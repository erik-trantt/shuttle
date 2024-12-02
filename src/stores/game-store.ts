import { create } from "zustand";
import { usePlayerStore, usePairStore } from "@stores";
import type { Court, CourtData, Game, Player } from "@types";
import {
  buildInitialCourtData,
  COURT_IDS,
  generateQueueNumber,
  generateUniqueId,
  validatePlayerSelection,
} from "@utils";
import { buildGameSettings, GameFormatType, GameSettings } from "@configs";

/**
 * State interface for game management
 *
 * This interface defines the structure of the game state, including settings, games, court data, and actions for updating the state.
 */
interface GameState {
  /**
   * Game configuration settings
   */
  settings: GameSettings;
  /**
   * List of all games played
   */
  games: Game[];
  /**
   * Data for all courts
   */
  courtData: CourtData | null;
  /**
   * Next court to be used
   */
  nextCourt: Court | null;

  /**
   * Returns whether there is a next court
   */
  hasNextCourt: () => boolean;

  /**
   * Returns the next available court
   *
   * @returns The next available court or null if no court is available
   */
  getNextAvailableCourt: () => Court | null;

  /**
   * Sets the next court
   *
   * This action is used when selecting a court for the next game.
   *
   * @param court The next court to be used
   */
  setNextCourt: (court: Court | null) => void;

  /**
   * Updates game settings
   *
   * This action can update player number, pair allowance, and auto-selection size.
   *
   * @param settings Partial game settings to update
   */
  updateSettings: (format: GameFormatType) => void;

  /**
   * Updates court data
   *
   * This action can update court status, current game, and player list.
   * It also validates court status transitions.
   *
   * @param courtId ID of the court to update
   * @param data Partial court data to update
   */
  updateCourtData: (
    courtId: string,
    data: Partial<{
      court: Partial<Court>;
      gameId?: string;
      game?: Game;
      players: Player[];
    }>,
  ) => void;

  /**
   * Starts a new game
   *
   * This action updates player statuses to "playing", creates a new game record, and updates court data.
   * It requires selected players and an available court.
   */
  startGame: () => void;

  /**
   * Checks if a game can be started
   *
   * This action verifies the correct number of players selected and checks court availability.
   *
   * @returns Whether a game can be started
   */
  canStartGame: () => boolean;

  /**
   * Adds a new game
   *
   * This action is used for game history.
   *
   * @param game The new game to add
   */
  addGame: (game: Game) => void;

  /**
   * Gets the total number of games played
   *
   * This action is used for queue number generation.
   *
   * @returns The total number of games played
   */
  getGameCount: () => number;

  /**
   * Gets the current auto-selection size
   *
   * @returns The current auto-selection size
   */
  getAutoSelectionSize: () => number;

  /**
   * Auto-selects players for the next game
   *
   * This action intelligently selects players based on game settings and pair status.
   */
  autoSelectPlayers: () => void;

  /**
   * Suggests players for the next game
   *
   * This action handles the initial player selection for a new game.
   */
  suggestPlayers: () => void;

  /**
   * Releases a court
   *
   * This action updates court status to available, clears game data, updates player statuses, and updates player queue numbers.
   *
   * @param courtId ID of the court to release
   */
  releaseCourt: (courtId: string) => void;

  /**
   * Toggles the lock status of a court
   *
   * This action toggles the lock status of a court and updates the court status accordingly.
   *
   * @param courtId ID of the court to toggle
   */
  toggleCourtLock: (courtId: string) => void;

  /**
   * Initializes the game store
   *
   * This action builds initial court data.
   */
  initialize: () => void;
}

/**
 * Creates the game store with the initial state and actions.
 */
