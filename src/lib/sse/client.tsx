import { common, symmetric } from "@/lib/utils/crypto";
import {
  EphemeralStore,
  LoroDoc,
  VersionVector,
  type Container,
  type Value,
} from "loro-crdt";
import { nanoid } from "nanoid";
import { type Accessor, createEffect, onCleanup } from "solid-js";
import superjson from "superjson";

const roomUrl = async (roomId: string) =>
  `/api/collab/${await common.hash(roomId)}`;

export type BaseSyncMessage =
  | {
      type: "send-state";
      data: Uint8Array;
    }
  | {
      type: "request-snapshot";
      data: Uint8Array;
    }
  | {
      type: "send-snapshot";
      data: Uint8Array;
    }
  | {
      type: string;
      data: Uint8Array;
    };

export const createSharedStore = <T extends Record<string, Value>>(opts: {
  id: string;
  timeout: number;
  onChange?: () => void | Promise<void>;
}) => {
  const { id: roomId, timeout, onChange } = opts;

  const store = new EphemeralStore<T>(timeout);

  const sendMsg = createSSENetworkSync<{ type: "update"; data: Uint8Array }>({
    roomId,
    onMessage: ({ data }) => store.apply(data),
  });

  // subscribe to all changes (e.g. to persist locally)
  store.subscribe(async () => await onChange?.());

  // share local changes
  store.subscribeLocalUpdates((data) => sendMsg({ type: "update", data }));

  return store;
};

export const createSharedDoc = <T extends Record<string, Container>>(opts: {
  id: string;
  initialData?: Uint8Array;
  onChange?: (doc: LoroDoc) => void | Promise<void>;
}) => {
  const { id: roomId, initialData, onChange } = opts;

  const doc = new LoroDoc<T>();
  if (initialData) doc.import(initialData);

  const sendMsg = createSSENetworkSync<BaseSyncMessage>({
    roomId,
    onMessage: (msg) => {
      switch (msg.type) {
        case "request-snapshot":
          sendMsg({
            type: "send-snapshot",
            data: doc.export({
              mode: "update",
              from: VersionVector.decode(msg.data),
            }),
          });
          break;
        case "send-state":
        case "send-snapshot":
          doc.import(msg.data);
          break;
      }
    },
    onConnect: () =>
      sendMsg({
        type: "send-snapshot",
        data: doc.export({ mode: "snapshot" }),
      }),
  });

  // send initial request for snapshot
  sendMsg({
    type: "request-snapshot",
    data: doc.oplogVersion().encode(),
  });

  // subscribe to all changes (e.g. to persist locally)
  doc.subscribe(async () => await onChange?.(doc));

  // local changes
  doc.subscribeLocalUpdates((data) => {
    sendMsg({ type: "send-snapshot", data });
  });

  // send full snapshot to server for storage
  const cncl = setInterval(() => {
    if (doc.opCount() <= 0) return;
    sendMsg({
      type: "send-state",
      data: doc.export({ mode: "snapshot" }),
    });
  }, 5000);
  onCleanup(() => clearInterval(cncl));

  return doc;
};

/**
 * Creates SSE-based network synchronization for real-time collaboration.
 *
 * Uses End to End encryption for secure communication.
 *
 * - The 'send-state' message can be used to persist the state on the server: Whenever this message is sent, it is not broadcasted to other peers but the state is stored on the server. If not persistence is wanted, this message can be simply not be sent.
 * - The 'request-snapshot' message can be used to request a snapshot of the current state from another peer. The server will also respond with the most recent stored state (the message type will be 'send-state').
 * - The 'send-snapshot' message is used to send a snapshot of the current state to another peer after the 'request-snapshot' message. This (partial) snapshot will not be persisted on the server.
 *
 * @param options - Configuration object
 * @returns sendMsg function for sending messages
 */
export const createSSENetworkSync = <T extends BaseSyncMessage>(options: {
  roomId: string;
  senderId?: string;
  key?: string;
  enabled?: Accessor<boolean>;
  onMessage?: (message: T & { _senderId: string }) => any | Promise<any>;
  onConnect?: () => any | Promise<any>;
  onDisconnect?: () => any | Promise<any>;
}) => {
  const {
    roomId,
    senderId = nanoid(64),
    key = roomId,
    enabled = () => true,
    onMessage,
    onConnect,
    onDisconnect,
  } = options;

  let eventSource: EventSource | null = null;

  const sendMsg = async (data: T) => {
    if (!enabled()) return;

    const payload = await symmetric.encrypt({
      payload: superjson.stringify({ ...data, _senderId: senderId }),
      key,
    });

    await fetch(await roomUrl(roomId), {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-msg-type": data.type },
      body: payload,
    }).catch((err) => console.error("Failed to send sync message:", err));
  };

  // Reactive effect to manage connection based on enabled state
  createEffect(async () => {
    if (enabled()) {
      // Create connection
      eventSource = new EventSource(await roomUrl(roomId));

      // Setup message handler
      eventSource.onmessage = async (event) => {
        const data = await symmetric.decrypt({
          payload: event.data,
          key,
        });
        let message = superjson.parse<T & { _senderId: string }>(data);
        // Skip messages from ourselves to prevent loops
        if (message._senderId === senderId) return;

        await onMessage?.(message);
      };

      // Setup connect handler
      eventSource.onopen = async () => {
        await onConnect?.();
      };
    } else {
      // Close connection
      if (eventSource) {
        await onDisconnect?.();
        eventSource.close();
        eventSource = null;
      }
    }
  });

  onCleanup(async () => {
    if (eventSource) {
      await onDisconnect?.();
      eventSource.close();
    }
  });

  return sendMsg;
};
