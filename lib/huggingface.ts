import { AppError } from "@/lib/errors";

export const HUGGINGFACE_IMAGE_MODEL =
  process.env.HUGGINGFACE_IMAGE_MODEL?.trim() ||
  "black-forest-labs/FLUX.1-schnell";

function getApiKey(): string {
  const apiKey =
    process.env.HUGGINGFACE_API_KEY?.trim().replace(/^["']|["']$/g, "") ?? "";

  if (!apiKey) {
    throw new AppError("HF_CONFIG");
  }

  return apiKey;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  return Buffer.from(buffer).toString("base64");
}

/**
 * Генерирует изображение по текстовому промпту через Hugging Face Inference.
 * Возвращает data URL (image/png или image/jpeg).
 */
export async function generateImage(prompt: string): Promise<string> {
  const trimmed = prompt.trim();
  if (!trimmed) {
    throw new AppError("IMAGE_FAILED");
  }

  const model = HUGGINGFACE_IMAGE_MODEL;
  const url = `https://router.huggingface.co/hf-inference/models/${model}`;

  let response: Response;

  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getApiKey()}`,
        "Content-Type": "application/json",
        Accept: "image/png",
      },
      body: JSON.stringify({
        inputs: trimmed,
        parameters: {
          num_inference_steps: 4,
        },
      }),
      signal: AbortSignal.timeout(180000),
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError("IMAGE_FAILED");
  }

  if (!response.ok) {
    if (response.status === 401) {
      throw new AppError("AI_AUTH");
    }

    if (response.status === 402 || response.status === 429) {
      throw new AppError("AI_QUOTA");
    }

    if (response.status === 403) {
      throw new AppError("AI_FORBIDDEN");
    }

    throw new AppError("IMAGE_FAILED");
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    throw new AppError("IMAGE_FAILED");
  }

  const buffer = await response.arrayBuffer();
  if (!buffer.byteLength) {
    throw new AppError("IMAGE_FAILED");
  }

  const mime = contentType.startsWith("image/") ? contentType.split(";")[0] : "image/png";
  return `data:${mime};base64,${arrayBufferToBase64(buffer)}`;
}
