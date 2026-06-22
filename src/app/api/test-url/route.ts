import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URL manquante" }, { status: 400 });
    }

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; n8n-hub-bot/1.0)",
        Accept: "text/html,application/json,*/*",
      },
      // Timeout court pour ne pas bloquer
      signal: AbortSignal.timeout(10000),
    });

    const contentType = res.headers.get("content-type") || "";
    const text = await res.text();
    const isHtml =
      contentType.includes("text/html") ||
      text.trim().startsWith("<!DOCTYPE") ||
      text.trim().startsWith("<html") ||
      text.trim().startsWith("<script") ||
      (text.includes("<div") && text.includes("</div>"));

    return NextResponse.json({
      url,
      status: res.status,
      contentType,
      isHtml,
      contentLength: text.length,
      preview: text.substring(0, 500),
      headers: Object.fromEntries(res.headers.entries()),
    });
  } catch (err) {
    return NextResponse.json({
      url: null,
      error: err instanceof Error ? err.message : "Erreur inconnue",
      isHtml: false,
      preview: null,
    });
  }
}
