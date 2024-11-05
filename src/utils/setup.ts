import { v4 as uuid } from "uuid";
import { generateQueueNumber } from ".";
import { CourtData, Player } from "../types";

export const COURT_IDS: string[] = [
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

export const PLAYER_NAMES = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
];

export const buildInitialPlayers = (): Player[] => {
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

export const buildInitialCourtData = (): CourtData => {
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
