export const DOUBLE_GAME_PLAYER_NUMBER = 4;
export const DOUBLE_GAME_PLAYER_SUGGEST_SIZE = 3;

interface BaseGameSettings {
  playerNumber?: number;
  suggestionSize?: number;
  format?: string;
}

export interface DoubleGameSettings extends BaseGameSettings {
  format: "double";
  playerNumber: 4;
  suggestionSize: 3;
}

export interface SingleGameSettings extends BaseGameSettings {
  format: "single";
  playerNumber: 2;
  suggestionSize: 1;
}

export type GameSettings = SingleGameSettings | DoubleGameSettings;
