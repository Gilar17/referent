import { AppError } from "@/lib/errors";

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
    throw new AppError("AI_CONFIG");
  }

  return apiKey;
}

function getChatCompletionsUrl(): string {
  return "https://openrouter.ai/api/v1/chat/completions";
}

function mapOpenRouterError(status: number, data: OpenRouterErrorResponse): AppError {
  const message = getErrorMessage(data)?.toLowerCase() ?? "";

  if (message.includes("security policy") || status === 403) {
    return new AppError("AI_FORBIDDEN");
  }

  if (status === 401) {
    return new AppError("AI_AUTH");
  }

  if (status === 402) {
    return new AppError("AI_QUOTA");
  }

  if (status === 404) {
    return new AppError("AI_MODEL");
  }

  if (status === 429) {
    return new AppError("AI_QUOTA");
  }

  return new AppError("AI_FAILED");
}

export async function chatCompletion(messages: ChatMessage[]): Promise<string> {
  let response: Response;

  try {
    response = await fetch(getChatCompletionsUrl(), {
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
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError("AI_FAILED");
  }

  let data: OpenRouterErrorResponse & {
    choices?: Array<{ message?: { content?: string } }>;
  };

  try {
    data = (await response.json()) as typeof data;
  } catch {
    throw new AppError("AI_FAILED");
  }

  if (!response.ok) {
    throw mapOpenRouterError(response.status, data);
  }

  const content = data.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new AppError("AI_EMPTY");
  }

  return content;
}
