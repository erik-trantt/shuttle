import React from "react";
import { Dices, PlayCircle } from "lucide-react";
import PlayerListItem from "./ListItem";
import styles from "./pool.module.css";
import { useGameStore, usePlayerStore } from "@stores";

const PlayerPool: React.FC = () => {
  const { getSortedAvailablePlayers, selectedPlayers } = usePlayerStore();

  const {
    settings,
    canStartGame,
    startGame,
    autoSelectPlayers,
    suggestPlayers,
    getNextAvailableCourt,
    setNextCourt,
  } = useGameStore();

  const sortedAvailablePlayers = getSortedAvailablePlayers();

  const handleStartGame = () => {
    startGame();

    autoSelectPlayers();

    const nextCourt = getNextAvailableCourt();
    if (nextCourt) {
      setNextCourt(nextCourt);
    }
  };

  if (selectedPlayers.length === 0) {
    autoSelectPlayers();
  }

  return (
    <div
      className={`[--sa-list-item-width:_50%] sm:[--sa-list-item-width:_25%]`}
    >
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
        {sortedAvailablePlayers.map((player) => (
          <PlayerListItem
            player={player}
            key={player.queueNumber}
            disabled={!(player.status === "available")}
            selected={selectedPlayers.some(
              (selected) => selected.id === player.id,
            )}
          />
        ))}
      </ul>

      <div className="flex flex-wrap gap-x-2 gap-y-4 text-xs sm:text-base">
        <div className="max-w-full basis-full">
          <h3 className="mb-1 font-bold">Confirming selection</h3>

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
            {Array.from(Array(settings.playerNumber).keys()).map((i) => (
              <li key={i} className="truncate px-2 text-sm">
                {selectedPlayers[i]?.name || ""}
              </li>
            ))}
          </ol>
        </div>

        <button
          onClick={handleStartGame}
          disabled={!canStartGame()}
          className={`inline-flex w-full flex-1 touch-manipulation items-center justify-center rounded-md px-6 py-2 ${
            canStartGame()
              ? "bg-green-500 text-white hover:bg-green-600"
              : "cursor-not-allowed bg-gray-300 text-gray-500"
          }`}
        >
          <PlayCircle size="1.5em" className="mr-2 flex-shrink-0" />
          <span className="whitespace-nowrap">Start Game</span>
        </button>

        <button
          type="button"
          onClick={suggestPlayers}
          className={`inline-flex w-full flex-1 touch-manipulation items-center justify-center rounded-md px-6 py-2 active:bg-gray-100`}
        >
          <Dices size="1.5em" className="mr-2 flex-shrink-0" />
          Suggest {settings.suggestionSize}
        </button>
      </div>
    </div>
  );
};

export default PlayerPool;
