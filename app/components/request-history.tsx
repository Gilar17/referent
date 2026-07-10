"use client";

import type { HistoryItem } from "@/lib/request-history";
import { Trash2 } from "lucide-react";

type RequestHistoryProps = {
  items: HistoryItem[];
  onOpen: (item: HistoryItem) => void;
  onRemove: (id: string) => void;
  onClearAll: () => void;
};

function displayUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.hostname}${parsed.pathname}${parsed.search}`;
  } catch {
    return url;
  }
}

export function RequestHistory({
  items,
  onOpen,
  onRemove,
  onClearAll,
}: RequestHistoryProps) {
  if (items.length === 0) {
    return null;
  }

  function handleClearAll() {
    const confirmed = window.confirm(
      "Удалить всю историю запросов? Это действие нельзя отменить.",
    );

    if (confirmed) {
      onClearAll();
    }
  }

  return (
    <section className="min-w-0 space-y-3">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-medium text-slate-900">История запросов</h2>
        <button
          type="button"
          onClick={handleClearAll}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 sm:w-auto"
        >
          <Trash2 className="size-4 shrink-0" />
          Очистить историю
        </button>
      </div>

      <ul className="min-w-0 space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex min-w-0 flex-col gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 md:flex-row md:items-center md:gap-3"
          >
            <div className="flex min-w-0 flex-1 flex-col gap-1 md:flex-row md:items-center md:gap-3">
              <p
                title={item.url}
                className="min-w-0 flex-1 truncate text-sm text-slate-800"
              >
                {displayUrl(item.url)}
              </p>
              <span className="shrink-0 text-sm font-medium text-slate-600">
                {item.actionLabel}
              </span>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => onOpen(item)}
                className="inline-flex flex-1 items-center justify-center rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-slate-800 md:flex-none"
              >
                Открыть
              </button>
              <button
                type="button"
                title="Удалить запись"
                aria-label="Удалить запись"
                onClick={() => onRemove(item.id)}
                className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white p-1.5 text-slate-600 transition hover:bg-slate-50 hover:text-red-600"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
