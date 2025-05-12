import createModal from "@/layouts/components/ui/Modal";
import { createResource, For, Show, createSignal } from "solid-js";
import { db, type Chat } from "../utils/db";
import { fetchModels, ModelDropdown } from "./EditChatModal";

const ACCEPTED_FILE_TYPES =
  ".pdf,.csv,.txt,application/pdf,text/csv,text/plain";

export default function useRAGSettings(chat: Chat) {
  const [response] = createResource(() => chat?.config.url, fetchModels);
  const [fileInputRef, setFileInputRef] = createSignal<HTMLInputElement>();
  const [uploadedFiles, setUploadedFiles] = createSignal<File[]>([]);
  const [isProcessing, setIsProcessing] = createSignal(false);

  const { open, openModal, Modal } = createModal("RAG", true);
  const Button = () => (
    <button
      onClick={openModal}
      class="icon-btn"
      aria-label={`RAG Einstellungen ${open() ? "schließen" : "öffnen"}`}
    >
      <i class={`ti ${open() ? "ti-database-off" : "ti-database"}`} />
    </button>
  );

  const EditRAGModal = () => (
    <Modal>
      <input
        type="file"
        multiple
        ref={setFileInputRef}
        class="hidden"
        accept={ACCEPTED_FILE_TYPES}
        onChange={(e) => {
          if (!e.target.files) return;

          const files = Array.from(e.target.files);
          setUploadedFiles((prev) => [...prev, ...files]);
          console.log("Ausgewählte Dateien:", files);
          // Reset file input to allow selecting the same file again
          e.target.value = "";
        }}
      />
      <div class="flex max-w-[500px] min-w-[30vw] flex-col gap-4 md:max-w-[700px] lg:max-w-[1000px]">
        <div class="paper p-2 text-xs text-green-500 ring-1 ring-green-500">
          Retrieval-Augmented Generation (RAG) bezeichnet ein Verfahren, bei dem
          KI-Sprachmodelle ihre Antworten durch externe Informationsquellen wie
          z.B. Dateien ergänzen, wodurch sie auf aktuelle und spezifische
          Inhalte zugreifen können, die nicht in ihrem Basiswissen enthalten
          sind.
          <br />
          Auch hier werden alle Daten ausschließlich bei dir lokal im Browser
          gespeichert und es werden keine Daten an Server übermittelt.
        </div>

        <Show when={response()?.models.length}>
          <div>
            <label>
              <p class="mb-1 block text-xs font-medium text-gray-500">
                Embedding Model
              </p>
              <p class="mb-1 block text-xs text-gray-400">
                Dieses Modell wird verwendet um die Embeddings für RAG zu
                generieren.
                <br />
                Es wird empfohlen, das Modell nicht zu ändern, wenn du bereits
                Dateien zu diesem Chat hinzugefügt hast.
              </p>
            </label>

            <ModelDropdown
              models={response()?.models || []}
              value={chat?.config.embedding_model}
              onChange={(model) => {
                db.chats.update(chat!.id, {
                  "config.embedding_model": model,
                });
              }}
            />
          </div>
        </Show>

        <div class="mt-4 border-t border-gray-200 pt-4">
          <h3 class="mb-2 text-sm font-medium">Dateien für RAG</h3>
          <p class="mb-4 text-xs text-gray-500">
            Füge PDF, CSV oder Textdateien hinzu, um dein Modell mit
            spezifischem Wissen anzureichern.
          </p>

          <div class="mb-4 flex flex-wrap gap-2">
            <button
              class="btn-primary btn-sm flex items-center gap-1"
              onClick={() => fileInputRef()?.click()}
            >
              <i class="ti ti-database-plus" />
              <span>Dateien hinzufügen</span>
            </button>
          </div>

          <Show when={uploadedFiles().length > 0}>
            <div class="paper p-2">
              <h4 class="mb-2 text-xs font-medium">Hochgeladene Dateien:</h4>
              <ul class="space-y-1 text-xs">
                <For each={uploadedFiles()}>
                  {(file, index) => (
                    <li class="flex items-center justify-between">
                      <div class="flex items-center gap-1 overflow-hidden">
                        <i
                          class={`ti ti-file ${file.type.includes("pdf") ? "text-red-500" : file.type.includes("csv") ? "text-green-500" : "text-blue-500"}`}
                        />
                        <span class="truncate">{file.name}</span>
                        <span class="text-gray-400">
                          ({Math.round(file.size / 1024)} KB)
                        </span>
                      </div>
                      <button
                        class="text-gray-500 hover:text-red-500"
                        onClick={() => {
                          setUploadedFiles((prev) =>
                            prev.filter((_, i) => i !== index()),
                          );
                        }}
                      >
                        <i class="ti ti-x" />
                      </button>
                    </li>
                  )}
                </For>
              </ul>
            </div>
          </Show>
        </div>
      </div>
    </Modal>
  );

  // Process the uploaded files for RAG
  const processFiles = async () => {
    if (uploadedFiles().length === 0 || !chat?.config.embedding_model) return;

    setIsProcessing(true);

    try {
      for (const file of uploadedFiles()) {
        try {
          // Read file content
          const content = await readFileContent(file);

          // Here you would add code to process the file with the embedding model
          // and store the results in your database
          console.log(`Processing file: ${file.name}`);

          // Simulate processing time
          await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`Error processing file ${file.name}:`, error);
        }
      }
    } catch (error) {
      console.error("Error processing files:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Read file content based on type
  const readFileContent = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        if (event.target?.result) {
          resolve(event.target.result as string);
        } else {
          reject(new Error("Konnte Dateiinhalt nicht lesen."));
        }
      };

      reader.onerror = () => {
        reject(new Error("Fehler beim Lesen der Datei."));
      };

      if (file.type.includes("text") || file.type.includes("csv")) {
        reader.readAsText(file);
      } else if (file.type.includes("pdf")) {
        // For PDF, we'd need a PDF parser library in a real implementation
        reader.readAsText(file);
      } else {
        reader.readAsText(file);
      }
    });
  };

  return {
    ToggleRAGModalButton: Button,
    EditRAGModal,
    openEditModal: openModal,
    uploadedFiles,
  };
}
