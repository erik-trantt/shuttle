export interface Court {
  id: string;
  name: string;
  index: number;
  status: "available" | "unavailable" | "playing";
  locked: boolean;
}

export interface Player {
  id: string;
  name: string;
  index: number;
  queueNumber: string;
  status: "available" | "unavailable";
  partnerId?: string;
}

export interface PlayerPair {
  id: string;
  playerIds: [string, string];
  name: string;
  createdAt: number;
}

export interface Match {
  id: string;
  courtId: number;
  gameIds: string[];
  timestamp: number;
  index?: number;
  playerIds?: string[];
}

export interface Game {
  id: string;
  courtId: string;
  firstParty: {
    playerIds: string[];
    score: number;
  };
  secondParty: {
    playerIds: string[];
    score: number;
  };
  index: number;
  timestamp: number;
}

export type CourtData = Record<
  string,
  {
    court: Court;
    gameId?: string;
    game?: Game;
    players: Player[];
  }
>;
