import React, { useEffect, useState } from "react";
import { Dices, PlayCircle, UserPlus } from "lucide-react";
import PlayerListItem from "./ListItem";
import { useRuntimeConfig } from "@hooks";
import type { Player } from "@types";
import { parseQueueNumberToOrder } from "@utils";
import styles from "./pool.module.css";

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
  const config = useRuntimeConfig();

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
    config.game.settings.playerNumber - config.game.settings.suggestionSize;

  const canStartGame =
    selectedPlayers.length === config.game.settings.playerNumber;

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
    if (availablePlayers.length < config.game.settings.playerNumber) {
      console.error(
        `Not enough players to form a match. Please wait till there are at least ${config.game.settings.playerNumber} available players.`,
      );
      return;
    }

    // Skip randomizing if the number of available players is equal to the expected number of players per game
    if (availablePlayers.length === config.game.settings.playerNumber) {
      selectPlayers(availablePlayers);
      return;
    }

    const randomizedPlayerIndexes: number[] = [];

    while (
      randomizedPlayerIndexes.length < config.game.settings.suggestionSize
    ) {
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
    <div
      className={`[--sa-list-item-width:_50%] sm:[--sa-list-item-width:_25%]`}
    >
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
        className={[
          styles.ScrollShadows,
          "mb-4 max-h-[20vh] overflow-y-auto",
          "grid gap-x-2 gap-y-2",
        ].join(" ")}
        style={{
          gridTemplateColumns:
            "repeat(auto-fill, minmax(calc(var(--sa-list-item-width, 50%) - 0.5rem), 1fr))",
          gridAutoRows: "minmax(min-content, 2em)",
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

      <div className="flex flex-wrap gap-x-2 gap-y-4 text-xs sm:text-base">
        <div className="max-w-full basis-full">
          <h3 className="mb-1 font-semibold">Confirming selection</h3>

          <ol
            className={[
              "rounded",
              "list-inside list-decimal",
              "grid grid-rows-2 gap-x-2 gap-y-1 sm:grid-rows-1 sm:gap-2",
              canStartGame ? "bg-green-200" : undefined,
            ].join(" ")}
            style={{
              gridTemplateColumns:
                "repeat(auto-fill, minmax(calc(var(--sa-list-item-width, 50%) - 0.5rem), 1fr))",
            }}
          >
            {selectedPlayers.map((player) => (
              <li key={player.id} className="truncate px-2 text-sm">
                {player.name}
              </li>
            ))}
          </ol>
        </div>

        <button
          onClick={startGame}
          disabled={!canStartGame}
          className={`inline-flex w-full flex-1 touch-manipulation items-center justify-center rounded-md px-6 py-2 ${
            canStartGame
              ? "bg-green-500 text-white hover:bg-green-600"
              : "cursor-not-allowed bg-gray-300 text-gray-500"
          }`}
        >
          <PlayCircle size="1.5em" className="mr-2" />
          <span className="whitespace-nowrap">Start Game</span>
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
