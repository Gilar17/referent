"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { HistoryItem } from "@/lib/request-history";
import {
  formatHistoryDate,
  previewResult,
  shortenUrl,
} from "@/lib/request-history";
import { Trash2 } from "lucide-react";

type RequestHistoryProps = {
  items: HistoryItem[];
  onOpen: (item: HistoryItem) => void;
  onRemove: (id: string) => void;
  onClearAll: () => void;
};

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
    <section className="min-w-0 space-y-4">
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

      <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
        {items.map((item) => (
          <Card key={item.id} className="min-w-0 overflow-hidden">
            <CardHeader className="min-w-0">
              <CardTitle className="break-all text-sm text-slate-900 [overflow-wrap:anywhere]">
                {shortenUrl(item.url)}
              </CardTitle>
              <CardDescription className="flex min-w-0 flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-2">
                <span className="font-medium text-slate-700">{item.actionLabel}</span>
                <span className="hidden text-slate-300 sm:inline">·</span>
                <span>{formatHistoryDate(item.createdAt)}</span>
              </CardDescription>
            </CardHeader>

            <CardContent className="min-w-0">
              <p className="break-words text-sm leading-relaxed text-slate-600 [overflow-wrap:anywhere]">
                {previewResult(item.result)}
              </p>
            </CardContent>

            <CardFooter className="flex min-w-0 flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => onOpen(item)}
                className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800 sm:w-auto"
              >
                Открыть
              </button>
              <button
                type="button"
                title="Удалить запись"
                onClick={() => onRemove(item.id)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 sm:w-auto"
              >
                <Trash2 className="size-4 shrink-0" />
                Удалить
              </button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  );
}