export const useGameStore = create<GameState>((set, get) => {
  // Lazily get state stores to avoid circular dependency
  const getPairStore = () => usePairStore.getState();
  const getPlayerStore = () => usePlayerStore.getState();

  return {
    settings: buildGameSettings("DOUBLE"),
    games: [],
    courtData: null,
    nextCourt: null,

    initialize: () => {
      const initialCourtData = buildInitialCourtData();

      const nextCourt = initialCourtData[COURT_IDS[0]]?.court || null;

      set({
        courtData: initialCourtData,
        nextCourt,
        settings: buildGameSettings("DOUBLE"),
      });
    },

    hasNextCourt: () => !!get().nextCourt,

    getNextAvailableCourt: () => {
      const courtData = get().courtData;

      if (!courtData) {
        return null;
      }

      const availableCourts = Object.values(courtData).filter(
        ({ court }) => court.status === "available",
      );

      if (!availableCourts.length) {
        return null;
      }

      return availableCourts[0].court;
    },

    setNextCourt: (court) => set({ nextCourt: court }),

    updateSettings: (format: GameFormatType) =>
      set((state) => ({
        settings: {
          ...state.settings,
          ...buildGameSettings(format),
        },
      })),

    updateCourtData: (courtId, data) => {
      set((state) => {
        const currentCourtData = state.courtData
          ? state.courtData[courtId]
          : null;

        if (!currentCourtData) {
          console.warn(`Court ${courtId} not found in court data`);
          return state;
        }

        const updatedCourtData = {
          [courtId]: {
            court: data.court
              ? { ...currentCourtData.court, ...data.court }
              : currentCourtData.court,
            players: data.players || currentCourtData.players,
            gameId:
              data.gameId !== undefined ? data.gameId : currentCourtData.gameId,
            game: data.game !== undefined ? data.game : currentCourtData.game,
          },
        };

        // Validate court status transition
        // TODO: Not validating for now, come back  later
        // const newStatus = updatedCourtData[courtId].court.status;
        // const oldStatus = currentCourtData.court.status;

        // const validTransition =
        //   newStatus === oldStatus ||
        //   (oldStatus === "available" && newStatus === "playing") ||
        //   (oldStatus === "playing" && newStatus === "available") ;

        // if (!validTransition) {
        //   console.warn(
        //     `Invalid court status transition from ${oldStatus} to ${newStatus}`,
        //   );
        //   return state;
        // }

        return {
          ...state,
          courtData: {
            ...state.courtData,
            ...updatedCourtData,
          },
        };
      });
    },

    startGame: () => {
      const { selectedPlayers } = getPlayerStore();
      const { nextCourt, games } = get();

      if (!nextCourt || !get().canStartGame()) {
        console.warn("Cannot start game: conditions not met");
        return;
      }

      const gameId = generateUniqueId();

      // Create new game
      const newGame: Game = {
        id: gameId,
        courtId: nextCourt.id,
        firstParty: {
          playerIds: selectedPlayers.slice(0, 2).map((p) => p.id),
          score: 0,
        },
        secondParty: {
          playerIds: selectedPlayers.slice(2).map((p) => p.id),
          score: 0,
        },
        index: games.length,
        timestamp: Date.now(),
      };

      // Update player statuses
      selectedPlayers.forEach((player) => {
        getPlayerStore().updatePlayerStatus(player.id, "playing");
      });

      // Update court data
      get().updateCourtData(nextCourt.id, {
        court: { status: "playing" },
        gameId,
        game: newGame,
        players: selectedPlayers,
      });

      // Add game to history
      get().addGame(newGame);

      // Reset selection state
      getPlayerStore().selectPlayers([]);
      set({ nextCourt: null });
    },

    canStartGame: () => {
      const { settings, hasNextCourt } = get();
      const { selectedPlayers } = getPlayerStore();
      return selectedPlayers.length === settings.playerNumber && hasNextCourt();
    },

    addGame: (game) => set((state) => ({ games: [...state.games, game] })),

    getGameCount: () => get().games.length,

    getAutoSelectionSize: () =>
      get().settings.playerNumber - get().settings.suggestionSize,

    autoSelectPlayers: () => {
      const { selectedPlayers, getSortedAvailablePlayers } = getPlayerStore();
      const settings = get().settings;

      const sortedAvailablePlayers = getSortedAvailablePlayers();
      const autoSelectionSize = get().getAutoSelectionSize();

      if (!sortedAvailablePlayers.length) {
        return;
      }

      const initialPlayer = sortedAvailablePlayers[0];

      // Prepare pool of candidates
      const candidates: Player[] = [initialPlayer];

      if (settings.allowPairs) {
        // Check if initial player is paired
        const isInitialPaired = Boolean(
          initialPlayer && (initialPlayer.partner || initialPlayer.partnerId),
        );

        // If initial player is paired, add the partner
        if (isInitialPaired && initialPlayer.partner) {
          candidates.push(initialPlayer.partner);
        }
      }

      // Add remaining available players
      if (candidates.length < autoSelectionSize) {
        candidates.push(
          ...sortedAvailablePlayers.slice(
            candidates.length,
            autoSelectionSize - candidates.length, // number of more players to add
          ),
        );
      }

      getPlayerStore().selectPlayers([...selectedPlayers, ...candidates]);
    },

    suggestPlayers: () => {
      const { getSortedAvailablePlayers, getInitialSelection } =
        getPlayerStore();
      const settings = get().settings;
      const sortedAvailablePlayers = getSortedAvailablePlayers();

      if (sortedAvailablePlayers.length < settings.playerNumber) {
        console.error(
          "Not enough available players for suggestion",
          sortedAvailablePlayers.length,
        );
        return;
      }

      // Get initial selection
      const autoSelectionSize = get().getAutoSelectionSize();
      const initialSelection = getInitialSelection(autoSelectionSize);

      // Get available players excluding already selected ones
      const remainingPlayers = sortedAvailablePlayers.filter(
        (player) =>
          !initialSelection.some((selected) => selected.id === player.id),
      );

      let attempts = 0;
      const maxAttempts = 10;

      // Check if initial player is part of a pair
      const initialPlayer = initialSelection[0];
      const isInitialPlayerPaired = initialPlayer && initialPlayer.partnerId;

      // If initial player is not paired, handle the three scenarios:
      // 1. 4 unpaired players
      // 2. 1 pair + 2 unpaired players
      // 3. 2 unpaired + 1 pair
      if (!isInitialPlayerPaired && settings.allowPairs) {
        while (attempts < maxAttempts) {
          const randomSelection = [...initialSelection];
          const remainingForSelection = [...remainingPlayers];

          // Select second player
          const secondPlayerIndex = Math.floor(
            Math.random() * remainingForSelection.length,
          );
          const secondPlayer = remainingForSelection[secondPlayerIndex];
          remainingForSelection.splice(secondPlayerIndex, 1);
          randomSelection.push(secondPlayer);

          // If second player is paired, add their partner and one unpaired
          if (secondPlayer.partnerId) {
            // Add partner of second player
            const partner = remainingForSelection.find(
              (p) => p.id === secondPlayer.partnerId,
            );
            if (partner) {
              randomSelection.push(partner);
              remainingForSelection.splice(
                remainingForSelection.findIndex((p) => p.id === partner.id),
                1,
              );

              // Find an unpaired player for the last slot
              const unpairedPlayers = remainingForSelection.filter(
                (p) => !p.partnerId,
              );
              if (unpairedPlayers.length > 0) {
                const lastPlayer =
                  unpairedPlayers[
                    Math.floor(Math.random() * unpairedPlayers.length)
                  ];
                randomSelection.push(lastPlayer);
              }
            }
          }
          // If second player is unpaired
          else {
            // Select third player
            const thirdPlayerIndex = Math.floor(
              Math.random() * remainingForSelection.length,
            );
            const thirdPlayer = remainingForSelection[thirdPlayerIndex];
            remainingForSelection.splice(thirdPlayerIndex, 1);
            randomSelection.push(thirdPlayer);

            // If third player is paired, add their partner (2 unpaired + 1 pair)
            if (thirdPlayer.partnerId) {
              const partner = remainingForSelection.find(
                (p) => p.id === thirdPlayer.partnerId,
              );
              if (partner) {
                randomSelection.push(partner);
              }
            }
            // If third player is unpaired, add another unpaired (4 unpaired)
            else {
              const unpairedPlayers = remainingForSelection.filter(
                (p) => !p.partnerId,
              );
              if (unpairedPlayers.length > 0) {
                const lastPlayer =
                  unpairedPlayers[
                    Math.floor(Math.random() * unpairedPlayers.length)
                  ];
                randomSelection.push(lastPlayer);
              }
            }
          }

          // Check if we have a valid selection
          const isValidSelection = randomSelection.every((player) =>
            validatePlayerSelection({
              playerToValidate: player,
              selectedPlayers: randomSelection,
              settings,
            }),
          );

          if (
            randomSelection.length === settings.playerNumber &&
            isValidSelection
          ) {
            getPlayerStore().selectPlayers(randomSelection);
            return;
          }

          attempts++;
        }
      } else {
        // Logic for when initial player is paired
        // Two scenarios:
        // 1. 2 pairs
        // 2. 1 pair + 2 unpaired
        while (attempts < maxAttempts) {
          const randomSelection = [...initialSelection];
          const remainingForSelection = [...remainingPlayers];

          // Add partner of initial player
          if (initialPlayer.partnerId) {
            const partner = remainingForSelection.find(
              (p) => p.id === initialPlayer.partnerId,
            );
            if (partner) {
              randomSelection.push(partner);
              remainingForSelection.splice(
                remainingForSelection.findIndex((p) => p.id === partner.id),
                1,
              );
            }
          }

          // Select third player
          if (remainingForSelection.length > 0) {
            const thirdPlayerIndex = Math.floor(
              Math.random() * remainingForSelection.length,
            );
            const thirdPlayer = remainingForSelection[thirdPlayerIndex];
            randomSelection.push(thirdPlayer);
            remainingForSelection.splice(thirdPlayerIndex, 1);

            // If third player is paired, add their partner (2 pairs)
            if (thirdPlayer.partnerId) {
              const partner = remainingForSelection.find(
                (p) => p.id === thirdPlayer.partnerId,
              );
              if (partner) {
                randomSelection.push(partner);
              }
            } else {
              // If third player is unpaired, add another unpaired (1 pair + 2 unpaired)
              const unpairedPlayers = remainingForSelection.filter(
                (p) => !p.partnerId,
              );
              if (unpairedPlayers.length > 0) {
                const lastPlayerIndex = Math.floor(
                  Math.random() * unpairedPlayers.length,
                );
                const lastPlayer = unpairedPlayers[lastPlayerIndex];
                randomSelection.push(lastPlayer);
              }
            }
          }

          // Check if we have a valid selection
          const isValidSelection = randomSelection.every((player) =>
            validatePlayerSelection({
              playerToValidate: player,
              selectedPlayers: randomSelection,
              settings,
            }),
          );

          if (
            randomSelection.length === settings.playerNumber &&
            isValidSelection
          ) {
            getPlayerStore().selectPlayers(randomSelection);
            return;
          }

          attempts++;
        }
      }

      console.warn(
        "Could not find valid player combination after",
        maxAttempts,
        "attempts",
      );
    },

    releaseCourt: (courtId: string) => {
      const courtData = get().courtData;
      const foundCourtData = courtData ? courtData[courtId] : null;

      if (!foundCourtData) {
        console.warn("Court is not found to be released.");
        return;
      }

      const lastQueuedAvailablePlayers = usePlayerStore
        .getState()
        .getLastQueuedAvailablePlayers();

      const playersToRelease = [...foundCourtData.players];

      // Update player statuses and queue numbers
      playersToRelease.forEach((player, playerToReleaseIndex) => {
        getPlayerStore().updatePlayer(player.id, {
          status: "available",
          queueNumber: generateQueueNumber({
            gameIndex: get().games.length + 1,
            playerIndex:
              lastQueuedAvailablePlayers.length + playerToReleaseIndex,
          }),
        });
      });

      // Update court data
      get().updateCourtData(courtId, {
        court: { status: "available" },
        gameId: undefined,
        game: undefined,
        players: [],
      });
    },

    toggleCourtLock: (courtId: string) => {
      const courtData = get().courtData;
      const foundCourt = courtData ? courtData[courtId] : null;

      if (!foundCourt) {
        return;
      }

      const updatedCourt: CourtData[0] = {
        ...foundCourt,
        court: {
          ...foundCourt.court,
          locked: !foundCourt.court.locked,
          status: foundCourt.court.locked ? "available" : "unavailable",
        },
      };

      get().updateCourtData(courtId, updatedCourt);

      const nextCourt = get().nextCourt;

      if (nextCourt && nextCourt.id === courtId) {
        get().setNextCourt(null);
      }
    },
  };
});
