/* eslint-disable @typescript-eslint/no-explicit-any */
import type { DynamoDBStreamHandler } from "aws-lambda";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../../amplify/data/resource";

import { env } from "$amplify/env/matchMake";
import { unmarshall } from "@aws-sdk/util-dynamodb";

Amplify.configure(
  {
    API: {
      GraphQL: {
        endpoint: env.API_URL,
        region: env.AWS_REGION,
        defaultAuthMode: "iam",
      },
    },
  },
  {
    Auth: {
      credentialsProvider: {
        getCredentialsAndIdentityId: async () => ({
          credentials: {
            accessKeyId: env.AWS_ACCESS_KEY_ID,
            secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
            sessionToken: env.AWS_SESSION_TOKEN,
          },
        }),
        clearCredentialsAndIdentityId: () => {
          /* noop */
        },
      },
    },
  }
);
const client = generateClient<Schema>({ authMode: "iam" });

export const handler: DynamoDBStreamHandler = async (event) => {
  for await (const record of event.Records) {
    console.log("record", record);

    if (record.eventName === "INSERT") {
      const NewImage: any = record.dynamodb?.NewImage;
      const Item = unmarshall(NewImage);
      if (Item.oneOnOne == true) {
        await setGame([Item]);
        await deleteWaitingRoom([Item]);
      }
    } else if (record.eventName === "MODIFY") {
      const Items = await listWaitingRoom();
      await matchMake(Items);
    }
  }
};

async function matchMake(Items:any) {
  if (Items && Items.length >= 2) {
    await setGame(Items);
    await deleteWaitingRoom(Items);
  }
}

function sortAsc(items:any):any {
  return [...items].sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
}
async function listWaitingRoom() {
  try {
    const result: any = await client.graphql({
      query: `
        query ListWaitingRooms{
          listWaitingRooms {
            items {
              id
              name
              oneOnOne
            }
          }
        }
      `,
    });
    console.log("query result:", JSON.stringify(result, null, 2));
    const Items = result.data.listWaitingRooms.items
    return sortAsc(Items);
  } catch (res) {
    console.error("errors", res);
  }
}

async function deleteWaitingRoom(Items: any) {
  for await (const item of Items) {
    const result = await client.graphql({
      query: `mutation DeleteWaitingRoom($input: DeleteWaitingRoomInput!) {
        deleteWaitingRoom(input: $input) {
          id
        }
      }
      `,
      variables: {
        input: {
          id: item.id,
        },
      },
    });
    console.log("Mutation result:", JSON.stringify(result, null, 2));
  }
  return true;
}
import { v4 as uuidv4 } from "uuid";
async function setGame(Items: any) {
  const gameId = uuidv4();
  // createGames
  const result:any = await client.graphql({
    query: `mutation CreateGames($input: CreateGamesInput!) {
      createGames(input: $input) {
        id
        status
        currentTurn
        gamePlayers
      }
    }
    `,
    variables: {
      input: {
        id:gameId,
        status: "bet",
        currentTurn: Items[0].id,
        gamePlayers: Items.map(({ id }: any) => id),
      },
    },
  });

  // const gameId=result.data.id
  console.log("Mutation result:", JSON.stringify(result, null, 2));
  

  // createGamePlayers
  for await (const item of Items) {
    const result1 = await client.graphql({
      query: `mutation CreateGamePlayers($input: CreateGamePlayersInput!) {
        createGamePlayers(input: $input) {
          id
          name
          status
          gameId
          bet
          insurance
          win
        }
      }
      `,
      variables: {
        input: {
          id: item.id,
          name: item.name,
          status: "bet",
          gameId: gameId,
          bet: 0,
          insurance: 0,
          win: 0,
        },
      },
    });
    console.log("Mutation result:", JSON.stringify(result1, null, 2));
  }


  return true;
}
