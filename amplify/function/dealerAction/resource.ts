import { defineFunction } from "@aws-amplify/backend";

export const dealerAction = defineFunction({
  name: "dealerAction",
  entry: './handler.ts',
  runtime: 20,
});
