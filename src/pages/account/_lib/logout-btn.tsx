import { prompts } from "@/lib/client/prompt-lib";
import { createMutation } from "@/lib/solidjs/mutation";
import { actions } from "astro:actions";
import { removeAccount } from "./util";

const LogoutBtn = () => {
  const disconnectMutation = createMutation({
    mutation: async () => {
      const confirmed = await prompts.confirm(
        "Möchtest du deinen Account von diesem Gerät entfernen? Stelle sicher das du deinen Account Schlüssel gesichert hast, andernfalls kannst du dich nicht mehr anmelden!",
        {
          title: "Verbindung trennen",
          confirmText: "Trennen",
        },
      );
      if (!confirmed) return false;
      await actions.auth.session.invalidate.orThrow();
      return true;
    },
    onError: () => {
      prompts.error("Verbindung konnte nicht getrennt werden.");
    },
    onSuccess: (destroyed) => {
      if (!destroyed) return;
      removeAccount();
      window.location.reload();
    },
  });

  return (
    <button
      class="btn-subtle group self-start p-2 hover:text-orange-500"
      onClick={disconnectMutation.mutate}
    >
      <i class="ti ti-link group-hover:hidden"></i>
      <i class="ti ti-unlink hidden group-hover:block"></i>
      <span>Verbindung trennen</span>
    </button>
  );
};

export default LogoutBtn;
