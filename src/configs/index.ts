export enum GAME_FORMATS {
  DOUBLE = "double",
  SINGLE = "single",
}

export type GameFormatType = keyof typeof GAME_FORMATS;

interface BaseGameSettings {
  playerNumber: number;
  suggestionSize: number;
  format: GameFormatType;
}

export interface DoubleGameSettings extends BaseGameSettings {
  format: "DOUBLE";
}

export interface SingleGameSettings extends BaseGameSettings {
  format: "SINGLE";
}

export type GameSettings = SingleGameSettings | DoubleGameSettings;

export function buildGameSettings(format: GameFormatType): GameSettings {
  switch (format) {
    case "DOUBLE": {
      return {
        format: "DOUBLE",
        playerNumber: 4,
        suggestionSize: 3,
      };
    }
    case "SINGLE": {
      return {
        format: "SINGLE",
        playerNumber: 2,
        suggestionSize: 1,
      };
    }
  }
}
