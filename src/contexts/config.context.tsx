import React, { createContext, useMemo, useState } from "react";
import { buildGameSettings, type GameSettings } from "@configs";

interface ConfigContext {
  game: {
    settings: GameSettings;
    setSettings: React.Dispatch<React.SetStateAction<GameSettings>>;
  };
}

export const ConfigContext = createContext<ConfigContext>({
  game: {
    settings: buildGameSettings("DOUBLE"),
    setSettings: () => {},
  },
});

interface Props {
  children: React.ReactNode;
}

export const ConfigProvider: React.FC<Props> = ({ children }) => {
  const [gameSettings, setGameSettings] = useState<GameSettings>(
    buildGameSettings("DOUBLE"),
  );

  const game = useMemo(
    () => ({ settings: gameSettings, setSettings: setGameSettings }),
    [gameSettings, setGameSettings],
  );

  return (
    <ConfigContext.Provider value={{ game }}>{children}</ConfigContext.Provider>
  );
};
