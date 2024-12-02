import { v4 as uuidv4 } from "uuid";

/**
 * Generate a string to present a queuing number comprising 3 elements:
 * - Current game number; 1-3 characters
 * - Time string from hours, minutes, and seconds; 6-7 characters
 * - Player index in the list; 1-3 characters
 * @param options
 * @returns
 */
export function generateQueueNumber(options: {
  gameIndex: number; // max 3 characters
  playerIndex: number; // max 3 characters
}): string {
  const { gameIndex, playerIndex } = options;

  if (gameIndex >= 1e3 || playerIndex >= 1e3) {
    console.error(
      "Unsupported number of games or players. Currently support only up to 999 games or players.",
    );
    return "";
  }

  // 4-5 characters
  const timeString = new Date()
    .toLocaleTimeString("en-AU", {
      hour: "2-digit",
      minute: "2-digit",
      // second: "2-digit",
      hour12: false,
    })
    .replace(/:/g, "");

  const gameIndexString = gameIndex.toString().padStart(3, "0");
  const playerIndexString = playerIndex.toString().padStart(3, "0");

  // TODO: support for when the app is run between 2 consecutive days
  return [gameIndexString, timeString, playerIndexString].join("-");
}

/**
 * Parse a queue number from a String to an Integer which will be used for the CSS property `order`.
 *
 * @param {string} queueNumber in format of `<game index>-<time string>-<player index>`
 *
 * For example:
 *
 * `12-180446-3` reads as
 * - the 12th game
 * - started at 18:04:46
 * - this player is at 3rd place in the list
 *
 * This function should return a string of `121804463`. When it is given to
 * `order` CSS property, it will be parsed into a number.
 */
export function parseQueueNumberToOrder(queueNumber: string): string {
  const orderParts = queueNumber.split("-");
  return orderParts.join("");
}

/**
 * Generates a UUID using Crypto.randomUUID function.
 * If Crypto.randomUUID is not available, use uuid v4.
 */
export function generateUniqueId() {
  try {
    if (
      typeof crypto !== "undefined" &&
      typeof crypto.randomUUID === "function"
    ) {
      return crypto.randomUUID();
    }

    return uuidv4();
  } catch {
    // If crypto fails for any reason, use uuid v4
    return uuidv4();
  }
}

/**
 * Randomizes the order of an array in place.
 * Using the Fisher-Yates algorithm for better time complexity.
 * This copies the original array and returns a new array,
 * so no optimization on space complexity, hence this is not suitable
 * for large arrays.
 *
 * @param array The array to be randomized.
 * @returns The randomized array.
 */
export function randomizeArray<T>(array: T[]): T[] {
  const arrayCopy = [...array];

  for (let i = arrayCopy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [arrayCopy[i], arrayCopy[j]] = [arrayCopy[j], arrayCopy[i]];
  }

  return arrayCopy;
}

/**
 * Randomly picks an element from an array.
 * @param array The array to pick from.
 * @returns The randomly picked element.
 */
export function randomPick<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

export * from "./game-logic";
export * from "./setup";
