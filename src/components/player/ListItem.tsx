import React from "react";
import { Player } from "../../types";

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
        order: disabled ? 1e10 : player.index ? player.index : undefined,
      }}
      onClick={() => selectPlayer(player)}
    >
      {player.name}
    </li>
  );
};

export default PlayerListItem;
