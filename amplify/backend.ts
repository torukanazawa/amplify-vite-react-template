import { defineBackend, defineFunction } from "@aws-amplify/backend";
import { auth } from "./auth/resource";
import { data } from "./data/resource";
import { matchMake } from "./function/matchMake/resource";
import { dealerAction } from "./function/dealerAction/resource";
import { playerAction } from "./function/playerAction/resource";
// import amplifyOutputs from "../amplify_outputs.json";

import { DynamoEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import { StartingPosition } from "aws-cdk-lib/aws-lambda";

const backend = defineBackend({
  auth,
  data,
  matchMake,
  dealerAction,
  playerAction,
});


import * as cdk from 'aws-cdk-lib';

const API_URL = "https://jspp6dqj6jfvzfagjh6hngfo3y.appsync-api.ap-northeast-1.amazonaws.com/graphql"
// const API_URL = "https://adq46apxhfhdnezibqfr2xrxnu.appsync-api.ap-northeast-1.amazonaws.com/graphql"

// MATCHMAKE LASMBDA
const WaitingRoomEventSource = new DynamoEventSource(backend.data.resources.tables["WaitingRoom"], {
  startingPosition: StartingPosition.LATEST,
});
backend.matchMake.resources.lambda.addEventSource(WaitingRoomEventSource);

backend.matchMake.addEnvironment('API_URL', API_URL);
backend.data.resources.graphqlApi.grant(
  backend.matchMake.resources.lambda,
  cdk.aws_appsync.IamResource.all(),
  'appsync:GraphQL'
);

// DEALERACTION LASMBDA
const GamesEventSource = new DynamoEventSource(backend.data.resources.tables["Games"], {
  startingPosition: StartingPosition.LATEST,
});
backend.dealerAction.resources.lambda.addEventSource(GamesEventSource);

backend.dealerAction.addEnvironment('API_URL', API_URL);
backend.data.resources.graphqlApi.grant(
  backend.dealerAction.resources.lambda,
  cdk.aws_appsync.IamResource.all(),
  'appsync:GraphQL'
);


// PLAYERACTION LASMBDA
const GamePlayersEventSource = new DynamoEventSource(backend.data.resources.tables["GamePlayers"], {
  startingPosition: StartingPosition.LATEST,
});
backend.playerAction.resources.lambda.addEventSource(GamePlayersEventSource);

backend.playerAction.addEnvironment('API_URL', API_URL);
backend.data.resources.graphqlApi.grant(
  backend.playerAction.resources.lambda,
  cdk.aws_appsync.IamResource.all(),
  'appsync:GraphQL'
);


// DINAMODB LASMBDA
// const eventSource = new DynamoEventSource(backend.data.resources.tables["WaitingRoom"], {
//   startingPosition: StartingPosition.LATEST,
// });
// backend.myDynamoDBFunction.resources.lambda.addEventSource(eventSource);

// import * as iam from "aws-cdk-lib/aws-iam";
// backend.myDynamoDBFunction.resources.lambda.addToRolePolicy(
//   new iam.PolicyStatement({
//     effect: iam.Effect.ALLOW,
//     actions: ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem", "dynamodb:DeleteItem", "dynamodb:Query", "dynamodb:Scan"],
//     resources: ["*"],
//     // resources: [
//     //   `arn:aws:dynamodb:ap-northeast-1:072459121594:table/WaitingRoom-eqthybmlerbthb4ewscstgzhha-NONE`,
//     //   `arn:aws:dynamodb:ap-northeast-1:072459121594:table/GamePlayers-eqthybmlerbthb4ewscstgzhha-NONE`,
//     //   `arn:aws:dynamodb:ap-northeast-1:072459121594:table/Games-eqthybmlerbthb4ewscstgzhha-NONE`,
//     // ]
//   })
// );


// HELLO WORLD
// const authenticatedUserIamRole = backend.auth.resources.authenticatedUserIamRole;
// backend.helloWorld.resources.lambda.grantInvoke(authenticatedUserIamRole);
// backend.addOutput({
//   custom: {
//     helloWorldFunctionName: backend.helloWorld.resources.lambda.functionName,
//   },
// });
