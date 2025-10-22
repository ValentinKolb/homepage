import type { Transaction } from "@/actions/shop/types";

/**
 * Formats a number of cents into a string representation of euros.
 */
export const euro = (cents: number) => `${(cents / 100).toFixed(2)}€`;

export const transaction = (transactionType: Transaction["type"]) =>
  ({
    purchase: {
      icon: "ti-shopping-cart",
      color: "text-blue-500",
      name: "Kauf",
    },
    restock: { icon: "ti-package", color: "text-green-500", name: "Auffüllen" },
    loss: { icon: "ti-trash-x", color: "text-red-500", name: "Verlust" },
    topup: { icon: "ti-coin", color: "text-teal-500", name: "Geldaufladen" },
  })[transactionType] || {
    icon: "ti-help",
    color: "text-gray-500",
    name: "Unbekannt",
  };
