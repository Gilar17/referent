import { isAction, isAnalyzeAction, type Action } from "@/lib/actions";
import { analyzeArticle } from "@/lib/analyze-article";
import { fetchAndParseArticle } from "@/lib/parse-article";
import { translateArticle } from "@/lib/translate-article";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = (await request.json()) as { url?: string; action?: Action };

  if (!body.url || !body.action) {
    return NextResponse.json(
      { error: "Укажите URL и тип действия" },
      { status: 400 },
    );
  }

  if (!isAction(body.action)) {
    return NextResponse.json({ error: "Неизвестный тип действия" }, { status: 400 });
  }

  try {
    const article = await fetchAndParseArticle(body.url);

    if (body.action === "translate") {
      const result = await translateArticle(article);
      return NextResponse.json({ result });
    }

    if (isAnalyzeAction(body.action)) {
      const result = await analyzeArticle(article, body.action);
      return NextResponse.json({ result });
    }

    return NextResponse.json({ error: "Неизвестный тип действия" }, { status: 400 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Не удалось обработать статью";

    return NextResponse.json({ error: message }, { status: 422 });
  }
}
