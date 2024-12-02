import { GameSettings } from "@configs";
import { Player } from "@types";

export const getAutoSelectionSize = (settings: GameSettings): number => {
  return settings.playerNumber - settings.suggestionSize;
};

/**
 * Validates the player selection based on the game settings.
 * @param selectedPlayers The selected players.
 * @returns {boolean} True if the selection is valid, false otherwise.
 */
export const validatePlayerSelection = ({
  playerToValidate,
  selectedPlayers,
  settings,
}: {
  playerToValidate: Player;
  selectedPlayers: Player[];
  settings: GameSettings;
}): boolean => {
  const hasEnoughPlayers = selectedPlayers.length > settings.playerNumber;

  if (hasEnoughPlayers) {
    return false;
  }

  const autoSelectionSize = getAutoSelectionSize(settings);

  const isAutoSelected = selectedPlayers
    .slice(0, autoSelectionSize)
    .some((selectedPlayer) => selectedPlayer.id === playerToValidate.id);

  if (isAutoSelected) {
    return false;
  }

  switch (settings.format) {
    case "SINGLE": {
      return true;
    }
    case "DOUBLE": {
      return true;
    }
    case "PAIRED_DOUBLE": {
      if (!playerToValidate.partnerId || !playerToValidate.partner) {
        return true;
      } else if (selectedPlayers.length < settings.playerNumber - 1) {
        return true;
      }

      return false;
    }
  }
};
