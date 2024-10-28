import React from "react";
import { X } from "lucide-react";
import { CourtData } from "../types";

interface CourtDisplayProps {
  courtData: CourtData;
  releaseCourt: (courtId: string) => void;
}

const CourtDisplay: React.FC<CourtDisplayProps> = ({
  courtData,
  releaseCourt,
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {Object.entries(courtData).map(([_id, data]) => (
        <div
          key={data.gameId || data.court.id}
          className={`p-4 rounded-lg shadow-md ${
            data.gameId ? "bg-green-100" : "bg-white"
          }`}
        >
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold">
              {data.court.name} {data.court.status}
            </h3>

            {data.gameId && (
              <button
                onClick={() => releaseCourt(data.court.id)}
                className="text-red-500 hover:text-red-700 focus:outline-none"
                title="Release Court"
              >
                <X size={20} />
              </button>
            )}
          </div>

          {data.game && (
            <ul className="mt-2 text-red-500 text-sm">
              {data.players.map((player, index) => (
                <li key={index} className="text-gray-700">
                  {player.name} - {player.status}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
};

export default CourtDisplay;
