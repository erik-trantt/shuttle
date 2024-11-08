import React, { createContext } from "react";
import { GameSettings } from "@configs";

interface SettingsContext {
  game: GameSettings;
}

export const SettingsContext = createContext<SettingsContext>({
  game: {
    format: "double",
    playerNumber: 4,
    suggestionSize: 3,
  },
});

interface Props {
  children: React.ReactNode;
}

export const SettingsProvider: React.FC<Props> = ({ children }) => {
  const gameSettings: GameSettings = {
    format: "double",
    playerNumber: 4,
    suggestionSize: 3,
  };

  return (
    <SettingsContext.Provider value={{ game: gameSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};
