import React, { useState, useEffect } from "react";
import { X, UserPlus, Pause, Link2, Link2Off, Dices, Play } from "lucide-react";
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
  onUndeletePlayer: (id: string) => void;
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
  onUndeletePlayer,
}) => {
  const [activeTab, setActiveTab] = useState<"pairs" | "players">("players");
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [pairName, setPairName] = useState("");
  const [newPlayerName, setNewPlayerName] = useState("");

  // Players available for pairing
  // - Available players are those that are not paired or in the process of playing
  const availablePlayersForPairing = players.filter(
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

  const handleCreatePair = (event: React.FormEvent) => {
    event.preventDefault();

    if (selectedPlayers.length === 2 && pairName.trim()) {
      onCreatePair(selectedPlayers as [string, string], pairName.trim());
      setSelectedPlayers([]);
      setPairName("");
    }
  };

  const handleCreatePlayer = (event: React.FormEvent) => {
    event.preventDefault();

    if (newPlayerName.trim()) {
      onCreatePlayer(newPlayerName.trim());
      setNewPlayerName("");
    }
  };

  const createRandomPair = () => {
    const randomPlayers = availablePlayersForPairing
      .sort(() => Math.random() - 0.5)
      .slice(0, 2);
    setSelectedPlayers(randomPlayers.map((player) => player.id));
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="relative my-6 ml-auto w-full max-w-xs overflow-y-auto overscroll-contain rounded-lg bg-white p-6 shadow-lg sm:mr-auto sm:max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          title="Close"
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
          onClick={onClose}
        >
          <X size="1.5em" />
        </button>

        <div className="mb-4 flex space-x-4 border-b">
          <button
            className={`pb-2 ${activeTab === "players" ? "border-b-2 border-blue-500 font-bold text-blue-500" : "text-gray-500"}`}
            onClick={() => setActiveTab("players")}
          >
            Manage Players
          </button>

          <button
            className={`pb-2 ${activeTab === "pairs" ? "border-b-2 border-blue-500 font-bold text-blue-500" : "text-gray-500"}`}
            onClick={() => setActiveTab("pairs")}
          >
            Manage Pairs
          </button>
        </div>

        {activeTab === "pairs" ? (
          <>
            <div className="mb-4">
              <h3 className="mb-2 font-bold">Create New Pair</h3>

              <form onSubmit={handleCreatePair} className="mb-4 flex gap-x-2">
                <input
                  type="text"
                  value={pairName}
                  onChange={(e) => setPairName(e.target.value)}
                  placeholder="Pair name"
                  className="w-full flex-1 truncate rounded border p-2"
                />

                <button
                  type="submit"
                  title="Pair"
                  disabled={selectedPlayers.length !== 2 || !pairName.trim()}
                  className="flex w-min flex-shrink-0 items-center rounded bg-blue-500 px-2 disabled:bg-gray-200"
                >
                  <Link2 size="1em" className="mr-2" />
                  Pair
                </button>

                <button
                  type="button"
                  title="Suggest"
                  className="flex w-min flex-shrink-0 items-center rounded bg-gray-100 px-2"
                  onClick={createRandomPair}
                >
                  <Dices size="1em" className="mr-2" />
                </button>
              </form>

              <div className="grid grid-cols-2 gap-2">
                {availablePlayersForPairing.map((player) => (
                  <button
                    key={player.id}
                    onClick={() => handlePlayerSelect(player.id)}
                    disabled={player.status !== "available"}
                    className={`rounded p-2 text-sm ${
                      selectedPlayers.includes(player.id)
                        ? "bg-blue-100 hover:bg-blue-200"
                        : player.status !== "available"
                          ? "cursor-not-allowed bg-gray-100 opacity-50"
                          : "bg-gray-100 hover:bg-gray-200"
                    }`}
                    title={
                      player.status !== "available"
                        ? `Player is ${player.status}`
                        : undefined
                    }
                  >
                    <span className="block truncate">{player.name}</span>
                    {player.status !== "available" && (
                      <span className="mt-1 block text-xs">
                        ({player.status})
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-4 font-bold">Existing Pairs</h3>

              <div className="space-y-2">
                {pairs.map((pair) => {
                  const player1 = players.find(
                    (p) => p.id === pair.playerIds[0],
                  );
                  const player2 = players.find(
                    (p) => p.id === pair.playerIds[1],
                  );
                  const isPlaying =
                    player1?.status === "playing" ||
                    player2?.status === "playing";

                  return (
                    <div
                      key={pair.id}
                      className="flex items-center justify-between rounded bg-gray-50 p-2"
                    >
                      <div className="flex flex-col">
                        <span>{pair.name}</span>
                        {isPlaying && (
                          <span className="text-xs text-green-600">
                            Currently playing
                          </span>
                        )}
                      </div>

                      <button
                        title={
                          isPlaying
                            ? "Cannot unpair players who are in a game"
                            : "Unpair"
                        }
                        onClick={() => onDeletePair(pair.id)}
                        disabled={isPlaying}
                        className={`ml-2 ${
                          isPlaying
                            ? "cursor-not-allowed text-gray-400"
                            : "text-red-500 hover:text-red-700"
                        }`}
                      >
                        <Link2Off size="1em" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <div>
            <div className="mb-4">
              <h3 className="mb-2 font-bold">Add New Player</h3>

              <form onSubmit={handleCreatePlayer} className="flex space-x-2">
                <input
                  type="text"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  placeholder="Player name"
                  className="flex-1 rounded border p-2"
                />

                <button
                  type="submit"
                  disabled={!newPlayerName.trim()}
                  className="flex w-min flex-shrink-0 items-center rounded bg-blue-500 p-2 text-white disabled:bg-gray-300"
                >
                  <UserPlus size="1em" className="mr-2" />
                  Add
                </button>
              </form>
            </div>

            <div>
              <h3 className="mb-2 font-bold">Players List</h3>
              <div className="space-y-2">
                {players.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between rounded bg-gray-50 p-2"
                  >
                    <div className="flex items-center">
                      <span>{player.name}</span>
                      {player.status === "playing" && (
                        <span className="ml-2 rounded bg-green-100 px-2 py-0.5 text-xs text-green-800">
                          Playing
                        </span>
                      )}
                      {player.status === "unavailable" && (
                        <span className="ml-2 rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-800">
                          Unavailable
                        </span>
                      )}
                    </div>

                    <div>
                      <button
                        title="Undelete"
                        onClick={() => onUndeletePlayer(player.id)}
                        disabled={player.status !== "retired"}
                        className={`group ml-2 ${
                          player.status !== "retired"
                            ? "cursor-not-allowed text-gray-400"
                            : "text-green-500"
                        }`}
                      >
                        <Play
                          size="1em"
                          className="group-enabled:group-hover:fill-current"
                        />
                      </button>

                      <button
                        title="Delete"
                        onClick={() => onDeletePlayer(player.id)}
                        disabled={player.status !== "available"}
                        className={`group ml-2 ${
                          player.status !== "available"
                            ? "cursor-not-allowed text-gray-400"
                            : "text-red-500"
                        }`}
                      >
                        <Pause
                          size="1em"
                          className="group-enabled:group-hover:fill-current"
                        />
                      </button>
                    </div>
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
