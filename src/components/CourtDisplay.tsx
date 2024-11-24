import React from "react";
import { X, Lock, Unlock } from "lucide-react";
import type { CourtData } from "@types";

interface CourtDisplayProps {
  courtData: CourtData;
  onEndGame: (courtId: string) => void;
  onToggleLock: (courtId: string) => void;
}

const CourtDisplay: React.FC<CourtDisplayProps> = ({
  courtData,
  onEndGame,
  onToggleLock,
}) => {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {Object.entries(courtData).map(([_id, data]) => (
        <div
          key={data.gameId || data.court.id}
          className={`relative overflow-hidden rounded-lg shadow-md ${
            data.court.locked ? "opacity-50" : ""
          }`}
        >
          <div className="flex w-full items-center justify-between bg-gray-100 px-2">
            <h3 className="text-sm font-bold">{data.court.name}</h3>

            <div className="flex items-center gap-2">
              <button
                title={`${data.court.locked ? "Unlock" : "Lock"} ${data.court.name}`}
                className="focus:outline-none enabled:text-red-500 enabled:hover:text-red-700 disabled:text-gray-500"
                onClick={() => onToggleLock(data.court.id)}
              >
                {data.court.locked ? (
                  <Lock size="1em" />
                ) : (
                  <Unlock size="1em" />
                )}
              </button>

              <button
                title={`Finish ${data.court.name}`}
                className="focus:outline-none enabled:text-red-500 enabled:hover:text-red-700 disabled:text-gray-500"
                disabled={!data.gameId}
                onClick={() => onEndGame(data.court.id)}
              >
                <X size="1em" />
              </button>
            </div>
          </div>

          <ul className="h-24 max-w-full px-4 py-2 text-sm">
            {data.players.map((player) => (
              <li key={player.id} className="truncate">
                {player.name}
              </li>
            ))}
          </ul>

          {/* {data.players && (
            <ul className="h-24 max-w-full px-4 py-2 text-sm">
              {data.players.map((player) => (
                <li key={player.id} className="truncate">
                  {player.name}
                </li>
              ))}
            </ul>
          )}

          {!data.players && !data.court.locked && (
            <div className="flex h-24 items-center justify-center px-4 py-2">
              <span className="text-sm text-gray-500">Available</span>
            </div>
          )} */}
        </div>
      ))}
    </div>
  );
};

export default CourtDisplay;
