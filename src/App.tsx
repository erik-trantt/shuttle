import { useState } from "react";
import { Users, LayoutGrid } from "lucide-react";
import { v4 as uuid } from "uuid";
import PlayerPool from "./components/player/Pool";
import CourtDisplay from "./components/CourtDisplay";
import { Court, CourtData, Game, Player } from "./types";
import { generateQueueNumber } from "./utils";

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

function App() {
  const COURT_IDS: string[] = [
    "62478d70-a53f-464f-b036-f380929a3584",
    "39c7d7b9-d13b-454c-abcd-e3317511026d",
    "d7ef2003-dc31-42ca-bbc1-51205e8170fd",
    "89b9cc5f-617e-4db2-96fd-ec9021626670",
    "9f85c0ac-74bc-4264-8b35-3ed51c05dcef",
    "b2e3a8ab-da0e-4f41-bb4e-80fd7352bb6e",
    "2e13096d-428e-443d-88df-0f55212f0a70",
    "3f681c47-7d4b-4018-8cbc-92b5779430fe",
    "4d0100ef-1d42-4d0d-9504-a21aabde780a",
    "145a6912-a579-499b-a022-ff54fbdb8ea0",
    "a704b89f-2976-40a2-8f3a-47836c3d2ef8",
    "0af47be0-b0c9-4f7a-9980-798076d5dcf2",
  ];

  const PLAYER_NAMES = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "L"];

  const buildInitialPlayers = (): Player[] => {
    return [...PLAYER_NAMES].map((name, index) => ({
      id: uuid(),
      name,
      status: "available",
      index: index,
      queueNumber: generateQueueNumber({
        gameIndex: 0,
        playerIndex: index,
      }),
    }));
  };

  const buildInitialCourtData = (): CourtData => {
    return Object.fromEntries(
      [...COURT_IDS].map((id, index) => [
        id,
        {
          court: {
            id,
            name: `Court ${index + 1}`,
            index,
            status: "available",
          },
          players: [],
        },
      ]),
    );
  };

  const [players, setPlayers] = useState<Player[]>(buildInitialPlayers());
  const [games, _games] = useState<Game[]>([]);

  const [courtData, _courtData] = useState<CourtData>(buildInitialCourtData());

  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);

  const [nextCourt, setNextCourt] = useState<Court | null>(null);

  const addPlayer = (name: string) => {
    if (!players.length) {
      setPlayers([
        {
          id: uuid(),
          name,
          status: "available",
          index: 0,
          queueNumber: generateQueueNumber({
            gameIndex: games.length,
            playerIndex: 0,
          }),
        },
      ]);
    }

    const foundPlayer: Player | undefined = players.find(
      (player) => player.name === name,
    );

    if (!foundPlayer) {
      setPlayers([
        ...players,
        {
          id: uuid(),
          name,
          status: "available",
          index: players.length - 1,
          queueNumber: generateQueueNumber({
            gameIndex: games.length,
            playerIndex: players.length - 1,
          }),
        },
      ]);
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

    console.log(COURT_IDS[0], courtData, courtData[COURT_IDS[0]]);

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

    selectedPlayers.forEach((player, index) => {
      player.status = "unavailable";
      player.queueNumber = generateQueueNumber({
        gameIndex: games.length,
        playerIndex: index,
      });
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
   *
   */
  const releaseCourt = (courtId: string) => {
    console.log(courtId);
    const courtToRelease: CourtData[0] | undefined = courtData[courtId];

    if (!courtToRelease) {
      console.warn("Court is not found to be released.");
      return;
    }

    console.log(courtToRelease);

    // - Reset status
    //   - court status: "playing" -> "available"
    //   - players status: "unavailable" -> "available"
    courtToRelease.court.status = "available";

    // - Delete game + gameId
    courtToRelease.game = undefined;
    courtToRelease.gameId = undefined;

    // - Set players' status to available
    courtToRelease.players.forEach((player, index) => {
      player.status = "available";
      player.queueNumber = generateQueueNumber({
        gameIndex: games.length,
        playerIndex: index,
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
