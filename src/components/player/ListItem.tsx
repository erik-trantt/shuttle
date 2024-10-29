import React from "react";
import { Player } from "../../types";
import { parseQueueNumberToOrder } from "../../utils";

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

  return (
    <li
      key={player.index}
      className={[
        "cursor-pointer rounded-md px-2 py-1 text-xs",
        selected
          ? "bg-blue-100 text-blue-800"
          : "bg-gray-100 hover:bg-gray-200",
        disabled && "pointer-events-none opacity-25",
      ].join(" ")}
      style={{
        order: disabled ? 1e13 : order, // Note to self, `disabled` is reactive and this is needed
      }}
      onClick={() => selectPlayer(player)}
    >
      {player.name}
    </li>
  );
};

export default PlayerListItem;
