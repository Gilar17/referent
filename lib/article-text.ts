import type { ParsedArticle } from "@/lib/parse-article";

export const MAX_CONTENT_LENGTH = 20000;

/** Собирает текст статьи для передачи в модель (Title / Date / Content). */
export function buildArticleText(article: ParsedArticle): string {
  const parts: string[] = [];

  if (article.title?.trim()) {
    parts.push(`Title:\n${article.title.trim()}`);
  }

  if (article.date?.trim()) {
    parts.push(`Date:\n${article.date.trim()}`);
  }

  if (article.content?.trim()) {
    parts.push(`Content:\n${article.content.trim().slice(0, MAX_CONTENT_LENGTH)}`);
  }

  return parts.join("\n\n");
}
