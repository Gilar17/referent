import { fetchAndParseArticle } from "@/lib/parse-article";
import { translateArticle } from "@/lib/translate-article";
import { NextResponse } from "next/server";

type Action = "summary" | "theses" | "telegram" | "translate";

export async function POST(request: Request) {
  const body = (await request.json()) as { url?: string; action?: Action };

  if (!body.url || !body.action) {
    return NextResponse.json(
      { error: "Укажите URL и тип действия" },
      { status: 400 },
    );
  }

  if (!["summary", "theses", "telegram", "translate"].includes(body.action)) {
    return NextResponse.json({ error: "Неизвестный тип действия" }, { status: 400 });
  }

  try {
    const article = await fetchAndParseArticle(body.url);

    if (body.action === "translate") {
      const translation = await translateArticle(article);
      return NextResponse.json({ result: translation });
    }

    return NextResponse.json({
      date: article.date,
      title: article.title,
      content: article.content,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Не удалось обработать статью";

    return NextResponse.json({ error: message }, { status: 422 });
  }
}
