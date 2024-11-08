import React, { type ChangeEventHandler } from "react";
import type { Player } from "@types";
import { parseQueueNumberToOrder } from "@utils";

export interface PlayerListItemProps {
  disabled: boolean;
  player: Player;
  selectPlayer: (player: Player) => void;
  selected: boolean;
}

const PlayerListItem: React.FC<PlayerListItemProps> = ({
  disabled,
  player,
  selectPlayer,
  selected,
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
          "flex-grow cursor-pointer",
          "rounded-md px-2 py-1.5 text-sm",
          selected ? "bg-blue-100" : "bg-gray-100 hover:bg-gray-200",
          disabled ? "pointer-events-none opacity-25" : "",
        ].join(" ")}
      >
        {player.name}
      </label>
    </li>
  );
};

export default PlayerListItem;
