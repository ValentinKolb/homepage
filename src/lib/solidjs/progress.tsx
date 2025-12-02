/**
 * SolidJS Progress Bar Component
 */

import { createSignal, createEffect, Show, type Component } from "solid-js";

export type ProgressBarProps = {
  /** Label text displayed above the progress bar */
  label: string;
  /** Progress percentage (0-100) */
  percent: number;
  /** Hide component completely when progress reaches 100% */
  hideOnComplete?: boolean;
  /** Additional CSS classes */
  class?: string;
};

/**
 * Progress bar component with gradient styling and completion animation
 */
export const ProgressBar: Component<ProgressBarProps> = (props) => {
  // Clamp percent to 0-100
  const clampedPercent = () => Math.max(0, Math.min(100, props.percent));
  
  // Track completion state
  const [isComplete, setIsComplete] = createSignal(false);
  const [shouldHide, setShouldHide] = createSignal(false);
  
  // Handle completion
  createEffect(() => {
    if (clampedPercent() === 100) {
      // Mark as complete after animation
      setTimeout(() => {
        setIsComplete(true);
        
        // Hide entire component if requested
        if (props.hideOnComplete) {
          setTimeout(() => setShouldHide(true), 300);
        }
      }, 500);
    } else {
      setIsComplete(false);
      setShouldHide(false);
    }
  });
  
  // Return null if should be hidden
  return (
    <Show when={!shouldHide()}>
      <div class={`progress-container flex flex-col gap-1 ${props.class || ""}`}>
        {/* Label with optional checkmark */}
        <div class="flex items-center gap-1">
          <span class="progress-label text-xs text-dimmed">
            {props.label}
          </span>
          <Show when={isComplete()}>
            <span class="ti ti-check text-green-500 dark:text-green-400 text-sm" />
          </Show>
        </div>
        
        {/* Progress bar */}
        <Show when={!isComplete()}>
          <div class="progress-bar-wrapper w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <div
              class="progress-bar bg-gradient-to-r from-blue-500 to-green-500 dark:from-blue-400 dark:to-green-400 h-full rounded-full transition-all duration-300 ease-out"
              style={{ width: `${clampedPercent()}%` }}
            />
          </div>
        </Show>
      </div>
    </Show>
  );
};

/**
 * Minimal progress bar without label
 */
export const SimpleProgress: Component<{ percent: number; class?: string }> = (
  props,
) => {
  const clampedPercent = () => Math.max(0, Math.min(100, props.percent));
  
  return (
    <div
      class={`w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden ${
        props.class || ""
      }`}
    >
      <div
        class="bg-gradient-to-r from-blue-500 to-green-500 dark:from-blue-400 dark:to-green-400 h-full rounded-full transition-all duration-300 ease-out"
        style={{ width: `${clampedPercent()}%` }}
      />
    </div>
  );
};