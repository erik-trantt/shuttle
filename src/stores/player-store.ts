import { v4 as uuid } from "uuid";
import { create } from "zustand";
import type { Player } from "@types";
import { generateQueueNumber, buildInitialPlayers } from "@utils";
import { useGameStore } from "./game-store";

/**
 * State interface for player management
 * - Contains list of all players and currently selected players
 */
interface PlayerState {
  /**
   * List of all players in the system
   * - Includes player details and status
   */
  players: Player[];
  /**
   * Currently selected players for game
   * - Subset of players list
   */
  selectedPlayers: Player[];
}

/**
 * Actions interface for player management
 * - Contains methods for player CRUD operations and selection
 */
interface PlayerActions {
  /**
   * Selects or deselects a player for game
   * - If player is already selected, removes them
   * - If player is not selected, adds them
   */
  selectPlayer: (player: Player) => void;

  /**
   * Sets the list of selected players
   * - Used for bulk selection/deselection
   */
  selectPlayers: (players: Player[]) => void;

  /**
   * Adds a new player to the system
   * - Generates unique ID
   * - Sets initial status as "available"
   * - Assigns queue number based on game count
   */
  addPlayer: (name: string) => void;

  /**
   * Marks a player as retired
   * - Updates player status to "retired"
   * - Removes from selected players if present
   */
  deletePlayer: (id: string) => void;

  /**
   * Restores a retired player
   * - Updates player status to "available"
   */
  undeletePlayer: (id: string) => void;

  /**
   * Updates a player's status
   * - Can be: "available", "playing", "unavailable", "retired"
   */
  updatePlayerStatus: (id: string, status: Player["status"]) => void;

  /**
   * Updates a player's queue number
   * - Based on game index and player index
   * - Used when releasing courts
   */
  updateQueueNumber: (
    id: string,
    params: { gameIndex: number; playerIndex: number },
  ) => void;

  /**
   * Updates a player's entire state
   * - Used for partner management
   * - Preserves all other player fields
   */
  updatePlayer: (updatedPlayer: Player) => void;

  /**
   * Gets list of available players
   * - Filters for "available" status
   * - Sorts by queue number
   */
  getAvailablePlayers: () => Player[];

  /**
   * Validates if a player name is unique
   * - Checks against existing player names
   * - Case sensitive comparison
   */
  validatePlayer: (name: string) => boolean;

  /**
   * Initializes the player store
   * - Builds initial player list
   */
  initialize: () => void;
}

/**
 * Type alias for player store
 * - Combines player state and actions
 */
type UsePlayerStore = PlayerState & PlayerActions;

/**
 * Initial player list
 * - Built using buildInitialPlayers utility
 * - Empty array if not in browser environment
 */
const initialPlayers =
  typeof window !== "undefined" ? buildInitialPlayers() : [];

/**
 * Player store creation
 * - Uses zustand create method
 * - Initializes with initial player list and empty selected players
 */
export const usePlayerStore = create<UsePlayerStore>((set, get) => ({
  players: initialPlayers,
  selectedPlayers: [],

  /**
   * Initializes the player store
   * - Builds initial player list
   */
  initialize: () => {
    set({ players: buildInitialPlayers() });
  },

  /**
   * Selects or deselects a player for game
   * - If player is already selected, removes them
   * - If player is not selected, adds them
   */
  selectPlayer: (player) =>
    set((state) => ({
      selectedPlayers: state.selectedPlayers.includes(player)
        ? state.selectedPlayers.filter((p) => p.id !== player.id)
        : [...state.selectedPlayers, player],
    })),

  /**
   * Sets the list of selected players
   * - Used for bulk selection/deselection
   */
  selectPlayers: (players) => set({ selectedPlayers: players }),

  /**
   * Validates if a player name is unique
   * - Checks against existing player names
   * - Case sensitive comparison
   */
  validatePlayer: (name) => {
    const { players } = get();
    return !players.some((player) => player.name === name);
  },

  /**
   * Adds a new player to the system
   * - Generates unique ID
   * - Sets initial status as "available"
   * - Assigns queue number based on game count
   */
  addPlayer: (name) => {
    const { players } = get();
    const gameStore = useGameStore.getState();

    // Validate player name
    if (!get().validatePlayer(name)) return;

    set({
      players: [
        ...players,
        {
          id: uuid(),
          name,
          status: "available",
          index: players.length,
          queueNumber: generateQueueNumber({
            gameIndex: gameStore.getGameCount() + 1,
            playerIndex: players.length,
          }),
          partnerId: undefined,
        },
      ],
    });
  },

  /**
   * Marks a player as retired
   * - Updates player status to "retired"
   * - Removes from selected players if present
   */
  deletePlayer: (id) =>
    set((state) => ({
      players: state.players.map((player) =>
        player.id === id ? { ...player, status: "retired" } : player,
      ),
      // Also remove from selected players if present
      selectedPlayers: state.selectedPlayers.filter((p) => p.id !== id),
    })),

  /**
   * Restores a retired player
   * - Updates player status to "available"
   */
  undeletePlayer: (id) =>
    set((state) => ({
      players: state.players.map((player) =>
        player.id === id ? { ...player, status: "available" } : player,
      ),
    })),

  /**
   * Updates a player's status
   * - Can be: "available", "playing", "unavailable", "retired"
   */
  updatePlayerStatus: (id, status) =>
    set((state) => ({
      players: state.players.map((player) =>
        player.id === id ? { ...player, status } : player,
      ),
    })),

  /**
   * Updates a player's queue number
   * - Based on game index and player index
   * - Used when releasing courts
   */
  updateQueueNumber: (id, { gameIndex, playerIndex }) =>
    set((state) => ({
      players: state.players.map((player) =>
        player.id === id
          ? {
              ...player,
              queueNumber: generateQueueNumber({ gameIndex, playerIndex }),
            }
          : player,
      ),
    })),

  /**
   * Updates a player's entire state
   * - Used for partner management
   * - Preserves all other player fields
   */
  updatePlayer: (updatedPlayer) =>
    set((state) => ({
      players: state.players.map((player) =>
        player.id === updatedPlayer.id ? updatedPlayer : player,
      ),
    })),

  /**
   * Gets list of available players
   * - Filters for "available" status
   * - Sorts by queue number
   */
  getAvailablePlayers: () => {
    const { players } = get();
    return players
      .filter((player) => player.status === "available")
      .sort((a, b) => Number(a.queueNumber) - Number(b.queueNumber));
  },
}));
