import React, { useCallback, useEffect, useRef, useState } from "react";
import { Dices, PlayCircle, UserPlus } from "lucide-react";
import PlayerListItem from "./ListItem";
import { useRuntimeConfig } from "@hooks";
import type { Player, PlayerPair } from "@types";
import { parseQueueNumberToOrder } from "@utils";
import styles from "./pool.module.css";

interface PlayerPoolProps {
  players: Player[];
  pairs: PlayerPair[];
  addPlayer: (name: string) => void;
  nextCourtAvailable: boolean;
  selectPlayer: (player: Player) => void;
  selectPlayers: (players: Player[]) => void;
  selectedPlayers: Player[];
  startGame: () => void;
}

const PlayerPool: React.FC<PlayerPoolProps> = ({
  players,
  pairs,
  addPlayer,
  nextCourtAvailable,
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

  const oldAutoSelectionSize = useRef(config.game.getAutoSelectionSize());
  const autoSelectionSize = config.game.getAutoSelectionSize();
  const canStartGame =
    selectedPlayers.length === config.game.settings.playerNumber &&
    nextCourtAvailable;
  const canAutoSelect = availablePlayers.length >= autoSelectionSize;

  // Helper function to get paired player if exists
  const getPairedPlayer = (playerId: string): Player | null => {
    const pair = pairs.find((p) => p.playerIds.includes(playerId));
    if (!pair) return null;

    const pairedPlayerId = pair.playerIds.find((id) => id !== playerId);
    if (!pairedPlayerId) return null;

    return availablePlayers.find((p) => p.id === pairedPlayerId) || null;
  };

  // Helper function to get initial selection considering pairs
  const getInitialSelection = (size: number): Player[] => {
    const selection: Player[] = [];
    let index = 0;

    while (selection.length < size && index < availablePlayers.length) {
      const player = availablePlayers[index];
      const pairedPlayer = getPairedPlayer(player.id);

      if (pairedPlayer) {
        // If this is a paired player and we have room for both
        if (selection.length + 2 <= config.game.settings.playerNumber) {
          selection.push(player, pairedPlayer);
        }
      } else if (selection.length + 1 <= size) {
        // If this is a single player and we have room
        selection.push(player);
      }

      index++;
    }

    return selection;
  };

  const autoSelectPlayers = useCallback(
    (suggestionSize: number): void => {
      const initialSelection = getInitialSelection(suggestionSize);
      selectPlayers(initialSelection);
    },
    [availablePlayers, pairs, config.game.settings.playerNumber, selectPlayers],
  );

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

  const suggestPlayers = () => {
    if (availablePlayers.length < config.game.settings.playerNumber) {
      console.error(
        `Not enough players to form a match. Please wait till there are at least ${config.game.settings.playerNumber} available players.`,
      );
      return;
    }

    if (availablePlayers.length === config.game.settings.playerNumber) {
      selectPlayers(availablePlayers);
      return;
    }

    // Get initial selection (including pairs)
    const initialSelection = getInitialSelection(autoSelectionSize);

    // Calculate how many more players we need
    const remainingNeeded =
      config.game.settings.playerNumber - initialSelection.length;

    if (remainingNeeded <= 0) {
      selectPlayers(initialSelection);
      return;
    }

    // Get available players excluding already selected ones
    const remainingPlayers = availablePlayers.filter(
      (player) => !initialSelection.some((p) => p.id === player.id),
    );

    // Randomly select from remaining players, considering pairs
    const randomSelected: Player[] = [];
    const usedIndexes = new Set<number>();

    while (
      randomSelected.length < remainingNeeded &&
      usedIndexes.size < remainingPlayers.length
    ) {
      const availableIndexes = Array.from(
        Array(remainingPlayers.length).keys(),
      ).filter((i) => !usedIndexes.has(i));

      if (availableIndexes.length === 0) break;

      const randomIndex =
        availableIndexes[Math.floor(Math.random() * availableIndexes.length)];
      const player = remainingPlayers[randomIndex];
      const pairedPlayer = getPairedPlayer(player.id);

      usedIndexes.add(randomIndex);

      if (pairedPlayer) {
        const pairedPlayerIndex = remainingPlayers.findIndex(
          (p) => p.id === pairedPlayer.id,
        );
        if (pairedPlayerIndex !== -1) {
          usedIndexes.add(pairedPlayerIndex);
        }

        if (randomSelected.length + 2 <= remainingNeeded) {
          randomSelected.push(player, pairedPlayer);
        }
      } else if (randomSelected.length + 1 <= remainingNeeded) {
        randomSelected.push(player);
      }
    }

    selectPlayers([...initialSelection, ...randomSelected]);
  };

  const isPaired = (player: Player) => {
    return pairs.some((pair) => pair.playerIds.includes(player.id));
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
            isPaired={isPaired(player)}
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
          <span className="whitespace-nowrap">Start Game</span>
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
