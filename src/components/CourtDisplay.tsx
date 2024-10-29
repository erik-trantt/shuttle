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
          className={`relative rounded-lg px-4 py-2 shadow-md`}
        >
          <div className="absolute left-0 top-0 mb-2 flex w-full items-center justify-between rounded-t bg-gray-100 px-2">
            <h3 className="text-sm font-semibold">{data.court.name}</h3>

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

          <div className="h-24">
            {data.game && (
              <ul className="h-20 pt-4 text-sm text-red-500">
                {data.players.map((player, index) => (
                  <li key={index} className="text-gray-700">
                    {player.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ))}

      {/* <dialog open className="fixed inset-0 h-screen w-screen bg-white">
        <p>Greetings, one and all!</p>
        <form method="dialog">
          <button>OK</button>
        </form>
      </dialog> */}
    </div>
  );
};

export default CourtDisplay;
