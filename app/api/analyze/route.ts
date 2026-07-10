import { isAnalyzeAction, type Action } from "@/lib/actions";
import { analyzeArticle, translateTitleToRussian } from "@/lib/analyze-article";
import {
  AppError,
  httpStatusForError,
  toAppError,
  type ErrorCode,
} from "@/lib/errors";
import { fetchAndParseArticle } from "@/lib/parse-article";
import { NextResponse } from "next/server";

function errorResponse(code: ErrorCode) {
  return NextResponse.json({ code }, { status: httpStatusForError(code) });
}

export async function POST(request: Request) {
  let body: { url?: string; action?: Action };

  try {
    body = (await request.json()) as { url?: string; action?: Action };
  } catch {
    return errorResponse("VALIDATION_REQUEST");
  }

  if (!body.url || !body.action) {
    return errorResponse("VALIDATION_REQUEST");
  }

  if (!isAnalyzeAction(body.action)) {
    return errorResponse("VALIDATION_ACTION");
  }

  try {
    const article = await fetchAndParseArticle(body.url);
    const originalTitle = article.title?.trim() || null;

    const [result, title] = await Promise.all([
      analyzeArticle(article, body.action, body.url),
      originalTitle
        ? translateTitleToRussian(originalTitle)
        : Promise.resolve(null),
    ]);

    return NextResponse.json({
      result,
      title,
    });
  } catch (error) {
    const appError = error instanceof AppError ? error : toAppError(error);
    return errorResponse(appError.code);
  }
}
