import { useState } from "react";
import { Users, LayoutGrid } from "lucide-react";
import { v4 as uuid } from "uuid";
import PlayerPool from "./components/player/Pool";
import CourtDisplay from "./components/CourtDisplay";
import { Court, CourtData, Game, Player } from "./types";
import {
  COURT_IDS,
  buildInitialCourtData,
  buildInitialPlayers,
  generateQueueNumber,
} from "./utils";

// interface ShuttleApp {
//   //
//   playerContext?: {
//     players: Player[];
//     addPlayer: (name: string) => void;
//   };

//   //
//   gameContext?: {
//     games: Game[];
//     createGame: (game: Omit<Game, "id">) => Game;
//   };

//   //
//   matchContext?: {
//     matches: Match[];
//     createMatch: (court: Court) => Match;
//   };

//   //
//   courtContext?: {
//     courts: CourtData;
//     availableCourtId: number;
//   };
// }

// export const ShuttleAppContext = React.createContext<ShuttleApp | null>(null);

let initialPlayers: Player[] = [];
let initialCourtData: CourtData = {};

// https://react.dev/learn/you-might-not-need-an-effect#initializing-the-application
// Initialize data only when running on the browser
if (typeof window !== "undefined") {
  // Only runs once per app load
  initialPlayers = buildInitialPlayers();
  initialCourtData = buildInitialCourtData();
}

function App() {
  const [courtData, _setCourtData] = useState<CourtData>(initialCourtData);
  const [games, _setGames] = useState<Game[]>([]);
  const [players, setPlayers] = useState<Player[]>(initialPlayers);

  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
  const [nextCourt, setNextCourt] = useState<Court>(
    initialCourtData[COURT_IDS[0]].court,
  );

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
      basePlayer.index = players.length - 1;
      basePlayer.queueNumber = generateQueueNumber({
        gameIndex: games.length,
        playerIndex: players.length,
      });

      setPlayers([...players, basePlayer]);
    }
  };

  /**
   * Select player.
   * TODO: describe
   */
  const selectPlayer = (player: Player) => {
    const selected = selectedPlayers.some(
      (selectPlayer) => selectPlayer.id === player.id,
    );

    if (selected) {
      // unselect
      setSelectedPlayers(
        selectedPlayers.filter(
          (selectedPlayer) => selectedPlayer.id !== player.id,
        ),
      );
    } else if (selectedPlayers.length < 4) {
      // select
      setSelectedPlayers([...selectedPlayers, player]);
    }
  };

  /**
   * Start game.
   * TODO: describe
   */
  const startGame = () => {
    if (selectedPlayers.length !== 4) {
      console.log("Not enough player. Do nothing");
    }

    const selectedPlayerIds = selectedPlayers.map((player) => player.id);

    const assignedCourt = nextCourt || courtData[COURT_IDS[0]].court;
    assignedCourt.status = "playing";

    const newGame: Game = {
      id: uuid(),
      courtId: assignedCourt.id,
      firstParty: {
        playerIds: selectedPlayerIds.slice(0, 1),
        score: 0,
      },
      secondParty: {
        playerIds: selectedPlayerIds.slice(2, 3),
        score: 0,
      },
      index: games.length + 1,
      timestamp: Date.now(),
    };

    courtData[assignedCourt.id] = {
      court: assignedCourt,
      gameId: newGame.id,
      game: newGame,
      players: selectedPlayers,
    };

    games.push(newGame);

    selectedPlayers.forEach((player) => {
      player.status = "unavailable";
    });

    setSelectedPlayers([]);

    const nextAvailableCourtData = Object.values(courtData).find(
      ({ court }) => court.status === "available",
    );

    if (nextAvailableCourtData) {
      setNextCourt(nextAvailableCourtData.court);
    }
  };

  /**
   * Finish a game.
   * TODO: Describe.
   */
  const releaseCourt = (courtId: string) => {
    const courtToRelease: CourtData[0] | undefined = courtData[courtId];

    if (!courtToRelease) {
      console.warn("Court is not found to be released.");
      return;
    }

    // - Reset status
    //   - court status: "playing" -> "available"
    //   - players status: "unavailable" -> "available"
    courtToRelease.court.status = "available";

    // - Delete game + gameId
    courtToRelease.game = undefined;
    courtToRelease.gameId = undefined;

    const availablePlayers = players.filter(
      (player) =>
        player.status === "available" &&
        player.queueNumber.startsWith(
          (games.length + 1).toString().padStart(3, "0"),
        ),
    );

    // - Set players' status to available
    courtToRelease.players.forEach((player, index) => {
      player.status = "available";
      player.queueNumber = generateQueueNumber({
        gameIndex: games.length + 1,
        playerIndex: availablePlayers.length + index,
      });
    });

    // - Set players to empty array
    courtToRelease.players = [];

    const nextAvailableCourtData = Object.values(courtData).find(
      ({ court }) => court.status === "available",
    );

    if (
      nextAvailableCourtData &&
      nextCourt &&
      nextAvailableCourtData.court.index <= nextCourt.index
    ) {
      setNextCourt({ ...nextAvailableCourtData.court });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 px-8 py-4">
      <header className="mb-8">
        <h1 className="text-center font-heading text-3xl font-bold text-blue-600">
          Badminton Court Management
        </h1>
      </header>

      <div className="mx-auto max-w-6xl space-y-4">
        <section className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 flex items-center text-xl font-semibold">
            <Users className="mr-2" /> Player Pool
          </h2>

          <PlayerPool
            players={players}
            addPlayer={addPlayer}
            selectPlayer={selectPlayer}
            selectedPlayers={selectedPlayers}
            startGame={startGame}
          />
        </section>

        <section className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 flex items-center text-xl font-semibold">
            <LayoutGrid className="mr-2" /> Courts {games.length}
          </h2>

          <CourtDisplay courtData={courtData} releaseCourt={releaseCourt} />
        </section>
      </div>
    </div>
  );
}

export default App;
