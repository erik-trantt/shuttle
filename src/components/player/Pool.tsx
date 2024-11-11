import React, { useCallback, useEffect, useRef, useState } from "react";
import { Dices, PlayCircle, UserPlus } from "lucide-react";
import PlayerListItem from "./ListItem";
import { useRuntimeConfig } from "@hooks";
import type { Player } from "@types";
import { parseQueueNumberToOrder } from "@utils";
import styles from "./pool.module.css";

interface PlayerPoolProps {
  players: Player[];
  addPlayer: (name: string) => void;
  nextCourtAvailable: boolean;
  selectPlayer: (player: Player) => void;
  selectPlayers: (players: Player[]) => void;
  selectedPlayers: Player[];
  startGame: () => void;
  queueLength: number;
}

const PlayerPool: React.FC<PlayerPoolProps> = ({
  players,
  addPlayer,
  nextCourtAvailable,
  selectPlayer,
  selectPlayers,
  selectedPlayers,
  startGame,
  queueLength,
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

  const oldAutoSelectionSize = useRef(config.game.getAutoSelectionSize());
  const autoSelectionSize = config.game.getAutoSelectionSize();
  const hasEnoughPlayers =
    selectedPlayers.length === config.game.settings.playerNumber;
  const queueNotFull = queueLength < 6;
  const canStartGame = hasEnoughPlayers && (nextCourtAvailable || queueNotFull);
  const canAutoSelect = availablePlayers.length >= autoSelectionSize;

  const autoSelectPlayers = useCallback(
    (suggestionSize: number): void => {
      const toBeSelectedPlayers = Array.from(Array(suggestionSize).keys()).map(
        (i) => availablePlayers[i],
      );

      selectPlayers(toBeSelectedPlayers);
    },
    [availablePlayers, selectPlayers],
  );

  /**
   * Auto select available player(s) as lead players as soon as
   * 1 or more are in or returned to the pool
   */
  useEffect(() => {
    if (!(selectedPlayers.length === 0 && canAutoSelect)) {
      return;
    }

    autoSelectPlayers(autoSelectionSize);
  }, [autoSelectionSize, canAutoSelect, selectedPlayers, autoSelectPlayers]);

  useEffect(() => {
    if (oldAutoSelectionSize.current === autoSelectionSize) {
      return;
    }

    oldAutoSelectionSize.current = autoSelectionSize;

    if (canAutoSelect) {
      autoSelectPlayers(autoSelectionSize);
    } else {
      selectPlayers([]);
    }
  }, [
    autoSelectionSize,
    canAutoSelect,
    selectedPlayers,
    oldAutoSelectionSize,
    autoSelectPlayers,
    selectPlayers,
  ]);

  /**
   * Suggestion
   */
  const suggestPlayers = () => {
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
          Math.random() * (availablePlayers.length - autoSelectionSize),
        ) + autoSelectionSize;

      if (!randomizedPlayerIndexes.includes(randomizedIndex)) {
        randomizedPlayerIndexes.push(randomizedIndex);
      }
    }

    selectPlayers([
      ...Array.from(Array(autoSelectionSize).keys()).map(
        (startPlayerIndex) => availablePlayers[startPlayerIndex],
      ),
      ...randomizedPlayerIndexes.map(
        (randomizedPlayerIndex) => availablePlayers[randomizedPlayerIndex],
      ),
    ]);
  };

  const getStartButtonText = () => {
    if (!hasEnoughPlayers) return "Start Game";
    if (nextCourtAvailable) return "Start Game";
    if (!queueNotFull) return "Queue Full";
    return "Add to Queue";
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
          "mb-4 max-h-[20vh] overflow-y-auto overscroll-contain",
          "grid gap-x-2 gap-y-2",
        ].join(" ")}
        style={{
          gridTemplateColumns:
            "repeat(auto-fill, minmax(calc(var(--sa-list-item-width, 50%) - 0.5rem), 1fr))",
          gridTemplateRows: "repeat(auto-fill, 2rem)",
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
            ].join(" ")}
            style={{
              gridTemplateColumns:
                "repeat(auto-fill, minmax(calc(var(--sa-list-item-width, 50%) - 0.5rem), 1fr))",
            }}
          >
            {Array.from(Array(config.game.settings.playerNumber).keys()).map(
              (i) => (
                <li
                  key={selectedPlayers[i]?.id || i}
                  className="truncate px-2 text-sm"
                >
                  {selectedPlayers[i]?.name || ""}
                </li>
              ),
            )}
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
          <PlayCircle size="1.5em" className="mr-2 flex-shrink-0" />
          <span className="whitespace-nowrap">{getStartButtonText()}</span>
        </button>

        <button
          type="button"
          onClick={suggestPlayers}
          className={`inline-flex w-full flex-1 touch-manipulation items-center justify-center rounded-md px-6 py-2 active:bg-gray-100`}
        >
          <Dices size="1.5em" className="mr-2 flex-shrink-0" />
          Suggest {config.game.settings.suggestionSize}
        </button>
      </div>
    </div>
  );
};

export default PlayerPool;
