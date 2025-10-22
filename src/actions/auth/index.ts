import { sessionActions } from "./session";
import { totpActions } from "./totp";
import { userActions } from "./user";

export const authActions = {
  user: userActions,
  session: sessionActions,
  totp: totpActions,
};
