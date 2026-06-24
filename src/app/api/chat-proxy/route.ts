import { NextRequest, NextResponse } from "next/server";
import { validateWebhookUrl } from "@/lib/validate-url";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { webhookUrl, chatInput, sessionId, action } = body;

    if (!webhookUrl) {
      return NextResponse.json(
        { success: false, error: "URL du webhook manquante" },
        { status: 400 }
      );
    }

    const validation = validateWebhookUrl(webhookUrl);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    let res: Response;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      res = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "n8n-integration-hub/1.0",
        },
        body: JSON.stringify({
          chatInput,
          sessionId: sessionId || `session-${Date.now()}`,
          action: action || "sendMessage",
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);
    } catch (fetchErr) {
      const msg = fetchErr instanceof Error ? fetchErr.message : "Fetch failed";
      console.error("[chat-proxy] Fetch error:", msg);

      // Fallback HTTP/1.1 via node:https (sans rejectUnauthorized:false)
      try {
        const url = new URL(webhookUrl);
        const mod = url.protocol === "http:" ? await import("node:http") : await import("node:https");

        const result = await new Promise<{ success: boolean; data?: unknown; error?: string }>((resolve) => {
          const data = JSON.stringify({
            chatInput,
            sessionId: `session-${Date.now()}`,
            action: action || "sendMessage",
          });

          const req = mod.request(
            url,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(data),
                "User-Agent": "n8n-integration-hub/1.0",
              },
              timeout: 15000,
            },
            (resp) => {
              let body = "";
              resp.on("data", (chunk) => (body += chunk));
              resp.on("end", () => {
                try {
                  const json = JSON.parse(body);
                  resolve({ success: true, data: json });
                } catch {
                  resolve({ success: true, data: body });
                }
              });
            }
          );

          req.on("error", (e) => {
            resolve({ success: false, error: e.message });
          });

          req.on("timeout", () => {
            req.destroy();
            resolve({ success: false, error: "Timeout" });
          });

          req.write(data);
          req.end();
        });

        if (!result.success) {
          return NextResponse.json({
            success: false,
            error: `Impossible de joindre le serveur n8n (${webhookUrl}).`,
            details: result.error,
          });
        }

        return NextResponse.json(result);
      } catch (httpsErr) {
        return NextResponse.json({
          success: false,
          error: `Impossible de joindre le serveur n8n (${webhookUrl}).`,
          details: msg,
        });
      }
    }

    const text = await res.text();

    if (res.status === 404) {
      return NextResponse.json({
        success: false,
        error:
          "Le webhook n8n n'est pas accessible. Activez le workflow dans n8n (toggle en haut à droite de l'éditeur).",
      });
    }

    if (!res.ok) {
      return NextResponse.json({
        success: false,
        error: `Erreur HTTP ${res.status} du webhook n8n. Vérifiez que le workflow est actif.`,
      });
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : "Erreur inconnue",
    });
  }
}
