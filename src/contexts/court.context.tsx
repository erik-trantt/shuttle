import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
} from "react";
import { v4 as uuid } from "uuid";
import type { Court, CourtData, Game, Player } from "@types";

// Action Types
export const COURT_ACTIONS = {
  ADD_COURT: "ADD_COURT",
  REMOVE_COURT: "REMOVE_COURT",
  START_GAME: "START_GAME",
  END_GAME: "END_GAME",
  TOGGLE_LOCK: "TOGGLE_LOCK",
} as const;

type CourtAction =
  | { type: typeof COURT_ACTIONS.ADD_COURT; payload: { initialCourt?: Court } }
  | { type: typeof COURT_ACTIONS.REMOVE_COURT; payload: { courtId: string } }
  | {
      type: typeof COURT_ACTIONS.START_GAME;
      payload: { courtId: string; game: Game; players: Player[] };
    }
  | { type: typeof COURT_ACTIONS.END_GAME; payload: { courtId: string } }
  | { type: typeof COURT_ACTIONS.TOGGLE_LOCK; payload: { courtId: string } };

type CourtState = {
  courtData: CourtData;
  games: Game[];
};

const initialState: CourtState = {
  courtData: {},
  games: [],
};

// Reducer
const courtReducer = (state: CourtState, action: CourtAction): CourtState => {
  switch (action.type) {
    case COURT_ACTIONS.ADD_COURT: {
      const initialCourt = action.payload.initialCourt;

      const courtIndex = Object.keys(state.courtData).length;

      const newCourt: Court = {
        id: uuid(),
        index: courtIndex,
        name: `Court ${courtIndex + 1}`,
        status: "available",
        locked: false,
        ...initialCourt,
      };

      return {
        ...state,
        courtData: {
          ...state.courtData,
          [newCourt.id]: {
            court: newCourt,
            gameId: undefined,
            game: undefined,
            players: [],
          },
        },
      };
    }

    case COURT_ACTIONS.REMOVE_COURT: {
      const { [action.payload.courtId]: _, ...remainingCourtData } =
        state.courtData;
      return {
        ...state,
        courtData: remainingCourtData,
      };
    }

    case COURT_ACTIONS.START_GAME: {
      const { courtId, game, players } = action.payload;
      const courtToUpdate = state.courtData[courtId];

      if (!courtToUpdate) return state;

      return {
        ...state,
        courtData: {
          ...state.courtData,
          [courtId]: {
            ...courtToUpdate,
            court: { ...courtToUpdate.court, status: "playing" },
            gameId: game.id,
            game,
            players,
          },
        },
        games: [...state.games, game],
      };
    }

    case COURT_ACTIONS.END_GAME: {
      const { courtId } = action.payload;
      const courtToUpdate = state.courtData[courtId];

      if (!courtToUpdate) return state;

      return {
        ...state,
        courtData: {
          ...state.courtData,
          [courtId]: {
            ...courtToUpdate,
            court: { ...courtToUpdate.court, status: "available" },
            gameId: undefined,
            game: undefined,
            players: [],
          },
        },
      };
    }

    case COURT_ACTIONS.TOGGLE_LOCK: {
      const { courtId } = action.payload;
      const courtToUpdate = state.courtData[courtId];

      if (!courtToUpdate) return state;

      const newLocked = !courtToUpdate.court.locked;
      return {
        ...state,
        courtData: {
          ...state.courtData,
          [courtId]: {
            ...courtToUpdate,
            court: {
              ...courtToUpdate.court,
              locked: newLocked,
              status: newLocked ? "unavailable" : "available",
            },
          },
        },
      };
    }

    default:
      return state;
  }
};

// Utility functions
const isCourtAvailable = (court: Court) => {
  return court.status === "available" && !court.locked;
};

const findNextAvailableCourt = (courtData: CourtData): Court | null => {
  const availableCourts = Object.values(courtData)
    .map(data => data.court)
    .filter(isCourtAvailable)
    .sort((a, b) => a.index - b.index);
  
  return availableCourts[0] || null;
};

// Context
type CourtContextType = {
  courtData: CourtData;
  games: Game[];
  addCourt: (initialCourt?: Court) => void;
  removeCourt: (courtId: string) => void;
  startGame: (courtId: string, game: Game, players: Player[]) => void;
  endGame: (courtId: string) => void;
  toggleLock: (courtId: string) => void;
  getNextAvailableCourt: () => Court | null;
};

const CourtContext = createContext<CourtContextType | null>(null);

// Provider
export const CourtProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(courtReducer, initialState);

  const addCourt = useCallback(
    (initialCourt?: Court) => {
      dispatch({ type: COURT_ACTIONS.ADD_COURT, payload: { initialCourt } });
    },
    [dispatch]
  );

  const removeCourt = useCallback(
    (courtId: string) => {
      dispatch({ type: COURT_ACTIONS.REMOVE_COURT, payload: { courtId } });
    },
    [dispatch]
  );

  const startGame = useCallback(
    (courtId: string, game: Game, players: Player[]) => {
      const court = state.courtData[courtId]?.court;
      if (!court || !isCourtAvailable(court)) {
        console.warn("Cannot start game: court is not available");
        return;
      }
      dispatch({
        type: COURT_ACTIONS.START_GAME,
        payload: { courtId, game, players },
      });
    },
    [dispatch, state.courtData]
  );

  const endGame = useCallback(
    (courtId: string) => {
      dispatch({ type: COURT_ACTIONS.END_GAME, payload: { courtId } });
    },
    [dispatch]
  );

  const toggleLock = useCallback(
    (courtId: string) => {
      dispatch({ type: COURT_ACTIONS.TOGGLE_LOCK, payload: { courtId } });
    },
    [dispatch]
  );

  const getNextAvailableCourt = useCallback(
    () => findNextAvailableCourt(state.courtData),
    [state.courtData]
  );

  const value = {
    courtData: state.courtData,
    games: state.games,
    addCourt,
    removeCourt,
    startGame,
    endGame,
    toggleLock,
    getNextAvailableCourt,
  };

  return (
    <CourtContext.Provider value={value}>{children}</CourtContext.Provider>
  );
};

// Hook
export const useCourt = () => {
  const context = useContext(CourtContext);
  if (!context) {
    throw new Error("useCourt must be used within a CourtProvider");
  }
  return context;
};
