import { defineFunction } from "@aws-amplify/backend";

export const playerAction = defineFunction({
  name: "playerAction",
  entry: './handler.ts',
  runtime: 20,
});
