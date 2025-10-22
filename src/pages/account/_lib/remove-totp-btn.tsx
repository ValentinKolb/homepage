import { prompts } from "@/lib/client/prompt-lib";
import { createMutation } from "@/lib/solidjs/mutation";
import { actions } from "astro:actions";

const RemoveTOTPBtn = ({
  label,
  totpId,
}: {
  label: string;
  totpId: string;
}) => {
  const removeMutation = createMutation({
    mutation: async () => {
      const confirmed = await prompts.confirm(
        `Bist du sicher, dass du den TOTP-Code ${label} entfernen möchtest?`,
      );
      if (!confirmed) return;

      await actions.auth.totp.delete.orThrow({ totpId });
    },
    onError: async () => {
      await prompts.error("Der TOTP-Code konnte nicht gelöscht werden.");
    },
    onSuccess: async () => window.location.reload(),
  });

  return (
    <button onClick={removeMutation.mutate}>
      <i class="ti ti-trash text-dimmed hover:text-red-500" />
    </button>
  );
};

export default RemoveTOTPBtn;
