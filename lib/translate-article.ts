import { chatCompletion } from "@/lib/openrouter";
import type { ParsedArticle } from "@/lib/parse-article";

const MAX_CONTENT_LENGTH = 20000;

function buildArticleText(article: ParsedArticle): string {
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

export async function translateArticle(article: ParsedArticle): Promise<string> {
  const articleText = buildArticleText(article);

  if (!articleText) {
    throw new Error("Не удалось извлечь текст статьи для перевода");
  }

  return chatCompletion([
    {
      role: "user",
      content: [
        "Переведи на русский язык следующую англоязычную статью.",
        "Сохрани структуру: сначала заголовок, затем дата (если есть), затем основной текст.",
        "Не добавляй пояснений до или после перевода.",
        "",
        articleText,
      ].join("\n"),
    },
  ]);
}
