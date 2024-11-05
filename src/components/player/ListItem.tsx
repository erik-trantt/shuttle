import React, { ChangeEventHandler } from "react";
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

  const handleOnChange: ChangeEventHandler<HTMLInputElement> = (_ev) => {
    selectPlayer(player);
  };

  return (
    <li
      className="flex"
      style={{
        order: disabled ? order : `-${order}`, // Note to self, `disabled` is reactive and this is needed
      }}
    >
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
          "rounded-md px-2 py-2 text-sm",
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
