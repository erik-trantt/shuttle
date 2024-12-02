import React, { type ChangeEventHandler } from "react";
import { Users2 } from "lucide-react";
import { usePlayerStore, usePairStore } from "@stores";
import type { Player } from "@types";
import { parseQueueNumberToOrder } from "@utils";

export interface PlayerListItemProps {
  disabled: boolean;
  player: Player;
  selected: boolean;
}

const PlayerListItem: React.FC<PlayerListItemProps> = React.memo(
  ({ disabled, player, selected }) => {
    const { selectPlayer } = usePlayerStore();
    const { pairs } = usePairStore();
    const { players } = usePlayerStore();

    const order = parseQueueNumberToOrder(player.queueNumber);

    const handleOnChange: ChangeEventHandler<HTMLInputElement> = (_ev) => {
      selectPlayer(player);
    };

    const pairNumber =
      pairs.findIndex((p) => p.playerIds.includes(player.id)) + 1;
    const partner =
      player.partner || players.find((p) => p.id === player.partnerId) || null;

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
          title={partner ? `Partner: ${partner.name}` : undefined}
          className={[
            "relative max-w-full flex-grow cursor-pointer truncate",
            "rounded-md px-2 py-1.5 text-sm",
            selected ? "bg-blue-100" : "bg-gray-100 hover:bg-gray-200",
            disabled ? "pointer-events-none opacity-25" : "",
            partner ? "pr-12" : "", // Increased right padding for pair number
          ].join(" ")}
        >
          {player.name}
          {partner && (
            <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1 text-blue-500">
              <span className="text-xs font-bold">P{pairNumber}</span>
              <Users2 size="1em" />
            </div>
          )}
        </label>
      </li>
    );
  },
);

export default PlayerListItem;
