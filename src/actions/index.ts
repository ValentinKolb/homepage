import { defineAction } from "astro:actions";
import { shopActions } from "./shop";
import { authActions } from "./auth";

export const server = {
  shop: shopActions,
  auth: authActions,
  ping: defineAction({
    handler: () => "pong",
  }),
};
