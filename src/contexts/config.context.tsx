import React, { createContext, useCallback, useMemo, useState } from "react";
import {
  buildGameSettings,
  type GameFormatType,
  type GameSettings,
} from "@configs";

interface GameConfigContext {
  settings: GameSettings;
  setSettings: React.Dispatch<React.SetStateAction<GameSettings>>;
  getAutoSelectionSize: () => number;
}

interface ConfigContext {
  game: GameConfigContext;
  setGameFormat: (format: GameFormatType) => void;
  setSuggestionSize: (suggestionSize: number) => void;
}

const DEFAULT_GAME_FORMAT: GameFormatType = "DOUBLE";

export const ConfigContext = createContext<ConfigContext>({
  game: {
    settings: buildGameSettings(DEFAULT_GAME_FORMAT),
    setSettings: () => {},
    getAutoSelectionSize: () => {
      const gameSettings = buildGameSettings(DEFAULT_GAME_FORMAT);

      return gameSettings.playerNumber - gameSettings.suggestionSize;
    },
  },
  setGameFormat: () => {},
  setSuggestionSize: () => {},
});

interface Props {
  children: React.ReactNode;
}

export const ConfigProvider: React.FC<Props> = ({ children }) => {
  const [gameSettings, setGameSettings] = useState<GameSettings>(
    buildGameSettings(DEFAULT_GAME_FORMAT),
  );

  /**
   * TODO: describe
   */
  function setGameFormat(format: GameFormatType): void {
    setGameSettings(buildGameSettings(format));
  }

  /**
   * TODO: describe
   */
  const getAutoSelectionSize = useCallback((): number => {
    return gameSettings.playerNumber - gameSettings.suggestionSize;
  }, [gameSettings.playerNumber, gameSettings.suggestionSize]);

  /**
   * TODO: describe
   */
  function setSuggestionSize(newSuggestionSize: number): void {
    const { suggestionSize, playerNumber } = gameSettings;

    const normalizedNewSuggestionSize = newSuggestionSize % playerNumber;

    if (
      normalizedNewSuggestionSize !== suggestionSize &&
      normalizedNewSuggestionSize <= playerNumber - 1
    ) {
      setGameSettings({
        ...gameSettings,
        suggestionSize: normalizedNewSuggestionSize,
      });
    }
  }

  const game: GameConfigContext = useMemo(() => {
    return {
      settings: gameSettings,
      setSettings: setGameSettings,
      getAutoSelectionSize,
    };
  }, [gameSettings, setGameSettings, getAutoSelectionSize]);

  return (
    <ConfigContext.Provider
      value={{
        game,
        setGameFormat,
        setSuggestionSize,
      }}
    >
      {children}
    </ConfigContext.Provider>
  );
};
