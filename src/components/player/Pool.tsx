import React, { useEffect, useState } from "react";
import { Dices, PlayCircle, UserPlus } from "lucide-react";
import PlayerListItem from "./ListItem";
import { Player } from "../../types";
import {
  DOUBLE_GAME_PLAYER_NUMBER,
  DOUBLE_GAME_PLAYER_SUGGEST_SIZE,
  parseQueueNumberToOrder,
} from "../../utils";

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

  const availablePlayers = players
    .filter((player) => player.status === "available")
    .sort(
      (playerA, playerB) =>
        Number(parseQueueNumberToOrder(playerA.queueNumber)) -
        Number(parseQueueNumberToOrder(playerB.queueNumber)),
    );

  const randomizeRangeStart =
    DOUBLE_GAME_PLAYER_NUMBER - DOUBLE_GAME_PLAYER_SUGGEST_SIZE;

  /**
   * Auto select available player(s) as lead players as soon as
   * 1 or more are in or returned to the pool
   */
  useEffect(() => {
    if (
      !(
        selectedPlayers.length === 0 &&
        availablePlayers.length >= randomizeRangeStart
      )
    ) {
      return;
    }

    for (let i = 0; i < randomizeRangeStart; i++) {
      selectPlayer(availablePlayers[i]);
    }
  }, [selectedPlayers, availablePlayers, selectPlayer, randomizeRangeStart]);

  const randomizePlayers = () => {
    if (availablePlayers.length < DOUBLE_GAME_PLAYER_NUMBER) {
      console.error(
        "Not enough players to form a match. Please wait till there are at least DOUBLE_GAME_PLAYER_NUMBER available players.",
      );
      return;
    }

    // Skip randomizing if the number of available players is equal to the expected number of players per game
    if (availablePlayers.length === DOUBLE_GAME_PLAYER_NUMBER) {
      selectPlayers(availablePlayers);
      return;
    }

    const randomizedPlayerIndexes: number[] = [];

    while (randomizedPlayerIndexes.length < DOUBLE_GAME_PLAYER_SUGGEST_SIZE) {
      const randomizedIndex =
        Math.floor(
          Math.random() * (availablePlayers.length - randomizeRangeStart),
        ) + randomizeRangeStart;

      if (!randomizedPlayerIndexes.includes(randomizedIndex)) {
        randomizedPlayerIndexes.push(randomizedIndex);
      }
    }

    selectPlayers([
      ...Array.from(Array(randomizeRangeStart).keys()).map(
        (startPlayerIndex) => availablePlayers[startPlayerIndex],
      ),
      ...randomizedPlayerIndexes.map(
        (randomizedPlayerIndex) => availablePlayers[randomizedPlayerIndex],
      ),
    ]);
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
          gridTemplateColumns: "repeat(auto-fill, minmax(125px, 1fr))",
          gridTemplateRows: "repeat(auto-fill, 2em)",
        }}
      >
        {availablePlayers.map((player) => (
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
          disabled={selectedPlayers.length !== DOUBLE_GAME_PLAYER_NUMBER}
          className={`inline-flex w-full flex-1 touch-manipulation items-center justify-center rounded-md px-6 py-2 ${
            selectedPlayers.length === DOUBLE_GAME_PLAYER_NUMBER
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
