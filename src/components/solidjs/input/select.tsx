import { createSignal, createMemo, Show, For, onCleanup } from "solid-js";

type SelectOption =
  | string
  | { id: string; label: string; description?: string; icon?: string };

type SelectInputProps = {
  label?: string;
  description?: string;
  placeholder?: string;
  icon?: string;
  activeIcon?: string;
  value?: () => string | undefined;
  onChange?: (value: string) => void;
  error?: () => string | undefined;
  options: SelectOption[];
};

const SelectInput = (props: SelectInputProps) => {
  const {
    label,
    description,
    placeholder = "Auswählen...",
    icon = "ti ti-chevron-down",
    activeIcon = "ti ti-chevron-up",
    value,
    onChange,
    error,
  } = props;

  const options = props.options.map((o) =>
    typeof o === "object" ? o : { id: o, label: o },
  );

  // State management - reduziert!
  const [isOpen, setIsOpen] = createSignal(false);
  const [focusedIndex, setFocusedIndex] = createSignal(-1);

  let containerRef: HTMLDivElement | undefined;
  let triggerRef: HTMLDivElement | undefined;
  let dialogRef: HTMLDialogElement | undefined;
  let optionRefs: HTMLDivElement[] = [];

  // Get selected option
  const selectedOption = createMemo(() =>
    options.find((opt) => opt.id === value?.()),
  );

  // Focus management mit auto-scroll!
  const focusOption = (index: number) => {
    setFocusedIndex(index);
    if (optionRefs[index]) {
      optionRefs[index].scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  };

  const navigateOptions = (direction: "next" | "previous") => {
    const count = options.length;
    if (!count) return;

    let newIndex = focusedIndex();
    if (direction === "next") {
      newIndex = newIndex < count - 1 ? newIndex + 1 : 0;
    } else {
      newIndex = newIndex > 0 ? newIndex - 1 : count - 1;
    }

    focusOption(newIndex);
  };

  // Event handlers - vereinfacht
  const toggleDropdown = (open: boolean) => {
    setIsOpen(open);

    if (open) {
      // Find current value index or default to first
      const currentIndex = options.findIndex((opt) => opt.id === value?.());
      setFocusedIndex(currentIndex >= 0 ? currentIndex : 0);

      // Position and show dialog
      if (dialogRef && triggerRef) {
        const rect = triggerRef.getBoundingClientRect();
        dialogRef.style.top = `${rect.bottom + 8}px`;
        dialogRef.style.left = `${rect.left}px`;
        dialogRef.style.width = `${rect.width}px`;
        dialogRef.showModal();
      }
    } else {
      dialogRef?.close();
      setFocusedIndex(-1);
    }
  };

  const selectOption = (option: any) => {
    onChange?.(option.id);
    toggleDropdown(false);
    triggerRef?.focus(); // Fokus zurück zum Trigger
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    const open = isOpen();

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!open) {
          toggleDropdown(true);
        } else {
          navigateOptions("next");
        }
        break;

      case "ArrowUp":
        e.preventDefault();
        if (open) {
          navigateOptions("previous");
        }
        break;

      case "Enter":
      case " ":
        e.preventDefault();
        if (open && focusedIndex() >= 0) {
          selectOption(options[focusedIndex()]);
        } else if (!open) {
          toggleDropdown(true);
        }
        break;

      case "Escape":
        if (open) {
          e.preventDefault();
          toggleDropdown(false);
        }
        break;

      case "Tab":
        if (open) {
          toggleDropdown(false);
        }
        break;
    }
  };

  // Dialog click-outside handler
  const handleDialogClick = (e: MouseEvent) => {
    if (e.target === dialogRef) {
      toggleDropdown(false);
    }
  };

  // Cleanup
  onCleanup(() => dialogRef?.close());

  return (
    <div class="flex flex-col gap-2">
      <Show when={label || description}>
        <label for="select-input">
          <Show when={label}>
            <p class="mb-1 block text-xs font-medium">{label}</p>
          </Show>
          <Show when={description}>
            <p class="text-dimmed block text-xs">{description}</p>
          </Show>
        </label>
      </Show>

      <div ref={containerRef} class="relative">
        <div class="group relative flex-1">
          <div class="pointer-events-none absolute inset-y-0 left-3 z-10 flex items-center text-gray-500">
            <i
              class={`${
                selectedOption()?.icon || (isOpen() ? activeIcon : icon)
              } ${isOpen() ? "text-blue-500" : ""}`}
            />
          </div>

          <div
            ref={triggerRef}
            id="select-input"
            class={`input-subtle w-full cursor-pointer p-2 pr-8 pl-9 focus:ring-2 focus:ring-blue-500 focus:outline-none ${
              isOpen() ? "ring-2 ring-blue-500" : ""
            }`}
            onClick={() => toggleDropdown(!isOpen())}
            onKeyDown={handleKeyDown}
            tabIndex={0}
            role="combobox"
            aria-expanded={isOpen()}
            aria-haspopup="listbox"
            aria-label={label || "Select an option"}
          >
            <Show
              when={selectedOption()}
              fallback={
                <span class="text-gray-400 dark:text-gray-500">
                  {placeholder}
                </span>
              }
            >
              <span class="text-gray-700 dark:text-gray-300">
                {selectedOption()!.label}
              </span>
            </Show>
          </div>
        </div>

        <dialog
          ref={dialogRef}
          class="dark:bg-dark rounded-lg bg-white p-1 ring-2 ring-gray-200 backdrop:bg-transparent dark:ring-gray-700"
          onKeyDown={handleKeyDown}
          onClick={handleDialogClick}
        >
          <div
            class="scrollbar flex max-h-60 flex-col gap-1 overflow-y-auto rounded-lg"
            role="listbox"
            aria-label={label || "Options"}
          >
            <For
              each={options}
              fallback={
                <div class="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                  Keine Optionen verfügbar
                </div>
              }
            >
              {(option, index) => {
                const isSelected = () => option.id === value?.();
                const isFocused = () => index() === focusedIndex();

                return (
                  <div
                    ref={(el) => (optionRefs[index()] = el)}
                    class={`flex cursor-pointer items-center rounded px-3 py-2 text-sm transition-colors select-none ${
                      isFocused()
                        ? "bg-gray-100 dark:bg-gray-800"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    }`}
                    onClick={() => selectOption(option)}
                    onMouseEnter={() => setFocusedIndex(index())}
                    role="option"
                    aria-label={option.label}
                    aria-selected={isSelected()}
                  >
                    <Show when={option.icon}>
                      <i class={`${option.icon} mr-3 text-gray-500`} />
                    </Show>

                    <div class="min-w-0 flex-1">
                      <span class="truncate text-gray-700 dark:text-gray-300">
                        {option.label}
                      </span>
                      <Show when={option.description}>
                        <div class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                          {option.description}
                        </div>
                      </Show>
                    </div>
                  </div>
                );
              }}
            </For>
          </div>
        </dialog>
      </div>

      {error?.() && <p class="text-sm text-red-500">{error()}</p>}
    </div>
  );
};

export default SelectInput;
