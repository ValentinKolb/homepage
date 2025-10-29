import SelectInput from "@/components/solidjs/input/select";
import TextInput from "@/components/solidjs/input/text";
import { DialogHeader, prompts } from "@/lib/client/prompt-lib";
import { createMutation } from "@/lib/solidjs/mutation";
import { actions } from "astro:actions";
import { createSignal } from "solid-js";
import { createStore } from "solid-js/store";

const roles = [
  {
    id: "use",
    label: "Nutzen",
    description: "Kann Artikel im Kiosk kaufen.",
    icon: "ti ti-user",
  },
  {
    id: "manage",
    label: "Nutzen und Verwalten",
    description: "Kann den Kiosk nutzen und verwalten.",
    icon: "ti ti-user-cog",
  },
];

export const AddUserButton = (inital: { shopId: string }) => {
  const mutation = createMutation({
    mutation: async () => {
      const newUser = await prompts.form({
        title: "Person hinzufügen",
        icon: "ti ti-user-plus",
        fields: {
          userId: {
            label: "Person",
            description:
              "Bitte gebe die User-ID der Person ein, die hinzugefügt werden soll.",
            placeholder: "XXX-YYYY-XXX-YYYY",
            icon: "ti ti-id-badge-2",
            type: "text",
            required: true,
          },
          permission: {
            label: "Rolle",
            description: "Bitte wähle die Rolle der Person aus.",
            icon: "ti ti-user-cog",
            type: "select",
            options: roles,
            required: true,
          },
        },
      });

      if (!newUser) return;

      await actions.shop.users.add.orThrow({
        shopId: inital.shopId,
        userId: newUser.userId,
        permission: newUser.permission as any,
      });

      window.location.reload();
    },
    onError: () =>
      prompts.error(
        "Fehler beim Hinzufügen der Person. Bitte versuche es erneut.",
      ),
  });

  return (
    <button
      class={`btn-subtle group flex-nowrap px-3 py-2`}
      onClick={mutation.mutate}
    >
      <i class={`ti ti-plus group-hover:hidden`}></i>
      <i class="ti ti-user-plus hidden group-hover:block"></i>
      <span class="hidden sm:block">Person hinzufügen</span>
    </button>
  );
};

export const RemoveUserButton = (inital: {
  userId: string;
  shopId: string;
}) => {
  const mutation = createMutation({
    mutation: async () => {
      const confirmed = await prompts.confirm(
        "Bist du sicher, dass du diese Person entfernen möchtest? Du kannst sie jederzeit wieder hinzufügen.",
        {
          title: "Person entfernen",
          icon: "ti ti-user-minus",
        },
      );
      if (!confirmed) return;

      await actions.shop.users.remove.orThrow({
        shopId: inital.shopId,
        userId: inital.userId,
      });

      window.location.reload();
    },
    onError: () =>
      prompts.error(
        "Fehler beim Entfernen der Person. Bitte versuche es erneut.",
      ),
  });

  return (
    <>
      <button
        onClick={mutation.mutate}
        class="btn-subtle group text--500 flex-1 justify-center p-2 sm:flex-initial"
        title="remove user"
        aria-label="remove user from shop"
      >
        <i class="ti ti-user-minus group-hover:hidden" />
        <i class="ti ti-trash hidden text-red-500 group-hover:block" />
      </button>
    </>
  );
};

export const TopUpUserButton = (inital: {
  userId: string;
  shopId: string;
  username: string;
}) => {
  const mutation = createMutation({
    mutation: async () => {
      const value = await prompts.form({
        title: "Konto Aufladen",
        icon: "ti ti-currency-euro",
        fields: {
          amountCents: {
            label: "Betrag",
            type: "currency",
            required: true,
            placeholder: "Gutschrift",
            description: `Gebe den Betrag in Euro an, der auf das Konto von ${inital.username} eingezahlt werden soll.`,
            min: 0,
          },
        },
      });

      if (!value) return;

      await actions.shop.transactions.topup.orThrow({
        shopId: inital.shopId,
        targetUserId: inital.userId,
        amountCents: value.amountCents,
      });

      window.location.reload();
    },
    onError: () =>
      prompts.error(
        "Fehler beim Aufladen des Kontos. Bitte versuche es erneut.",
      ),
  });

  return (
    <>
      <button
        onClick={mutation.mutate}
        class="btn-subtle group flex-1 justify-center p-2 hover:text-green-500 sm:flex-initial"
        aria-label="Top up user balance"
      >
        <i class="ti ti-currency-euro group-hover:hidden" />
        <i class="ti ti-plus hidden group-hover:block" />
      </button>
    </>
  );
};
