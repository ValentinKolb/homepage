import Tooltip from "@/components/solidjs/Tooltip";
import { exportCredentials, retrieveAccount } from "./util";
import CopyButton from "@/components/solidjs/CopyButton";
import { prompts } from "@/lib/client/prompt-lib";
import { downloadFileFromContent } from "@/lib/client/files";

const truncateId = (id: string, start = 4, end = 4) => {
  if (id.length <= start + end) return id;
  return `${id.slice(0, start)}...${id.slice(-end)}`;
};

const CopyAccountInfo = () => {
  const account = retrieveAccount();

  if (!account)
    return (
      <div class="paper text-dimmed p-6 text-xs shadow-red-500">
        <p>
          <span class="mr-1">
            <i class="ti ti-mood-sad text-red-500"></i>
          </span>
          Es wurden keine localen Account Daten gefunden.
        </p>
      </div>
    );

  return (
    <div class="space-y-3">
      <div class="flex flex-row flex-wrap items-center gap-2 font-mono text-xs sm:text-sm">
        <i class="ti text-dimmed ti-hash"></i>
        <h4 class="inline font-bold">
          <span class="hidden sm:inline-block">Account-</span>ID:
        </h4>
        <code class="text-gray-600 dark:text-gray-400">
          {account.accountId}
        </code>
        <Tooltip label="Kopieren">
          <CopyButton>
            {({ copy, wasCopied }) => (
              <button
                class={`ti text-xs text-blue-400 hover:text-blue-500 dark:text-gray-500 ${wasCopied() ? "ti-copy-check text-green-500" : "ti-copy"}`}
                aria-label="Account-ID kopieren"
                onClick={async () => await copy(account.accountId)}
              />
            )}
          </CopyButton>
        </Tooltip>

        <Tooltip label="Die ID kannst du mit anderen Teilen teilen, damit Sie sich im System finden können.">
          <i class="ti ti-info-circle text-dimmed"></i>
        </Tooltip>
      </div>

      <div class="flex flex-row flex-wrap items-center gap-2 font-mono text-xs sm:text-sm">
        <i class="ti text-dimmed ti-key"></i>
        <h4 class="inline font-bold">
          <span class="hidden sm:inline-block">Backup-</span>
          Schlüssel:
        </h4>
        <code class="text-gray-300 dark:text-gray-600">
          {truncateId(exportCredentials(account))}
        </code>
        <Tooltip label="Kopieren">
          <CopyButton>
            {({ copy, wasCopied }) => (
              <button
                class={`ti text-xs text-blue-400 hover:text-blue-500 dark:text-gray-500 ${wasCopied() ? "ti-copy-check text-green-500" : "ti-copy"}`}
                aria-label="Backup-Schlüssel kopieren"
                onClick={async () =>
                  await copy(exportCredentials(account)).then(() =>
                    prompts.alert(
                      "Speichere den Schlüssel sicher (z.B. in einem Passwortmanager) und teile ihn mit niemandem.",
                      {
                        title: "Backup-Schlüssel kopiert",
                        icon: "ti ti-check",
                      },
                    ),
                  )
                }
              />
            )}
          </CopyButton>
        </Tooltip>

        <Tooltip label="Als Datei herunterladen">
          <button
            class="ti ti-download text-xs text-blue-400 hover:text-blue-500 dark:text-gray-500"
            aria-label="Backup-Schlüssel herunterladen"
            onClick={() => {
              const content = exportCredentials(account);
              if (content) {
                downloadFileFromContent(content, "account-backup.txt");
              } else {
                prompts.error("Es ist ein Fehler aufgetreten.");
              }
            }}
          ></button>
        </Tooltip>
      </div>

      <p class="text-dimmed border-t border-gray-200 pt-2 text-xs dark:border-gray-500">
        <i class="ti ti-info-triangle mr-1 self-baseline text-orange-500"></i>{" "}
        Bewahre deinen Account Schlüssel sicher auf! Mit ihm kannst du dich auf
        anderen Geräten einloggen.
      </p>
    </div>
  );
};

export default CopyAccountInfo;
