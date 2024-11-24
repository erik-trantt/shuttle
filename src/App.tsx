import { useCallback, useEffect, useState } from "react";
import { Users, LayoutGrid, Menu } from "lucide-react";
import { v4 as uuid } from "uuid";
import PlayerPool from "~/components/player/Pool";
import CourtDisplay from "~/components/CourtDisplay";
import PlayerManagement from "~/components/player/PlayerManagement";
import { ConfigProvider, PlayerProvider, CourtProvider } from "@contexts";
import { useRuntimeConfig } from "@hooks";
import { usePlayer, useSelectedPlayers, useCourt } from "@contexts";
import type { Game } from "@types";
import { buildInitialCourtData, buildInitialPlayers } from "@utils";

function App() {
  return (
    <ConfigProvider>
      <CourtProvider>
        <PlayerProvider>
          <AppContent />
        </PlayerProvider>
      </CourtProvider>
    </ConfigProvider>
  );
}

function AppContent() {
  const config = useRuntimeConfig();
  const [isPairManagementOpen, setIsPairManagementOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Player context
  const { setPlayers } = usePlayer();
  const selectedPlayers = useSelectedPlayers();

  // Court context
  const {
    courtData,
    startGame: startGameOnCourt,
    endGame: endGameOnCourt,
    toggleLock,
    getNextAvailableCourt,
    addCourt,
  } = useCourt();

  // Initialize players and courts
  useEffect(() => {
    if (!isInitialized) {
      // Initialize players
      setPlayers(buildInitialPlayers());

      // Initialize courts
      Object.values(buildInitialCourtData()).forEach((courtItem) => {
        addCourt(courtItem.court);
      });

      setIsInitialized(true);
    }
  }, [isInitialized, setPlayers, addCourt]);

  const nextCourt = getNextAvailableCourt();

  const handleStartGame = useCallback(() => {
    if (selectedPlayers.length !== config.game.settings.playerNumber) {
      console.log("Not enough players. Do nothing");
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
      index: Object.values(courtData).filter((data) => data.gameId).length + 1,
      timestamp: Date.now(),
    };

    startGameOnCourt(nextCourt.id, newGame, selectedPlayers);
    setPlayers([]);
  }, [
    selectedPlayers,
    nextCourt,
    courtData,
    config.game.settings.playerNumber,
    startGameOnCourt,
    setPlayers,
  ]);

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

      <main className="mx-auto max-w-6xl space-y-4">
        <section className="rounded-lg bg-white p-4 shadow-md lg:p-6">
          <h2 className="mb-4 flex items-center text-sm font-bold sm:text-xl">
            <Users size="1em" className="mr-2" /> Player Pool
          </h2>

          <PlayerPool
            nextCourtAvailable={!!nextCourt}
            startGame={handleStartGame}
          />
        </section>

        <section className="rounded-lg bg-white p-4 shadow-md lg:p-6">
          <h2 className="mb-4 flex items-center text-sm font-bold sm:text-xl">
            <LayoutGrid size="1em" className="mr-2" /> Courts
          </h2>

          <CourtDisplay
            courtData={courtData}
            onEndGame={endGameOnCourt}
            onToggleLock={toggleLock}
          />
        </section>
      </main>

      <PlayerManagement
        isOpen={isPairManagementOpen}
        onClose={() => setIsPairManagementOpen(false)}
      />
    </div>
  );
}

export default App;
