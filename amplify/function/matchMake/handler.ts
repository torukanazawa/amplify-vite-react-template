import type { DynamoDBStreamHandler } from "aws-lambda";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../../amplify/data/resource";

import { env } from "$amplify/env/matchMake";
import { unmarshall } from "@aws-sdk/util-dynamodb";
// import { getScore, shuffle, createDeck } from "../utils/gameUtils";

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
    }
  }
};
