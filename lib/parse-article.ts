import * as cheerio from "cheerio";
import type { CheerioAPI } from "cheerio";

export type ParsedArticle = {
  date: string | null;
  title: string | null;
  content: string | null;
};

const CONTENT_SELECTORS = [
  "article",
  '[role="article"]',
  ".post-content",
  ".entry-content",
  ".article-content",
  ".article-body",
  ".post-body",
  ".post",
  ".content",
  "main",
];

const DATE_META_SELECTORS = [
  'meta[property="article:published_time"]',
  'meta[name="article:published_time"]',
  'meta[property="og:published_time"]',
  'meta[name="pubdate"]',
  'meta[name="date"]',
  'meta[name="DC.date.issued"]',
];

function normalizeText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function extractTitle($: CheerioAPI): string | null {
  const ogTitle = $('meta[property="og:title"]').attr("content");
  if (ogTitle) return normalizeText(ogTitle);

  const twitterTitle = $('meta[name="twitter:title"]').attr("content");
  if (twitterTitle) return normalizeText(twitterTitle);

  const articleHeading = $("article h1").first().text();
  if (articleHeading) return normalizeText(articleHeading);

  const h1 = $("h1").first().text();
  if (h1) return normalizeText(h1);

  const title = $("title").first().text();
  if (title) return normalizeText(title);

  return null;
}

function extractDateFromJsonLd($: CheerioAPI): string | null {
  const scripts = $('script[type="application/ld+json"]');

  for (const element of scripts.toArray()) {
    const raw = $(element).html();
    if (!raw) continue;

    try {
      const data = JSON.parse(raw) as unknown;
      const date = findDateInJsonLd(data);
      if (date) return date;
    } catch {
      continue;
    }
  }

  return null;
}

function findDateInJsonLd(value: unknown): string | null {
  if (!value) return null;

  if (Array.isArray(value)) {
    for (const item of value) {
      const date = findDateInJsonLd(item);
      if (date) return date;
    }
    return null;
  }

  if (typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  const candidates = [
    record.datePublished,
    record.dateCreated,
    record.uploadDate,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }

  if (record["@graph"]) {
    return findDateInJsonLd(record["@graph"]);
  }

  return null;
}

function extractDate($: CheerioAPI): string | null {
  for (const selector of DATE_META_SELECTORS) {
    const value = $(selector).attr("content");
    if (value?.trim()) return value.trim();
  }

  const timeDatetime = $("time[datetime]").first().attr("datetime");
  if (timeDatetime?.trim()) return timeDatetime.trim();

  const timeText = $("time").first().text();
  if (timeText?.trim()) return normalizeText(timeText);

  const jsonLdDate = extractDateFromJsonLd($);
  if (jsonLdDate) return jsonLdDate;

  return null;
}

function extractContent($: CheerioAPI): string | null {
  let bestContent: string | null = null;
  let bestLength = 0;

  for (const selector of CONTENT_SELECTORS) {
    $(selector).each((_, element) => {
      const clone = $(element).clone();
      clone.find("script, style, nav, footer, aside, form, iframe").remove();

      const text = normalizeText(clone.text());
      if (text.length > bestLength) {
        bestLength = text.length;
        bestContent = text;
      }
    });
  }

  return bestContent;
}

export function parseArticleHtml(html: string): ParsedArticle {
  const $ = cheerio.load(html);

  return {
    date: extractDate($),
    title: extractTitle($),
    content: extractContent($),
  };
}

export async function fetchAndParseArticle(url: string): Promise<ParsedArticle> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; ReferentBot/1.0; +https://github.com/referent)",
      Accept: "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`Не удалось загрузить страницу: HTTP ${response.status}`);
  }

  const html = await response.text();
  const parsed = parseArticleHtml(html);

  if (!parsed.title && !parsed.content) {
    throw new Error("Не удалось извлечь заголовок и контент статьи");
  }

  return parsed;
}
