"use client";

import { useState, useRef, useEffect } from "react";
import { N8nModule, ChatMessage } from "@/lib/types";

interface N8nChatProps {
  module: N8nModule;
}

export default function N8nChat({ module }: N8nChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `👋 Bonjour ! Bienvenue sur **${module.title}**.

${module.description}

Comment puis-je vous aider aujourd'hui ?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showScrollbar, setShowScrollbar] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sessionId = useRef(`session-${module.id}-${Date.now()}`);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Ajuster la hauteur et gérer l'affichage de la scrollbar
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      const newHeight = Math.min(ta.scrollHeight, 200);
      ta.style.height = newHeight + "px";

      // Afficher la scrollbar seulement si > 6 lignes (~144px)
      setShowScrollbar(newHeight >= 144);
    }
  }, [input]);

  const sendToWebhook = async (text: string): Promise<string> => {
    try {
      const proxyRes = await fetch("/api/chat-proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          webhookUrl: module.webhookUrl,
          chatInput: text,
          sessionId: sessionId.current,
          action: "sendMessage",
        }),
      });
      const json = await proxyRes.json();
      if (json.success) return extractReply(json.data);
    } catch {
      console.warn("[N8nChat] Proxy failed, trying direct call");
    }

    const directRes = await fetch(module.webhookUrl!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chatInput: text,
        sessionId: sessionId.current,
        action: "sendMessage",
      }),
    });
    if (!directRes.ok) {
      throw new Error(`HTTP ${directRes.status}`);
    }
    const raw = await directRes.text();
    try {
      return extractReply(JSON.parse(raw));
    } catch {
      return raw;
    }
  };

  const extractReply = (data: unknown): string => {
    if (typeof data === "string") return data;
    if (data && typeof data === "object") {
      const obj = data as Record<string, unknown>;
      return (obj.output ||
        obj.response ||
        obj.reply ||
        obj.message ||
        obj.text ||
        JSON.stringify(obj, null, 2)) as string;
    }
    return String(data);
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending || !module.webhookUrl) return;

    setError(null);
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      const reply = await sendToWebhook(text);
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: reply,
          timestamp: new Date(),
        },
      ]);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Erreur inconnue";
      setError(errMsg);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: `❌ **Erreur**

\`${errMsg}\`

**Solutions :**
1. Activez le workflow n8n
2. Vérifiez l'URL : \`${module.webhookUrl}\`
3. Configurez les **CORS** dans le Chat Trigger n8n`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="flex flex-col h-full bg-white">
      {/* ── En-tête ── */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl shadow-sm shrink-0">
          {module.icon}
        </div>
        <div className="min-w-0">
          <h1 className="text-base font-semibold text-gray-900 truncate">
            {module.title}
          </h1>
          <p className="text-xs text-gray-500 truncate">
            {module.description}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-xs text-green-600 font-medium shrink-0">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-sm shadow-green-400" />
          En ligne
        </div>
      </div>

      {/* ── Zone des messages ── */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-4 bg-gray-50/50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[88%] sm:max-w-[75%] rounded-2xl px-4 py-3 ${
                msg.role === "user"
                  ? "bg-blue-600 text-white rounded-br-md shadow-sm"
                  : "bg-white text-gray-900 rounded-bl-md shadow-sm border border-gray-100"
              }`}
            >
              <div className="text-sm leading-relaxed whitespace-pre-wrap">
                {msg.content}
              </div>
              <p
                className={`text-[10px] mt-1.5 ${
                  msg.role === "user"
                    ? "text-blue-200"
                    : "text-gray-400"
                }`}
              >
                {formatTime(msg.timestamp)}
              </p>
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex justify-start">
            <div className="bg-white rounded-2xl rounded-bl-md px-5 py-4 shadow-sm border border-gray-100">
              <div className="flex gap-1.5">
                {[0, 150, 300].map((delay) => (
                  <div
                    key={delay}
                    className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Barre de saisie ── */}
      <div className="border-t border-gray-200 bg-white">
        <div className="px-4 pt-4 pb-5 max-w-4xl mx-auto">
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Écrivez votre message... (Shift+Enter pour sauter une ligne)"
                disabled={sending || !module.webhookUrl}
                rows={1}
                className={`w-full px-4 py-3 rounded-xl border border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm resize-y min-h-[44px] max-h-[200px] ${
                  showScrollbar ? "overflow-y-auto" : "overflow-y-hidden"
                }`}
              />
            </div>
            <button
              onClick={sendMessage}
              disabled={sending || !input.trim() || !module.webhookUrl}
              className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-300 text-white disabled:text-gray-400 transition-all flex items-center justify-center shrink-0 shadow-sm disabled:shadow-none"
              title="Envoyer (Enter)"
            >
              {sending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19V5M5 12l7-7 7 7"
                  />
                </svg>
              )}
            </button>
          </div>

          <div className="flex justify-between items-center mt-2 px-1">
            <span className="text-[11px] text-gray-400">
              {module.webhookUrl ? (
                <>Enter pour envoyer · Shift+Enter pour un saut de ligne</>
              ) : (
                <span className="text-amber-500">
                  ⚠️ webhookUrl non configurée
                </span>
              )}
            </span>
            {error && (
              <span className="text-[11px] text-red-500 truncate ml-2">
                {error}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
