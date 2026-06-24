"use client";

import { useState, FormEvent, useRef } from "react";
import { N8nModule, WebhookField, WebhookResponse } from "@/lib/types";

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
  const [formData, setFormData] = useState<Record<string, string | string[]>>({});
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<WebhookResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ─── Gestion des fichiers ───────────────────────────────────────────────
  interface FileInfo {
    filename: string;
    mimeType: string;
    size: number;
    data: string; // base64 (sans le préfixe data:...)
    id: string;   // clé unique par fichier (pour le key React)
  }
  const [fileData, setFileData] = useState<Record<string, FileInfo[]>>({});
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 Mo

  /** Ajoute un ou plusieurs fichiers à la liste d'un champ */
  const addFiles = (name: string, files: FileList | null) => {
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (file.size > MAX_FILE_SIZE) {
        setError(
          `Le fichier "${file.name}" dépasse la limite de ${MAX_FILE_SIZE / 1024 / 1024} Mo.`
        );
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.includes("base64,") ? result.split("base64,")[1] : result;
        setFileData((prev) => ({
          ...prev,
          [name]: [...(prev[name] || []), {
            filename: file.name,
            mimeType: file.type,
            size: file.size,
            data: base64,
            id: crypto.randomUUID(),
          }],
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  /** Supprime un fichier d'un champ par son index */
  const removeFileAt = (name: string, index: number) => {
    setFileData((prev) => {
      const arr = prev[name] || [];
      return { ...prev, [name]: arr.filter((_, i) => i !== index) };
    });
  };

  const handleChange = (name: string, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ─── Gestion des champs "list" ───────────────────────────────────────────

  /** Ajoute une ligne vide à une liste */
  const addListItem = (name: string) => {
    setFormData((prev) => {
      const current = prev[name];
      const arr = Array.isArray(current) ? [...current] : [];
      arr.push("");
      return { ...prev, [name]: arr };
    });
  };

  /** Met à jour une ligne d'une liste */
  const updateListItem = (name: string, index: number, value: string) => {
    setFormData((prev) => {
      const arr = Array.isArray(prev[name]) ? [...(prev[name] as string[])] : [];
      arr[index] = value;
      return { ...prev, [name]: arr };
    });
  };

  /** Supprime une ligne d'une liste */
  const removeListItem = (name: string, index: number) => {
    setFormData((prev) => {
      const arr = Array.isArray(prev[name])
        ? (prev[name] as string[]).filter((_, i) => i !== index)
        : [];
      return { ...prev, [name]: arr.length > 0 ? arr : [] };
    });
  };

  // ─── Soumission ──────────────────────────────────────────────────────────

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResponse(null);
    setError(null);

    const missingLabels: string[] = [];

    for (const field of module.webhookFields || []) {
      if (!field.required) continue;
      const val = formData[field.name];

      if (field.type === "list") {
        // Pour les listes : required vérifie qu'il y a au moins une valeur non vide
        const arr = Array.isArray(val) ? (val as string[]) : [];
        const nonEmpty = arr.filter((v) => v.trim() !== "");
        if (nonEmpty.length === 0) {
          missingLabels.push(field.label);
        }
      } else if (field.type === "file") {
        // Pour les fichiers : required vérifie qu'au moins un fichier est sélectionné
        const files = fileData[field.name];
        if (!files || files.length === 0) {
          missingLabels.push(field.label);
        }
      } else {
        if (!val || (typeof val === "string" && !val.trim())) {
          missingLabels.push(field.label);
        }
      }
    }

    if (missingLabels.length > 0) {
      setError(`Champs obligatoires manquants : ${missingLabels.join(", ")}`);
      setLoading(false);
      return;
    }

    try {
      const payload: Record<string, unknown> = {
        _module: module.id,
        _timestamp: new Date().toISOString(),
      };

      // On construit le payload : les listes sont envoyées en tant que tableaux
      for (const field of module.webhookFields || []) {
        const val = formData[field.name];
        if (field.type === "list") {
          payload[field.name] = Array.isArray(val)
            ? (val as string[]).filter((v) => v.trim() !== "")
            : [];
        } else if (field.type === "file") {
          const files = fileData[field.name] || [];
          payload[field.name] = files.map((f) => ({
            filename: f.filename,
            mimeType: f.mimeType,
            size: f.size,
            data: f.data,
          }));
        } else {
          payload[field.name] = typeof val === "string" ? val : "";
        }
      }

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
    setFileData({});
    setResponse(null);
    setError(null);
  };

  // ─── Rendu d'un champ individuel ─────────────────────────────────────────

  const renderField = (field: WebhookField) => {
    const baseInput =
      "w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow text-sm";

    // ── Radio ────────────────────────────────────────────────────────────
    if (field.type === "radio") {
      return (
        <fieldset className="space-y-2">
          {(field.options || []).map((opt) => (
            <label
              key={opt.value}
              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                formData[field.name] === opt.value
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-600"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              <input
                type="radio"
                name={field.name}
                value={opt.value}
                checked={formData[field.name] === opt.value}
                onChange={(e) => handleChange(field.name, e.target.value)}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-800 dark:text-gray-200">
                {opt.label}
              </span>
            </label>
          ))}
        </fieldset>
      );
    }

    // ── List (dynamique) ─────────────────────────────────────────────────
    if (field.type === "list") {
      const items = Array.isArray(formData[field.name])
        ? (formData[field.name] as string[])
        : [];

      return (
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type={field.listType || "text"}
                value={item}
                onChange={(e) => updateListItem(field.name, idx, e.target.value)}
                placeholder={field.placeholder || `Élément ${idx + 1}`}
                className={`${baseInput} flex-1`}
              />
              <button
                type="button"
                onClick={() => removeListItem(field.name, idx)}
                className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg border border-red-200 dark:border-red-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                title="Supprimer"
              >
                ✕
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={() => addListItem(field.name)}
            className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
          >
            <span className="text-lg leading-none">+</span>
            Ajouter
          </button>
        </div>
      );
    }

    // ── Fichier ────────────────────────────────────────────────────────────
    if (field.type === "file") {
      const files = fileData[field.name] || [];
      const isMulti = field.multiple === true;

      return (
        <div className="space-y-3">
          {/* Liste des fichiers déjà sélectionnés */}
          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((f, idx) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-lg shrink-0">📎</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                        {f.filename}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(f.size / 1024).toFixed(1)} Ko
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFileAt(field.name, idx)}
                    className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg border border-red-200 dark:border-red-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    title="Supprimer le fichier"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Zone d'ajout (toujours visible) */}
          <label
            htmlFor={`file-${field.name}`}
            className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors bg-gray-50 dark:bg-gray-800/50"
          >
            <span className="text-2xl">📄</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {isMulti ? "Ajouter des fichiers" : files.length > 0 ? "Changer le fichier" : "Cliquez pour sélectionner un fichier"}
            </span>
            {isMulti && (
              <span className="text-[10px] text-gray-400">
                Vous pouvez sélectionner plusieurs fichiers à la fois
              </span>
            )}
            {field.accept && (
              <span className="text-[10px] text-gray-400">
                Formats acceptés : {field.accept}
              </span>
            )}
          </label>

          <input
            ref={(el) => {
              fileInputs.current[field.name] = el;
            }}
            id={`file-${field.name}`}
            type="file"
            accept={field.accept}
            multiple={isMulti}
            onChange={(e) => {
              const fl = e.target.files;
              if (!fl || fl.length === 0) return;
              if (!isMulti) {
                // Mono-fichier : remplacer la sélection
                setFileData((prev) => ({ ...prev, [field.name]: [] }));
              }
              addFiles(field.name, fl);
              // Reset value pour permettre de re-sélectionner le même fichier
              e.target.value = "";
            }}
            className="hidden"
          />
        </div>
      );
    }

    // ── Textarea ──────────────────────────────────────────────────────────
    if (field.type === "textarea") {
      return (
        <textarea
          id={field.name}
          name={field.name}
          required={field.required}
          placeholder={field.placeholder}
          value={typeof formData[field.name] === "string" ? (formData[field.name] as string) : ""}
          onChange={(e) => handleChange(field.name, e.target.value)}
          rows={4}
          className={baseInput}
        />
      );
    }

    // ── Select ────────────────────────────────────────────────────────────
    if (field.type === "select") {
      return (
        <select
          id={field.name}
          name={field.name}
          required={field.required}
          value={typeof formData[field.name] === "string" ? (formData[field.name] as string) : ""}
          onChange={(e) => handleChange(field.name, e.target.value)}
          className={baseInput}
        >
          <option value="">Sélectionnez...</option>
          {(field.options || []).map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );
    }

    // ── Input par défaut (text, email, number, file) ────────────────────
    const inputType = field.type === "number" ? "number"
      : field.type === "email" ? "email"
      : "text";
    return (
      <input
        id={field.name}
        name={field.name}
        type={inputType}
        required={field.required}
        placeholder={field.placeholder}
        value={typeof formData[field.name] === "string" ? (formData[field.name] as string) : ""}
        onChange={(e) => handleChange(field.name, e.target.value)}
        className={baseInput}
      />
    );
  };

  // ─── État final : réponse reçue ───────────────────────────────────────────
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

  // ─── Formulaire ───────────────────────────────────────────────────────────
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
                htmlFor={field.type === "radio" ? undefined : field.type === "file" ? `file-${field.name}` : field.name}
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>

              {renderField(field)}
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
