import { slug } from "github-slugger";
import { marked } from "marked";

/**
 * Convert a string to a URL-friendly slug
 * @param content - The string to slugify
 * @returns URL-safe slug (lowercase, hyphenated)
 * @example slugify("Hello World!") // "hello-world"
 */
export const slugify = (content: string): string => {
  return slug(content);
};

/**
 * Convert a string to human-readable format
 * Removes underscores, hyphens, and extra spaces, capitalizes first letter
 * @param content - The string to humanize
 * @returns Human-readable string
 * @example humanize("hello_world-foo") // "Hello world foo"
 */
export const humanize = (content: string): string => {
  return content
    .replace(/^[\s_]+|[\s_]+$/g, "")
    .replace(/[_\s]+/g, " ")
    .replace(/[-\s]+/g, " ")
    .replace(/^[a-z]/, function (m) {
      return m.toUpperCase();
    });
};

/**
 * Convert a string to title case
 * Capitalizes the first letter of each word
 * @param content - The string to convert to title case
 * @returns Title-cased string
 * @example titleify("hello world foo") // "Hello World Foo"
 */
export const titleify = (content: string): string => {
  const humanized = humanize(content);
  return humanized
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

/**
 * Convert markdown to plain text
 * Removes all markdown syntax and HTML tags
 * @param content - Markdown string to convert
 * @returns Plain text without formatting
 * @example plainify("**Hello** _world_") // "Hello world"
 */
export const plainify = (content: string): string => {
  const parseMarkdown: any = marked.parse(content);
  const filterBrackets = parseMarkdown.replace(/<\/?[^>]+(>|$)/gm, "");
  const filterSpaces = filterBrackets.replace(/[\r\n]\s*[\r\n]/gm, "");
  const stripHTML = htmlEntityDecoder(filterSpaces);
  return stripHTML;
};

/**
 * Decode HTML entities to their character equivalents
 * @param htmlWithEntities - HTML string with encoded entities
 * @returns String with decoded entities
 */
const htmlEntityDecoder = (htmlWithEntities: string): string => {
  const entityList: { [key: string]: string } = {
    "&nbsp;": " ",
    "&lt;": "<",
    "&gt;": ">",
    "&amp;": "&",
    "&quot;": '"',
    "&#39;": "'",
  };
  const htmlWithoutEntities: string = htmlWithEntities.replace(
    /(&amp;|&lt;|&gt;|&quot;|&#39;)/g,
    (entity: string): string => {
      return entityList[entity];
    },
  );
  return htmlWithoutEntities;
};

/**
 * Pretty print bytes in human readable format
 * @param bytes - Number of bytes
 * @returns Human readable string (e.g., "1.2 MB", "512 KB")
 */
export const pprintBytes = (bytes: number): string => {
  if (bytes === 0) return "0 bytes";

  const units = ["bytes", "KB", "MB", "GB", "TB"];
  const base = 1024;

  const exponent = Math.floor(Math.log(bytes) / Math.log(base));
  const unit = units[Math.min(exponent, units.length - 1)];

  if (exponent === 0) {
    return `${bytes} ${unit}`;
  }

  const value = bytes / Math.pow(base, exponent);

  // Show appropriate decimal places
  const decimals = value >= 100 ? 0 : value >= 10 ? 1 : 2;

  return `${value.toFixed(decimals)} ${unit}`;
};
