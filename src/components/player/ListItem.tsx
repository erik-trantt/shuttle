import React, { useEffect, type ChangeEventHandler } from "react";
import { Users2 } from "lucide-react";
import type { Player, PlayerPair } from "@types";
import { parseQueueNumberToOrder } from "@utils";
import { useRuntimeConfig } from "@hooks";

export interface PlayerListItemProps {
  disabled: boolean;
  player: Player;
  selectPlayer: (player: Player) => void;
  selected: boolean;
  selectedPlayers: Player[];
  pairs: PlayerPair[];
  players: Player[];
}

const PlayerListItem: React.FC<PlayerListItemProps> = ({
  disabled,
  player,
  selectPlayer,
  selected,
  selectedPlayers,
  pairs,
  players,
}) => {
  const order = parseQueueNumberToOrder(player.queueNumber);
  const config = useRuntimeConfig();
  const isPairingEnabled = config.game.settings.allowPairs;

  const handleOnChange: ChangeEventHandler<HTMLInputElement> = (_ev) => {
    selectPlayer(player);
  };

  const isPaired = pairs.some((pair) => pair.playerIds.includes(player.id));

  const isPairPlayerSelected = selectedPlayers.some(
    (selectedPlayer) => selectedPlayer.id == player.partnerId,
  );

  const getPairInfo = () => {
    if (!isPaired) return null;
    const pair = pairs.find((p) => p.playerIds.includes(player.id));
    if (!pair) return null;

    const partnerId = pair.playerIds.find((id) => id !== player.id);
    if (!partnerId) return null;

    const partner = players.find((p) => p.id === partnerId);
    if (!partner) return null;

    // Find the index of this pair in the pairs array (1-based)
    const pairNumber = pairs.findIndex((p) => p.id === pair.id) + 1;

    return {
      pairNumber,
      partner,
    };
  };

  const pairInfo = getPairInfo();

  // useEffect(() => {
  //   console.log(!isPairingEnabled, !pairInfo);
  //   if (!isPairingEnabled || !pairInfo) {
  //     return;
  //   }

  //   if (selected && !isPairPlayerSelected) {
  //     console.log("Paired", "but partner is not selected");
  //     console.log("Selecting partner", pairInfo.partner);

  //     selectPlayer(pairInfo.partner);
  //   }
  // }, [
  //   isPairingEnabled,
  //   pairInfo,
  //   selected,
  //   isPairPlayerSelected,
  //   selectPlayer,
  // ]);

  return (
    <li className="flex" data-queue-number={order}>
      <input
        type="checkbox"
        name={player.id}
        id={`player-${player.id}`}
        checked={selected}
        className="hidden"
        onChange={handleOnChange}
      />

      <label
        htmlFor={`player-${player.id}`}
        className={[
          "relative max-w-full flex-grow cursor-pointer truncate",
          "rounded-md px-2 py-1.5 text-sm",
          selected ? "bg-blue-100" : "bg-gray-100 hover:bg-gray-200",
          disabled ? "pointer-events-none opacity-25" : "",
          isPaired ? "pr-12" : "", // Increased right padding for pair number
        ].join(" ")}
        title={pairInfo ? `Partner: ${pairInfo.partner.name}` : undefined}
      >
        {player.name}
        {pairInfo && (
          <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1 text-blue-500">
            <span className="text-xs font-bold">P{pairInfo.pairNumber}</span>
            <Users2 size="1em" />
          </div>
        )}
      </label>
    </li>
  );
};

export default PlayerListItem;
