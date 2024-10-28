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
          className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded-r-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center"
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

      <ul className="grid space-y-2">
        {players.map(
          (player, index) =>
            player.status === "available" && (
              <PlayerListItem
                player={player}
                key={index}
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
