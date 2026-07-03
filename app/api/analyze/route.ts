import { fetchAndParseArticle } from "@/lib/parse-article";
import { NextResponse } from "next/server";

type Action = "summary" | "theses" | "telegram";

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

  try {
    const article = await fetchAndParseArticle(body.url);

    return NextResponse.json({
      date: article.date,
      title: article.title,
      content: article.content,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Не удалось распарсить статью";

    return NextResponse.json({ error: message }, { status: 422 });
  }
}
