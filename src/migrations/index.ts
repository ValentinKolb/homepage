import { migrate as migrateShopSchema } from "./shop-schema";
import { migrate as migrateAuthSchema } from "./auth-schema";
import { migrate as migrateCollabSchema } from "./collab-schema";

await migrateAuthSchema().catch((error) => {
  console.error("Failed to run auth migrations:", error);
  throw error;
});
await migrateShopSchema().catch((error) => {
  console.error("Failed to run shop migrations:", error);
  throw error;
});
await migrateCollabSchema().catch((error) => {
  console.error("Failed to run collab migrations:", error);
  throw error;
});
console.log("Migrations completed successfully");
