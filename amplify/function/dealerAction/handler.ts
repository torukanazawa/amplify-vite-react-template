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
      console.log("id",NewImage.id.S);
      
      const Item = unmarshall(NewImage);
      console.log(record.eventName, Item);

      if (Item.currentTurn == "dealer" && Item.status == "play") {
        
        if (getScore(Item.dealerCards) < 17) {
          await makeDealersHand(Item);
        } else {
          await makeResult(Item);
        }
      }
    }
  }
};


async function makeResult(Item: any) {
  console.log("makeResult");

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
            split
          }
        }
      }
    `,
    variables: {
      filter: {
        gameId: { eq: Item.id },
      },
    },
  });
  console.log("query result:", JSON.stringify(result, null, 2));
  const gamePlayers = result.data.listGamePlayers.items;

  // updateGamePlayers
  for await (const item of gamePlayers) {
    const win = resolveHands(Item, item);
    console.log(win, {
      id: item.id,
      status: "result",
      win: win,
    });
    

    /* gamePlayers result
     **************************/
    const result = await client.graphql({
      query: `mutation UpdateGamePlayers($input: UpdateGamePlayersInput!) {
        updateGamePlayers(input: $input) {
          id
          status
          win
        }
      }
      `,
      variables: {
        input: {
          id: item.id,
          status: "result",
          win: win,
        },
      },
    });
    console.log("Mutation result:", JSON.stringify(result, null, 2));

    /* player result
     **************************/
    if(item.split)item.id=item.split
    const result2: any = await client.graphql({
      query: `
        query GetPlayers($id: ID!) {
          getPlayers(id: $id) {
            id
            userId
            name
            email
            balance
          }
        }
      `,
      variables: {
        id: item.id,
      },
    });
    
    console.log("Mutation result2:", JSON.stringify(result2, null, 2));
    const player = result2.data.getPlayers;

    const result3 = await client.graphql({
      query: `mutation UpdatePlayers($input: UpdatePlayersInput!) {
        updatePlayers(input: $input) {
          id
        }
      }
      `,
      variables: {
        input: {
          id: item.id,
          balance: player.balance + win,
        },
      },
    });
    console.log("Mutation result3:", JSON.stringify(result3, null, 2));
  }

  const result4 = await client.graphql({
    query: `mutation UpdateGames($input: UpdateGamesInput!) {
      updateGames(input: $input) {
        id
        status
      }
    }
    `,
    variables: {
      input: {
        id: Item.id,
        status: "result",
      },
    },
  });
  console.log("Mutation result4:", JSON.stringify(result4, null, 2));

  return true;
}

async function makeDealersHand(Item: any) {
  console.log("makeDealersHand");
  await new Promise(resolve => setTimeout(resolve, 1000));


  // dealersTurn
  Item.dealerCards.push(Item.deck.shift());

  console.log({
    id: Item.id,
    status: "play",
    currentTurn: Item.currentTurn,
    deck: Item.deck,
    dealerCards: Item.dealerCards,
  });
  
  const result = await client.graphql({
    query: `mutation UpdateGames($input: UpdateGamesInput!) {
      updateGames(input: $input) {
        id
        deck{
          suit
          value
        }
        dealerCards{
          suit
          value
        }
      }
    }
    `,
    variables: {
      input: {
        id: Item.id,
        deck: Item.deck,
        dealerCards: Item.dealerCards,
      },
    },
  });
  console.log("Mutation result:", JSON.stringify(result, null, 2));

  return result;
}

function resolveHands(dealer: any, gamePlayer: any): number {
  const dealerScore = getScore(dealer.dealerCards);
  const playerScore = getScore(gamePlayer.cards);
  // console.log({ dealer, dealerScore, gamePlayer, playerScore });

  let win = 0;
  if (playerScore > 21) {
    // プレイヤーがバストした場合
  } else if (dealerScore > 21) {
    // ディーラーがバストした場合
    win = gamePlayer.bet * 2;
    console.log("ディーラーがバスト");
  } else if (playerScore == 21 && gamePlayer.cards.length == 2&&dealerScore == 21 && dealer.dealerCards.length == 2) {
    console.log("同点の場合は変化なし");
    win = gamePlayer.bet;
  } else if (playerScore == 21 && gamePlayer.cards.length == 2) {
    console.log("ブラックジャック プレイヤーの勝ち");
    // プレイヤーの勝ち
    win = gamePlayer.bet * 2.5;
  } else if (playerScore > dealerScore) {
    console.log("プレイヤーの勝ち");
    // プレイヤーの勝ち
    win = gamePlayer.bet * 2;
  } else if (playerScore < dealerScore) {
    console.log("プレイヤーの負け");
    // プレイヤーの負け
  } else {
    console.log("同点の場合は変化なし");
    win = gamePlayer.bet;
  }

  // インシュランスの精算
  if (gamePlayer.insurance > 0) {
    if (dealerScore === 21 && dealer.cards.length === 2) {
      win += gamePlayer.insurance * 2;
    } else {
      win -= gamePlayer.insurance;
    }
  }
  return Math.round(win);
}
