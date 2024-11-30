import { create } from "zustand";
import { usePlayerStore } from "./player-store";
import { usePairStore } from "./pair-store";
import { buildInitialCourtData, COURT_IDS, generateUniqueId } from "@utils";
import type { Court, CourtData, Game, Player } from "@types";

/**
 * Settings interface for game configuration
 *
 * This interface defines the structure of game settings, including player number, pair allowance, and auto-selection size.
 */
interface GameSettings {
  /**
   * Number of players required for a game
   */
  playerNumber: number;
  /**
   * Whether pairs are allowed in the game
   */
  allowPairs: boolean;
  /**
   * Number of players to auto-select
   */
  autoSelectionSize: number;
}

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
  courtData: CourtData;
  /**
   * Next court to be used
   */
  nextCourt: Court | null;

  /**
   * Current auto-selection size
   */
  autoSelectionSize: number;

  /**
   * Sets the availability of the next court
   *
   * This action is used to control when new games can start.
   *
   * @param available Whether the next court is available
   */
  // setNextCourtAvailable: (available: boolean) => void;

  /**
   * Returns whether there is a next court
   */
  hasNextCourt: () => boolean;

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
  updateSettings: (settings: Partial<GameSettings>) => void;

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
   * Sets the auto-selection size
   *
   * @param size The new auto-selection size
   */
  setAutoSelectionSize: (size: number) => void;

  /**
   * Auto-selects players for the next game
   *
   * This action intelligently selects players based on game settings and pair status.
   *
   * @param suggestionSize Number of players to auto-select
   */
  autoSelectPlayers: (suggestionSize: number) => void;

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

const initialCourtData =
  typeof window !== "undefined" ? buildInitialCourtData() : {};

/**
 * Creates the game store with the initial state and actions.
 */
export const useGameStore = create<GameState>((set, get) => ({
  settings: {
    playerNumber: 4,
    allowPairs: true,
    autoSelectionSize: 2,
  },
  games: [],
  courtData: initialCourtData,
  nextCourt: null,
  autoSelectionSize: 2,

  initialize: () => {
    const initialCourtData = buildInitialCourtData();

    const nextCourt = initialCourtData[COURT_IDS[0]]?.court || null;

    set({
      courtData: initialCourtData,
      nextCourt,
    });
  },

  hasNextCourt: () => !!get().nextCourt,

  setNextCourt: (court) => set({ nextCourt: court }),

  updateSettings: (newSettings) =>
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    })),

  updateCourtData: (courtId, data) => {
    set((state) => {
      const currentCourtData = state.courtData[courtId];

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
      const newStatus = updatedCourtData[courtId].court.status;
      const oldStatus = currentCourtData.court.status;

      const validTransition =
        newStatus === oldStatus ||
        (oldStatus === "available" && newStatus === "playing") ||
        (oldStatus === "playing" && newStatus === "available");

      if (!validTransition) {
        console.warn(
          `Invalid court status transition from ${oldStatus} to ${newStatus}`,
        );
        return state;
      }

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
    const { selectedPlayers } = usePlayerStore.getState();
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
      usePlayerStore.getState().updatePlayerStatus(player.id, "playing");
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
    usePlayerStore.getState().selectPlayers([]);
    set({ nextCourt: null });
  },

  canStartGame: () => {
    const { settings, hasNextCourt } = get();
    const { selectedPlayers } = usePlayerStore.getState();
    return selectedPlayers.length === settings.playerNumber && hasNextCourt();
  },

  addGame: (game) => set((state) => ({ games: [...state.games, game] })),

  getGameCount: () => get().games.length,

  getAutoSelectionSize: () => get().autoSelectionSize,

  setAutoSelectionSize: (size) => set({ autoSelectionSize: size }),

  autoSelectPlayers: (suggestionSize: number) => {
    const { selectedPlayers, getSortedAvailablePlayers: getAvailablePlayers } =
      usePlayerStore.getState();
    const { getPairedPlayer } = usePairStore.getState();
    const { settings } = get();

    if (selectedPlayers.length >= settings.playerNumber) {
      return;
    }

    // Get remaining players (excluding already selected)
    const remainingPlayers = getAvailablePlayers().filter(
      (p) => !selectedPlayers.some((selected) => selected.id === p.id),
    );

    // Check if initial player is paired
    const initialPlayer =
      selectedPlayers.length > 0 ? selectedPlayers[0] : null;
    const isInitialPaired =
      initialPlayer && getPairedPlayer(initialPlayer.id) !== null;

    // Prepare pool of candidates based on initial player's pair status
    let candidates: Player[] = [];
    if (isInitialPaired) {
      // If initial player is paired, look for another pair first
      const pairs = remainingPlayers.filter((p) => getPairedPlayer(p.id));
      const singles = remainingPlayers.filter((p) => !getPairedPlayer(p.id));

      if (pairs.length >= 2) {
        // Try to find a complete pair
        const firstPairPlayer = pairs[0];
        const secondPairPlayer = getPairedPlayer(firstPairPlayer.id);
        if (secondPairPlayer) {
          candidates = [firstPairPlayer, secondPairPlayer];
        }
      }

      // If no pairs available, use singles
      if (candidates.length === 0 && singles.length >= 2) {
        candidates = singles.slice(0, 2);
      }
    } else {
      // For non-paired initial player, follow game settings
      if (settings.allowPairs) {
        // Try to find a pair first
        const pairs = remainingPlayers.filter((p) => getPairedPlayer(p.id));
        if (pairs.length >= 2) {
          const firstPairPlayer = pairs[0];
          const secondPairPlayer = getPairedPlayer(firstPairPlayer.id);
          if (secondPairPlayer) {
            candidates = [firstPairPlayer, secondPairPlayer];
          }
        }
      }

      // If no pairs selected or pairs not allowed, use random players
      if (candidates.length === 0) {
        candidates = remainingPlayers.slice(0, suggestionSize);
      }
    }

    usePlayerStore
      .getState()
      .selectPlayers([...selectedPlayers, ...candidates]);
  },

  suggestPlayers: () => {
    const { getSortedAvailablePlayers: getAvailablePlayers } =
      usePlayerStore.getState();
    const { getInitialSelection } = usePairStore.getState();
    const { settings } = get();

    if (getAvailablePlayers().length < settings.playerNumber) {
      console.error(
        "Not enough available players for suggestion",
        getAvailablePlayers().length,
      );
      return;
    }

    // Get initial selection
    const initialSelection = getInitialSelection(1);
    const remainingNeeded = settings.playerNumber - initialSelection.length;

    // Auto-select remaining players
    if (remainingNeeded > 0) {
      usePlayerStore.getState().selectPlayers(initialSelection);
      get().autoSelectPlayers(remainingNeeded);
    } else {
      usePlayerStore.getState().selectPlayers(initialSelection);
    }
  },

  releaseCourt: (courtId: string) => {
    const { courtData } = get();
    const foundCourtData: CourtData[0] | undefined = courtData[courtId];

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
      usePlayerStore.getState().updateQueueNumber(player.id, {
        gameIndex: get().games.length + 1,
        playerIndex: lastQueuedAvailablePlayers.length + playerToReleaseIndex,
      });
      usePlayerStore.getState().updatePlayerStatus(player.id, "available");
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
    const { courtData } = get();
    const foundCourt = courtData[courtId];

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
  },
}));
