/**
 * Контракт действий приложения.
 * Этап 1 плана: типы и ожидаемый формат ответа для каждой кнопки.
 */

export const ANALYZE_ACTIONS = ["summary", "theses", "telegram"] as const;

export type AnalyzeAction = (typeof ANALYZE_ACTIONS)[number];
export type Action = AnalyzeAction;

export type ActionContract = {
  id: AnalyzeAction;
  label: string;
  /** Ожидаемый формат ответа модели на русском */
  responseFormat: string;
};

/**
 * Формат ответа для AI-кнопок из PROJECT.md / PLAN.md.
 * Используется как спецификация при сборке промптов (этап 3).
 */
export const ANALYZE_ACTION_CONTRACTS: Record<AnalyzeAction, ActionContract> = {
  summary: {
    id: "summary",
    label: "О чем статья?",
    responseFormat:
      "Краткое описание сути статьи на русском языке, 1–3 абзаца. Без списков, без мета-комментариев.",
  },
  theses: {
    id: "theses",
    label: "Тезисы",
    responseFormat:
      "Нумерованный или маркированный список ключевых тезисов на русском языке. Только тезисы, без вступления и заключения.",
  },
  telegram: {
    id: "telegram",
    label: "Пост для Telegram",
    responseFormat:
      "Весь пост строго на русском языке (не на английском): хук/заголовок, основной текст; при необходимости эмодзи и абзацы. Текст удобен для копирования. В конце будет добавлена ссылка на источник.",
  },
};

export function isAction(value: unknown): value is Action {
  return (
    typeof value === "string" && (ANALYZE_ACTIONS as readonly string[]).includes(value)
  );
}

export function isAnalyzeAction(value: unknown): value is AnalyzeAction {
  return isAction(value);
}
