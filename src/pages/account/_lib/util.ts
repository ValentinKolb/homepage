import { asymmetric } from "@/lib/utils/crypto";
import { actions } from "astro:actions";

export type StoredAccount = {
  accountId: string;
  privateKey: string;
};

export const storeAccount = (data: StoredAccount) => {
  localStorage.setItem("_ACCOUNT_KEY", JSON.stringify(data));
};

export const retrieveAccount = () => {
  const data = localStorage.getItem("_ACCOUNT_KEY");
  if (!data) return null;
  return JSON.parse(data) as StoredAccount;
};

export const removeAccount = () => {
  localStorage.removeItem("_ACCOUNT_KEY");
};

export const createSession = async (creds: StoredAccount) => {
  // Generate login challenge
  const { nonce, timestamp, signature } = await asymmetric.sign({
    privateKey: creds.privateKey,
    message: creds.accountId,
  });

  // Create session, will set cookie automatically
  const { error } = await actions.auth.session.create({
    userId: creds.accountId,
    nonce,
    timestamp,
    signature,
  });

  return error === undefined;
};

/**
 * Export credentials as Base64 string
 */
export function exportCredentials({
  accountId,
  privateKey,
}: StoredAccount): string {
  const exported = {
    accountId,
    privateKey,
    exportedAt: new Date().toISOString(),
  };
  return btoa(JSON.stringify(exported));
}

/**
 * Import credentials from Base64 string
 * @returns as partial auth object that can be used to create a session
 * @throws Error if import fails
 */
export const importCredentials = (base64: string) => {
  const data = JSON.parse(atob(base64)) as StoredAccount;
  if (!data?.accountId || !data?.privateKey) {
    throw new Error("Can not import: invalid credentials");
  }
  return {
    accountId: data.accountId,
    privateKey: data.privateKey,
  } as StoredAccount;
};
