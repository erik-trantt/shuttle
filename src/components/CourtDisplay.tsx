import React from "react";
import { X } from "lucide-react";
import type { CourtData } from "@types";

interface CourtDisplayProps {
  courtData: CourtData;
  releaseCourt: (courtId: string) => void;
}

const CourtDisplay: React.FC<CourtDisplayProps> = ({
  courtData,
  releaseCourt,
}) => {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {Object.entries(courtData).map(([_id, data]) => (
        <div
          key={data.gameId || data.court.id}
          className={`relative overflow-hidden rounded-lg shadow-md`}
        >
          <div className="flex w-full items-center justify-between bg-gray-100 px-2">
            <h3 className="text-sm font-semibold">{data.court.name}</h3>

            <button
              title={`Finish ${data.court.name}`}
              className="focus:outline-none enabled:text-red-500 enabled:hover:text-red-700 disabled:text-gray-500"
              disabled={!data.gameId}
              onClick={() => releaseCourt(data.court.id)}
            >
              <X size="1em" />
            </button>
          </div>

          <ul className="h-24 max-w-full px-4 py-2 text-sm">
            {data.players.map((player) => (
              <li key={player.id} className="truncate">
                {player.name}
              </li>
            ))}
          </ul>
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
