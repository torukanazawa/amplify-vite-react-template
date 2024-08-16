import { type ClientSchema, a, defineData } from "@aws-amplify/backend";


/*== STEP 1 ===============================================================
The section below creates a Todo database table with a "content" field. Try
adding a new "isDone" field as a boolean. The authorization rule below
specifies that any unauthenticated user can "create", "read", "update", 
and "delete" any "Todo" records.
=========================================================================*/
const schema = a.schema({
  Todo: a
    .model({
      id: a.id(),
      content: a.string(),
      isDone: a.boolean(),
    })
    .authorization((allow) => [allow.authenticated()]),

  Players: a
    .model({
      id: a.id(),
      userId: a.id(),
      name: a.string(),
      email: a.email(),
      balance: a.integer(),
    })
    .authorization((allow) => [allow.authenticated()]),

  WaitingRoom: a
    .model({
      id: a.id(),
      name: a.string(),
      oneOnOne: a.boolean(),
    })
    .authorization((allow) => [allow.authenticated()]),

  Card: a.customType({
    suit: a.string(),
    value: a.string(),
  }),

  Games: a
    .model({
      id: a.id(),
      status: a.string(),
      currentTurn: a.string(),
      deck: a.ref("Card").array(),
      dealerCards: a.ref("Card").array(),
      isInsurance: a.boolean(),
      gamePlayers: a.string().array(),
    })
    .authorization((allow) => [allow.authenticated()]),

  GamePlayers: a
    .model({
      id: a.id(),
      gameId: a.id(),
      status: a.string(),
      name: a.string(),
      cards: a.ref("Card").array(),
      bet: a.integer(),
      insurance: a.integer(),
      win: a.integer(),
      split: a.id(),
      createdAt: a.string(),
    })
    .secondaryIndexes((index) => [index("gameId").queryField("listGamePlayersByGameId").sortKeys(["createdAt"]),],)
    .authorization((allow) => [allow.authenticated()]),
});
export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
  },
});
