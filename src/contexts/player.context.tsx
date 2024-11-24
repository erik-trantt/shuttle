import React, {
  createContext,
  useCallback,
  useContext,
  useReducer,
  useMemo,
} from "react";
import type { Player, PlayerPair } from "@types";

// State interface
interface PlayerState {
  players: Player[];
  selectedPlayers: Player[];
  pairs: PlayerPair[];
}

// Action types
type PlayerAction =
  | { type: "SELECT_PLAYER"; payload: Player }
  | { type: "DESELECT_PLAYER"; payload: string }
  | {
      type: "CREATE_PAIR";
      payload: { playerIds: [string, string]; name: string; createdAt: number };
    }
  | { type: "DELETE_PAIR"; payload: string }
  | { type: "ADD_PLAYER"; payload: Player }
  | { type: "DELETE_PLAYER"; payload: string }
  | { type: "UNDELETE_PLAYER"; payload: string }
  | { type: "SET_PLAYERS"; payload: Player[] };

// Context type with state and dispatch
interface PlayerContextType {
  state: PlayerState;
  dispatch: React.Dispatch<PlayerAction>;
  // Memoized action creators
  selectPlayer: (player: Player) => void;
  deselectPlayer: (playerId: string) => void;
  createPair: (playerIds: [string, string], name: string) => void;
  deletePair: (pairId: string) => void;
  addPlayer: (player: Player) => void;
  deletePlayer: (playerId: string) => void;
  undeletePlayer: (playerId: string) => void;
  setPlayers: (players: Player[]) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

// Reducer
function playerReducer(state: PlayerState, action: PlayerAction): PlayerState {
  switch (action.type) {
    case "SELECT_PLAYER":
      return {
        ...state,
        selectedPlayers: [...state.selectedPlayers, action.payload],
      };
    case "DESELECT_PLAYER":
      return {
        ...state,
        selectedPlayers: state.selectedPlayers.filter(
          (p) => p.id !== action.payload,
        ),
      };
    case "CREATE_PAIR":
      return {
        ...state,
        pairs: [
          ...state.pairs,
          {
            id: crypto.randomUUID(),
            ...action.payload,
          },
        ],
      };
    case "DELETE_PAIR":
      return {
        ...state,
        pairs: state.pairs.filter((pair) => pair.id !== action.payload),
      };
    case "ADD_PLAYER":
      return {
        ...state,
        players: [...state.players, action.payload],
      };
    case "DELETE_PLAYER":
      return {
        ...state,
        players: state.players.map((player) =>
          player.id === action.payload
            ? { ...player, status: "retired" }
            : player,
        ),
      };
    case "UNDELETE_PLAYER":
      return {
        ...state,
        players: state.players.map((player) =>
          player.id === action.payload
            ? { ...player, status: "available" }
            : player,
        ),
      };
    case "SET_PLAYERS":
      return {
        ...state,
        players: action.payload,
      };
    default:
      return state;
  }
}

// Provider component
export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(playerReducer, {
    players: [],
    selectedPlayers: [],
    pairs: [],
  });

  // Memoized action creators
  const selectPlayer = useCallback((player: Player) => {
    dispatch({ type: "SELECT_PLAYER", payload: player });
  }, []);

  const deselectPlayer = useCallback((playerId: string) => {
    dispatch({ type: "DESELECT_PLAYER", payload: playerId });
  }, []);

  const createPair = useCallback(
    (playerIds: [string, string], name: string) => {
      dispatch({
        type: "CREATE_PAIR",
        payload: { playerIds, name, createdAt: Date.now() },
      });
    },
    [],
  );

  const deletePair = useCallback((pairId: string) => {
    dispatch({ type: "DELETE_PAIR", payload: pairId });
  }, []);

  const addPlayer = useCallback((player: Player) => {
    dispatch({ type: "ADD_PLAYER", payload: player });
  }, []);

  const deletePlayer = useCallback((playerId: string) => {
    dispatch({ type: "DELETE_PLAYER", payload: playerId });
  }, []);

  const undeletePlayer = useCallback((playerId: string) => {
    dispatch({ type: "UNDELETE_PLAYER", payload: playerId });
  }, []);

  const setPlayers = useCallback((players: Player[]) => {
    dispatch({ type: "SET_PLAYERS", payload: players });
  }, []);

  // Memoized value to prevent unnecessary rerenders
  const value = useMemo(
    () => ({
      state,
      dispatch,
      // Expose memoized action creators
      selectPlayer,
      deselectPlayer,
      createPair,
      deletePair,
      addPlayer,
      deletePlayer,
      undeletePlayer,
      setPlayers,
    }),
    [
      state,
      selectPlayer,
      deselectPlayer,
      createPair,
      deletePair,
      addPlayer,
      deletePlayer,
      undeletePlayer,
      setPlayers,
    ],
  );

  return (
    <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
  );
}

// Custom hook for accessing context
export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error("usePlayer must be used within PlayerProvider");
  }
  return context;
}

// Selector hooks for specific state slices
export function useSelectedPlayers() {
  const { state } = usePlayer();
  return useMemo(() => state.selectedPlayers, [state.selectedPlayers]);
}

export function usePairs() {
  const { state } = usePlayer();
  return useMemo(() => state.pairs, [state.pairs]);
}

export function useAvailablePlayers() {
  const { state } = usePlayer();
  return useMemo(
    () => state.players.filter((player) => player.status === "available"),
    [state.players],
  );
}

// Custom selector hook with memoization
export function usePlayerSelector<T>(selector: (state: PlayerState) => T) {
  const { state } = usePlayer();
  return useMemo(() => selector(state), [state, selector]);
}
