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
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
      {Object.entries(courtData).map(([_id, data]) => (
        <div
          key={data.gameId || data.court.id}
          className={`rounded-lg px-4 py-2 shadow-md ${
            data.gameId ? "bg-green-100" : "bg-white"
          }`}
        >
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold">
              {data.court.name} - {data.court.status}
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

          <div className="min-h-[4rem]">
            {data.game && (
              <ul className="mt-2 text-sm text-red-500">
                {data.players.map((player, index) => (
                  <li key={index} className="text-gray-700">
                    {player.name} - {player.status}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default CourtDisplay;
