import {
  ANALYZE_ACTION_CONTRACTS,
  isAnalyzeAction,
  type AnalyzeAction,
} from "@/lib/actions";

export const HISTORY_STORAGE_KEY = "referent.request-history";
export const HISTORY_LIMIT = 5;

export type HistoryItem = {
  id: string;
  url: string;
  action: AnalyzeAction;
  actionLabel: string;
  result: string;
  createdAt: string;
};

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function isHistoryItem(value: unknown): value is HistoryItem {
  if (!value || typeof value !== "object") {
    return false;
  }

  const item = value as Record<string, unknown>;

  return (
    typeof item.id === "string" &&
    typeof item.url === "string" &&
    isAnalyzeAction(item.action) &&
    typeof item.actionLabel === "string" &&
    typeof item.result === "string" &&
    typeof item.createdAt === "string" &&
    item.result.trim().length > 0
  );
}

export function loadHistory(): HistoryItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isHistoryItem).slice(0, HISTORY_LIMIT);
  } catch {
    return [];
  }
}

function saveHistory(items: HistoryItem[]): void {
  window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(items.slice(0, HISTORY_LIMIT)));
}

export function addHistoryItem(input: {
  url: string;
  action: AnalyzeAction;
  result: string;
}): HistoryItem[] {
  const result = input.result.trim();
  if (!result) {
    return loadHistory();
  }

  const item: HistoryItem = {
    id: createId(),
    url: input.url.trim(),
    action: input.action,
    actionLabel: ANALYZE_ACTION_CONTRACTS[input.action].label,
    result,
    createdAt: new Date().toISOString(),
  };

  const next = [item, ...loadHistory().filter((entry) => entry.id !== item.id)].slice(
    0,
    HISTORY_LIMIT,
  );

  saveHistory(next);
  return next;
}

export function removeHistoryItem(id: string): HistoryItem[] {
  const next = loadHistory().filter((item) => item.id !== id);
  saveHistory(next);
  return next;
}

export function clearHistory(): HistoryItem[] {
  window.localStorage.removeItem(HISTORY_STORAGE_KEY);
  return [];
}

export function shortenUrl(url: string, maxLength = 48): string {
  try {
    const parsed = new URL(url);
    const display = `${parsed.hostname}${parsed.pathname}${parsed.search}`;
    if (display.length <= maxLength) {
      return display;
    }

    return `${display.slice(0, maxLength - 1)}…`;
  } catch {
    if (url.length <= maxLength) {
      return url;
    }

    return `${url.slice(0, maxLength - 1)}…`;
  }
}

export function previewResult(result: string, maxLength = 150): string {
  const normalized = result.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength)}…`;
}

export function formatHistoryDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
