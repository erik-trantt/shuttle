import { create } from "zustand";
import { usePlayerStore } from "./player-store";
import { buildInitialCourtData } from "@utils";
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
 * State and actions interface for game management
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
   * Current state of all courts
   */
  courtData: CourtData;
  /**
   * Next court to be used
   */
  nextCourt: Court | null;
  /**
   * Whether the next court is available
   */
  nextCourtAvailable: boolean;

  /**
   * Sets the availability of the next court
   *
   * This action is used to control when new games can start.
   *
   * @param available Whether the next court is available
   */
  setNextCourtAvailable: (available: boolean) => void;

  /**
   * Sets the next court to be used
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
   * Updates court data for a specific court
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
   * Adds a new game to the games list
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
   * Releases a court after game completion
   *
   * This action updates court status to available, clears game data, updates player statuses, and updates player queue numbers.
   *
   * @param courtId ID of the court to release
   */
  releaseCourt: (courtId: string) => void;

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
    autoSelectionSize: 4,
  },
  games: [],
  courtData: initialCourtData,
  nextCourt: null,
  nextCourtAvailable: true,

  /**
   * Initializes the game store by building initial court data.
   */
  initialize: () => {
    set({ courtData: buildInitialCourtData() });
  },

  /**
   * Sets the availability of the next court.
   *
   * @param available Whether the next court is available
   */
  setNextCourtAvailable: (available) => set({ nextCourtAvailable: available }),

  /**
   * Sets the next court to be used.
   *
   * @param court The next court to be used
   */
  setNextCourt: (court) => set({ nextCourt: court }),

  /**
   * Updates game settings.
   *
   * @param newSettings Partial game settings to update
   */
  updateSettings: (newSettings) =>
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    })),

  /**
   * Updates court data for a specific court.
   *
   * @param courtId ID of the court to update
   * @param data Partial court data to update
   */
  updateCourtData: (courtId, data) => {
    set((state) => {
      const currentCourtData = state.courtData[courtId];

      if (!currentCourtData) {
        console.warn(`Court ${courtId} not found in court data`);
        return state;
      }

      // Merge court data while preserving required fields
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

  /**
   * Starts a new game.
   */
  startGame: () => {
    const { selectedPlayers } = usePlayerStore.getState();
    const { nextCourt, games } = get();

    if (!nextCourt) return;

    const gameId = crypto.randomUUID();

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
    const updatedCourtData: CourtData = {
      [nextCourt.id]: {
        court: { ...nextCourt, status: "playing" },
        players: selectedPlayers,
        gameId,
        game: newGame,
      },
    };

    set((state) => ({
      nextCourtAvailable: false,
      nextCourt: null,
      courtData: { ...state.courtData, ...updatedCourtData },
      games: [...state.games, newGame],
    }));
  },

  /**
   * Checks if a game can be started.
   *
   * @returns Whether a game can be started
   */
  canStartGame: () => {
    const { settings, nextCourtAvailable } = get();
    const { selectedPlayers } = usePlayerStore.getState();
    return (
      selectedPlayers.length === settings.playerNumber && nextCourtAvailable
    );
  },

  /**
   * Adds a new game to the games list.
   *
   * @param game The new game to add
   */
  addGame: (game) => set((state) => ({ games: [...state.games, game] })),

  /**
   * Gets the total number of games played.
   *
   * @returns The total number of games played
   */
  getGameCount: () => get().games.length,

  /**
   * Releases a court after game completion.
   *
   * @param courtId ID of the court to release
   */
  releaseCourt: (courtId: string) => {
    const { courtData } = get();
    const foundCourtData = courtData[courtId];

    if (!foundCourtData) {
      console.warn("Court is not found to be released.");
      return;
    }

    const updatedCourtData: CourtData = {
      [courtId]: {
        court: { ...foundCourtData.court, status: "available" },
        players: [],
        gameId: undefined,
        game: undefined,
      },
    };

    set((state) => ({
      courtData: { ...state.courtData, ...updatedCourtData },
    }));

    // Update player statuses and queue numbers
    const playerStore = usePlayerStore.getState();
    const gameCount = get().games.length;
    const availablePlayers = playerStore.getAvailablePlayers();

    foundCourtData.players.forEach(({ id }, index) => {
      playerStore.updatePlayerStatus(id, "available");
      playerStore.updateQueueNumber(id, {
        gameIndex: gameCount + 1,
        playerIndex: availablePlayers.length + index,
      });
    });
  },
}));
