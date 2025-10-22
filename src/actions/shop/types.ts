import type { Permission } from "@/actions/auth/types";

// ==========================
// General Shop Types
// ==========================

export type Shop = {
  id: string;
  name: string;
  description: string | null;
  userPermission: Permission | null;
  userBalance: number | null;
};

export type ShopItem = {
  id: string;
  shopId: string;
  name: string;
  description: string | null;
  ean13: string | null;
  priceCents: number;
  active: boolean;
  stock: number;
  imgSrc: string | null;
  tags: string[];
};

export type ShopUser = {
  userId: string;
  username: string;
  imgSrc: string | null;
  userPermission: Permission;
  userBalance: number | null;
};

// ==========================
// Transaction Types
// ==========================

type BaseTransaction = {
  id: string;
  shopId: string;
  userId: string;
  username: string;
  createdAt: Date;
};

export type TopupTransaction = BaseTransaction & {
  type: "topup";
  amountCents: number; // negative (money in)
  itemId: null;
  itemName: null;
  itemAmount: 0;
};

export type PurchaseTransaction = BaseTransaction & {
  type: "purchase";
  amountCents: number; // positive (money out)
  itemId: string;
  itemName: string;
  itemAmount: number; // negative
};

export type RestockTransaction = BaseTransaction & {
  type: "restock";
  amountCents: number; // 0 or negative (credit to user)
  itemId: string;
  itemName: string;
  itemAmount: number; // positive
};

export type LossTransaction = BaseTransaction & {
  type: "loss";
  amountCents: number; // 0
  itemId: string;
  itemName: string;
  itemAmount: number; // negative
};

export type Transaction =
  | TopupTransaction
  | PurchaseTransaction
  | RestockTransaction
  | LossTransaction;
