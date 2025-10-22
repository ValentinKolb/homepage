import { prompts } from "@/lib/client/prompt-lib";
import { createMutation } from "@/lib/solidjs/mutation";
import { importCredentials, createSession, storeAccount } from "./util";

const ImportAccountBtn = () => {
  const importAccountMutation = createMutation({
    mutation: async () => {
      const creds = await prompts.prompt(
        "Füge hier deinen gespeicherten Schlüssel ein. Du findest ihn in deinen gesicherten Zugangsdaten oder auf einem anderen angemeldeten Gerät.",
        "",
        {
          title: "Mit Schlüssel anmelden",
          icon: "ti ti-key",
        },
      );
      if (!creds) return;

      // Parse and validate key
      const { accountId, privateKey } = importCredentials(creds);

      // Try to create session
      const success = await createSession({ accountId, privateKey });
      if (!success) throw new Error("Unable to create session");

      return { accountId, privateKey };
    },
    onError: () => {
      prompts.error("Account konnte nicht importiert werden.");
    },
    onSuccess: (auth) => {
      if (!auth) return;
      // Store private key in settings!
      storeAccount(auth);
      // Reload page after
      setTimeout(() => {
        window.location.reload();
      }, 0);
    },
  });

  return (
    <button
      class="btn-subtle group self-start p-2 hover:text-green-500"
      onClick={importAccountMutation.mutate}
    >
      <i class="ti ti-key group-hover:hidden" />
      <i class="ti ti-login hidden group-hover:block" />
      <span class="hidden md:block">Mit Schlüssel anmelden</span>
      <span class="md:hidden">Anmelden</span>
    </button>
  );
};

export default ImportAccountBtn;
