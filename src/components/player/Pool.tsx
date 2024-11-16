import React, { useCallback, useEffect, useRef } from "react";
import { Dices, PlayCircle } from "lucide-react";
import PlayerListItem from "./ListItem";
import { useRuntimeConfig } from "@hooks";
import type { Player, PlayerPair } from "@types";
import { parseQueueNumberToOrder } from "@utils";
import styles from "./pool.module.css";

interface PlayerPoolProps {
  players: Player[];
  pairs: PlayerPair[];
  nextCourtAvailable: boolean;
  selectPlayer: (player: Player) => void;
  selectPlayers: (players: Player[]) => void;
  selectedPlayers: Player[];
  startGame: () => void;
}

const PlayerPool: React.FC<PlayerPoolProps> = ({
  players,
  pairs,
  nextCourtAvailable,
  selectPlayer,
  selectPlayers,
  selectedPlayers,
  startGame,
}) => {
  const config = useRuntimeConfig();

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
      let index = 0;

      while (selection.length < size && index < availablePlayers.length) {
        const player = availablePlayers[index];
        const pairedPlayer = getPairedPlayer(player.id);

        if (selection.length === 0) {
          // First player selection
          selection.push(player);

          // If first player is paired, automatically select their pair
          if (pairedPlayer) {
            selection.push(pairedPlayer);
          }
        } else {
          // For subsequent selections
          const firstPlayerPaired = getPairedPlayer(selection[0].id) !== null;

          if (firstPlayerPaired) {
            // If first player was paired, prefer another pair or singles
            if (pairedPlayer && selection.length + 2 <= size) {
              selection.push(player, pairedPlayer);
            } else if (!pairedPlayer && selection.length + 1 <= size) {
              selection.push(player);
            }
          } else {
            // If first player was single, follow game settings
            if (
              config.game.settings.allowPairs &&
              pairedPlayer &&
              selection.length + 2 <= size
            ) {
              selection.push(player, pairedPlayer);
            } else if (!pairedPlayer && selection.length + 1 <= size) {
              selection.push(player);
            }
          }
        }

        index++;
      }

      return selection;
    },
    [availablePlayers, config.game.settings.allowPairs, getPairedPlayer],
  );

  // Helper function to validate player selection based on format rules
  const validatePlayerSelection = (players: Player[]): boolean => {
    if (players.length !== config.game.settings.playerNumber) return false;

    const pairedPlayers = players.filter((player) =>
      getPairedPlayer(player.id),
    );
    const singlePlayers = players.filter(
      (player) => !getPairedPlayer(player.id),
    );

    // Check if initial player is paired
    const initialPlayer = players[0];
    const isInitialPaired = getPairedPlayer(initialPlayer.id) !== null;

    if (isInitialPaired) {
      // When initial player is paired, enforce paired double format
      // Must have either 2 pairs (4 paired players) or 1 pair + 2 singles
      return (
        (pairedPlayers.length === 4 && singlePlayers.length === 0) ||
        (pairedPlayers.length === 2 && singlePlayers.length === 2)
      );
    } else {
      // For regular format, follow game settings
      if (config.game.settings.allowPairs) {
        // Allow mix of pairs and singles
        return (
          (pairedPlayers.length === 2 && singlePlayers.length === 2) ||
          (pairedPlayers.length === 0 && singlePlayers.length === 4)
        );
      } else {
        // No pairs allowed
        return pairedPlayers.length === 0 && singlePlayers.length === 4;
      }
    }
  };

  const autoSelectPlayers = useCallback(
    (suggestionSize: number): void => {
      if (!canAutoSelect) return;

      // Get remaining players (excluding already selected)
      const remainingPlayers = availablePlayers.filter(
        (p) => !selectedPlayers.some((selected) => selected.id === p.id),
      );

      // Check if initial player is paired
      const initialPlayer =
        selectedPlayers.length > 0 ? selectedPlayers[0] : null;
      const isInitialPaired =
        initialPlayer && getPairedPlayer(initialPlayer.id) !== null;

      // Prepare pool of candidates based on initial player's pair status
      let candidates: Player[] = [];
      if (isInitialPaired) {
        // If initial player is paired, look for another pair first
        const pairs = remainingPlayers.filter((p) => getPairedPlayer(p.id));
        const singles = remainingPlayers.filter((p) => !getPairedPlayer(p.id));

        if (pairs.length >= 2) {
          // Try to find a complete pair
          const firstPairPlayer = pairs[0];
          const secondPairPlayer = getPairedPlayer(firstPairPlayer.id);
          if (secondPairPlayer) {
            candidates = [firstPairPlayer, secondPairPlayer];
          }
        }

        // If no pairs available, use singles
        if (candidates.length === 0 && singles.length >= 2) {
          candidates = singles.slice(0, 2);
        }
      } else {
        // For non-paired initial player, follow game settings
        if (config.game.settings.allowPairs) {
          // Try to find a pair first
          const pairs = remainingPlayers.filter((p) => getPairedPlayer(p.id));
          if (pairs.length >= 2) {
            const firstPairPlayer = pairs[0];
            const secondPairPlayer = getPairedPlayer(firstPairPlayer.id);
            if (secondPairPlayer) {
              candidates = [firstPairPlayer, secondPairPlayer];
            }
          }
        }

        // If no pairs selected or pairs not allowed, use random players
        if (candidates.length === 0) {
          candidates = remainingPlayers
            .sort(() => Math.random() - 0.5)
            .slice(0, suggestionSize);
        }
      }

      selectPlayers([...selectedPlayers, ...candidates]);
    },
    [
      availablePlayers,
      canAutoSelect,
      config.game.settings.allowPairs,
      getPairedPlayer,
      selectedPlayers,
      selectPlayers,
    ],
  );

  useEffect(() => {
    if (!(selectedPlayers.length === 0 && canAutoSelect)) {
      return;
    }

    // Reset selection if auto selection size changed
    if (oldAutoSelectionSize.current !== autoSelectionSize) {
      selectPlayers([]);
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
        "Not enough available players for suggestion",
        availablePlayers.length,
      );
      return;
    }

    // Get initial selection
    const initialSelection = getInitialSelection(1);
    const remainingNeeded =
      config.game.settings.playerNumber - initialSelection.length;

    if (remainingNeeded <= 0) {
      if (validatePlayerSelection(initialSelection)) {
        selectPlayers(initialSelection);
      }
      return;
    }

    // Get available players excluding already selected ones
    const remainingPlayers = availablePlayers.filter(
      (player) =>
        !initialSelection.some((selected) => selected.id === player.id),
    );

    let attempts = 0;
    const maxAttempts = 10;

    // Check if initial player is part of a pair
    const initialPlayer = initialSelection[0];
    const isInitialPlayerPaired = initialPlayer && initialPlayer.partnerId;

    // If initial player is not paired, handle the three scenarios:
    // 1. 4 unpaired players
    // 2. 1 pair + 2 unpaired players
    // 3. 2 unpaired + 1 pair
    if (!isInitialPlayerPaired && config.game.settings.allowPairs) {
      while (attempts < maxAttempts) {
        const randomSelection = [...initialSelection];
        const remainingForSelection = [...remainingPlayers];

        // Select second player
        const secondPlayerIndex = Math.floor(
          Math.random() * remainingForSelection.length,
        );
        const secondPlayer = remainingForSelection[secondPlayerIndex];
        remainingForSelection.splice(secondPlayerIndex, 1);
        randomSelection.push(secondPlayer);

        // If second player is paired, add their partner and one unpaired
        if (secondPlayer.partnerId) {
          // Add partner of second player
          const partner = remainingForSelection.find(
            (p) => p.id === secondPlayer.partnerId,
          );
          if (partner) {
            randomSelection.push(partner);
            remainingForSelection.splice(
              remainingForSelection.findIndex((p) => p.id === partner.id),
              1,
            );

            // Find an unpaired player for the last slot
            const unpairedPlayers = remainingForSelection.filter(
              (p) => !p.partnerId,
            );
            if (unpairedPlayers.length > 0) {
              const lastPlayer =
                unpairedPlayers[
                  Math.floor(Math.random() * unpairedPlayers.length)
                ];
              randomSelection.push(lastPlayer);
            }
          }
        }
        // If second player is unpaired
        else {
          // Select third player
          const thirdPlayerIndex = Math.floor(
            Math.random() * remainingForSelection.length,
          );
          const thirdPlayer = remainingForSelection[thirdPlayerIndex];
          remainingForSelection.splice(thirdPlayerIndex, 1);
          randomSelection.push(thirdPlayer);

          // If third player is paired, add their partner (2 unpaired + 1 pair)
          if (thirdPlayer.partnerId) {
            const partner = remainingForSelection.find(
              (p) => p.id === thirdPlayer.partnerId,
            );
            if (partner) {
              randomSelection.push(partner);
            }
          }
          // If third player is unpaired, add another unpaired (4 unpaired)
          else {
            const unpairedPlayers = remainingForSelection.filter(
              (p) => !p.partnerId,
            );
            if (unpairedPlayers.length > 0) {
              const lastPlayer =
                unpairedPlayers[
                  Math.floor(Math.random() * unpairedPlayers.length)
                ];
              randomSelection.push(lastPlayer);
            }
          }
        }

        // Check if we have a valid selection
        if (
          randomSelection.length === config.game.settings.playerNumber &&
          validatePlayerSelection(randomSelection)
        ) {
          selectPlayers(randomSelection);
          return;
        }

        attempts++;
      }
    } else {
      // Logic for when initial player is paired
      // Two scenarios:
      // 1. 2 pairs
      // 2. 1 pair + 2 unpaired
      while (attempts < maxAttempts) {
        const randomSelection = [...initialSelection];
        const remainingForSelection = [...remainingPlayers];

        // Add partner of initial player
        if (initialPlayer.partnerId) {
          const partner = remainingForSelection.find(
            (p) => p.id === initialPlayer.partnerId,
          );
          if (partner) {
            randomSelection.push(partner);
            remainingForSelection.splice(
              remainingForSelection.findIndex((p) => p.id === partner.id),
              1,
            );
          }
        }

        // Select third player
        if (remainingForSelection.length > 0) {
          const thirdPlayerIndex = Math.floor(
            Math.random() * remainingForSelection.length,
          );
          const thirdPlayer = remainingForSelection[thirdPlayerIndex];
          randomSelection.push(thirdPlayer);
          remainingForSelection.splice(thirdPlayerIndex, 1);

          // If third player is paired, add their partner (2 pairs)
          if (thirdPlayer.partnerId) {
            const partner = remainingForSelection.find(
              (p) => p.id === thirdPlayer.partnerId,
            );
            if (partner) {
              randomSelection.push(partner);
            }
          } else {
            // If third player is unpaired, add another unpaired (1 pair + 2 unpaired)
            const unpairedPlayers = remainingForSelection.filter(
              (p) => !p.partnerId,
            );
            if (unpairedPlayers.length > 0) {
              const lastPlayerIndex = Math.floor(
                Math.random() * unpairedPlayers.length,
              );
              const lastPlayer = unpairedPlayers[lastPlayerIndex];
              randomSelection.push(lastPlayer);
            }
          }
        }

        // Check if this combination is valid according to the rules
        if (validatePlayerSelection(randomSelection)) {
          selectPlayers(randomSelection);
          return;
        }

        attempts++;
      }
    }

    console.warn(
      "Could not find valid player combination after",
      maxAttempts,
      "attempts",
    );
  };

  const isPaired = (player: Player) => {
    return pairs.some((pair) => pair.playerIds.includes(player.id));
  };

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
        {availablePlayers.map((player) => (
          <PlayerListItem
            player={player}
            key={player.queueNumber}
            disabled={player.status === "unavailable"}
            selectPlayer={() => selectPlayer(player)}
            selected={selectedPlayers.some(
              (selected) => selected.id === player.id,
            )}
            isPaired={isPaired(player)}
            pairs={pairs}
            players={players}
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
