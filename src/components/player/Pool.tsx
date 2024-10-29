import React, { useState } from "react";
import { PlayCircle, UserPlus } from "lucide-react";
import PlayerListItem from "./ListItem";
import { Player } from "../../types";

interface PlayerPoolProps {
  players: Player[];
  addPlayer: (name: string) => void;
  selectPlayer: (player: Player) => void;
  selectedPlayers: Player[];
  startGame: () => void;
}

const PlayerPool: React.FC<PlayerPoolProps> = ({
  players,
  addPlayer,
  selectPlayer,
  selectedPlayers,
  startGame,
}) => {
  const [newPlayerName, setNewPlayerName] = useState("");

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPlayerName.trim()) {
      addPlayer(newPlayerName.trim());

      setNewPlayerName("");
    }
  };

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

      <ul
        className="mb-4 grid h-[20vh] gap-x-2 gap-y-2 overflow-y-auto"
        style={{
          gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
          gridTemplateRows: "repeat(auto-fit, 1.5rem)",
        }}
      >
        {players.map((player) => (
          <PlayerListItem
            player={player}
            key={player.queueNumber}
            disabled={player.status === "unavailable"}
            selectPlayer={() => selectPlayer(player)}
            selected={selectedPlayers.some(
              (selectedPlayer) => selectedPlayer.id === player.id,
            )}
          />
        ))}
      </ul>

      <div
        style={{
          order: 1001,
        }}
      >
        <button
          onClick={startGame}
          disabled={selectedPlayers.length !== 4}
          className={`flex w-full items-center justify-center rounded-md px-4 py-2 ${
            selectedPlayers.length === 4
              ? "bg-green-500 text-white hover:bg-green-600"
              : "cursor-not-allowed bg-gray-300 text-gray-500"
          }`}
        >
          <PlayCircle size={20} className="mr-2" />
          Start Match
        </button>
      </div>
    </div>
  );
};

export default PlayerPool;
