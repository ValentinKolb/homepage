import { prompts } from "@/lib/client/prompt-lib";
import { createMutation } from "@/lib/solidjs/mutation";
import { actions } from "astro:actions";
import { removeAccount } from "./util";

const DeleteAccountBtn = () => {
  const deleteAccountMutation = createMutation({
    mutation: async () => {
      const confirmed = await prompts.confirm(
        "Bist du absolut sicher? Du verlierst alle Account-Daten und kannst dich nicht mehr anmelden.",
        {
          title: "Account löschen",
          confirmText: "Endgültig löschen",
        },
      );
      if (!confirmed) return false;
      await actions.auth.user.delete.orThrow();
      return true;
    },
    onError: () => {
      prompts.error("Account konnte nicht gelöscht werden.");
    },
    onSuccess: (deleted) => {
      if (!deleted) return;
      removeAccount();
      window.location.reload();
    },
  });

  return (
    <button
      class="btn-subtle group self-start p-2 hover:text-red-500"
      onClick={deleteAccountMutation.mutate}
    >
      <i class="ti ti-trash group-hover:hidden"></i>
      <i class="ti ti-trash-x hidden group-hover:block"></i>
      <span>Account löschen</span>
    </button>
  );
};

export default DeleteAccountBtn;
