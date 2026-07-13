import { AppError } from "@/lib/errors";
import OpenAI from "openai";

/** Модель Cerebras для текстовых запросов. */
export const CEREBRAS_MODEL =
  process.env.CEREBRAS_MODEL?.trim() || "gpt-oss-120b";

const DEFAULT_BASE_URL = "https://api.cerebras.ai/v1";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

function getApiKey(): string {
  const apiKey =
    process.env.CEREBRAS_API_KEY?.trim().replace(/^["']|["']$/g, "") ?? "";

  if (!apiKey) {
    throw new AppError("AI_CONFIG");
  }

  return apiKey;
}

function getBaseUrl(): string {
  return process.env.CEREBRAS_BASE_URL?.trim() || DEFAULT_BASE_URL;
}

function getClient(): OpenAI {
  return new OpenAI({
    apiKey: getApiKey(),
    baseURL: getBaseUrl(),
  });
}

function isConnectionError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  const name = error.name.toLowerCase();

  return (
    name.includes("abort") ||
    name.includes("timeout") ||
    message.includes("fetch failed") ||
    message.includes("network") ||
    message.includes("econnrefused") ||
    message.includes("enotfound") ||
    message.includes("socket") ||
    message.includes("timeout")
  );
}

function mapCerebrasError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (isConnectionError(error)) {
    return new AppError("CEREBRAS_CONNECTION");
  }

  if (error instanceof OpenAI.APIError) {
    if (error.status === 401) {
      return new AppError("AI_AUTH");
    }

    if (error.status === 403) {
      return new AppError("AI_FORBIDDEN");
    }

    if (error.status === 402 || error.status === 429) {
      return new AppError("AI_QUOTA");
    }

    if (error.status === 404) {
      return new AppError("AI_MODEL");
    }

    return new AppError("AI_FAILED");
  }

  return new AppError("AI_FAILED");
}

export async function chatCompletion(messages: ChatMessage[]): Promise<string> {
  try {
    const client = getClient();
    const response = await client.chat.completions.create({
      model: CEREBRAS_MODEL,
      messages,
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content?.trim();

    if (!content) {
      throw new AppError("AI_EMPTY");
    }

    return content;
  } catch (error) {
    throw mapCerebrasError(error);
  }
}
