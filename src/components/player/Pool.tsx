import React, { useState } from "react";
import { Dices, PlayCircle, UserPlus } from "lucide-react";
import PlayerListItem from "./ListItem";
import { Player } from "../../types";

interface PlayerPoolProps {
  players: Player[];
  addPlayer: (name: string) => void;
  selectPlayer: (player: Player) => void;
  selectPlayers: (players: Player[]) => void;
  selectedPlayers: Player[];
  startGame: () => void;
}

const PlayerPool: React.FC<PlayerPoolProps> = ({
  players,
  addPlayer,
  selectPlayer,
  selectPlayers,
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

  const randomizePlayers = () => {
    const availablePlayers = players.filter(
      (player) => player.status === "available",
    );

    if (availablePlayers.length < 4) {
      console.error(
        "Not enough players to form a match. Please wait till there are at least 4 available players.",
      );
      return;
    }

    const selectedPlayerIndexes: number[] = [];

    // Skip randomizing if there are 4 available players left in the pool
    if (availablePlayers.length === 4) {
      selectPlayers(availablePlayers);
      return;
    }

    while (selectedPlayerIndexes.length < 4) {
      const randomizedIndex = Math.floor(
        Math.random() * availablePlayers.length,
      );

      if (!selectedPlayerIndexes.includes(randomizedIndex)) {
        selectedPlayerIndexes.push(randomizedIndex);
      }
    }

    selectPlayers(
      selectedPlayerIndexes.map((playerIndex) => availablePlayers[playerIndex]),
    );
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
          className="flex items-center rounded-r-md bg-blue-500 px-4 py-2 text-xs text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-base"
        >
          <UserPlus size="1.5em" className="mr-2" />
          Add
        </button>
      </form>

      <ul
        className="mb-4 grid h-[20vh] gap-x-2 gap-y-2 overflow-y-auto"
        style={{
          gridTemplateColumns: "repeat(auto-fit, minmax(125px, 1fr))",
          gridTemplateRows: "repeat(auto-fill, minmax(2em, 1fr))",
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

      <div className="flex flex-wrap gap-2 text-xs sm:text-base">
        <button
          onClick={startGame}
          disabled={selectedPlayers.length !== 4}
          className={`inline-flex w-full flex-1 touch-manipulation items-center justify-center rounded-md px-6 py-2 ${
            selectedPlayers.length === 4
              ? "bg-green-500 text-white hover:bg-green-600"
              : "cursor-not-allowed bg-gray-300 text-gray-500"
          }`}
        >
          <PlayCircle size="1.5em" className="mr-2" />
          <span className="whitespace-nowrap">Start Match</span>
        </button>

        <button
          type="button"
          onClick={randomizePlayers}
          className={`inline-flex w-full flex-1 touch-manipulation items-center justify-center rounded-md px-6 py-2 active:bg-gray-100`}
        >
          <Dices size="1.5em" className="mr-2" />
          Suggest
        </button>
      </div>
    </div>
  );
};

export default PlayerPool;
