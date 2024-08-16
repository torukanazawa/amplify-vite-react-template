import { defineFunction } from "@aws-amplify/backend";

export const matchMake = defineFunction({
  name: "matchMake",
  entry: './handler.ts',
  runtime: 20,
});
