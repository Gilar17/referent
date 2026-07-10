"use client";

import {
  ANALYZE_ACTION_CONTRACTS,
  type AnalyzeAction,
} from "@/lib/actions";
import { useEffect, useState } from "react";

type ApiResponse = {
  result?: string;
  error?: string;
};

const ACTIONS: {
  id: AnalyzeAction;
  label: string;
  color: string;
  title: string;
}[] = [
  {
    id: "summary",
    label: ANALYZE_ACTION_CONTRACTS.summary.label,
    color: "#6BA781",
    title: "Кратко опишет суть статьи на русском (1–3 абзаца)",
  },
  {
    id: "theses",
    label: ANALYZE_ACTION_CONTRACTS.theses.label,
    color: "#1972B7",
    title: "Составит список ключевых тезисов статьи",
  },
  {
    id: "telegram",
    label: ANALYZE_ACTION_CONTRACTS.telegram.label,
    color: "#7E70B9",
    title: "Напишет готовый пост для Telegram со ссылкой на источник",
  },
];

const ACTION_PROCESS_MESSAGES: Record<AnalyzeAction, string> = {
  summary: "Готовлю краткое описание…",
  theses: "Формирую тезисы…",
  telegram: "Пишу пост для Telegram…",
};

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function ArticleForm() {
  const [url, setUrl] = useState("");
  const [activeAction, setActiveAction] = useState<AnalyzeAction | null>(null);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [processStatus, setProcessStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading || !activeAction) {
      return;
    }

    const timer = window.setTimeout(() => {
      setProcessStatus(ACTION_PROCESS_MESSAGES[activeAction]);
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [isLoading, activeAction]);

  async function handleAction(action: AnalyzeAction) {
    const trimmedUrl = url.trim();

    if (!trimmedUrl) {
      setError("Введите URL статьи");
      setResult("");
      setProcessStatus(null);
      return;
    }

    if (!isValidUrl(trimmedUrl)) {
      setError("Укажите корректный URL (http:// или https://)");
      setResult("");
      setProcessStatus(null);
      return;
    }

    setError("");
    setActiveAction(action);
    setIsLoading(true);
    setResult("");
    setProcessStatus("Загружаю статью…");

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmedUrl, action }),
      });

      const data = (await response.json()) as ApiResponse;

      if (!response.ok) {
        throw new Error(data.error ?? "Не удалось выполнить запрос");
      }

      setResult(data.result ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка");
      setResult("");
    } finally {
      setIsLoading(false);
      setProcessStatus(null);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <header className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-wide text-indigo-600">
          Referent
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          Анализ англоязычных статей
        </h1>
        <p className="text-slate-600">
          Вставьте ссылку на статью и выберите, как обработать материал с помощью
          ИИ.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <label htmlFor="article-url" className="mb-2 block text-sm font-medium text-slate-700">
          URL англоязычной статьи
        </label>
        <input
          id="article-url"
          type="url"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="Введите URL статьи, например: https://example.com/article"
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
        />
        <p className="mt-2 text-xs text-slate-500">
          Укажите ссылку на англоязычную статью
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          {ACTIONS.map(({ id, label, color, title }) => {
            const isActive = activeAction === id;

            return (
              <button
                key={id}
                type="button"
                title={title}
                onClick={() => handleAction(id)}
                disabled={isLoading}
                style={{ backgroundColor: color }}
                className={`rounded-xl px-4 py-2.5 text-sm font-medium text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60 ${
                  isActive ? "shadow-md ring-2 ring-offset-2 ring-slate-400" : ""
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {error && (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}
      </section>

      {processStatus && (
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
          <span className="inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
          <span>{processStatus}</span>
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-medium text-slate-900">Результат</h2>

        {!isLoading && !result && !error && (
          <p className="text-slate-500">
            Результат появится здесь после выбора действия.
          </p>
        )}

        {!isLoading && result && (
          <div className="overflow-x-auto whitespace-pre-wrap rounded-xl bg-slate-50 px-4 py-4 text-base text-slate-800 leading-relaxed">
            {result}
          </div>
        )}
      </section>
    </div>
  );
}
