/**
 * Kit Date Helpers
 *
 * Simple helpers that return Day.js instances for full flexibility
 */

import dayjs, { Dayjs } from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import relativeTime from "dayjs/plugin/relativeTime";
import isBetween from "dayjs/plugin/isBetween";
import weekOfYear from "dayjs/plugin/weekOfYear";
import dayOfYear from "dayjs/plugin/dayOfYear";
import quarterOfYear from "dayjs/plugin/quarterOfYear";
import duration from "dayjs/plugin/duration";
import "dayjs/locale/de";
import "dayjs/locale/en";
import "dayjs/locale/fr";

// ==========================
// Plugin Configuration
// ==========================

dayjs.extend(customParseFormat);
dayjs.extend(relativeTime);
dayjs.extend(isBetween);
dayjs.extend(weekOfYear);
dayjs.extend(dayOfYear);
dayjs.extend(quarterOfYear);
dayjs.extend(duration);

// default locale
dayjs.locale("de");

// ==========================
// Kit Date Helpers
// ==========================

const isoDate = /^\d{4}-\d{2}-\d{2}$/;
const isoDateTime = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2})?(\.\d{3})?Z?$/;

const kitDate = {
  /**
   * Create new Day.js instance from ISO format only
   * @param input ISO date string, Date object, or timestamp
   * @returns Day.js instance
   */
  new: (input?: string | Date | number | Dayjs): Dayjs => {
    // Handle null/undefined
    if (!input) return dayjs();

    // Handle Day.js instances
    if (dayjs.isDayjs(input)) return input.clone();

    // Handle Date objects
    if (input instanceof Date) return dayjs(input);

    // Handle Unix timestamps
    if (typeof input === "number") return dayjs(input);

    // Handle ISO strings only
    if (typeof input === "string") {
      const trimmed = input.trim();

      // ISO date patterns
      if (isoDate.test(trimmed) || isoDateTime.test(trimmed)) {
        const parsed = dayjs(trimmed);
        if (parsed.isValid()) return parsed;
      }

      // Error with help
      console.error(
        `[KitDate] Invalid date format: "${input}"\n` +
          `Expected ISO format:\n` +
          `  - Date only: YYYY-MM-DD (e.g., "2024-03-15")\n` +
          `  - Date & time: YYYY-MM-DD HH:mm:ss (e.g., "2024-03-15 14:30:00")\n` +
          `  - With T separator: YYYY-MM-DDTHH:mm:ss (e.g., "2024-03-15T14:30:00")\n` +
          `  - With timezone: YYYY-MM-DDTHH:mm:ssZ (e.g., "2024-03-15T14:30:00Z")`,
      );

      return dayjs(); // Return current date as fallback
    }

    // Fallback to current date
    return dayjs();
  },

  /**
   * Get current date/time
   * @returns Day.js instance
   */
  now: (): Dayjs => dayjs(),

  /**
   * Get today at midnight
   * @returns Day.js instance
   */
  today: (): Dayjs => dayjs().startOf("day"),

  /**
   * Create from Unix timestamp (seconds)
   * @param timestamp Unix timestamp in seconds
   * @returns Day.js instance
   */
  unix: (timestamp: number): Dayjs => dayjs.unix(timestamp),

  /**
   * Set or get global locale
   * @param locale Locale code (e.g., "de", "en")
   * @returns Current locale if no parameter given
   */
  locale: (locale?: string): string => dayjs.locale(locale),

  /**
   * Check if string is valid ISO format
   * @param input String to check
   * @returns true if valid ISO format
   */
  isValidISO(input: string): boolean {
    const trimmed = input.trim();
    return (
      (isoDate.test(trimmed) || isoDateTime.test(trimmed)) &&
      dayjs(trimmed).isValid()
    );
  },

  /**
   * Format Day.js instance for SQL
   * @param date Day.js instance
   * @returns SQL formatted datetime string
   */
  toSQL: (date: Dayjs): string => date.format("YYYY-MM-DD HH:mm:ss"),

  /**
   * Create a duration
   * @param value Duration value
   * @param unit Duration unit
   * @returns Day.js Duration
   */
  duration: (value: number, unit?: any) => dayjs.duration(value, unit),
};

// ==========================
// Export
// ==========================

export const createDateAPI = () => kitDate;

// Re-export Day.js type for convenience
export type { Dayjs };
