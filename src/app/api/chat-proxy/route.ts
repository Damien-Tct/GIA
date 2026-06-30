import { NextRequest, NextResponse } from "next/server";
import { validateWebhookUrl } from "@/lib/validate-url";

export const runtime = "nodejs";

/**
 * Proxy qui relaie les appels vers le webhook n8n.
 * Supporte à la fois :
 *   - JSON (body avec `webhookUrl`, `chatInput`, `sessionId`, `action`, `messages`, etc.)
 *   - FormData multipart (avec vrais fichiers binaires en plus des champs texte)
 */
export async function POST(request: NextRequest) {
  try {
    // Détecter le type de contenu
    const contentType = request.headers.get("content-type") ?? "";

    let webhookUrl: string | null = null;
    let chatInput = "";
    let sessionId = "";
    let action = "sendMessage";
    let messages: unknown = undefined;
    let payloadBody: string | FormData | undefined;

    if (contentType.includes("multipart/form-data") || contentType.includes("form-data")) {
      // --- MODE FORMDATA (fichiers binaires) ---
      const incomingFormData = await request.formData();

      webhookUrl = incomingFormData.get("webhookUrl") as string | null;
      chatInput = (incomingFormData.get("chatInput") as string) ?? "";
      sessionId = (incomingFormData.get("sessionId") as string) ?? `session-${Date.now()}`;
      action = (incomingFormData.get("action") as string) ?? "sendMessage";

      // Reconstruire un FormData pour n8n
      const outFormData = new FormData();
      outFormData.append("chatInput", chatInput);
      outFormData.append("sessionId", sessionId);
      outFormData.append("action", action);

      for (const [key, value] of incomingFormData.entries()) {
        if (key.startsWith("file_") && value instanceof File) {
          outFormData.append(key, value, value.name);
        }
      }

      payloadBody = outFormData;
    } else {
      // --- MODE JSON (fichiers en base64 dans messages) ---
      const body = await request.json();

      webhookUrl = body.webhookUrl ?? null;
      chatInput = body.chatInput ?? "";
      sessionId = body.sessionId ?? `session-${Date.now()}`;
      action = body.action ?? "sendMessage";
      messages = body.messages;

      const payload: Record<string, unknown> = { chatInput, sessionId, action };
      if (messages) payload.messages = messages;

      payloadBody = JSON.stringify(payload);
    }

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

    // --- Envoi vers n8n ---
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const headers: Record<string, string> = {
      "User-Agent": "n8n-integration-hub/1.0",
    };

    if (typeof payloadBody === "string") {
      headers["Content-Type"] = "application/json";
    }
    // Pour FormData, on laisse fetch gérer le Content-Type avec boundary

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers,
      body: payloadBody,
      signal: controller.signal,
    });

    clearTimeout(timeout);

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
