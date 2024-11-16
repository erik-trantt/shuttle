import React, { type ChangeEventHandler } from "react";
import { Users2 } from "lucide-react";
import type { Player, PlayerPair } from "@types";
import { parseQueueNumberToOrder } from "@utils";

export interface PlayerListItemProps {
  disabled: boolean;
  player: Player;
  selectPlayer: (player: Player) => void;
  selected: boolean;
  isPaired: boolean;
  pairs: PlayerPair[];
  players: Player[];
}

const PlayerListItem: React.FC<PlayerListItemProps> = ({
  disabled,
  player,
  selectPlayer,
  selected,
  isPaired,
  pairs,
  players,
}) => {
  const order = parseQueueNumberToOrder(player.queueNumber);

  const handleOnChange: ChangeEventHandler<HTMLInputElement> = (_ev) => {
    selectPlayer(player);
  };

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
      partnerName: partner.name,
    };
  };

  const pairInfo = getPairInfo();

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
        title={pairInfo ? `Partner: ${pairInfo.partnerName}` : undefined}
      >
        {player.name}
        {pairInfo && (
          <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1 text-blue-500">
            <span className="text-xs font-medium">P{pairInfo.pairNumber}</span>
            <Users2 size="1em" />
          </div>
        )}
      </label>
    </li>
  );
};

export default PlayerListItem;
