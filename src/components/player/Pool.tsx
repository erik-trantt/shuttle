import React, { useState } from "react";
import { UserPlus } from "lucide-react";
import { v4 as uuid } from "uuid";
import PlayerListItem from "./ListItem";
import { Player } from "../../types";

interface PlayerPoolProps {
  players: Player[];
  addPlayer: (player: Player) => void;
  selectPlayer: (player: Player) => void;
  selectedPlayers: Player[];
}

const PlayerPool: React.FC<PlayerPoolProps> = ({
  players,
  addPlayer,
  selectPlayer,
  selectedPlayers,
}) => {
  const [newPlayerName, setNewPlayerName] = useState("");

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPlayerName.trim()) {
      addPlayer({
        id: uuid(),
        name: newPlayerName.trim(),
        status: "available",
      });

      setNewPlayerName("");
    }
  };

  // const sortedPlayers: PlayerListItemProps[] = players.map((player, _index) => ({
  //   player,
  //   selected: selectedPlayers.includes(player.name),
  //   selectPlayer: (name: string) => selectPlayer(name),
  // }));

  return (
    <div>
      <form onSubmit={handleAddPlayer} className="mb-4 flex">
        <input
          type="text"
          value={newPlayerName}
          onChange={(e) => setNewPlayerName(e.target.value)}
          placeholder="Enter player name"
          className="min-w-0 flex-grow rounded-l-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          type="submit"
          className="flex items-center rounded-r-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <UserPlus size={20} className="mr-2" />
          Add
        </button>
      </form>

      {/* <div>
        {players.map((player, index) => (
          <pre key={index}>{JSON.stringify(player, null, 2)}</pre>
        ))}
      </div> */}

      <ul className="grid max-h-[25vh] auto-cols-fr grid-cols-2 gap-x-3 gap-y-2 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
        {players.map(
          (player, index) =>
            player.status === "available" && (
              <PlayerListItem
                player={player}
                key={index}
                disabled={index + 1 > 8}
                selectPlayer={() => selectPlayer(player)}
                selected={selectedPlayers.some(
                  (selectedPlayer) => selectedPlayer.id === player.id,
                )}
              />
            ),
        )}
      </ul>
    </div>
  );
};

export default PlayerPool;
