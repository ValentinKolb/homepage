import { prompts } from "@/lib/client/prompt-lib";
import { createSession, retrieveAccount } from "./util";

const AutoLogin = () => {
  const account = retrieveAccount();

  console.log(account);

  if (!account) return null;

  createSession(account)
    .then(() => {
      window.location.reload();
    })
    .catch((error) =>
      prompts.error(`Automatische Anmeldung fehlgeschlagen: ${error}`),
    );

  return (
    <div class="paper text-dimmed p-6 text-xs shadow-green-500">
      <p>
        <span class="mr-1">
          <i class="ti ti-login animate-pulse text-green-500"></i>
        </span>
        Gespeicherte Account Daten erkannt - du wirst automatisch angemeldet ...
      </p>
    </div>
  );
};

export default AutoLogin;
