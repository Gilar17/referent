/**
 * Коды ошибок API и клиентской валидации.
 * В UI показываются только дружественные тексты из ERROR_MESSAGES.
 */
export const ERROR_CODES = [
  "VALIDATION_URL_EMPTY",
  "VALIDATION_URL_INVALID",
  "VALIDATION_REQUEST",
  "VALIDATION_ACTION",
  "ARTICLE_FETCH",
  "ARTICLE_PARSE",
  "AI_CONFIG",
  "AI_AUTH",
  "AI_QUOTA",
  "AI_FORBIDDEN",
  "AI_MODEL",
  "AI_EMPTY",
  "AI_FAILED",
  "NETWORK",
  "UNKNOWN",
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  VALIDATION_URL_EMPTY: "Введите URL статьи.",
  VALIDATION_URL_INVALID: "Укажите корректный URL (http:// или https://).",
  VALIDATION_REQUEST: "Не хватает данных для запроса. Проверьте ссылку и действие.",
  VALIDATION_ACTION: "Выбрано неизвестное действие. Обновите страницу и попробуйте снова.",
  ARTICLE_FETCH: "Не удалось загрузить статью по этой ссылке.",
  ARTICLE_PARSE:
    "Не удалось извлечь текст статьи. Попробуйте другую ссылку или откройте материал в браузере.",
  AI_CONFIG: "Сервис ИИ не настроен. Обратитесь к администратору или проверьте настройки.",
  AI_AUTH: "Не удалось авторизоваться в сервисе ИИ. Проверьте API-ключ.",
  AI_QUOTA: "Лимит запросов к ИИ исчерпан. Попробуйте позже.",
  AI_FORBIDDEN: "Сервис ИИ отклонил запрос. Попробуйте позже или проверьте доступ.",
  AI_MODEL: "Модель ИИ сейчас недоступна. Попробуйте позже.",
  AI_EMPTY: "ИИ вернул пустой ответ. Попробуйте ещё раз.",
  AI_FAILED: "Не удалось обработать статью с помощью ИИ. Попробуйте ещё раз.",
  NETWORK: "Нет связи с сервером. Проверьте интернет и попробуйте снова.",
  UNKNOWN: "Что-то пошло не так. Попробуйте ещё раз.",
};

export class AppError extends Error {
  readonly code: ErrorCode;

  constructor(code: ErrorCode, details?: string) {
    super(details ?? ERROR_MESSAGES[code]);
    this.name = "AppError";
    this.code = code;
  }
}

export function isErrorCode(value: unknown): value is ErrorCode {
  return typeof value === "string" && (ERROR_CODES as readonly string[]).includes(value);
}

export function getFriendlyErrorMessage(code: unknown): string {
  if (isErrorCode(code)) {
    return ERROR_MESSAGES[code];
  }

  return ERROR_MESSAGES.UNKNOWN;
}

export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    const name = error.name.toLowerCase();
    const message = error.message.toLowerCase();

    if (
      name.includes("timeout") ||
      name.includes("abort") ||
      message.includes("timeout") ||
      message.includes("aborted") ||
      message.includes("fetch failed") ||
      message.includes("network") ||
      message.includes("failed to parse url")
    ) {
      return new AppError("ARTICLE_FETCH");
    }
  }

  return new AppError("UNKNOWN");
}

export function httpStatusForError(code: ErrorCode): number {
  switch (code) {
    case "VALIDATION_URL_EMPTY":
    case "VALIDATION_URL_INVALID":
    case "VALIDATION_REQUEST":
    case "VALIDATION_ACTION":
      return 400;
    case "AI_AUTH":
      return 401;
    case "AI_FORBIDDEN":
      return 403;
    case "AI_QUOTA":
      return 402;
    case "ARTICLE_FETCH":
    case "ARTICLE_PARSE":
    case "AI_CONFIG":
    case "AI_MODEL":
    case "AI_EMPTY":
    case "AI_FAILED":
      return 422;
    case "NETWORK":
    case "UNKNOWN":
    default:
      return 500;
  }
}
