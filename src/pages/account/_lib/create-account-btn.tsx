import { prompts } from "@/lib/client/prompt-lib";
import { createMutation } from "@/lib/solidjs/mutation";
import { asymmetric } from "@/lib/utils/crypto";
import { actions } from "astro:actions";
import { createSession, storeAccount } from "./util";

const CreateAccountBtn = () => {
  const createAccountMutation = createMutation({
    mutation: async () => {
      const username = await prompts.prompt(
        "Gebe einen Namen ein um einen neuen Account zu erstellen.",
        "",
        {
          title: "Account erstellen",
          icon: "ti ti-user-plus",
        },
      );
      if (!username) return;

      const { privateKey, publicKey } = await asymmetric.generate();
      const { id } = await actions.auth.user.register.orThrow({
        username,
        publicKey,
      });

      const success = await createSession({ accountId: id, privateKey });
      if (!success) throw new Error("Unable to create initial session");

      return {
        accountId: id,
        privateKey,
      };
    },
    onError: () => {
      prompts.error("Account konnte nicht erstellt werden.");
    },
    onSuccess: (auth) => {
      if (!auth) return;
      // Store private key in localStorage
      storeAccount(auth);
      // Reload page after
      setTimeout(() => {
        window.location.reload();
      }, 0);
    },
  });
  return (
    <button
      class="btn-primary group self-start p-2"
      onClick={createAccountMutation.mutate}
    >
      <i class="ti ti-user-plus group-hover:hidden" />
      <i class="ti ti-plus hidden group-hover:block" />
      <span class="hidden md:block">Account erstellen</span>
      <span class="md:hidden">Neu</span>
    </button>
  );
};

export default CreateAccountBtn;
