import { createSharedDoc, createSharedStore } from "@/lib/sse/client";
import { common } from "@/lib/utils/crypto";
import { getRandomTextColor } from "@/lib/utils/random";
import { getTextFromDoc, LoroExtensions } from "loro-codemirror";
import { UndoManager } from "loro-crdt";
import { nanoid } from "nanoid";
import { createSignal, onCleanup } from "solid-js";
import { savePadDoc, type MarkdownPad } from "../util";

type UserState = { name: string; id: string; color: string; self?: boolean };

/**
 * Creates a collaborative pad manager with real-time sync and user presence.
 *
 * @param pad - The markdown pad to manage
 * @param setPad - Function to update the pad state
 * @returns Object with users signal and loro extension
 */
export const createPadManager = (opts: {
  pad: MarkdownPad;
  setPad: (pad: Partial<MarkdownPad>) => void;
  localData?: Uint8Array;
  username?: string;
}) => {
  const { pad, setPad, localData } = opts;
  const username = opts.username ?? `Guest ${common.readableId(3, 2, 3)}`;
  const color = getRandomTextColor();
  const selfId = nanoid(64);

  // solid signal with all online users
  const currentUser = () =>
    ({
      id: selfId,
      name: username,
      color,
      self: true,
    }) as UserState;

  const [users, setUsers] = createSignal<UserState[]>([currentUser()]);

  const loroDoc = createSharedDoc({
    id: pad.id,
    initialData: localData,
    onChange: async () => {
      setPad({
        content: getTextFromDoc(loroDoc).toString() ?? "",
        updated: new Date(),
      });
      await savePadDoc(pad, loroDoc);
    },
  });

  const undoManager = new UndoManager(loroDoc, {});

  const ephemeralCursorStore = createSharedStore({
    id: `cursor-${pad.id}`,
    timeout: 1000,
  });

  const ephemeralUserStore = createSharedStore<{
    [userId: string]: UserState;
  }>({
    id: `users-${pad.id}`,
    timeout: 5000,
    onChange: () => {
      setUsers(
        Object.values(ephemeralUserStore.getAllStates())
          .filter((u) => !!u)
          .map((u) => ({ ...u, self: u.id === selfId }))
          .sort((u1, u2) => u1!.name.localeCompare(u2!.name)) as UserState[],
      );
    },
  });

  const cncl = setInterval(() => {
    ephemeralUserStore.set(`user-${selfId}`, currentUser());
  }, 4000);
  onCleanup(() => clearInterval(cncl));

  return {
    users,
    loroExtention: () =>
      LoroExtensions(
        loroDoc,
        {
          ephemeral: ephemeralCursorStore,
          user: {
            name: username ?? `Guest ${common.readableId(3, 2, 3)}`,
            colorClassName: color,
          },
        },
        undoManager,
      ),
  };
};
