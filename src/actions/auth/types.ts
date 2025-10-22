/**
 * The authenticated user, all fields are public and can be safely passed to ANY client.
 */
export type UserModel = {
  id: string;
  username: string;
  publicKey: string;
  imgSrc: string | null;
};

/**
 * Describts a policy type
 */
export type Permission = "read" | "use" | "manage" | "admin";
