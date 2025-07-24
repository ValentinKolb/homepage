/**
 * Returns a random gender-neutral name.
 */
export function getRandomName(): string {
  const names = [
    "Alex",
    "Sam",
    "Jordan",
    "Taylor",
    "Morgan",
    "Casey",
    "Riley",
    "Avery",
    "Quinn",
    "Parker",
  ];

  return names[Math.floor(Math.random() * names.length)];
}

/**
 * Returns a random Tailwind text color class.
 */
export function getRandomTextColor(): string {
  const colors = [
    "text-red-500",
    "text-blue-500",
    "text-green-500",
    "text-yellow-500",
    "text-purple-500",
    "text-pink-500",
    "text-indigo-500",
    "text-orange-500",
    "text-teal-500",
    "text-cyan-500",
    "text-emerald-500",
    "text-violet-500",
  ];

  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Adds random jitter to a number within a specified range.
 *
 * @param value - The base value to add jitter to
 * @param range - The +/- range for jitter (e.g., range of 5 gives -5 to +5)
 * @returns The value with random jitter applied
 *
 * @example
 * ```ts
 * jitter(100, 10); // Returns a number between 90 and 110
 * jitter(50, 5);   // Returns a number between 45 and 55
 * ```
 */
export function jitter(value: number, range: number): number {
  const randomOffset = (Math.random() - 0.5) * 2 * range;
  return value + randomOffset;
}
