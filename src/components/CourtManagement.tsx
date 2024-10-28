import React from "react";
import { PlayCircle } from "lucide-react";
import { Player } from "../types";

interface CourtManagementProps {
  selectedPlayers: Player[];
  startGame: () => void;
}

const CourtManagement: React.FC<CourtManagementProps> = ({
  selectedPlayers,
  startGame,
}) => {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Selected Players:</h3>

      <ul className="mb-4 space-y-2">
        {selectedPlayers.map((player, index) => (
          <li key={index} className="bg-blue-100 text-blue-800 p-2 rounded-md">
            {player.name}
          </li>
        ))}
        {[...Array(4 - selectedPlayers.length)].map((_, index) => (
          <li
            key={`empty-${index}`}
            className="bg-gray-100 p-2 rounded-md text-gray-400 italic"
          >
            Waiting for player...
          </li>
        ))}
      </ul>

      <button
        onClick={startGame}
        disabled={selectedPlayers.length !== 4}
        className={`w-full py-2 px-4 rounded-md flex items-center justify-center ${
          selectedPlayers.length === 4
            ? "bg-green-500 text-white hover:bg-green-600"
            : "bg-gray-300 text-gray-500 cursor-not-allowed"
        }`}
      >
        <PlayCircle size={20} className="mr-2" />
        Start Match
      </button>
    </div>
  );
};

export default CourtManagement;
