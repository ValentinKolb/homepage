import { Portal } from "solid-js/web";
import { createSignal, Show, type ParentProps } from "solid-js";

/**
 * createModal returns an object with:
 * - openModal: a function to open the modal.
 * - closeModal: a function to close the modal.
 * - Modal: a component that renders the modal content.
 *
 * If a title is provided, the modal will display a header with the title and a close button.
 *
 * @param title Optional title to display in the modal header.
 */
export default function createModal(title?: string, defaultOpen = false) {
  const [open, setOpen] = createSignal(defaultOpen);

  const openModal = () => setOpen(true);
  const closeModal = () => setOpen(false);

  const Modal = (props: ParentProps) => {
    // Schließe das Modal, wenn auf den Overlay-Bereich geklickt wird.
    const handleOverlayClick = (e: MouseEvent) => {
      if (e.target === e.currentTarget) {
        closeModal();
      }
    };

    return (
      <Portal>
        <Show when={open()}>
          <div
            class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            onClick={handleOverlayClick}
            aria-label={`Modal ${title || ""}`}
          >
            <div class="m-2 flex max-h-[90vh] flex-col overflow-hidden rounded-lg bg-white shadow-lg">
              {title && (
                <div class="flex items-center justify-between border-b p-4">
                  <h2 class="text-xl font-bold">{title}</h2>
                  <button
                    onClick={closeModal}
                    class="flex h-8 w-8 items-center justify-center rounded p-4 hover:bg-gray-200"
                    aria-label={`Modal ${title || ""} schließen`}
                  >
                    <i class="ti ti-x" />
                  </button>
                </div>
              )}
              {/* scrollable modal content */}
              <div class="no-scrollbar flex-1 overflow-y-auto overflow-x-hidden p-4">
                {props.children}
              </div>
            </div>
          </div>
        </Show>
      </Portal>
    );
  };

  return { open, openModal, closeModal, Modal };
}
