// Current approach with lazy loading is solid, but if the application grows, consider:
//
// - Moving to a slice-based architecture
// - Using more specific selectors
// - Extracting shared business logic to utilities
// - Implementing an event system for complex state interactions
//
// The key is to balance between:
//
// - Maintainability (keeping stores focused)
// - Performance (lazy loading and memoization)
// - Type safety (maintaining TypeScript support)
// - Testing (ability to mock store interactions)

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
