import React from "react";
import { Player } from "../../types";

export interface PlayerListItemProps {
  player: Player;
  selectPlayer: (player: Player) => void;
  selected: boolean;
}

const PlayerListItem: React.FC<PlayerListItemProps> = ({
  player,
  selectPlayer,
  selected,
}) => {
  return (
    <li
      key={player.index}
      className={[
        "p-2 rounded-md cursor-pointer",
        selected
          ? "bg-blue-100 text-blue-800"
          : "bg-gray-100 hover:bg-gray-200",
      ].join(" ")}
      onClick={() => selectPlayer(player)}
    >
      {player.name}
    </li>
  );
};

export default PlayerListItem;
