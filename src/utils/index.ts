/**
 * Generate a string to present a queuing number comprising 3 elements:
 * - Current game number; 1-3 characters
 * - Time string from hours, minutes, and seconds; 6-7 characters
 * - Player index in the list; 1-3 characters
 * @param options
 * @returns
 */
export function generateQueueNumber(options: {
  gameIndex: number; // 1-3 characters
  playerIndex: number; // 1-3 characters
}): string {
  const { gameIndex, playerIndex } = options;

  // 6-7 characters
  const timeString = new Date()
    .toLocaleTimeString("en-AU", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
    .replace(/:/g, "");

  // TODO: support for when the app is run between 2 consecutive days

  return `${gameIndex}-${timeString}-${playerIndex}`;
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
export function parseQueueNumberToOrder(queueNumber: string): string | number {
  const orderParts = queueNumber.split("-");
  return orderParts.join("");
}

export * from "./setup";
