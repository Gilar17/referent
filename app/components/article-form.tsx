"use client";

import { useState } from "react";

type Action = "summary" | "theses" | "telegram";

type ParsedArticle = {
  date: string | null;
  title: string | null;
  content: string | null;
};

const ACTIONS: { id: Action; label: string }[] = [
  { id: "summary", label: "О чем статья?" },
  { id: "theses", label: "Тезисы" },
  { id: "telegram", label: "Пост для Telegram" },
];

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
  const [activeAction, setActiveAction] = useState<Action | null>(null);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleAction(action: Action) {
    const trimmedUrl = url.trim();

    if (!trimmedUrl) {
      setError("Введите URL статьи");
      setResult("");
      return;
    }

    if (!isValidUrl(trimmedUrl)) {
      setError("Укажите корректный URL (http:// или https://)");
      setResult("");
      return;
    }

    setError("");
    setActiveAction(action);
    setIsLoading(true);
    setResult("");

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmedUrl, action }),
      });

      const data = (await response.json()) as ParsedArticle & { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Не удалось выполнить запрос");
      }

      setResult(JSON.stringify(data, null, 2));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка");
      setResult("");
    } finally {
      setIsLoading(false);
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
          placeholder="https://example.com/article"
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
        />

        <div className="mt-4 flex flex-wrap gap-3">
          {ACTIONS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => handleAction(id)}
              disabled={isLoading}
              className={`rounded-xl px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
                activeAction === id
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {error && (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-medium text-slate-900">Результат</h2>

        {isLoading && (
          <div className="flex items-center gap-3 text-slate-600">
            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
            <span>Загрузка и парсинг статьи…</span>
          </div>
        )}

        {!isLoading && !result && !error && (
          <p className="text-slate-500">
            Результат появится здесь после выбора действия.
          </p>
        )}

        {!isLoading && result && (
          <div className="overflow-x-auto whitespace-pre-wrap rounded-xl bg-slate-50 px-4 py-4 font-mono text-sm text-slate-800 leading-relaxed">
            {result}
          </div>
        )}
      </section>
    </div>
  );
}
