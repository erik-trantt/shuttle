import React, { useState, useEffect } from "react";
import { X, UserPlus, Trash2, Link2, Link2Off, Dices } from "lucide-react";
import type { Player, PlayerPair } from "@types";

interface UserManagementProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  pairs: PlayerPair[];
  onCreatePair: (playerIds: [string, string], name: string) => void;
  onDeletePair: (pairId: string) => void;
  onCreatePlayer: (name: string) => void;
  onDeletePlayer: (id: string) => void;
}

const UserManagement: React.FC<UserManagementProps> = ({
  isOpen,
  onClose,
  players,
  pairs,
  onCreatePair,
  onDeletePair,
  onCreatePlayer,
  onDeletePlayer,
}) => {
  const [activeTab, setActiveTab] = useState<"pairs" | "players">("players");
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [pairName, setPairName] = useState("");
  const [newPlayerName, setNewPlayerName] = useState("");

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

  const handleCreatePlayer = () => {
    if (newPlayerName.trim()) {
      onCreatePlayer(newPlayerName.trim());
      setNewPlayerName("");
    }
  };

  const createRandomPair = () => {
    const randomPlayers = availablePlayers
      .sort(() => Math.random() - 0.5)
      .slice(0, 2);
    setSelectedPlayers(randomPlayers.map((player) => player.id));
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="relative mx-4 my-6 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
        >
          <X size="1.5em" />
        </button>

        <div className="mb-4 flex space-x-4 border-b">
          <button
            className={`pb-2 ${activeTab === "players" ? "border-b-2 border-blue-500 font-semibold text-blue-500" : "text-gray-500"}`}
            onClick={() => setActiveTab("players")}
          >
            Manage Players
          </button>
          <button
            className={`pb-2 ${activeTab === "pairs" ? "border-b-2 border-blue-500 font-semibold text-blue-500" : "text-gray-500"}`}
            onClick={() => setActiveTab("pairs")}
          >
            Manage Pairs
          </button>
        </div>

        {activeTab === "pairs" ? (
          <>
            <div className="mb-4">
              <h3 className="mb-2 font-semibold">Create New Pair</h3>

              <div className="mb-2 flex gap-x-2">
                <input
                  type="text"
                  value={pairName}
                  onChange={(e) => setPairName(e.target.value)}
                  placeholder="Pair name"
                  className="w-full flex-1 truncate rounded border p-2"
                />

                <button
                  type="button"
                  title="Pair"
                  disabled={selectedPlayers.length !== 2 || !pairName.trim()}
                  className="flex w-min flex-shrink-0 items-center rounded bg-blue-500 px-2 disabled:bg-gray-200"
                  onClick={handleCreatePair}
                >
                  <Link2 size="1em" className="mr-2" />
                  Pair
                </button>

                <button
                  type="button"
                  className="flex w-min flex-shrink-0 items-center rounded bg-gray-100 px-2"
                  title="Suggest"
                  onClick={createRandomPair}
                >
                  <Dices size="1em" className="mr-2" />
                  {/* Suggest */}
                </button>
              </div>

              <div className="mb-2 grid grid-cols-2 gap-2">
                {availablePlayers.map((player) => (
                  <button
                    key={player.id}
                    onClick={() => handlePlayerSelect(player.id)}
                    className={`rounded p-2 text-sm ${
                      selectedPlayers.includes(player.id)
                        ? "bg-blue-100 hover:bg-blue-200"
                        : "bg-gray-100"
                    }`}
                  >
                    {player.name}
                  </button>
                ))}
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
                      <Link2Off size="1em" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div>
            <div className="mb-4">
              <h3 className="mb-2 font-semibold">Add New Player</h3>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  placeholder="Player name"
                  className="flex-1 rounded border p-2"
                />

                <button
                  onClick={handleCreatePlayer}
                  disabled={!newPlayerName.trim()}
                  className="flex w-min flex-shrink-0 items-center rounded bg-blue-500 p-2 text-white disabled:bg-gray-300"
                >
                  <UserPlus size="1em" className="mr-2" />
                  Add
                </button>
              </div>
            </div>

            <div>
              <h3 className="mb-2 font-semibold">Players List</h3>
              <div className="space-y-2">
                {players.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between rounded bg-gray-50 p-2"
                  >
                    <span>{player.name}</span>
                    <button
                      onClick={() => onDeletePlayer(player.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size="1em" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
