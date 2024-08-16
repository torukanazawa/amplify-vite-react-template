import type { DynamoDBStreamHandler } from "aws-lambda";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../../amplify/data/resource";
import { env } from "$amplify/env/dealerAction";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { getScore, shuffle, createDeck } from "../utils/gameUtils";

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

    if (record.eventName === "MODIFY") {
      const NewImage: any = record.dynamodb?.NewImage;
      const Item = unmarshall(NewImage);
      console.log(record.eventName, Item);

      if (Item.status == "next") {
        const Items = await listGamePlayers(Item);
        if (Items.length && Items.every((item: any) => item.status == "next")) {
          await makeNextGame(Items);
        }
      } else if (Item.status == "insuranced") {
        const Items = await listGamePlayers(Item);
        if (Items.length && Items.every((item: any) => item.status == "insuranced")) {
          await checkDealersBlackjack(Items);
        }
      } else if (Item.status == "betted") {
        const Items = await listGamePlayers(Item);
        if (Items.length && Items.every((item: any) => item.status == "betted")) {
          await makePlayGame(Items);
        }
      }
    }
  }
};

async function checkDealersBlackjack(Items: any) {
  console.log("checkDealersBlackjack");

  const result: any = await client.graphql({
    query: `
      query GetGames($id: ID!) {
        getGames(id: $id) {
          id
          dealerCards{
            suit
            value
          }
        }
      }
    `,
    variables: {
      id: Items[0].gameId,
    },
  });
  console.log("Mutation result:", JSON.stringify(result, null, 2));
  const game = result.data.getGames;
  
  // updateGames
  const result1 = await client.graphql({
    query: `mutation UpdateGames($input: UpdateGamesInput!) {
      updateGames(input: $input) {
        id
        status
        currentTurn
      }
    }
    `,
    variables: {
      input: {
        id: Items[0].gameId,
        status: "play",
        currentTurn: getScore(game.dealerCards)==21?"dealer":Items[0].id,
      },
    },
  });
  console.log("Mutation result:", JSON.stringify(result1, null, 2))
}
async function makePlayGame(Items: any) {
  console.log("makePlayGame");

  const deck = shuffle(createDeck());
  const dealerCards = deck.splice(0, 2);
  const isInsurance = dealerCards[0].value == "A";

  // updateGamePlayers
  for await (const item of Items) {
    const cards = deck.splice(0, 2);
    const result1 = await client.graphql({
      query: `mutation UpdateGamePlayers($input: UpdateGamePlayersInput!) {
        updateGamePlayers(input: $input) {
          id
          status
          cards{
            suit
            value
          }
          insurance
        }
      }
      `,
      variables: {
        input: {
          id: item.id,
          status: isInsurance ? "insurance" : "play",
          cards: cards,
          insurance: 0,
        },
      },
    });
    console.log("Mutation result:", JSON.stringify(result1, null, 2));
  }

  // updateGames
  const result = await client.graphql({
    query: `mutation UpdateGames($input: UpdateGamesInput!) {
      updateGames(input: $input) {
        id
        status
        currentTurn
        deck{
          suit
          value
        }
        dealerCards{
          suit
          value
        }
        isInsurance
      }
    }
    `,
    variables: {
      input: {
        id: Items[0].gameId,
        status: isInsurance ? "insurance" : "play",
        currentTurn: Items[0].id,
        deck: deck,
        dealerCards: dealerCards,
        isInsurance: isInsurance,
      },
    },
  });
  console.log("Mutation result:", JSON.stringify(result, null, 2));
}
async function makeNextGame(Items: any) {
  console.log("makeNextGame");

  // updateGamePlayers
  for await (const item of Items) {
    const result1 = await client.graphql({
      query: `mutation UpdateGamePlayers($input: UpdateGamePlayersInput!) {
        updateGamePlayers(input: $input) {
          id
          status
          bet
          insurance
          win
        }
      }
      `,
      variables: {
        input: {
          id: item.id,
          status: "bet",
          bet: 0,
          insurance: 0,
          win: 0,
        },
      },
    });
    console.log("Mutation result:", JSON.stringify(result1, null, 2));
  }

  // updateGames
  const result = await client.graphql({
    query: `mutation UpdateGames($input: UpdateGamesInput!) {
      updateGames(input: $input) {
        id
        status
        currentTurn
      }
    }
    `,
    variables: {
      input: {
        id: Items[0].gameId,
        status: "bet",
        currentTurn: Items[0].id,
      },
    },
  });
  console.log("Mutation result:", JSON.stringify(result, null, 2));
}
async function listGamePlayers(Item: any) {
  console.log("listGamePlayers", Item.id);
  const result: any = await client.graphql({
    query: `
      query ListGamePlayers($filter: ModelGamePlayersFilterInput!) {
        listGamePlayers(filter: $filter) {
          items {
            id
            name
            status
            gameId
            cards{
              suit
              value
            }
            bet
            insurance
            win
          }
        }
      }
    `,
    variables: {
      filter: {
        gameId: { eq: Item.gameId },
      },
    },
  });

  // const result: any = await client.graphql({
  //   query: `
  //     query ListGamePlayersByGameId($gameId: ID!) {
  //       listGamePlayersByGameId(gameId: $gameId) {
  //         items {
  //           id
  //           name
  //           status
  //           gameId
  //           cards{
  //             suit
  //             value
  //           }
  //           bet
  //           insurance
  //           win
  //         }
  //       }
  //     }
  //   `,
  //   variables: {
  //     gameId: Item.id,
  //   },
  // });

  console.log("query result:", JSON.stringify(result, null, 2));
  const gamePlayers = result.data.listGamePlayers.items;
  

  return gamePlayers;
}
