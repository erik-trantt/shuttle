import { useEffect, useState } from "react";
import { Users, LayoutGrid, Menu } from "lucide-react";
import { v4 as uuid } from "uuid";
import PlayerPool from "~/components/player/Pool";
import CourtDisplay from "~/components/CourtDisplay";
import PairManagement from "~/components/player/PlayerManagement";
import { ConfigProvider } from "@contexts";
import { useRuntimeConfig } from "@hooks";
import {
  buildInitialCourtData,
  buildInitialPlayers,
  generateQueueNumber,
} from "@utils";
import type { Court, CourtData, Game, Player, PlayerPair } from "@types";

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
  const [pairs, setPairs] = useState<PlayerPair[]>([]);
  const [isPairManagementOpen, setIsPairManagementOpen] = useState(false);

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

  const handleCreatePair = (playerIds: [string, string], name: string) => {
    const newPair: PlayerPair = {
      id: uuid(),
      playerIds,
      name,
      createdAt: Date.now(),
    };
    setPairs([...pairs, newPair]);

    // Update players with their partner IDs
    setPlayers(
      players.map((player) => {
        if (player.id === playerIds[0]) {
          return { ...player, partnerId: playerIds[1] };
        }
        if (player.id === playerIds[1]) {
          return { ...player, partnerId: playerIds[0] };
        }
        return player;
      }),
    );
  };

  const handleDeletePair = (pairId: string) => {
    const pairToDelete = pairs.find((pair) => pair.id === pairId);
    setPairs(pairs.filter((pair) => pair.id !== pairId));

    // Remove partner IDs when pair is deleted
    if (pairToDelete) {
      setPlayers(
        players.map((player) => {
          if (pairToDelete.playerIds.includes(player.id)) {
            return { ...player, partnerId: undefined };
          }
          return player;
        }),
      );
    }
  };

  const handleDeletePlayer = (id: string) => {
    // Remove player from any pair they're in
    const pairsWithPlayer = pairs.filter((pair) => pair.playerIds.includes(id));
    pairsWithPlayer.forEach((pair) => handleDeletePair(pair.id));

    // Remove the player
    setPlayers(players.filter((player) => player.id !== id));
  };

  const selectPlayer = (player: Player) => {
    const isAutoSelected = selectedPlayers
      .slice(0, config.game.getAutoSelectionSize())
      .some((selectedPlayer) => selectedPlayer.id === player.id);

    if (isAutoSelected) {
      return;
    }

    // Find if player is part of a pair
    const playerPair = pairs.find((pair) => pair.playerIds.includes(player.id));

    const isSelected = selectedPlayers.some(
      (selectedPlayer) => selectedPlayer.id === player.id,
    );

    if (isSelected) {
      // If player is part of a pair, remove both players
      if (playerPair) {
        setSelectedPlayers(
          selectedPlayers.filter(
            (selectedPlayer) =>
              !playerPair.playerIds.includes(selectedPlayer.id),
          ),
        );
      } else {
        // Remove single player
        setSelectedPlayers(
          selectedPlayers.filter(
            (selectedPlayer) => selectedPlayer.id !== player.id,
          ),
        );
      }
    } else if (selectedPlayers.length < config.game.settings.playerNumber) {
      if (playerPair) {
        // If adding a paired player would exceed player limit, don't add
        if (selectedPlayers.length + 2 > config.game.settings.playerNumber) {
          return;
        }
        // Add both players from the pair
        const pairedPlayers = players.filter((p) =>
          playerPair.playerIds.includes(p.id),
        );
        setSelectedPlayers([...selectedPlayers, ...pairedPlayers]);
      } else {
        // Add single player
        setSelectedPlayers([...selectedPlayers, player]);
      }
    }
  };

  const selectPlayers = (playersToSelect: Player[]) => {
    setSelectedPlayers(playersToSelect);
  };

  const startGame = () => {
    if (selectedPlayers.length !== 4) {
      console.log("Not enough player. Do nothing");
      return;
    }

    if (!nextCourt) {
      console.error(
        "No available court to start game! Please try again later.",
      );
      return;
    }

    const selectedPlayerIds = selectedPlayers.map((player) => player.id);

    const newGame: Game = {
      id: uuid(),
      courtId: nextCourt.id,
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

    const playersToStartGame = [...selectedPlayers];
    const updatedPlayers = [...players];

    playersToStartGame.forEach(({ index: playerIndex }) => {
      const foundPlayer = updatedPlayers[playerIndex];
      if (!foundPlayer) return;
      foundPlayer.status = "unavailable";
    });

    setPlayers(updatedPlayers);

    const courtToStartGame: CourtData = {
      [nextCourt.id]: {
        court: { ...nextCourt, status: "playing" },
        gameId: newGame.id,
        game: newGame,
        players: playersToStartGame,
      },
    };
    setCourtData((oldCourtData) => ({
      ...oldCourtData,
      ...courtToStartGame,
    }));

    setGames((oldGames) => [...oldGames, newGame]);
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

    const playersToRelease = [...foundCourtData.players];
    const updatedPlayers = [...players];

    playersToRelease.forEach(({ index: playerIndex }, playerToReleaseIndex) => {
      const foundPlayer = updatedPlayers[playerIndex];
      if (!foundPlayer) return;

      foundPlayer.status = "available";
      foundPlayer.queueNumber = generateQueueNumber({
        gameIndex: games.length + 1,
        playerIndex: availablePlayers.length + playerToReleaseIndex,
      });
    });

    setPlayers(updatedPlayers);

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

  const toggleCourtLock = (courtId: string) => {
    const foundCourtData = courtData[courtId];
    if (!foundCourtData) return;

    const updatedCourtData: CourtData = {
      [courtId]: {
        ...foundCourtData,
        court: {
          ...foundCourtData.court,
          locked: !foundCourtData.court.locked,
          status: foundCourtData.court.locked ? "available" : "unavailable",
        },
      },
    };

    setCourtData((prevData) => ({
      ...prevData,
      ...updatedCourtData,
    }));
  };

  useEffect(() => {
    const nextAvailableCourtsData = Object.values(courtData)
      .filter(({ court }) => court.status === "available" && !court.locked)
      .sort(
        (courtDataA, courtDataB) =>
          courtDataA.court.index - courtDataB.court.index,
      );

    if (!nextAvailableCourtsData.length) {
      setNextCourt(null);
    } else {
      setNextCourt({ ...nextAvailableCourtsData[0].court });
    }
  }, [courtData, games]);

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-4 sm:px-8">
      <header className="mx-auto mb-4 max-w-6xl">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-lg font-bold text-blue-600 lg:text-2xl">
            Badminton Court Management
          </h1>

          <button
            title="Menu"
            onClick={() => setIsPairManagementOpen(true)}
            className="flex items-center rounded bg-blue-500 px-1 py-1 text-white hover:bg-blue-600"
          >
            <Menu size="1.2em" className="mr-2 max-sm:mr-0" />
            <span className="text-sm max-sm:hidden">Menu</span>
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-4">
        <section className="rounded-lg bg-white p-4 shadow-md lg:p-6">
          <h2 className="mb-4 flex items-center text-sm font-bold sm:text-xl">
            <Users size="1em" className="mr-2" /> Player Pool
          </h2>

          <ConfigProvider>
            <PlayerPool
              players={players}
              pairs={pairs}
              nextCourtAvailable={nextCourt !== null}
              selectPlayer={selectPlayer}
              selectPlayers={selectPlayers}
              selectedPlayers={selectedPlayers}
              startGame={startGame}
            />
          </ConfigProvider>
        </section>

        <section className="rounded-lg bg-white p-4 shadow-md lg:p-6">
          <h2 className="mb-4 flex items-center text-sm font-bold sm:text-xl">
            <LayoutGrid size="1em" className="mr-2" /> Courts
          </h2>

          <CourtDisplay
            courtData={courtData}
            releaseCourt={releaseCourt}
            toggleCourtLock={toggleCourtLock}
          />
        </section>
      </div>

      <PairManagement
        isOpen={isPairManagementOpen}
        onClose={() => setIsPairManagementOpen(false)}
        players={players}
        pairs={pairs}
        onCreatePair={handleCreatePair}
        onDeletePair={handleDeletePair}
        onCreatePlayer={addPlayer}
        onDeletePlayer={handleDeletePlayer}
      />
    </div>
  );
}

export default App;
