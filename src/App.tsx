import { useEffect, useState } from "react";
import { Users, LayoutGrid } from "lucide-react";
import { v4 as uuid } from "uuid";
import PlayerPool from "./components/player/Pool";
import CourtDisplay from "./components/CourtDisplay";
import { ConfigProvider } from "@contexts";
import { useRuntimeConfig } from "@hooks";
import {
  buildInitialCourtData,
  buildInitialPlayers,
  generateQueueNumber,
} from "@utils";
import type { Court, CourtData, Game, Player } from "@types";

let initialPlayers: Player[] = [];
let initialCourtData: CourtData = {};

if (typeof window !== "undefined") {
  initialPlayers = buildInitialPlayers();
  initialCourtData = buildInitialCourtData();
}

function App() {
  const [courtData, setCourtData] = useState<CourtData>(initialCourtData);
  const [games, setGames] = useState<Game[]>([]);
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [gameQueue, setGameQueue] = useState<Game[]>([]);
  const [queuedGamePlayers, setQueuedGamePlayers] = useState<
    {
      gameId: string;
      players: { id: string; name: string }[];
    }[]
  >([]);

  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
  const [nextCourt, setNextCourt] = useState<Court | null>(null);

  const config = useRuntimeConfig();

  const addPlayer = (name: string) => {
    const basePlayer: Player = {
      id: uuid(),
      name,
      status: "available",
      index: 0,
      queueNumber: generateQueueNumber({
        gameIndex: games.length,
        playerIndex: 0,
      }),
    };

    if (!players.length) {
      setPlayers([basePlayer]);
    }

    const foundPlayer: Player | undefined = players.find(
      (player) => player.name === name,
    );

    if (!foundPlayer) {
      basePlayer.index = players.length;
      basePlayer.queueNumber = generateQueueNumber({
        gameIndex: games.length + 1,
        playerIndex: players.length,
      });

      setPlayers([...players, basePlayer]);
    }
  };

  const selectPlayer = (player: Player) => {
    const isAutoSelected = selectedPlayers
      .slice(0, config.game.getAutoSelectionSize())
      .some((selectedPlayer) => selectedPlayer.id === player.id);

    if (isAutoSelected) {
      return;
    }

    const isSelected = selectedPlayers.some(
      (selectedPlayer) => selectedPlayer.id === player.id,
    );

    if (isSelected) {
      setSelectedPlayers(
        selectedPlayers.filter(
          (selectedPlayer) => selectedPlayer.id !== player.id,
        ),
      );
    } else if (selectedPlayers.length < config.game.settings.playerNumber) {
      setSelectedPlayers([...selectedPlayers, player]);
    }
  };

  const selectPlayers = (players: Player[]) => {
    setSelectedPlayers(players);
  };

  const assignGameToCourt = (
    game: Game,
    court: Court,
    gamePlayers: Player[],
  ) => {
    const updatedGame = { ...game, courtId: court.id };
    const courtToStartGame: CourtData = {
      [court.id]: {
        court: { ...court, status: "playing" },
        gameId: updatedGame.id,
        game: updatedGame,
        players: gamePlayers,
      },
    };

    setCourtData((oldCourtData) => ({
      ...oldCourtData,
      ...courtToStartGame,
    }));

    setGames((oldGames) => [...oldGames, updatedGame]);

    // Remove from queued players if it was a queued game
    setQueuedGamePlayers((current) =>
      current.filter((qgp) => qgp.gameId !== game.id),
    );

    return updatedGame;
  };

  const startGame = () => {
    if (selectedPlayers.length !== 4) {
      console.log("Not enough player. Do nothing");
      return;
    }

    const selectedPlayerIds = selectedPlayers.map((player) => player.id);
    const newGame: Game = {
      id: uuid(),
      courtId: nextCourt?.id || "",
      firstParty: {
        playerIds: selectedPlayerIds.slice(0, 2),
        score: 0,
      },
      secondParty: {
        playerIds: selectedPlayerIds.slice(2, 4),
        score: 0,
      },
      index: games.length + 1,
      timestamp: Date.now(),
    };

    // Update players' status
    const playersToStartGame = [...selectedPlayers];
    const updatedPlayers = [...players];

    playersToStartGame.forEach(({ index: playerIndex }) => {
      const foundPlayer = updatedPlayers[playerIndex];
      if (!foundPlayer) return;
      foundPlayer.status = "unavailable";
    });

    setPlayers(updatedPlayers);

    if (!nextCourt) {
      // Add to queue if no court is available
      if (gameQueue.length < 6) {
        setGameQueue((oldQueue) => [...oldQueue, newGame]);
        // Store players for the queued game
        setQueuedGamePlayers((current) => [
          ...current,
          {
            gameId: newGame.id,
            players: selectedPlayers.map((p) => ({ id: p.id, name: p.name })),
          },
        ]);
        console.log("Game added to queue. Position:", gameQueue.length + 1);
      } else {
        console.error("Queue is full! Cannot add more games.");
      }
    } else {
      // Assign to available court
      assignGameToCourt(newGame, nextCourt, playersToStartGame);
    }

    // Reset selected players
    setSelectedPlayers([]);
  };

  const releaseCourt = (courtId: string) => {
    const foundCourtData: CourtData[0] | undefined = courtData[courtId];

    if (!foundCourtData) {
      console.warn("Court is not found to be released.");
      return;
    }

    const availablePlayers = players.filter(
      (player) =>
        player.status === "available" &&
        player.queueNumber.startsWith(
          (games.length + 1).toString().padStart(3, "0"),
        ),
    );

    // Cloning data to update
    const playersToRelease = [...foundCourtData.players];
    const updatedPlayers = [...players];

    playersToRelease.forEach(({ index: playerIndex }, playerToReleaseIndex) => {
      const foundPlayer = updatedPlayers[playerIndex];

      if (!foundPlayer) {
        return;
      }

      foundPlayer.status = "available";
      foundPlayer.queueNumber = generateQueueNumber({
        gameIndex: games.length + 1,
        playerIndex: availablePlayers.length + playerToReleaseIndex,
      });
    });

    setPlayers(updatedPlayers);

    // Reset court
    const courtToRelease: CourtData = {
      [foundCourtData.court.id]: {
        court: { ...foundCourtData.court, status: "available" },
        gameId: undefined,
        game: undefined,
        players: [],
      },
    };
    setCourtData((oldCourtData) => ({
      ...oldCourtData,
      ...courtToRelease,
    }));
  };

  // Effect to handle court availability and queue assignment
  useEffect(() => {
    const nextAvailableCourtsData = Object.values(courtData)
      .filter(({ court }) => court.status === "available")
      .sort(
        (courtDataA, courtDataB) =>
          courtDataA.court.index - courtDataB.court.index,
      );

    if (!nextAvailableCourtsData.length) {
      setNextCourt(null);
    } else {
      setNextCourt({ ...nextAvailableCourtsData[0].court });

      // If there's a game in queue and a court becomes available, assign it
      if (gameQueue.length > 0 && nextAvailableCourtsData[0]) {
        const [nextGame, ...remainingQueue] = gameQueue;
        const playersInGame = players.filter((player) =>
          [
            ...nextGame.firstParty.playerIds,
            ...nextGame.secondParty.playerIds,
          ].includes(player.id),
        );

        assignGameToCourt(
          nextGame,
          nextAvailableCourtsData[0].court,
          playersInGame,
        );
        setGameQueue(remainingQueue);
      }
    }
  }, [courtData, games, gameQueue]);

  return (
    <div className="min-h-screen bg-gray-100 px-8 py-4">
      <header className="mb-4 lg:mb-8">
        <h1 className="font-heading text-lg font-bold text-blue-600 sm:text-center lg:text-2xl">
          Badminton Court Management
        </h1>
      </header>

      <div className="mx-auto max-w-6xl space-y-4">
        <section className="rounded-lg bg-white p-4 shadow-md lg:p-6">
          <h2 className="mb-4 flex items-center text-sm font-semibold sm:text-xl">
            <Users size="1em" className="mr-2" /> Player Pool
          </h2>

          <ConfigProvider>
            <PlayerPool
              players={players}
              addPlayer={addPlayer}
              nextCourtAvailable={nextCourt !== null}
              selectPlayer={selectPlayer}
              selectPlayers={selectPlayers}
              selectedPlayers={selectedPlayers}
              startGame={startGame}
              queueLength={gameQueue.length}
            />
          </ConfigProvider>
        </section>

        <section className="rounded-lg bg-white p-4 shadow-md lg:p-6">
          <h2 className="mb-4 flex items-center text-sm font-semibold sm:text-xl">
            <LayoutGrid size="1em" className="mr-2" /> Courts
          </h2>

          <CourtDisplay
            courtData={courtData}
            releaseCourt={releaseCourt}
            queueLength={gameQueue.length}
            queuedGames={gameQueue}
            queuedGamePlayers={queuedGamePlayers}
          />
        </section>
      </div>
    </div>
  );
}

export default App;
