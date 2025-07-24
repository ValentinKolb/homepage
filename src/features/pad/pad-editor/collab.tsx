import { getRandomTextColor, jitter } from "@/lib/client/random";
import { getTextFromDoc, LoroExtensions } from "loro-codemirror";
import { EphemeralStore, VersionVector } from "loro-crdt";
import { nanoid } from "nanoid";
import { createSignal, onCleanup } from "solid-js";
import superjson from "superjson";
import {
  createPadSettings,
  getDocFromPad,
  type MarkdownPad,
  padStorageId,
} from "../util";

/**
 * Creates SSE-based network synchronization for real-time collaboration.
 *
 * @param pad - The markdown pad to sync
 * @param senderId - Unique ID to identify this client and filter own messages
 * @returns Object with sendMsg, onMessage, and onConnect functions
 */
const createSSENetworkSync = (pad: MarkdownPad, senderId: string) => {
  const roomId = padStorageId(pad);
  const apiPath = `/api/pad?roomId=${encodeURIComponent(roomId)}`;
  const eventSource = new EventSource(apiPath);

  onCleanup(() => eventSource.close());

  const sendMsg = (data: SyncMessage) => {
    fetch(apiPath, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: superjson.stringify({ ...data, senderId }),
    }).catch((err) => console.error("Failed to send message:", err));
  };

  const onMessage = (callback: (message: SyncMessage) => void) => {
    eventSource.onmessage = (event) => {
      const message = superjson.parse<SyncMessage>(event.data);
      // Skip messages from ourselves to prevent loops
      if (message.senderId === senderId) return;
      callback(message);
    };
  };

  const onConnect = (callback: () => void) => {
    eventSource.onopen = () => {
      callback();
    };
  };

  return {
    onConnect,
    sendMsg,
    onMessage,
  };
};

type SyncMessage =
  | {
      type: "request-snapshot";
      version: VersionVector;
      senderId?: string;
    }
  | {
      type: "send-snapshot";
      snapshot: Uint8Array;
      senderId?: string;
    }
  | {
      type: "update";
      update: Uint8Array;
      senderId?: string;
    }
  | {
      type: "cursor-update";
      update: Uint8Array;
      senderId?: string;
    }
  | {
      type: "user-update";
      update: Uint8Array;
      senderId?: string;
    };

/**
 * Creates a collaborative pad manager with real-time sync and user presence.
 *
 * @param pad - The markdown pad to manage
 * @param setPad - Function to update the pad state
 * @returns Object with users signal and loro extension
 */
export const createPadManager = (
  pad: MarkdownPad,
  setPad: (pad: Partial<MarkdownPad>) => void,
) => {
  const [settings, setSettings] = createPadSettings();

  const { sendMsg, onMessage, onConnect } = createSSENetworkSync(
    pad,
    settings.publicUserId!,
  );

  // make sure user id is set
  if (settings.publicUserId === undefined) {
    setSettings({ publicUserId: nanoid(64) });
  }

  // solid signal with all online users
  const [users, setUsers] = createSignal<string[]>([]);

  // userstore with ttl five seconds
  const ephemeralUserStore = new EphemeralStore<{
    [userId: string]: string;
  }>(5000);

  // local user update
  ephemeralUserStore.subscribeLocalUpdates((update) => {
    sendMsg({ type: "user-update", update });
  });

  // sync ephemeral user store with solid signal
  ephemeralUserStore.subscribe(() => {
    setUsers(
      Object.values(ephemeralUserStore.getAllStates())
        .filter((u) => !!u)
        .sort((u1, u2) => u1!.localeCompare(u2!)) as string[],
    );
  });

  // update user every two seconds (since the ttl is five seconds)
  const cncl = setInterval(
    () => {
      ephemeralUserStore.set(`user-${settings.publicUserId}`, settings.name);
    },
    jitter(2000, 100), // avoid overlapping updates (maybe?)
  );
  onCleanup(() => {
    clearInterval(cncl);
  });

  // loro doc
  const doc = getDocFromPad(pad);

  // ephemeral store for multi cursor view
  const ephemeralCursorStore = new EphemeralStore(1000);

  // on create send inital sync message to network
  // @see https://loro.dev/docs/tutorial/sync
  onConnect(() =>
    sendMsg({
      type: "request-snapshot",
      version: doc.oplogVersion(),
    }),
  );

  // persist all doc changes to local storage
  doc.subscribe(() => {
    setPad({
      doc,
      content: getTextFromDoc(doc).toString() ?? "",
      updated: new Date(),
    });
  });

  // local doc update -> send to network
  doc.subscribeLocalUpdates((update) => {
    sendMsg({ type: "update", update });
  });

  // handle local cursor movement -> send to network
  ephemeralCursorStore.subscribeLocalUpdates((update) => {
    sendMsg({ type: "cursor-update", update });
  });

  // subscribe to network messages and apply locally
  onMessage((msg) => {
    switch (msg.type) {
      case "request-snapshot":
        sendMsg({
          type: "send-snapshot",
          snapshot: doc.export({ mode: "update", from: msg.version }),
        });
        break;
      case "send-snapshot":
        doc.import(msg.snapshot);
        break;
      case "update":
        doc.import(msg.update);
        break;
      case "cursor-update":
        ephemeralCursorStore.apply(msg.update);
        break;
      case "user-update":
        ephemeralUserStore.apply(msg.update);
        break;
    }
  });

  return {
    users,
    loroExtention: () =>
      LoroExtensions(doc, {
        ephemeral: ephemeralCursorStore,
        user: { name: settings.name, colorClassName: getRandomTextColor() },
      }),
  };
};
