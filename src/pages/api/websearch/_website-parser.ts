import * as cheerio from "cheerio";
import { Readability } from "@paoramen/cheer-reader";

/**
 * This function extracts the main content and a title from an HTML string
 */
export function extractWebsiteContent(html: string): {
  title: string | null;
  content: string;
} {
  const $ = cheerio.load(html);

  // first try to use the Readability library
  const article = new Readability($).parse();
  if (article.textContent) {
    // remove multiple whitespace characters
    article.textContent = article.textContent.replace(/\s+/g, " ");

    return {
      title: article.title,
      content: article.textContent,
    };
  }

  // if Readability fails, use a custom approach
  const title = extractTitle($);
  removeNonContentElements($);
  const content = extractMainContent($);

  return { title, content };
}

/**
 * This function extracts the title of a page
 */
function extractTitle($: cheerio.CheerioAPI): string | null {
  // Try meta tags first
  const metaTitle =
    $('meta[property="og:title"]').attr("content") ||
    $('meta[name="twitter:title"]').attr("content");
  if (metaTitle) return metaTitle.trim();

  // Then try the title tag
  const titleTag = $("title").text().trim();
  if (titleTag) return titleTag;

  // Finally try the first h1
  const h1 = $("h1").first().text().trim();
  if (h1) return h1;

  return null;
}

/**
 * This function removes elements that are definitely not part of the content
 */
function removeNonContentElements($: cheerio.CheerioAPI): void {
  // Minimal removal - only obvious non-content elements
  $("script, style, meta, link, noscript, iframe").remove();

  // Only remove navigation and footer if they're clearly labeled
  $("nav, [role='navigation'], footer, [role='contentinfo']").remove();

  // Only remove ads, not potential content
  $(".ads, .ad, .advertisement, [id^='ad-'], [class*='-ad-']").remove();

  // Remove comments sections
  $(".comments, #comments, .comment-section").remove();

  // Remove hidden elements
  $(
    "[style*='display: none'], [style*='visibility: hidden'], [hidden]",
  ).remove();
}

/**
 * This function extracts the main content from a page
 */
function extractMainContent($: cheerio.CheerioAPI): string {
  // Try to find the main content container
  const mainContainer = findMainContentContainer($);

  // Get text content with basic formatting
  let content = "";

  // Process paragraphs
  mainContainer.find("p").each((_, p) => {
    const text = $(p).text().trim();
    if (text) {
      content += text + "\n\n";
    }
  });

  // Process headings and their following content
  mainContainer.find("h1, h2, h3, h4, h5, h6").each((_, heading) => {
    const headingText = $(heading).text().trim();
    if (headingText) {
      content += headingText + "\n\n";
    }
  });

  // Process lists
  mainContainer.find("ul, ol").each((_, list) => {
    $(list)
      .find("li")
      .each((_, li) => {
        const text = $(li).text().trim();
        if (text) {
          content += "• " + text + "\n";
        }
      });
    content += "\n";
  });

  // Process tables
  mainContainer.find("table").each((_, table) => {
    const tableText = $(table).text().trim().replace(/\s+/g, " ");
    if (tableText) {
      content += tableText + "\n\n";
    }
  });

  // If we still don't have much content, just take all text
  if (content.length < 100) {
    content = mainContainer.text().trim();
    // Basic cleanup
    content = content.replace(/\s+/g, " ");
    // Add some paragraph breaks for readability
    content = content.replace(/\. /g, ".\n\n");
  }

  return cleanContent(content);
}

/**
 * Finds the main content container using a simple heuristic approach
 */
function findMainContentContainer($: cheerio.CheerioAPI): cheerio.Cheerio<any> {
  // Try common content containers first
  const commonSelectors = [
    "main",
    "article",
    "#content",
    "#main-content",
    ".content",
    "article",
    ".entry-content",
    ".post-content",
    ".article-body",
    ".mw-content-text",
    ".mw-parser-output", // For Wikipedia
    "#bodyContent", // Also for Wikipedia
  ];

  for (const selector of commonSelectors) {
    const element = $(selector);
    if (element.length) {
      return element;
    }
  }

  // If no common container was found, just return the body
  return $("body");
}

/**
 * Clean up the content for consumption
 */
function cleanContent(content: string): string {
  return (
    content
      // Remove excess whitespace
      .replace(/\s+/g, " ")
      // Fix paragraph breaks
      .replace(/ \n/g, "\n")
      // Remove duplicate line breaks
      .replace(/\n{3,}/g, "\n\n")
      // Remove any remaining HTML tags
      .replace(/<[^>]*>/g, "")
      // Trim whitespace
      .trim()
  );
}
