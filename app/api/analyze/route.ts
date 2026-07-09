import { isAnalyzeAction, type Action } from "@/lib/actions";
import { analyzeArticle } from "@/lib/analyze-article";
import { fetchAndParseArticle } from "@/lib/parse-article";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = (await request.json()) as { url?: string; action?: Action };

  if (!body.url || !body.action) {
    return NextResponse.json(
      { error: "Укажите URL и тип действия" },
      { status: 400 },
    );
  }

  if (!isAnalyzeAction(body.action)) {
    return NextResponse.json({ error: "Неизвестный тип действия" }, { status: 400 });
  }

  try {
    const article = await fetchAndParseArticle(body.url);
    const result = await analyzeArticle(article, body.action, body.url);
    return NextResponse.json({ result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Не удалось обработать статью";

    return NextResponse.json({ error: message }, { status: 422 });
  }
}
