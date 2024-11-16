import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import type { Player, PlayerPair } from "@types";

interface PairManagementProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  pairs: PlayerPair[];
  onCreatePair: (playerIds: [string, string], name: string) => void;
  onDeletePair: (pairId: string) => void;
}

const PairManagement: React.FC<PairManagementProps> = ({
  isOpen,
  onClose,
  players,
  pairs,
  onCreatePair,
  onDeletePair,
}) => {
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [pairName, setPairName] = useState("");

  const availablePlayers = players.filter(
    (player) =>
      player.status === "available" &&
      !pairs.some((pair) => pair.playerIds.includes(player.id)),
  );

  // Update pair name when players are selected
  useEffect(() => {
    if (selectedPlayers.length === 2) {
      const player1 = players.find((p) => p.id === selectedPlayers[0]);
      const player2 = players.find((p) => p.id === selectedPlayers[1]);
      if (player1 && player2) {
        setPairName(`${player1.name} & ${player2.name}`);
      }
    } else {
      setPairName("");
    }
  }, [selectedPlayers, players]);

  const handlePlayerSelect = (playerId: string) => {
    if (selectedPlayers.includes(playerId)) {
      setSelectedPlayers(selectedPlayers.filter((id) => id !== playerId));
    } else if (selectedPlayers.length < 2) {
      setSelectedPlayers([...selectedPlayers, playerId]);
    }
  };

  const handleCreatePair = () => {
    if (selectedPlayers.length === 2 && pairName.trim()) {
      onCreatePair(selectedPlayers as [string, string], pairName.trim());
      setSelectedPlayers([]);
      setPairName("");
    }
  };

  if (!isOpen) return null;

  const createRandomPair = () => {
    const randomPlayers = availablePlayers
      .sort(() => Math.random() - 0.5)
      .slice(0, 2);
    setSelectedPlayers(randomPlayers.map((player) => player.id));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
        >
          <X size={24} />
        </button>

        <h2 className="mb-4 text-xl font-bold">Manage Player Pairs</h2>

        <div className="mb-4">
          <h3 className="mb-2 font-semibold">Create New Pair</h3>

          <input
            type="text"
            value={pairName}
            onChange={(e) => setPairName(e.target.value)}
            placeholder="Pair name"
            className="mb-2 w-full rounded border p-2"
          />

          <div className="mb-2 grid grid-cols-2 gap-2">
            {availablePlayers.map((player) => (
              <button
                key={player.id}
                onClick={() => handlePlayerSelect(player.id)}
                className={`rounded p-2 text-sm ${selectedPlayers.includes(player.id)
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100"
                  }`}
              >
                {player.name}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              onClick={handleCreatePair}
              disabled={selectedPlayers.length !== 2 || !pairName.trim()}
              className="w-full rounded bg-blue-500 p-2 text-white disabled:bg-gray-300"
            >
              Create Pair
            </button>

            <button
              type="button"
              className="w-full rounded bg-gray-100 p-2"
              onClick={createRandomPair}
            >
              Random pair
            </button>
          </div>
        </div>

        <div>
          <h3 className="mb-2 font-semibold">Existing Pairs</h3>
          <div className="space-y-2">
            {pairs.map((pair) => (
              <div
                key={pair.id}
                className="flex items-center justify-between rounded bg-gray-50 p-2"
              >
                <span>{pair.name}</span>
                <button
                  onClick={() => onDeletePair(pair.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X size={20} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PairManagement;
