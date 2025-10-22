import { type Component } from "solid-js";

interface SwitchProps {
  id?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  label?: string;
  disabled?: boolean;
}

const Switch: Component<SwitchProps> = (props) => {
  const toggle = () => {
    if (!props.disabled) {
      props.onChange(!props.value);
    }
  };

  return (
    <div class="my-1 flex flex-row items-center gap-2">
      <button
        id={props.id}
        type="button"
        onClick={toggle}
        class={`relative inline-flex h-3 w-10 items-center rounded-full focus:ring-0 focus:outline-none ${
          props.value ? "bg-green-600" : "bg-gray-200 dark:bg-gray-500"
        } ${props.disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
        role="switch"
        aria-checked={props.value}
        disabled={props.disabled}
      >
        <span class="sr-only">{props.label || "Toggle"}</span>
        <span
          class={`${
            props.value
              ? "translate-x-6 text-green-600 ring-2 ring-green-600"
              : "translate-x-0 text-gray-300 ring-2 ring-gray-300 dark:ring-gray-600"
          } flex h-4 w-4 transform items-center justify-center rounded-full bg-white transition-transform duration-200 ease-in-out`}
        >
          <i class={`ti ${props.value ? "ti-check" : ""} text-xs`} />
        </span>
      </button>

      <span
        class={`${props.value ? "text-green-600" : "text-gray-500 dark:text-gray-400"} text-xs`}
      >
        {props.label
          ? props.label + (props.value ? " aktiviert" : " deaktiviert")
          : props.value
            ? "Aktiviert"
            : "Deaktiviert"}
      </span>
    </div>
  );
};

export default Switch;
