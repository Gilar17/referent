"use client";

import {
  ANALYZE_ACTION_CONTRACTS,
  type AnalyzeAction,
} from "@/lib/actions";
import { RequestHistory } from "./request-history";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  getFriendlyErrorMessage,
  isErrorCode,
  type ErrorCode,
} from "@/lib/errors";
import {
  addHistoryItem,
  clearHistory,
  getHistoryTitle,
  loadHistory,
  removeHistoryItem,
  type HistoryItem,
} from "@/lib/request-history";
import { AlertCircle, Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type ApiResponse = {
  result?: string;
  title?: string | null;
  code?: string;
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
  {
    id: "illustration",
    label: ANALYZE_ACTION_CONTRACTS.illustration.label,
    color: "#A469A0",
    title: "Создаст иллюстрацию по смыслу статьи",
  },
];

const ACTION_PROCESS_MESSAGES: Record<AnalyzeAction, string> = {
  summary: "Готовлю краткое описание…",
  theses: "Формирую тезисы…",
  telegram: "Пишу пост для Telegram…",
  illustration: "Генерирую иллюстрацию…",
};

function isImageResult(value: string): boolean {
  return value.startsWith("data:image/");
}

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function resolveErrorCode(data: ApiResponse | null, networkFailed: boolean): ErrorCode {
  if (networkFailed) {
    return "NETWORK";
  }

  if (data && isErrorCode(data.code)) {
    return data.code;
  }

  return "UNKNOWN";
}

export function ArticleForm() {
  const [url, setUrl] = useState("");
  const [articleTitle, setArticleTitle] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<AnalyzeAction | null>(null);
  const [result, setResult] = useState("");
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [processStatus, setProcessStatus] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const resultSectionRef = useRef<HTMLElement>(null);
  const copyResetTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  useEffect(() => {
    if (!isLoading || !activeAction) {
      return;
    }

    const timer = window.setTimeout(() => {
      setProcessStatus(ACTION_PROCESS_MESSAGES[activeAction]);
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [isLoading, activeAction]);

  useEffect(() => {
    if (!result || isLoading) {
      return;
    }

    resultSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [result, isLoading]);

  useEffect(() => {
    return () => {
      if (copyResetTimerRef.current !== null) {
        window.clearTimeout(copyResetTimerRef.current);
      }
    };
  }, []);

  function handleClear() {
    setUrl("");
    setArticleTitle(null);
    setActiveAction(null);
    setResult("");
    setErrorCode(null);
    setIsLoading(false);
    setProcessStatus(null);
    setCopied(false);

    if (copyResetTimerRef.current !== null) {
      window.clearTimeout(copyResetTimerRef.current);
      copyResetTimerRef.current = null;
    }
  }

  function handleOpenHistoryItem(item: HistoryItem) {
    setUrl(item.url);
    setArticleTitle(getHistoryTitle(item));
    setActiveAction(item.action);
    setErrorCode(null);
    setProcessStatus(null);
    setCopied(false);
    setResult(item.result);

    window.requestAnimationFrame(() => {
      resultSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function handleRemoveHistoryItem(id: string) {
    setHistory(removeHistoryItem(id));
  }

  function handleClearHistory() {
    setHistory(clearHistory());
  }

  async function handleCopy() {
    if (!result) {
      return;
    }

    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);

      if (copyResetTimerRef.current !== null) {
        window.clearTimeout(copyResetTimerRef.current);
      }

      copyResetTimerRef.current = window.setTimeout(() => {
        setCopied(false);
        copyResetTimerRef.current = null;
      }, 2000);
    } catch {
      setCopied(false);
    }
  }

  async function handleAction(action: AnalyzeAction) {
    const trimmedUrl = url.trim();

    if (!trimmedUrl) {
      setErrorCode("VALIDATION_URL_EMPTY");
      setResult("");
      setProcessStatus(null);
      return;
    }

    if (!isValidUrl(trimmedUrl)) {
      setErrorCode("VALIDATION_URL_INVALID");
      setResult("");
      setProcessStatus(null);
      return;
    }

    setErrorCode(null);
    setActiveAction(action);
    setIsLoading(true);
    setResult("");
    setArticleTitle(null);
    setCopied(false);
    setProcessStatus(
      action === "illustration"
        ? "Готовлю промпт для иллюстрации…"
        : "Загружаю статью…",
    );

    try {
      let response: Response;

      try {
        response = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: trimmedUrl, action }),
        });
      } catch {
        setErrorCode("NETWORK");
        setResult("");
        return;
      }

      let data: ApiResponse | null = null;

      try {
        data = (await response.json()) as ApiResponse;
      } catch {
        setErrorCode("UNKNOWN");
        setResult("");
        return;
      }

      if (!response.ok) {
        setErrorCode(resolveErrorCode(data, false));
        setResult("");
        return;
      }

      const nextResult = data.result?.trim() ?? "";
      if (!nextResult) {
        setErrorCode("AI_EMPTY");
        setResult("");
        return;
      }

      const nextTitle =
        typeof data.title === "string" && data.title.trim() ? data.title.trim() : null;

      setArticleTitle(nextTitle);
      setResult(nextResult);
      try {
        setHistory(
          addHistoryItem({
            url: trimmedUrl,
            action,
            result: nextResult,
            title: nextTitle,
          }),
        );
      } catch {
        // localStorage может не вместить большое изображение — результат всё равно показываем
      }
    } finally {
      setIsLoading(false);
      setProcessStatus(null);
    }
  }

  const errorMessage = errorCode ? getFriendlyErrorMessage(errorCode) : null;

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-3xl flex-col gap-6 sm:gap-8">
      <header className="min-w-0 space-y-2">
        <p className="text-sm font-medium uppercase tracking-wide text-indigo-600">
          Referent
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Анализ англоязычных статей
        </h1>
        <p className="text-sm text-slate-600 sm:text-base">
          Вставьте ссылку на статью и выберите, как обработать материал с помощью
          ИИ.
        </p>
      </header>

      <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-2 flex items-center justify-between gap-3">
          <label htmlFor="article-url" className="text-sm font-medium text-slate-700">
            URL статьи
          </label>
          <button
            type="button"
            title="Сбросить URL, результат, ошибки и состояние"
            onClick={handleClear}
            disabled={isLoading}
            className="shrink-0 text-sm text-slate-500 transition hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Очистить
          </button>
        </div>
        <input
          id="article-url"
          type="url"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="Введите URL статьи, например: https://example.com/article"
          className="w-full min-w-0 max-w-full rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
        />
        <p className="mt-2 text-xs text-slate-500">
          Укажите ссылку на англоязычную статью
        </p>

        <div className="mt-4 flex w-full min-w-0 flex-col gap-3 md:flex-row md:flex-wrap">
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
                className={`w-full rounded-xl px-4 py-2.5 text-sm font-medium text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60 md:w-auto ${
                  isActive ? "shadow-md ring-2 ring-offset-2 ring-slate-400" : ""
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {errorMessage && (
          <Alert variant="destructive" className="mt-4 min-w-0 break-words">
            <AlertCircle className="shrink-0" />
            <AlertTitle>Ошибка</AlertTitle>
            <AlertDescription className="break-words">{errorMessage}</AlertDescription>
          </Alert>
        )}
      </section>

      {processStatus && (
        <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
          <span className="inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
          <span className="min-w-0 break-words">{processStatus}</span>
        </div>
      )}

      <section
        ref={resultSectionRef}
        className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm scroll-mt-6 sm:p-6"
      >
        <div className="mb-4 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-medium text-slate-900">Результат</h2>

          {result && !isLoading && !isImageResult(result) && (
            <button
              type="button"
              title="Скопировать результат в буфер обмена"
              onClick={handleCopy}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 sm:w-auto"
            >
              {copied ? (
                <>
                  <Check className="size-4 shrink-0 text-emerald-600" />
                  Скопировано
                </>
              ) : (
                <>
                  <Copy className="size-4 shrink-0" />
                  Копировать
                </>
              )}
            </button>
          )}
        </div>

        {!isLoading && !result && !errorCode && (
          <p className="text-slate-500">
            Результат появится здесь после выбора действия.
          </p>
        )}

        {!isLoading && result && (
          <div className="space-y-3">
            {articleTitle && (
              <p
                title={articleTitle}
                className="truncate text-sm font-medium text-slate-700"
              >
                {articleTitle}
              </p>
            )}
            {isImageResult(result) ? (
              <div className="overflow-hidden rounded-xl bg-slate-50 p-2 sm:p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={result}
                  alt={articleTitle ? `Иллюстрация: ${articleTitle}` : "Иллюстрация к статье"}
                  className="mx-auto h-auto max-h-[70vh] w-full max-w-full rounded-lg object-contain"
                />
              </div>
            ) : (
              <div className="max-w-full min-w-0 overflow-x-auto whitespace-pre-wrap break-words rounded-xl bg-slate-50 px-4 py-4 text-base text-slate-800 leading-relaxed [overflow-wrap:anywhere]">
                {result}
              </div>
            )}
          </div>
        )}
      </section>

      <RequestHistory
        items={history}
        onOpen={handleOpenHistoryItem}
        onRemove={handleRemoveHistoryItem}
        onClearAll={handleClearHistory}
      />
    </div>
  );
}
