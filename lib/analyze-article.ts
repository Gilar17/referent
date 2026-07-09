import {
  ANALYZE_ACTION_CONTRACTS,
  type AnalyzeAction,
} from "@/lib/actions";
import { buildArticleText } from "@/lib/article-text";
import { chatCompletion } from "@/lib/openrouter";
import type { ParsedArticle } from "@/lib/parse-article";

const ACTION_INSTRUCTIONS: Record<AnalyzeAction, string[]> = {
  summary: [
    "Кратко опиши, о чём эта статья.",
    "Ответ на русском языке, 1–3 абзаца.",
    "Без списков и без мета-комментариев.",
  ],
  theses: [
    "Выдели ключевые тезисы статьи.",
    "Ответ на русском языке в виде нумерованного или маркированного списка.",
    "Только тезисы, без вступления и заключения.",
  ],
  telegram: [
    "Напиши готовый пост для Telegram по этой статье.",
    "На русском языке: хук или заголовок, затем основной текст; при необходимости эмодзи и абзацы.",
    "Текст должен быть удобен для копирования целиком.",
    "Не добавляй пояснений до или после поста.",
  ],
};

function buildPrompt(action: AnalyzeAction, articleText: string): string {
  const contract = ANALYZE_ACTION_CONTRACTS[action];

  return [
    ...ACTION_INSTRUCTIONS[action],
    `Ожидаемый формат: ${contract.responseFormat}`,
    "Опирайся только на текст статьи ниже. Не выдумывай факты.",
    "",
    articleText,
  ].join("\n");
}

export async function analyzeArticle(
  article: ParsedArticle,
  action: AnalyzeAction,
): Promise<string> {
  const articleText = buildArticleText(article);

  if (!articleText) {
    throw new Error("Не удалось извлечь текст статьи для анализа");
  }

  return chatCompletion([
    {
      role: "user",
      content: buildPrompt(action, articleText),
    },
  ]);
}

export async function summarizeArticle(article: ParsedArticle): Promise<string> {
  return analyzeArticle(article, "summary");
}

export async function extractTheses(article: ParsedArticle): Promise<string> {
  return analyzeArticle(article, "theses");
}

export async function createTelegramPost(article: ParsedArticle): Promise<string> {
  return analyzeArticle(article, "telegram");
}
