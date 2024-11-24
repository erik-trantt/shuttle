import React, { useCallback, useEffect, useRef } from "react";
import { Dices, PlayCircle } from "lucide-react";
import PlayerListItem from "./ListItem";
import { useRuntimeConfig } from "@hooks";
import type { Player } from "@types";
import {
  usePlayer,
  useAvailablePlayers,
  useSelectedPlayers,
  usePairs,
} from "@contexts";
import styles from "./pool.module.css";

interface PlayerPoolProps {
  nextCourtAvailable: boolean;
  startGame: () => void;
}

const PlayerPool: React.FC<PlayerPoolProps> = ({
  nextCourtAvailable,
  startGame,
}) => {
  const config = useRuntimeConfig();
  const { selectPlayer } = usePlayer();
  const availablePlayers = useAvailablePlayers();
  const selectedPlayers = useSelectedPlayers();
  const pairs = usePairs();

  const selectedPlayersLength = selectedPlayers.length;
  const oldAutoSelectionSize = useRef(config.game.getAutoSelectionSize());
  const autoSelectionSize = config.game.getAutoSelectionSize();
  const canStartGame =
    selectedPlayers.length === config.game.settings.playerNumber &&
    nextCourtAvailable;
  const canAutoSelect = availablePlayers.length >= autoSelectionSize;

  // Helper function to get paired player if exists
  const getPairedPlayer = useCallback(
    (playerId: string): Player | null => {
      const pair = pairs.find((p) => p.playerIds.includes(playerId));
      if (!pair) return null;

      const pairedPlayerId = pair.playerIds.find((id) => id !== playerId);
      if (!pairedPlayerId) return null;

      return availablePlayers.find((p) => p.id === pairedPlayerId) || null;
    },
    [availablePlayers, pairs],
  );

  // Helper function to get initial selection considering pairs and format rules
  const getInitialSelection = useCallback(
    (size: number): Player[] => {
      const selection: Player[] = [];
      const availableForSelection = [...availablePlayers].filter(
        (p) => !p.inGame
      );

      // First try to find players with partner preferences
      const playersWithPartners = availableForSelection.filter(
        (player) =>
          player.preferredPartners && player.preferredPartners.length > 0
      );

      // Try to match preferred pairs first
      if (
        playersWithPartners.length >= 2 &&
        config.game.settings.allowPairs
      ) {
        for (const player of playersWithPartners) {
          if (selection.length >= size) break;

          // Skip if player already selected
          if (selection.some((p) => p.id === player.id)) continue;

          const preferredPartner = availableForSelection.find(
            (p) =>
              player.preferredPartners?.includes(p.id) &&
              p.id !== player.id &&
              !selection.some((s) => s.id === p.id)
          );

          if (preferredPartner && selection.length + 2 <= size) {
            selection.push(player, preferredPartner);
          }
        }
      }

      // Fill remaining slots with random players
      if (selection.length < size) {
        const remainingPlayers = availableForSelection
          .filter((p) => !selection.some((s) => s.id === p.id))
          .sort(() => Math.random() - 0.5);

        while (selection.length < size && remainingPlayers.length > 0) {
          const nextPlayer = remainingPlayers.pop();
          if (nextPlayer) {
            selection.push(nextPlayer);
          }
        }
      }

      return selection;
    },
    [availablePlayers, config.game.settings.allowPairs]
  );

  // Auto-select players when auto-selection size changes
  useEffect(() => {
    if (autoSelectionSize !== oldAutoSelectionSize.current) {
      oldAutoSelectionSize.current = autoSelectionSize;
      const initialSelection = getInitialSelection(autoSelectionSize);
      initialSelection.forEach(selectPlayer);
    }
  }, [autoSelectionSize, getInitialSelection, selectPlayer]);

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
        {availablePlayers.map((player) => {
          const isSelected = selectedPlayers.some(
            (selectedPlayer) => selectedPlayer.id === player.id
          );
          const isDisabled =
            !isSelected &&
            selectedPlayersLength >= config.game.settings.playerNumber;

          return (
            <PlayerListItem
              key={player.queueNumber}
              player={player}
              selected={isSelected}
              selectedPlayers={selectedPlayers}
              selectPlayer={() => selectPlayer(player)}
              disabled={isDisabled}
              pairs={pairs}
              players={availablePlayers}
            />
          );
        })}
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
            {Array.from(Array(config.game.settings.playerNumber).keys()).map(
              (i) => (
                <li key={i} className="truncate px-2 text-sm">
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
          onClick={() => {
            const initialSelection = getInitialSelection(autoSelectionSize);
            initialSelection.forEach(selectPlayer);
          }}
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
