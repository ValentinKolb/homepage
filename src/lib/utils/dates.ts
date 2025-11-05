import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/de";

/**
 * Format a date to a string pattern
 * @param date - Date object or string to format
 * @param pattern - dayjs format pattern (default: "DD.MM.YYYY")
 * @returns Formatted date string
 */
const dateFormat = (
  date: Date | string,
  pattern: string = "DD.MM.YYYY",
): string => {
  return dayjs(date).format(pattern);
};

/**
 * Format a date with time to a string pattern
 * @param date - Date object or string to format
 * @param pattern - dayjs format pattern (default: "HH:mm • DD.MM.YYYY")
 * @returns Formatted date-time string
 */
const dateTimeFormat = (
  date: Date | string | Dayjs,
  pattern: string = "HH:mm • DD.MM.YYYY",
): string => {
  return dayjs(date).format(pattern);
};

/**
 * Format only the time portion of a date
 * @param date - Date object or string to format
 * @param pattern - dayjs format pattern (default: "HH:mm")
 * @returns Formatted time string
 */
const timeFormat = (date: Date | string, pattern: string = "HH:mm"): string => {
  return dayjs(date).format(pattern);
};

export { dateFormat, dateTimeFormat, timeFormat };
