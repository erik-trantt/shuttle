export enum GAME_FORMATS {
  DOUBLE = "DOUBLE",
  SINGLE = "SINGLE",
  PAIRED_DOUBLE = "PAIRED_DOUBLE",
}

export type GameFormatType = "DOUBLE" | "SINGLE" | "PAIRED_DOUBLE";

export interface GameSettings {
  format: GameFormatType;
  playerNumber: number;
  suggestionSize: number;
  allowPairs: boolean;
}

export function buildGameSettings(format: GameFormatType): GameSettings {
  switch (format) {
    case "DOUBLE": {
      return {
        format: "DOUBLE",
        playerNumber: 4,
        suggestionSize: 3,
        allowPairs: true,
      };
    }

    case "PAIRED_DOUBLE": {
      return {
        format: "PAIRED_DOUBLE",
        playerNumber: 4,
        suggestionSize: 2,
        allowPairs: true,
      };
    }

    case "SINGLE": {
      return {
        format: "SINGLE",
        playerNumber: 2,
        suggestionSize: 1,
        allowPairs: false,
      };
    }
  }
}
