import { onCleanup, onMount } from "solid-js";

/**
 * Hook to detect clicks outside of a specific element
 *
 * @param callback Function to call when a click outside occurs
 * @returns A function that should be spread on the element to track
 */
export function createClickOutside(callback: () => void) {
  let element: HTMLElement | null = null;

  /**
   * Handler for click events anywhere in the document
   * Checks if the click was outside the tracked element
   */
  const handleClickOutside = (event: MouseEvent) => {
    // Skip if we haven't registered an element yet
    if (!element) return;

    // Check if the click target is not within our element
    if (event.target instanceof Node && !element.contains(event.target)) {
      callback();
    }
  };

  // Set up the event listener when the component mounts
  onMount(() => {
    document.addEventListener("mousedown", handleClickOutside);

    // Clean up the event listener when the component unmounts
    onCleanup(() => {
      document.removeEventListener("mousedown", handleClickOutside);
    });
  });

  /**
   * Reference function for the element that should be monitored
   * Example usage: <div ref={clickOutsideRef} />
   */
  const clickOutsideRef = (el: HTMLElement) => {
    element = el;
  };

  return clickOutsideRef;
}
