import { atom } from "jotai";
import type { Schema } from "@/../amplify/data/resource";
type User = {
  email: string;
  username: string;
  userId: string;
};
export const userAtom = atom<User>();
export const playerAtom = atom<Schema["Players"]["type"]>();
export const gamePlayersAtom = atom<Schema["GamePlayers"]["type"][]>();
export const gameAtom = atom<Schema["Games"]["type"]>();
export const waitingRoomAtom = atom<Schema["WaitingRoom"]["type"]>();
