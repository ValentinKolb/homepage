import { prompts } from "@/lib/client/prompt-lib";
import { createMutation } from "@/lib/solidjs/mutation";
import { actions } from "astro:actions";

export default function CreateShopButton() {
  const createShopMutation = createMutation({
    mutation: async () => {
      const newName = await prompts.prompt("Name des neuen Shops");
      if (!newName) return;
      return await actions.shop.create.orThrow({ name: newName });
    },
    onError: () => {
      prompts.alert("Fehler beim Erstellen des Shops");
    },
    onSuccess: (data) => {
      data && (window.location.href = `/tools/shop/${data.id}`);
    },
  });

  return (
    <button
      class="paper group flex cursor-pointer flex-row items-center gap-4 p-4"
      onClick={createShopMutation.mutate}
    >
      <i class="ti ti-plus group-hover:hidden"></i>
      <i class="ti ti-thumb-up hidden group-hover:block"></i>
      Neuen Kiosk anlegen
    </button>
  );
}
