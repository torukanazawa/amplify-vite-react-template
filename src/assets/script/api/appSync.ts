/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Schema } from "@/../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
const client = generateClient<Schema>();

// Games
export async function updateGames(query):Promise<any>{
  const result = await client.models.Games.update(query);
  console.log("updateGames",result);
  return result;
}
export async function deleteGames(query):Promise<any>{
  const result = await client.models.Games.delete(query);
  console.log("deleteGames",result);
  return result;
}

// GamePlayers
export async function createGamePlayers(query):Promise<any>{
  const result = await client.models.GamePlayers.create(query);
  console.log("createGamePlayers",result);
  return result;
}
export async function updateGamePlayers(query):Promise<any>{
  const result = await client.models.GamePlayers.update(query);
  console.log("updateGamePlayers",result);
  return result;
}
export async function deleteGamePlayers(query):Promise<any>{
  const result = await client.models.GamePlayers.delete(query);
  console.log("deleteGamePlayers",result);
  return result;
}

// Players
export async function updatePlayers(query):Promise<any>{
  const result = await client.models.Players.update(query);
  console.log("updatePlayers",result);
  return result;
}