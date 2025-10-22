/**
 * Kit Store API
 *
 * Key-value store using OPFS with bucket system and Web Locks
 */

import { OPFS } from "@/lib/client/files";
import { common } from "@/lib/utils/crypto";
import * as devalue from "devalue";

// ==========================
// Types
// ==========================

type BucketData = Record<
  string,
  { key: string; value: string; timestamp: number }
>;
type Manifest = { buckets: string[]; version: number };

// ==========================
// Constants
// ==========================

const STORE_DIR = ".kitstore";
const MANIFEST_PATH = `${STORE_DIR}/manifest.json`;
const BUCKETS_DIR = `${STORE_DIR}/buckets`;

// ==========================
// Store Implementation
// ==========================

class StoreManager {
  private manifestCache: Manifest | null = null;

  /**
   * Get bucket name from key hash (first 2 hex chars)
   */
  private async getBucketName(key: string): Promise<string> {
    const hashValue = await common.hash(key);
    return hashValue.substring(0, 2);
  }

  /**
   * Load manifest from disk or create new one
   */
  private async loadManifest(): Promise<Manifest> {
    if (this.manifestCache) {
      return this.manifestCache;
    }

    try {
      const data = await OPFS.read(MANIFEST_PATH);
      if (data) {
        this.manifestCache = JSON.parse(new TextDecoder().decode(data));
        return this.manifestCache!;
      }
    } catch {
      // Manifest doesn't exist yet
    }

    // Create new manifest
    this.manifestCache = { buckets: [], version: 1 };
    return this.manifestCache;
  }

  /**
   * Save manifest to disk
   */
  private async saveManifest(manifest: Manifest): Promise<void> {
    const data = new TextEncoder().encode(JSON.stringify(manifest));
    await OPFS.write(MANIFEST_PATH, data);
    this.manifestCache = manifest;
  }

  /**
   * Load bucket data from disk
   */
  private async loadBucket(bucketName: string): Promise<BucketData> {
    const bucketPath = `${BUCKETS_DIR}/${bucketName}.json`;
    try {
      const data = await OPFS.read(bucketPath);
      if (data) {
        return JSON.parse(new TextDecoder().decode(data));
      }
    } catch {
      // Bucket doesn't exist yet
    }

    return {};
  }

  /**
   * Save bucket data to disk
   */
  private async saveBucket(
    bucketName: string,
    data: BucketData,
  ): Promise<void> {
    const bucketPath = `${BUCKETS_DIR}/${bucketName}.json`;
    await OPFS.write(bucketPath, JSON.stringify(data));
  }

  /**
   * Set a value in the store
   */
  async set(key: string, value: any): Promise<void> {
    const bucketName = await this.getBucketName(key);
    const keyHash = await common.hash(key);

    // Lock bucket for writing
    await navigator.locks.request(
      `kitstore-bucket-${bucketName}`,
      { mode: "exclusive" },
      async () => {
        const bucket = await this.loadBucket(bucketName);

        // Store with original key and serialized value
        bucket[keyHash] = {
          key,
          value: devalue.stringify(value),
          timestamp: Date.now(),
        };

        await this.saveBucket(bucketName, bucket);

        // Update manifest if this is a new bucket
        const manifest = await this.loadManifest();
        if (!manifest.buckets.includes(bucketName)) {
          manifest.buckets.push(bucketName);
          manifest.version++;
          await this.saveManifest(manifest);
        }
      },
    );
  }

  /**
   * Get a value from the store
   */
  async get(key: string): Promise<any | undefined> {
    const bucketName = await this.getBucketName(key);
    const keyHash = await common.hash(key);

    // Lock bucket for reading (shared lock)
    return navigator.locks.request(
      `kitstore-bucket-${bucketName}`,
      { mode: "shared" },
      async () => {
        const bucket = await this.loadBucket(bucketName);
        const entry = bucket[keyHash];

        if (!entry) {
          return undefined;
        }

        try {
          return devalue.parse(entry.value);
        } catch (e) {
          console.error(`[KitStore] Failed to parse value for key: ${key}`, e);
          return undefined;
        }
      },
    );
  }

  /**
   * Delete a key from the store
   */
  async delete(key: string): Promise<void> {
    const bucketName = await this.getBucketName(key);
    const keyHash = await common.hash(key);

    // Lock bucket for writing
    await navigator.locks.request(
      `kitstore-bucket-${bucketName}`,
      { mode: "exclusive" },
      async () => {
        const bucket = await this.loadBucket(bucketName);

        if (keyHash in bucket) {
          delete bucket[keyHash];
          await this.saveBucket(bucketName, bucket);
        }
      },
    );
  }

  /**
   * List all keys with optional prefix filter
   */
  async list(prefix?: string): Promise<string[]> {
    const manifest = await this.loadManifest();
    const keys: string[] = [];

    // Load all buckets in parallel (shared locks)
    const promises = manifest.buckets.map(async (bucketName) => {
      return navigator.locks.request(
        `kitstore-bucket-${bucketName}`,
        { mode: "shared" },
        async () => {
          const bucket = await this.loadBucket(bucketName);

          for (const entry of Object.values(bucket)) {
            if (!prefix || entry.key.startsWith(prefix)) {
              keys.push(entry.key);
            }
          }
        },
      );
    });

    await Promise.all(promises);

    return keys.sort();
  }

  /**
   * Clear all data (for debugging)
   */
  async clear(): Promise<void> {
    await OPFS.delete(STORE_DIR);
    this.manifestCache = null;
  }
}

// ==========================
// Singleton Instance
// ==========================

let storeInstance: StoreManager | null = null;

const getStore = (): StoreManager => {
  if (!storeInstance) {
    storeInstance = new StoreManager();
  }
  return storeInstance;
};

// ==========================
// Public API
// ==========================

export const createStoreAPI = () => ({
  /**
   * Set a value in the store
   * @param key - Storage key
   * @param value - Value to store (will be serialized)
   */
  set: (key: string, value: any): Promise<void> => {
    return getStore().set(key, value);
  },

  /**
   * Get a value from the store
   * @param key - Storage key
   * @returns Deserialized value or undefined
   */
  get: (key: string): Promise<any> => {
    return getStore().get(key);
  },

  /**
   * Delete a key from the store
   * @param key - Storage key
   */
  delete: (key: string): Promise<void> => {
    return getStore().delete(key);
  },

  /**
   * List all keys with optional prefix
   * @param prefix - Optional prefix filter
   * @returns Array of keys
   */
  list: (prefix?: string): Promise<string[]> => {
    return getStore().list(prefix);
  },

  /**
   * Clear all store data
   */
  clear: (): Promise<void> => {
    return getStore().clear();
  },
});