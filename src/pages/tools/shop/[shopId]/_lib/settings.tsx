import type { Shop } from "@/actions/shop/types";
import TextInput from "@/components/solidjs/input/text";
import { prompts } from "@/lib/client/prompt-lib";
import { createForm } from "@/lib/solidjs/form";
import { createMutation } from "@/lib/solidjs/mutation";
import { actions } from "astro:actions";
import { Show } from "solid-js";

const Settings = (initial: { shop: Shop }) => {
  const [newSettings, setNewSettings, handler] = createForm({
    initial: {
      name: initial.shop.name,
      description: initial.shop.description ?? "",
    },
    validate: {
      name: (v) =>
        v.length >= 2 && v.length <= 100
          ? null
          : "Name muss zwischen 2 und 100 Zeichen lang sein",
    },
  });

  const mutation = createMutation({
    mutation: async ({
      name,
      description,
    }: {
      name: string;
      description: string | null;
    }) => {
      await actions.shop.update.orThrow({
        shopId: initial.shop.id,
        name,
        description,
      });

      window.location.reload();
    },
    onError: () =>
      prompts.error(
        "Fehler beim Speichern der Einstellungen. Bitte versuche es erneut.",
      ),
  });

  return (
    <>
      <TextInput
        label="Name"
        description="Der Name des Kiosks"
        placeholder="Kioskname"
        error={() => handler.errors.name}
        value={() => newSettings.name}
        onInput={(val) => setNewSettings("name", val)}
      />
      <TextInput
        label="Beschreibung"
        description="Eine kurze Beschreibung des Kiosks (optional)"
        placeholder="Kioskbeschreibung"
        value={() => newSettings.description}
        onInput={(val) => setNewSettings("description", val)}
        multiline
      />

      <Show when={handler.touched()}>
        <div class="flex flex-row gap-2">
          <button
            id="reset-settings-btn"
            onClick={handler.reset}
            class="btn-subtle px-3 py-2"
          >
            <span class="font-semibold">Zurücksetzen</span>
          </button>
          <button
            id="save-settings-btn"
            onClick={handler.submit(mutation.mutate)}
            class="btn-success group px-3 py-2"
          >
            <i class="ti ti-device-floppy mr-1 group-hover:hidden"></i>
            <i class="ti ti-check mr-1 hidden group-hover:block"></i>
            <span class="font-semibold">Speichern</span>
          </button>
        </div>
      </Show>
    </>
  );
};

export default Settings;
