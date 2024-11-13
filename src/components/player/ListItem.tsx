import React, { type ChangeEventHandler } from "react";
import { Users2 } from "lucide-react";
import type { Player } from "@types";
import { parseQueueNumberToOrder } from "@utils";

export interface PlayerListItemProps {
  disabled: boolean;
  player: Player;
  selectPlayer: (player: Player) => void;
  selected: boolean;
  isPaired: boolean;
}

const PlayerListItem: React.FC<PlayerListItemProps> = ({
  disabled,
  player,
  selectPlayer,
  selected,
  isPaired,
}) => {
  const order = parseQueueNumberToOrder(player.queueNumber);

  const handleOnChange: ChangeEventHandler<HTMLInputElement> = (_ev) => {
    selectPlayer(player);
  };

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
          isPaired ? "pr-8" : "",
        ].join(" ")}
      >
        {player.name}
        {isPaired && (
          <Users2
            size="1em"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-500"
          />
        )}
      </label>
    </li>
  );
};

export default PlayerListItem;
