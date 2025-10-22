import { prompts } from "@/lib/client/prompt-lib";
import { createMutation } from "@/lib/solidjs/mutation";
import { actions } from "astro:actions";
import { retrieveAccount } from "./util";
import { asymmetric } from "@/lib/utils/crypto";
import { generate } from "lean-qr/nano";
import { toSvgDataURL } from "lean-qr/extras/svg";
import { createEffect, createSignal } from "solid-js";
import PinInput from "@/components/solidjs/input/pin";

const AddTotpBtn = () => {
  const disconnectMutation = createMutation({
    mutation: async () => {
      const label = await prompts.prompt(
        "Bitte gebe eine Bezeichnung für den Code ein.",
        "",
        {
          title: "TOTP Code hinzufügen",
          icon: "ti ti-lock-plus",
        },
      );
      if (!label) return;

      const { encryptedUri, id: totpId } =
        await actions.auth.totp.create.orThrow({
          label,
        });

      const account = retrieveAccount();
      if (!account) throw new Error("No local account found");

      const uri = await asymmetric.decrypt({
        payload: encryptedUri,
        privateKey: account.privateKey,
      });

      const svg = toSvgDataURL(generate(uri), {
        on: "black",
        off: "white",
      });

      const firstTotp = await prompts.dialog<string>((close) => {
        const [pin, setPin] = createSignal("");
        createEffect(() => pin().length === 6 && close(pin()));
        return (
          <div class="flex flex-col items-center gap-6 p-2">
            <img
              class="aspect-square h-auto w-full overflow-hidden rounded ring-2 ring-green-500 dark:ring-0"
              src={svg}
              alt="TOTP QR Code"
            />

            <p class="text-dimmed text-center text-xs md:text-sm">
              Bitte scanne den Code mit einer Authenticator-App und gebe dann
              den Code ein, der angezeigt wird.
            </p>

            <PinInput value={pin} onChange={setPin} />
          </div>
        );
      });

      const { valid } = firstTotp
        ? await actions.auth.totp.validate.orThrow({
            totpId,
            token: firstTotp,
          })
        : { valid: false };

      if (!valid) {
        await actions.auth.totp.delete.orThrow({ totpId });
        await prompts.error("Invalider Pin. Bitte versuche es erneut.");
      } else {
        window.location.reload();
      }
    },
    onError: () => {
      prompts.error("Der TOTP Code konnte nicht hinzugefügt werden.");
    },
  });

  return (
    <button
      class="btn-subtle group self-start p-2 hover:text-blue-500"
      onClick={disconnectMutation.mutate}
    >
      <i class="ti ti-lock-plus group-hover:hidden"></i>
      <i class="ti ti-plus hidden group-hover:block"></i>
      <span>TOTP Code hinzufügen</span>
    </button>
  );
};

export default AddTotpBtn;
