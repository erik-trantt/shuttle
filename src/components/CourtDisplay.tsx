import React from "react";
import { X, Clock } from "lucide-react";
import type { CourtData, Game } from "@types";

interface CourtDisplayProps {
  courtData: CourtData;
  releaseCourt: (courtId: string) => void;
  queueLength: number;
  queuedGames?: Game[];
  queuedGamePlayers?: {
    gameId: string;
    players: { id: string; name: string }[];
  }[];
}

const CourtDisplay: React.FC<CourtDisplayProps> = ({
  courtData,
  releaseCourt,
  queueLength,
  queuedGames = [],
  queuedGamePlayers = [],
}) => {
  return (
    <div>
      {queueLength > 0 && (
        <div className="mb-4 rounded-md bg-blue-50 p-3">
          <p className="text-sm text-blue-700">
            Games in queue: <span className="font-semibold">{queueLength}</span>
            {queueLength === 6 && " (Queue is full)"}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {/* Active Courts */}
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

        {/* Queued Games */}
        {queuedGames.map((game, index) => {
          const gamePlayers =
            queuedGamePlayers.find((gp) => gp.gameId === game.id)?.players ||
            [];

          return (
            <div
              key={game.id}
              className="relative overflow-hidden rounded-lg border-2 border-dashed border-blue-300 shadow-md"
            >
              <div className="flex w-full items-center justify-between bg-blue-50 px-2">
                <h3 className="flex items-center text-sm font-semibold">
                  <Clock size="1em" className="mr-1" />
                  Queue #{index + 1}
                </h3>
              </div>

              <ul className="h-24 max-w-full px-4 py-2 text-sm">
                {gamePlayers.map((player) => (
                  <li key={player.id} className="truncate text-blue-600">
                    {player.name}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CourtDisplay;
