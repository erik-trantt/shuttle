import { create } from "zustand";
import { usePlayerStore } from "@stores";
import type { Court, CourtData, Game, Player } from "@types";
import {
  buildInitialCourtData,
  COURT_IDS,
  generateQueueNumber,
  generateUniqueId,
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
  updateCourtData: (courtId: string, data: Partial<CourtData[0]>) => void;

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
        court: { ...nextCourt, status: "playing" },
        gameId,
        game: newGame,
        players: selectedPlayers,
      });

      // Add game to history
      get().addGame(newGame);

      // Reset selection state
      getPlayerStore().selectPlayers([]);

      const nextAvailableCourt = get().getNextAvailableCourt();

      set({ nextCourt: nextAvailableCourt });
    },

    canStartGame: () => {
      const { settings, getNextAvailableCourt } = get();
      const { selectedPlayers } = getPlayerStore();
      const nextCourt = getNextAvailableCourt();

      return (
        selectedPlayers.length === settings.playerNumber && nextCourt !== null
      );
    },

    addGame: (game) => set((state) => ({ games: [...state.games, game] })),

    getGameCount: () => get().games.length,

    getAutoSelectionSize: () =>
      get().settings.playerNumber - get().settings.suggestionSize,

    autoSelectPlayers: () => {
      const { getSortedAvailablePlayers } = getPlayerStore();

      const sortedAvailablePlayers = getSortedAvailablePlayers();

      if (!sortedAvailablePlayers.length) {
        return;
      }

      const initialPlayer = sortedAvailablePlayers[0];

      getPlayerStore().selectPlayer(initialPlayer);
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
      } else if (sortedAvailablePlayers.length === settings.playerNumber) {
        getPlayerStore().selectPlayers(sortedAvailablePlayers);

        return;
      }

      let attempts = 0;
      const maxAttempts = 10;

      const getRandomPlayers = (initialRemainingPlayers: Player[]) => {
        // Get initial selection
        const autoSelectionSize = get().getAutoSelectionSize();
        let selections = getInitialSelection(autoSelectionSize);

        // Get available players excluding already selected ones
        const remainingPlayers = initialRemainingPlayers.filter(
          (player) => !selections.some((selected) => selected.id === player.id),
        );

        Array.from({ length: get().settings.suggestionSize }).forEach(() => {
          const randomIndex = Math.floor(
            Math.random() * remainingPlayers.length,
          );

          const randomPlayer = remainingPlayers[randomIndex];

          selections.push(randomPlayer);

          remainingPlayers.splice(randomIndex, 1);
        });

        if (settings.allowPairs) {
          selections = selections
            .flatMap((player) =>
              player.partner &&
              !selections.some((s) => s.id === player.partnerId)
                ? [player, player.partner]
                : player,
            )
            .slice(0, settings.playerNumber);

          const lastPlayerToSuggest: Player | undefined =
            selections[settings.playerNumber - 1];

          if (attempts >= maxAttempts) {
            console.error("Failed to find valid suggestion after 10 attempts");
          } else if (lastPlayerToSuggest?.partner) {
            console.warn(
              "Last player to suggest has a partner, retrying suggestion",
            );
            selections = getRandomPlayers(sortedAvailablePlayers);
            attempts++;
          }
        }

        return selections;
      };

      const playersToSuggest = getRandomPlayers(sortedAvailablePlayers);

      getPlayerStore().selectPlayers(playersToSuggest);
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

      const updatedCourtData: CourtData[0] = {
        ...foundCourtData,
        court: {
          ...foundCourtData.court,
          status: "available",
        },
        gameId: null,
        game: null,
        players: [],
      };

      if (foundCourtData.court.locked) {
        updatedCourtData.court.status = "unavailable";
      }

      // Update court data
      get().updateCourtData(courtId, updatedCourtData);
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

      const nextAvailableCourt = get().getNextAvailableCourt();

      get().setNextCourt(nextAvailableCourt);
    },
  };
});
