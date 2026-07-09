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
    "КРИТИЧЕСКИ ВАЖНО: весь текст поста должен быть строго на русском языке. Не пиши на английском. Переведи все факты, даты, названия мероприятий и описания на русский.",
    "Структура: хук или заголовок, затем основной текст; при необходимости эмодзи и абзацы.",
    "Текст должен быть удобен для копирования целиком.",
    "Не добавляй пояснений до или после поста и не добавляй ссылку на источник — она будет добавлена отдельно.",
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

function appendSourceLink(post: string, sourceUrl: string): string {
  const trimmed = post.trim();
  const sourceBlock = `Источник: ${sourceUrl}`;

  if (trimmed.includes(sourceUrl)) {
    return trimmed;
  }

  return `${trimmed}\n\n${sourceBlock}`;
}

export async function analyzeArticle(
  article: ParsedArticle,
  action: AnalyzeAction,
  sourceUrl?: string,
): Promise<string> {
  const articleText = buildArticleText(article);

  if (!articleText) {
    throw new Error("Не удалось извлечь текст статьи для анализа");
  }

  const result = await chatCompletion([
    {
      role: "user",
      content: buildPrompt(action, articleText),
    },
  ]);

  if (action === "telegram" && sourceUrl) {
    return appendSourceLink(result, sourceUrl);
  }

  return result;
}

export async function summarizeArticle(article: ParsedArticle): Promise<string> {
  return analyzeArticle(article, "summary");
}

export async function extractTheses(article: ParsedArticle): Promise<string> {
  return analyzeArticle(article, "theses");
}

export async function createTelegramPost(
  article: ParsedArticle,
  sourceUrl?: string,
): Promise<string> {
  return analyzeArticle(article, "telegram", sourceUrl);
}
