import { createMutation } from "@/lib/solidjs/mutation";
import { navigate } from "astro:transitions/client";
import { actions } from "astro:actions";
import { prompts } from "@/lib/client/prompt-lib";

const CreateItemBtn = (initial: { shopId: string }) => {
  const mutation = createMutation({
    mutation: async () => {
      const name = await prompts.prompt(
        "Bitte gebe den Namen des neuen Artikels ein. Alle weiteren Informationen können nach dem Erstellen hinzugefügt werden.",
        "",
        {
          title: "Neuer Artikel",
          icon: "ti ti-bottle",
          confirmText: "Erstellen",
        },
      );
      if (!name) return;

      await actions.shop.items.create.orThrow({
        shopId: initial.shopId,
        name: name,
        priceCents: 0,
      });
    },
    onSuccess: () => {
      navigate(window.location.href, { history: "replace" });
    },
    onError: () => {
      prompts.error(
        "Der Artikel konnte nicht erstellt werden. Bitte versuche es erneut.",
      );
    },
  });

  return (
    <>
      <button
        class={`btn-success group flex-nowrap px-3 py-2 font-semibold`}
        onClick={mutation.mutate}
      >
        <i class={`ti ti-plus group-hover:hidden`}></i>
        <i class="ti ti-bottle hidden group-hover:block"></i>
        <span class="hidden sm:block">Neuer Artikel</span>
      </button>
    </>
  );
};

export default CreateItemBtn;
