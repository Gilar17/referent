import { chatCompletion } from "@/lib/openrouter";
import type { ParsedArticle } from "@/lib/parse-article";

export async function translateArticle(article: ParsedArticle): Promise<string> {
  if (!article.title && !article.content) {
    throw new Error("Нет текста для перевода");
  }

  const parts: string[] = [];

  if (article.title) {
    parts.push(`Title:\n${article.title}`);
  }

  if (article.date) {
    parts.push(`Date:\n${article.date}`);
  }

  if (article.content) {
    parts.push(`Content:\n${article.content}`);
  }

  return chatCompletion([
    {
      role: "system",
      content:
        "You are a professional translator. Translate English articles into Russian. Preserve structure: first output the translated title (if present), then date (if present), then the full translated article text. Write naturally in Russian. Do not add comments or explanations.",
    },
    {
      role: "user",
      content: `Translate the following article into Russian:\n\n${parts.join("\n\n")}`,
    },
  ]);
}
