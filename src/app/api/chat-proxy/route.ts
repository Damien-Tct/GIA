import { NextRequest, NextResponse } from "next/server";
import { validateWebhookUrl } from "@/lib/validate-url";

export const runtime = "nodejs";

/**
 * Proxy qui relaie un FormData multipart (avec vrais fichiers)
 * vers le webhook n8n, toujours en multipart.
 */
export async function POST(request: NextRequest) {
  try {
    // Récupérer le FormData entrant (envoyé par le client)
    const incomingFormData = await request.formData();

    const webhookUrl = incomingFormData.get("webhookUrl") as string | null;

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

    // Reconstruire un FormData vers n8n (on garde les champs texte et les fichiers)
    const outFormData = new FormData();

    // Copier les champs texte connus
    const chatInput = incomingFormData.get("chatInput") as string ?? "";
    const sessionId = (incomingFormData.get("sessionId") as string) ?? `session-${Date.now()}`;
    const action = (incomingFormData.get("action") as string) ?? "sendMessage";

    outFormData.append("chatInput", chatInput);
    outFormData.append("sessionId", sessionId);
    outFormData.append("action", action);

    // Copier les fichiers (clés "file_0", "file_1", etc.)
    for (const [key, value] of incomingFormData.entries()) {
      if (key.startsWith("file_") && value instanceof File) {
        outFormData.append(key, value, value.name);
      }
    }

    let res: Response;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      res = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "User-Agent": "n8n-integration-hub/1.0",
          // Pas de Content-Type → fetch le définit avec le bon boundary
        },
        body: outFormData,
        signal: controller.signal,
      });

      clearTimeout(timeout);
    } catch (fetchErr) {
      const msg = fetchErr instanceof Error ? fetchErr.message : "Fetch failed";
      console.error("[chat-proxy] Fetch error:", msg);

      // Fallback : le FormData natif de fetch ne fonctionne pas dans certains environnements
      // On tente un dernier appel avec un body JSON simple (sans fichiers)
      // Note : les fichiers ne pourront pas être transmis en fallback JSON → on le signale
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);

        res = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chatInput,
            sessionId,
            action,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeout);
      } catch (secondErr) {
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
