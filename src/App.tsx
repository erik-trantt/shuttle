import { useState } from "react";
import { Users, LayoutGrid, Menu } from "lucide-react";
import PlayerPool from "~/components/player/Pool";
import CourtDisplay from "~/components/CourtDisplay";
import PairManagement from "~/components/player/PlayerManagement";

function App() {
  const [isPairManagementOpen, setIsPairManagementOpen] = useState(false);

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

          <PlayerPool />
        </section>

        <section className="rounded-lg bg-white p-4 shadow-md lg:p-6">
          <h2 className="mb-4 flex items-center text-sm font-bold sm:text-xl">
            <LayoutGrid size="1em" className="mr-2" /> Courts
          </h2>

          <CourtDisplay />
        </section>
      </div>

      <PairManagement
        isOpen={isPairManagementOpen}
        onClose={() => setIsPairManagementOpen(false)}
      />
    </div>
  );
}

export default App;
