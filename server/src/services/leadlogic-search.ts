import * as cheerio from "cheerio";

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export interface ExtractedPage {
  url: string;
  title: string;
  textContent: string;
}

/**
 * Search businesses using DuckDuckGo HTML (no API key required).
 */
export async function searchBusinesses(
  query: string,
  maxResults: number = 10,
): Promise<SearchResult[]> {
  const params = new URLSearchParams({ q: query });
  const response = await fetch(`https://html.duckduckgo.com/html/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
    body: params.toString(),
  });

  if (!response.ok) {
    throw new Error(`DuckDuckGo search failed: ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const results: SearchResult[] = [];

  $(".result").each((_i, el) => {
    if (results.length >= maxResults) return false;

    const anchorEl = $(el).find(".result__a");
    const snippetEl = $(el).find(".result__snippet");

    const title = anchorEl.text().trim();
    const rawHref = anchorEl.attr("href") || "";
    const snippet = snippetEl.text().trim();

    // DuckDuckGo wraps URLs in a redirect; extract the real URL
    let url = rawHref;
    try {
      const parsed = new URL(rawHref, "https://duckduckgo.com");
      url = parsed.searchParams.get("uddg") || rawHref;
    } catch {
      // keep rawHref if parsing fails
    }

    if (title && url) {
      results.push({ title, url, snippet });
    }
  });

  return results;
}

/**
 * Extract the main text content from a web page (strips nav, footer, scripts).
 * Zero cost — uses native fetch + cheerio.
 */
export async function extractPageContent(url: string): Promise<ExtractedPage> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  // Remove noise elements
  $("script, style, nav, footer, header, iframe, noscript, svg, [role='navigation'], [role='banner']").remove();

  const title = $("title").text().trim() || $("h1").first().text().trim() || "";

  // Extract main content area first, then fall back to body
  let textContent = "";
  const mainSelectors = ["main", "article", "[role='main']", "#content", ".content"];
  for (const selector of mainSelectors) {
    const found = $(selector).text().trim();
    if (found && found.length > 100) {
      textContent = found;
      break;
    }
  }
  if (!textContent) {
    textContent = $("body").text().trim();
  }

  // Collapse whitespace
  textContent = textContent.replace(/\s+/g, " ").trim();

  // Truncate to ~8000 chars to keep token costs low
  if (textContent.length > 8000) {
    textContent = textContent.slice(0, 8000) + "... [truncated]";
  }

  return { url, title, textContent };
}
