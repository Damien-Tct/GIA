"use client";

import { useState, FormEvent } from "react";
import { N8nModule, WebhookResponse } from "@/lib/types";

interface WebhookFormProps {
  module: N8nModule;
}

interface DisplayMessage {
  type: "success" | "info" | "warning" | "error";
  title: string;
  message: string;
}

function formatWebhookResponse(response: WebhookResponse): DisplayMessage {
  // Si le webhook a explicitement répondu avec un message
  if (response.message) {
    return {
      type: response.success ? "success" : "error",
      title: response.success ? "✅ Succès" : "❌ Erreur",
      message: response.message,
    };
  }

  // Si data est une string, on l'affiche directement
  if (typeof response.data === "string") {
    return {
      type: "success",
      title: "✅ Réponse reçue",
      message: response.data,
    };
  }

  // Si data est un objet structuré
  if (response.data && typeof response.data === "object") {
    const obj = response.data as Record<string, unknown>;
    const text = obj.message || obj.text || obj.reply || obj.output || obj.response;
    if (typeof text === "string") {
      return {
        type: obj.success === false ? "error" : "success",
        title: obj.success === false ? "❌ Erreur" : "✅ Réponse reçue",
        message: text,
      };
    }
    // Si c'est juste des données, on les affiche joliment
    return {
      type: "info",
      title: "📦 Données reçues",
      message: JSON.stringify(response.data, null, 2),
    };
  }

  // Fallback
  return {
    type: "success",
    title: "✅ Envoyé avec succès",
    message: "Votre soumission a bien été transmise.",
  };
}

function ResponseBanner({ display }: { display: DisplayMessage }) {
  const colors = {
    success: {
      bg: "bg-green-50 dark:bg-green-950/30",
      border: "border-green-200 dark:border-green-800",
      text: "text-green-800 dark:text-green-300",
    },
    info: {
      bg: "bg-blue-50 dark:bg-blue-950/30",
      border: "border-blue-200 dark:border-blue-800",
      text: "text-blue-800 dark:text-blue-300",
    },
    warning: {
      bg: "bg-amber-50 dark:bg-amber-950/30",
      border: "border-amber-200 dark:border-amber-800",
      text: "text-amber-800 dark:text-amber-300",
    },
    error: {
      bg: "bg-red-50 dark:bg-red-950/30",
      border: "border-red-200 dark:border-red-800",
      text: "text-red-800 dark:text-red-300",
    },
  };

  const c = colors[display.type];

  return (
    <div className={`mb-6 p-5 rounded-xl border ${c.bg} ${c.border}`}>
      <div className="flex items-start gap-3">
        <span className="text-xl shrink-0">{display.title.split(" ")[0]}</span>
        <div className="min-w-0">
          <h3 className={`font-semibold text-sm ${c.text} mb-1`}>
            {display.title}
          </h3>
          <div className={`text-sm whitespace-pre-wrap ${c.text} opacity-90`}>
            {display.message}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WebhookForm({ module }: WebhookFormProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<WebhookResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResponse(null);
    setError(null);

    const missingFields = (module.webhookFields || [])
      .filter((f) => f.required && !formData[f.name]?.trim())
      .map((f) => f.label);

    if (missingFields.length > 0) {
      setError(`Champs obligatoires manquants : ${missingFields.join(", ")}`);
      setLoading(false);
      return;
    }

    try {
      const payload = {
        ...formData,
        _module: module.id,
        _timestamp: new Date().toISOString(),
      };

      const res = await fetch(module.webhookUrl!, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data: WebhookResponse = await res.json();

      if (!data.success && !data.message && !data.data) {
        data.success = res.ok;
      }

      setResponse(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur de connexion au webhook n8n. Vérifiez l'URL."
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({});
    setResponse(null);
    setError(null);
  };

  // État final : réponse reçue
  if (response && !error) {
    const display = formatWebhookResponse(response);

    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8 text-center">
          <ResponseBanner display={display} />

          {/* Afficher les données brutes si c'est de l'info */}
          {display.type === "info" && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-6 text-left">
              <p className="text-xs font-mono text-gray-500 mb-2">Données complètes :</p>
              <pre className="text-xs font-mono text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-all max-h-60 overflow-y-auto">
                {display.message}
              </pre>
            </div>
          )}

          <button
            onClick={resetForm}
            className="px-6 py-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all font-medium shadow-sm"
          >
            📝 Nouvelle soumission
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8">
        {/* En-tête */}
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100 dark:border-gray-800">
          <span className="text-3xl">{module.icon}</span>
          <div>
            <h1 className="text-xl font-semibold">{module.title}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {module.description}
            </p>
          </div>
        </div>

        {/* Erreur locale */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            <span className="font-medium">Erreur :</span> {error}
          </div>
        )}

        {/* Erreur du webhook */}
        {response && !response.success && (
          <ResponseBanner
            display={{
              type: "error",
              title: "❌ Erreur",
              message: response.error || response.message || "Le webhook a retourné une erreur",
            }}
          />
        )}

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {(module.webhookFields || []).map((field) => (
            <div key={field.name}>
              <label
                htmlFor={field.name}
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>

              {field.type === "textarea" ? (
                <textarea
                  id={field.name}
                  name={field.name}
                  required={field.required}
                  placeholder={field.placeholder}
                  value={formData[field.name] || ""}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow text-sm"
                />
              ) : field.type === "select" ? (
                <select
                  id={field.name}
                  name={field.name}
                  required={field.required}
                  value={formData[field.name] || ""}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow text-sm"
                >
                  <option value="">Sélectionnez...</option>
                  {(field.options || []).map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id={field.name}
                  name={field.name}
                  type={field.type}
                  required={field.required}
                  placeholder={field.placeholder}
                  value={formData[field.name] || ""}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow text-sm"
                />
              )}
            </div>
          ))}

          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-gray-400">* Champs obligatoires</p>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center gap-2 shadow-sm"
            >
              {loading ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  Envoi en cours...
                </>
              ) : (
                "📤 Envoyer"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
