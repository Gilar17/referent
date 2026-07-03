import { NextResponse } from "next/server";

type Action = "summary" | "theses" | "telegram";

const PLACEHOLDERS: Record<Action, string> = {
  summary:
    "Краткое содержание статьи появится здесь после подключения парсера и AI-модели.",
  theses:
    "Список тезисов появится здесь после подключения парсера и AI-модели.",
  telegram:
    "Текст поста для Telegram появится здесь после подключения парсера и AI-модели.",
};

export async function POST(request: Request) {
  const body = (await request.json()) as { url?: string; action?: Action };

  if (!body.url || !body.action) {
    return NextResponse.json(
      { error: "Укажите URL и тип действия" },
      { status: 400 },
    );
  }

  if (!["summary", "theses", "telegram"].includes(body.action)) {
    return NextResponse.json({ error: "Неизвестный тип действия" }, { status: 400 });
  }

  return NextResponse.json({
    result: PLACEHOLDERS[body.action],
  });
}
