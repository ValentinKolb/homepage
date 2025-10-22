import { createEffect, createResource, Match, Switch } from "solid-js";
import { createPadStore, loadPadDoc, padTitle } from "../util";
import Editor from "./editor";

import { withMinLoadTime } from "@/lib/utils/timing";
/**
 * Main pad editor component
 */
const PadView = ({
  urlParam,
  username,
}: {
  urlParam: string;
  username: string | undefined;
}) => {
  // Get or create pad with localStorage persistence
  const [padValue, setPadValue] = createPadStore(urlParam);
  const isHowTo = urlParam === "howto";

  // Update window title when pad changes
  createEffect(() => {
    document.title = isHowTo ? "HowTo Pad" : padTitle(padValue);
  });

  const [localData] = createResource(async () =>
    withMinLoadTime(async () => loadPadDoc(padValue), 200),
  );

  return (
    <Switch>
      <Match when={localData.error}>
        <div class="paper m-auto max-w-xl p-4 shadow shadow-red-500">
          <h3 class="mb-2 font-bold">Fehler</h3>
          <p class="mb-2">
            Etwas ist schief gelaufen: Das Dokument konnte nicht geladen werden.
          </p>
          <i>{localData.error.message}</i>
        </div>
      </Match>
      <Match when={localData.loading}>
        <div class="text-dimmed m-auto flex max-w-xl items-center gap-2">
          <i class="ti ti-loader animate-spin"></i>
          <span class="text-sm">Das Dokument wird geladen...</span>
        </div>
      </Match>
      <Match when={localData.state === "ready"}>
        <Editor
          pad={padValue}
          setPad={setPadValue}
          localData={localData()!}
          username={username}
          howto={urlParam === "howto"}
        />
      </Match>
    </Switch>
  );
};

export default PadView;
