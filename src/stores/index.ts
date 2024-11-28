export { useGameStore } from "./game-store";
export { usePlayerStore } from "./player-store";
export { usePairStore } from "./pair-store";

// Initialize stores
import { useGameStore } from "./game-store";
import { usePlayerStore } from "./player-store";

if (typeof window !== "undefined") {
  useGameStore.getState().initialize();
  usePlayerStore.getState().initialize();
}
