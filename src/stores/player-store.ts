import { create } from "zustand";
import { useGameStore, usePairStore } from "@stores";
import type { Player, PlayerStatus } from "@types";
import {
  buildInitialPlayers,
  generateQueueNumber,
  generateUniqueId,
  parseQueueNumberToOrder,
} from "@utils";

interface PlayerState {
  /**
   * List of all players
   */
  players: Player[];
  /**
   * List of selected players for the next game
   */
  selectedPlayers: Player[];

  /**
   * Adds a new player
   *
   * @param name Player name
   */
  addPlayer: (name: string) => void;

  /**
   * Deletes a player
   *
   * @param id Player ID to delete
   */
  deletePlayer: (id: string) => void;

  /**
   * Undeletes a player
   *
   * @param id Player ID to undelete
   */
  undeletePlayer: (id: string) => void;

  /**
   * Updates a player's status
   *
   * @param id Player ID to update
   * @param status New status
   */
  updatePlayerStatus: (id: string, status: PlayerStatus) => void;

  /**
   * Updates a player's queue number
   *
   * @param id Player ID to update
   * @param queueData Queue data containing game index and player index
   */
  updateQueueNumber: (
    id: string,
    queueData: { gameIndex: number; playerIndex: number },
  ) => void;

  /**
   * Gets available players
   */
  getAvailablePlayers: () => Player[];

  /**
   * Gets last queued available players
   */
  getLastQueuedAvailablePlayers: () => Player[];

  /**
   * Gets available players sorted by queue number
   */
  getSortedAvailablePlayers: () => Player[];

  /**
   * Gets selected players
   */
  getSelectedPlayers: () => Player[];

  /**
   * Selects a player for the next game
   *
   * @param player Player to select
   */
  selectPlayer: (player: Player) => void;

  /**
   * Selects multiple players for the next game
   *
   * @param players Players to select
   */
  selectPlayers: (players: Player[]) => void;

  /**
   * Initializes the players store
   *
   * This action builds initial player data.
   */
  initialize: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => {
  // Lazily get state stores to avoid circular dependency
  const getGameStore = () => useGameStore.getState();
  const getPairStore = () => usePairStore.getState();

  return {
    players: [],
    selectedPlayers: [],

    initialize: () => {
      set({ players: buildInitialPlayers() });
    },

    addPlayer: (name) => {
      const { getGameCount } = getGameStore();
      const players = get().players;

      const newPlayer: Player = {
        id: generateUniqueId(),
        name,
        status: "available",
        index: players.length,
        queueNumber: generateQueueNumber({
          gameIndex: getGameCount() + 1,
          playerIndex: players.length,
        }),
      };

      set((state) => ({
        players: [...state.players, newPlayer],
      }));
    },

    deletePlayer: (id) => {
      get().updatePlayerStatus(id, "retired");

      set((state) => ({
        selectedPlayers: state.selectedPlayers.filter((p) => p.id !== id),
      }));
    },

    undeletePlayer: (id) => {
      get().updatePlayerStatus(id, "available");
    },

    updatePlayerStatus: (id, status) => {
      set((state) => ({
        players: state.players.map((p) => (p.id === id ? { ...p, status } : p)),
      }));
    },

    updateQueueNumber: (id, { gameIndex, playerIndex }) => {
      set((state) => ({
        players: state.players.map((p) =>
          p.id === id
            ? {
                ...p,
                queueNumber: generateQueueNumber({ gameIndex, playerIndex }),
              }
            : p,
        ),
      }));
    },

    getAvailablePlayers: () => {
      const players = get().players;

      return players.filter((p) => p.status === "available");
    },

    getLastQueuedAvailablePlayers: (): Player[] => {
      const { getGameCount } = getGameStore();
      const players = get().players;

      return players.filter(
        (p) =>
          p.status === "available" &&
          p.queueNumber.startsWith(
            (getGameCount() + 1).toString().padStart(3, "0"),
          ),
      );
    },

    getSortedAvailablePlayers: () => {
      const players = get().players;

      return players
        .filter((p) => p.status === "available")
        .sort(
          (playerA, playerB) =>
            Number(parseQueueNumberToOrder(playerA.queueNumber)) -
            Number(parseQueueNumberToOrder(playerB.queueNumber)),
        );
    },

    getSelectedPlayers: () => get().selectedPlayers,

    selectPlayer: (player) => {
      const currentSelection = [...get().selectedPlayers];
      const playerIndex = currentSelection.findIndex((p) => p.id === player.id);

      if (playerIndex !== -1) {
        // Deselect player if already selected
        currentSelection.splice(playerIndex, 1);
      } else {
        // Add player if not at max capacity
        const { settings } = getGameStore();
        if (currentSelection.length < settings.playerNumber) {
          currentSelection.push(player);
        }
      }

      // Validate and update selection
      const { validatePlayerSelection } = getPairStore();
      if (validatePlayerSelection(currentSelection)) {
        set({ selectedPlayers: currentSelection });
      }
    },

    selectPlayers: (players) => {
      const { validatePlayerSelection } = getPairStore();
      if (validatePlayerSelection(players)) {
        set({ selectedPlayers: players });
      }
    },
  };
});
