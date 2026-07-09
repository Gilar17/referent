import { buildArticleText } from "@/lib/article-text";
import { chatCompletion } from "@/lib/openrouter";
import type { ParsedArticle } from "@/lib/parse-article";

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
