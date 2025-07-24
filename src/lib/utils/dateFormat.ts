import { format } from "date-fns";

const dateFormat = (
  date: Date | string,
  pattern: string = "dd MMM, yyyy",
): string => {
  const dateObj = new Date(date);
  const output = format(dateObj, pattern);
  return output;
};

const dateTimeFormat = (
  date: Date | string,
  pattern: string = "dd MMM, yyyy HH:mm",
): string => {
  const dateObj = new Date(date);
  const output = format(dateObj, pattern);
  return output;
};

const timeFormat = (date: Date | string, pattern: string = "HH:mm"): string => {
  const dateObj = new Date(date);
  const output = format(dateObj, pattern);
  return output;
};

export { dateFormat, dateTimeFormat, timeFormat };
