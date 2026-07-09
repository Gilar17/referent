export const OPENROUTER_MODEL = "openrouter/free";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type OpenRouterErrorResponse = {
  success?: boolean;
  error?:
    | string
    | {
        message?: string;
        code?: number;
        metadata?: Record<string, unknown>;
      };
};

function getErrorMessage(data: OpenRouterErrorResponse): string | undefined {
  if (typeof data.error === "string") {
    return data.error.trim();
  }

  return data.error?.message?.trim();
}

function getApiKey(): string {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim().replace(/^["']|["']$/g, "") ?? "";

  if (!apiKey) {
    throw new Error(
      "OPENROUTER_API_KEY не задан. Локально добавьте его в .env.local, на Vercel — в Settings → Environment Variables.",
    );
  }

  return apiKey;
}

function getChatCompletionsUrl(): string {
  return "https://openrouter.ai/api/v1/chat/completions";
}

function formatOpenRouterError(status: number, data: OpenRouterErrorResponse): string {
  const message = getErrorMessage(data);

  if (message) {
    if (message.toLowerCase().includes("security policy")) {
      return "OpenRouter заблокировал ключ политикой безопасности. Проверьте аккаунт и создайте новый ключ на openrouter.ai/keys";
    }

    return message;
  }

  if (status === 401) {
    return "Неверный API-ключ OpenRouter. Проверьте OPENROUTER_API_KEY в .env.local";
  }

  if (status === 402) {
    return "Недостаточно средств на балансе OpenRouter";
  }

  if (status === 403) {
    return "OpenRouter отклонил запрос. Проверьте ключ, баланс и доступ к модели";
  }

  if (status === 404) {
    return "Модель OpenRouter недоступна. Используется openrouter/free";
  }

  return `OpenRouter вернул ошибку: HTTP ${status}`;
}

export async function chatCompletion(messages: ChatMessage[]): Promise<string> {
  const response = await fetch(getChatCompletionsUrl(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      "X-Title": "Referent",
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages,
      temperature: 0.3,
    }),
    signal: AbortSignal.timeout(120000),
  });

  const data = (await response.json()) as OpenRouterErrorResponse & {
    choices?: Array<{ message?: { content?: string } }>;
  };

  if (!response.ok) {
    throw new Error(formatOpenRouterError(response.status, data));
  }

  const content = data.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new Error("OpenRouter вернул пустой ответ");
  }

  return content;
}
