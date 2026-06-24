import { NextRequest, NextResponse } from "next/server";
import { validateWebhookUrl } from "@/lib/validate-url";

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URL manquante" }, { status: 400 });
    }

    const validation = validateWebhookUrl(url);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; n8n-hub-bot/1.0)",
        Accept: "text/html,application/json,*/*",
      },
      signal: AbortSignal.timeout(10000),
    });

    const contentType = res.headers.get("content-type") || "";
    const text = await res.text();
    const isHtml =
      contentType.includes("text/html") ||
      text.trim().startsWith("<!DOCTYPE") ||
      text.trim().startsWith("<html");

    return NextResponse.json({
      url,
      status: res.status,
      contentType,
      isHtml,
      contentLength: text.length,
      reachable: true,
    });
  } catch (err) {
    return NextResponse.json({
      url: null,
      error: err instanceof Error ? err.message : "Erreur inconnue",
      isHtml: false,
      reachable: false,
    });
  }
}
