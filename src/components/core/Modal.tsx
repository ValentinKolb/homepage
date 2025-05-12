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
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/90"
            onClick={handleOverlayClick}
            aria-label={`Modal ${title || ""}`}
          >
            <div class="m-2 flex max-h-[90vh] flex-col overflow-hidden rounded-lg bg-white shadow-md dark:bg-black dark:shadow-none dark:ring dark:ring-white dark:ring-inset">
              {title && (
                <div class="flex items-center justify-between border-b border-gray-100 p-4 dark:border-gray-500">
                  <h2 class="text-xl font-bold">{title}</h2>
                  <button
                    onClick={closeModal}
                    class="icon-btn"
                    aria-label={`Modal ${title || ""} schließen`}
                  >
                    <i class="ti ti-x" />
                  </button>
                </div>
              )}
              {/* scrollable modal content */}
              <div class="no-scrollbar flex-1 overflow-x-hidden overflow-y-auto p-4">
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
