import { useState } from "react";
import { Users, PlaySquare, LayoutGrid } from "lucide-react";
import { v4 as uuid } from "uuid";
import PlayerPool from "./components/player/Pool";
import CourtManagement from "./components/CourtManagement";
import CourtDisplay from "./components/CourtDisplay";
import { Court, CourtData, Game, Match, Player } from "./types";

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
    return [...PLAYER_NAMES].map((name) => ({
      id: uuid(),
      name,
      status: "available",
    }));
  };

  const buildInitialCourtData = (): CourtData => {
    // Array.from({ length: 12 }, (_, i) => i).forEach(() =>
    //   COURT_IDS.push(uuid()),
    // );

    // console.log(COURT_IDS);

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
  const [games, setGames] = useState<Game[]>([]);

  const [courtData, _setCourtData] = useState<CourtData>(
    buildInitialCourtData(),
  );

  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);

  // console.log(COURT_IDS[0], courtData, courtData[COURT_IDS[0]]);

  // const firstCourt: CourtData[0]["court"] = courtData[COURT_IDS[0]].court;

  const [nextCourt, setNextCourt] = useState<Court | null>(null);

  const addPlayer = (newPlayer: Player) => {
    if (!players.length) {
      setPlayers([newPlayer]);
    }

    const foundPlayer = players.some(
      (player) => player.name === newPlayer.name || player.id === newPlayer.id,
    );

    if (!foundPlayer) {
      setPlayers([...players, newPlayer]);
    }
  };

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

  const startGame = () => {
    if (selectedPlayers.length !== 4) {
      console.log("Not enough player. Do nothing");
    }

    const selectedPlayerIds = selectedPlayers.map((player) => player.id);

    console.log(COURT_IDS[0], courtData, courtData[COURT_IDS[0]]);

    let assignedCourt = nextCourt || courtData[COURT_IDS[0]].court;
    assignedCourt.status = "playing";

    // if (assignedCourt === null) {
    //   console.log(courtData[COURT_IDS[0]]);
    //   assignedCourt = courtData[COURT_IDS[0]].court;
    // }

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
      timestamp: Math.round(Date.now() / 1e3),
    };

    console.log("updating court data");

    _setCourtData(
      Object.assign(courtData, {
        [assignedCourt.id]: {
          court: assignedCourt,
          gameId: newGame.id,
          game: newGame,
          players: [...selectedPlayers],
        },
      }),
    );

    setGames([...games, newGame]);

    selectedPlayers.forEach((player) => (player.status = "unavailable"));

    setSelectedPlayers([]);

    const nextAvailableCourtData = Object.values(courtData).find(
      ({ court }) => court.status === "available",
    );

    console.log(nextAvailableCourtData);

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

    console.log("after clearing", courtToRelease.court.status);

    // - Delete game + gameId
    courtToRelease.game = undefined;
    courtToRelease.gameId = undefined;

    console.log("after clearing", courtToRelease.game, courtToRelease.gameId);

    // - Set players' status to available
    courtToRelease.players.forEach((player) => {
      player.status === "available";
    });

    setPlayers([...players, ...courtToRelease.players]);

    // - Set players to empty array
    courtToRelease.players = [];

    _setCourtData(
      Object.assign(courtData, {
        [courtToRelease.court.id]: {
          ...courtToRelease,
        },
      }),
    );

    console.log("after clearing", courtToRelease);

    const nextAvailableCourtData = Object.values(courtData).find(
      ({ court }) => court.status === "available",
    );

    console.log(nextAvailableCourtData);

    if (
      nextAvailableCourtData &&
      nextAvailableCourtData.court.index &&
      nextCourt &&
      nextCourt.index &&
      nextAvailableCourtData.court.index < nextCourt.index
    ) {
      setNextCourt(nextAvailableCourtData.court);
    }

    console.log(nextCourt);
  };

  return (
    <div className="min-h-screen bg-gray-100 px-8 py-4">
      <header className="mb-8">
        <h1 className="text-center font-heading text-3xl font-bold text-blue-600">
          Badminton Court Management
        </h1>
      </header>

      <div className="mx-auto max-w-6xl space-y-4">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
          <section className="rounded-lg bg-white p-6 shadow-md">
            <h2 className="mb-4 flex items-center text-xl font-semibold">
              <Users className="mr-2" /> Player Pool
            </h2>

            <PlayerPool
              players={players}
              addPlayer={addPlayer}
              selectPlayer={selectPlayer}
              selectedPlayers={selectedPlayers}
            />
          </section>

          <section className="rounded-lg bg-white p-6 shadow-md">
            <h2 className="mb-4 flex items-center text-xl font-semibold">
              <PlaySquare className="mr-2" /> Court Management
            </h2>

            <CourtManagement
              selectedPlayers={selectedPlayers}
              startGame={startGame}
            />
          </section>
        </div>

        <section className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 flex items-center text-xl font-semibold">
            <LayoutGrid className="mr-2" /> Courts
          </h2>

          <CourtDisplay courtData={courtData} releaseCourt={releaseCourt} />
        </section>
      </div>
    </div>
  );
}

export default App;
