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
      // createAt: a.string(),
      // updateAt: a.string()
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
// .authorization((allow) => [allow.resource(matchMake)]);
export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
  },
});

/*== STEP 2 ===============================================================
Go to your frontend source code. From your client-side code, generate a
Data client to make CRUDL requests to your table. (THIS SNIPPET WILL ONLY
WORK IN THE FRONTEND CODE FILE.)

Using JavaScript or Next.js React Server Components, Middleware, Server 
Actions or Pages Router? Review how to generate Data clients for those use
cases: https://docs.amplify.aws/gen2/build-a-backend/data/connect-to-API/
=========================================================================*/

/*
"use client"
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>() // use this Data client for CRUDL requests
*/

/*== STEP 3 ===============================================================
Fetch records from the database and use them in your frontend component.
(THIS SNIPPET WILL ONLY WORK IN THE FRONTEND CODE FILE.)
=========================================================================*/

/* For example, in a React component, you can use this snippet in your
  function's RETURN statement */
// const { data: todos } = await client.models.Todo.list()

// return <ul>{todos.map(todo => <li key={todo.id}>{todo.content}</li>)}</ul>
