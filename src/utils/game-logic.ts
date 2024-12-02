import { GameSettings } from "@configs";
import { Player, PlayerPair } from "@types";

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

// Helper function to get initial selection considering pairs and format rules
// export const getInitialSelection = ({
//   size,
//   pairs,
//   settings,
//   getPairedPlayer,
//   getSortedAvailablePlayers,
// }: {
//   size: number;
//   pairs: PlayerPair[];
//   settings: GameSettings;
//   getPairedPlayer: (playerId: string) => Player | null;
//   getSortedAvailablePlayers: () => Player[];
// }:{size: number; pairs: PlayerPair[];
//   settings: GameSettings;}): Player[] => {
//   // const settings = useGameStore.getState().settings;
//   // const { getPairedPlayer } = usePairStore.getState();
//   // const { getSortedAvailablePlayers } = usePlayerStore.getState();

//   const sortedAvailablePlayers = getSortedAvailablePlayers();

//   const selection: Player[] = [];
//   let index = 0;

//   while (selection.length < size && index < sortedAvailablePlayers.length) {
//     const player = sortedAvailablePlayers[index];
//     const pairedPlayer = getPairedPlayer(player.id);

//     if (selection.length === 0) {
//       // First player selection
//       selection.push(player);

//       // If first player is paired, automatically select their pair
//       if (pairedPlayer) {
//         selection.push(pairedPlayer);
//       }
//     } else {
//       // For subsequent selections
//       const firstPlayerPaired = getPairedPlayer(selection[0].id) !== null;

//       if (firstPlayerPaired) {
//         // If first player was paired, prefer another pair or singles
//         if (pairedPlayer && selection.length + 2 <= size) {
//           selection.push(player, pairedPlayer);
//         } else if (!pairedPlayer && selection.length + 1 <= size) {
//           selection.push(player);
//         }
//       } else {
//         // If first player was single, follow game settings
//         if (
//           settings.allowPairs &&
//           pairedPlayer &&
//           selection.length + 2 <= size
//         ) {
//           selection.push(player, pairedPlayer);
//         } else if (!pairedPlayer && selection.length + 1 <= size) {
//           selection.push(player);
//         }
//       }
//     }

//     index++;
//   }

//   return selection;
// };
