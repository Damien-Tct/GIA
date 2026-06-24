"use client";

import { useEffect, useState } from "react";
import { N8nModule } from "@/lib/types";

interface UserInfo {
  id: string;
  email: string;
  name: string;
  role: "admin" | "user";
  createdAt: string;
}

function ModuleEditModal({
  module,
  onSave,
  onClose,
}: {
  module: N8nModule;
  onSave: (updated: N8nModule) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<N8nModule>({ ...module });
  const [fieldsJson, setFieldsJson] = useState(
    JSON.stringify(module.webhookFields || [], null, 2)
  );
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const update = <K extends keyof N8nModule>(key: K, value: N8nModule[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    // Valider le JSON des champs
    try {
      const parsed = JSON.parse(fieldsJson);
      if (!Array.isArray(parsed)) {
        setJsonError("Doit être un tableau");
        return;
      }
      form.webhookFields = parsed;
      setJsonError(null);
    } catch {
      setJsonError("JSON invalide");
      return;
    }

    setSaving(true);
    onSave(form);
  };

  const inputClass =
    "w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold">✏️ Modifier : {module.id}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>
        <div className="flex-1 overflow-auto p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Icône</label>
              <input className={inputClass} value={form.icon || ""} onChange={(e) => update("icon", e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Type</label>
              <select className={inputClass} value={form.type} onChange={(e) => update("type", e.target.value as "chat" | "webhook")}>
                <option value="chat">💬 Chat</option>
                <option value="webhook">📋 Webhook</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Titre</label>
            <input className={inputClass} value={form.title} onChange={(e) => update("title", e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Description</label>
            <textarea className={inputClass} rows={2} value={form.description || ""} onChange={(e) => update("description", e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Webhook URL</label>
            <input className={inputClass} value={form.webhookUrl || ""} onChange={(e) => update("webhookUrl", e.target.value)} placeholder="https://..." />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Message de succès (optionnel)</label>
            <input className={inputClass} value={form.successMessage || ""} onChange={(e) => update("successMessage", e.target.value)} placeholder="Merci ! Votre demande a été envoyée." />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="enabled" checked={form.enabled !== false}
              onChange={(e) => update("enabled", e.target.checked)} className="w-4 h-4 rounded" />
            <label htmlFor="enabled" className="text-sm text-gray-700 dark:text-gray-300">Module activé</label>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Champs du formulaire <span className="text-gray-400">(JSON)</span>
            </label>
            <textarea
              className={`${inputClass} font-mono text-xs`}
              rows={10}
              value={fieldsJson}
              onChange={(e) => { setFieldsJson(e.target.value); setJsonError(null); }}
            />
            {jsonError && <p className="text-xs text-red-500 mt-1">{jsonError}</p>}
          </div>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t border-gray-200 dark:border-gray-700">
          <button onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm hover:bg-gray-50 dark:hover:bg-gray-800">Annuler</button>
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50">
            {saving ? "Enregistrement..." : "💾 Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [modules, setModules] = useState<N8nModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [editingModule, setEditingModule] = useState<N8nModule | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // ─── Utilisateurs ──────────────────────────────────────────────────────
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>("");

  const loadUsers = async () => {
    setUsersLoading(true);
    setUsersError(null);
    try {
      const res = await fetch("/api/users");
      if (res.status === 403) { setUsersError("Accès refusé — droits admin requis"); setUsersLoading(false); return; }
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      setUsersError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setUsersLoading(false);
    }
  };

  const handleRoleToggle = async (email: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    const res = await fetch("/api/users/role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role: newRole }),
    });
    if (!res.ok) {
      const data = await res.json();
      setUsersError(data.error || "Erreur");
      return;
    }
    await loadUsers();
  };

  const handleDeleteUser = async (email: string) => {
    if (!confirm(`Supprimer l'utilisateur "${email}" ? Cette action est irréversible.`)) return;
    const res = await fetch("/api/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      const data = await res.json();
      setUsersError(data.error || "Erreur");
      return;
    }
    await loadUsers();
  };

  // Charger la configuration depuis l'API
  const loadConfig = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/config");
      if (!res.ok) throw new Error(`Erreur HTTP ${res.status}`);
      const data: N8nModule[] = await res.json();
      setModules(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
    loadUsers();
    // Récupérer l'email de l'utilisateur courant
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => { if (d.authenticated) setCurrentUserEmail(d.user.email); })
      .catch(() => {});
  }, []);

  // Exporter la configuration
  const handleExport = () => {
    window.open("/api/config/export", "_blank");
  };

  // Importer un fichier de configuration
  const handleImport = async () => {
    if (!file) {
      setImportError("Veuillez sélectionner un fichier JSON");
      return;
    }

    setImportStatus(null);
    setImportError(null);

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      if (!Array.isArray(parsed)) {
        setImportError("Le fichier doit contenir un tableau de modules");
        return;
      }

      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });

      const result = await res.json();

      if (!res.ok) {
        setImportError(result.error || "Erreur lors de l'import");
        return;
      }

      setImportStatus(`✅ ${result.count} modules importés avec succès`);
      setFile(null);
      // Recharger la config affichée
      await loadConfig();
    } catch (err) {
      setImportError(
        err instanceof Error ? err.message : "Erreur lors de la lecture du fichier"
      );
    }
  };

  // ─── Édition d'un module ────────────────────────────────────────────────
  const handleSaveModule = async (updated: N8nModule) => {
    const newModules = modules.map((m) => (m.id === updated.id ? updated : m));
    const res = await fetch("/api/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newModules),
    });
    if (!res.ok) {
      const data = await res.json();
      setSaveStatus(`❌ Erreur : ${data.error || "Erreur inconnue"}`);
      return;
    }
    setModules(newModules);
    setEditingModule(null);
    setSaveStatus(`✅ Module "${updated.title}" mis à jour`);
    setTimeout(() => setSaveStatus(null), 3000);
  };

  return (
      <div className="min-h-screen bg-gray-50">
        {editingModule && (
          <ModuleEditModal
            module={editingModule}
            onSave={handleSaveModule}
            onClose={() => setEditingModule(null)}
          />
        )}

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Titre */}
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Administration</h1>

          {/* Message de statut */}
          {saveStatus && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl text-green-700 dark:text-green-300 text-sm">
              {saveStatus}
            </div>
          )}

        {/* Section Configuration */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            📦 Configuration des modules
          </h2>

          {loading && (
            <div className="text-gray-500 text-sm py-4">
              Chargement de la configuration...
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-4">
              Erreur : {error}
            </div>
          )}

          {!loading && !error && modules.length === 0 && (
            <div className="text-gray-500 text-sm py-4">
              Aucun module trouvé.
            </div>
          )}

          {!loading && !error && modules.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {modules.map((mod) => (
                <div
                  key={mod.id}
                  onClick={() => setEditingModule(mod)}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col gap-2 cursor-pointer hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{mod.icon || "📦"}</span>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        mod.enabled !== false
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {mod.enabled !== false ? "Activé" : "Désactivé"}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm truncate">
                    {mod.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="bg-gray-100 px-2 py-0.5 rounded-full">
                      {mod.id}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full ${
                        mod.type === "chat"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-purple-100 text-purple-700"
                      }`}
                    >
                      {mod.type === "chat" ? "💬 Chat" : "📋 Webhook"}
                    </span>
                  </div>
                  {mod.description && (
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {mod.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Section Utilisateurs */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
            👥 Gestion des utilisateurs
          </h2>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
            {usersLoading && <p className="text-sm text-gray-500">Chargement...</p>}

            {usersError && (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg px-4 py-3 text-sm mb-4">
                {usersError}
              </div>
            )}

            {!usersLoading && !usersError && users.length === 0 && (
              <p className="text-sm text-gray-500">Aucun utilisateur.</p>
            )}

            {!usersLoading && users.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-2 font-medium text-gray-600 dark:text-gray-400">Email</th>
                      <th className="text-left py-3 px-2 font-medium text-gray-600 dark:text-gray-400">Nom</th>
                      <th className="text-left py-3 px-2 font-medium text-gray-600 dark:text-gray-400">Rôle</th>
                      <th className="text-left py-3 px-2 font-medium text-gray-600 dark:text-gray-400">Créé le</th>
                      <th className="text-right py-3 px-2 font-medium text-gray-600 dark:text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.email} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="py-3 px-2 text-gray-900 dark:text-gray-100">{u.email}</td>
                        <td className="py-3 px-2 text-gray-700 dark:text-gray-300">{u.name}</td>
                        <td className="py-3 px-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            u.role === "admin"
                              ? "bg-purple-100 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300"
                              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                          }`}>
                            {u.role === "admin" ? "👑 Admin" : "👤 Utilisateur"}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-xs text-gray-500">{new Date(u.createdAt).toLocaleDateString("fr-FR")}</td>
                        <td className="py-3 px-2 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleRoleToggle(u.email, u.role)}
                              disabled={u.email === currentUserEmail}
                              className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              title={u.email === currentUserEmail ? "Vous ne pouvez pas changer votre propre rôle" : `Passer en ${u.role === "admin" ? "utilisateur" : "admin"}`}
                            >
                              {u.role === "admin" ? "⬇ Rétrograder" : "⬆ Promouvoir"}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u.email)}
                              disabled={u.email === currentUserEmail}
                              className="text-xs px-2.5 py-1.5 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              title={u.email === currentUserEmail ? "Vous ne pouvez pas vous supprimer" : "Supprimer cet utilisateur"}
                            >
                              🗑 Supprimer
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* Section Exporter */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            📤 Exporter
          </h2>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <p className="text-sm text-gray-600 mb-4">
              Téléchargez la configuration actuelle au format JSON pour la sauvegarder
              ou la partager.
            </p>
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              ⬇️ Télécharger la configuration
            </button>
          </div>
        </section>

        {/* Section Importer */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            📥 Importer
          </h2>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <p className="text-sm text-gray-600 mb-4">
              Importez un fichier JSON de configuration pour remplacer les modules
              actuels.
            </p>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <input
                type="file"
                accept=".json"
                onChange={(e) => {
                  const selectedFile = e.target.files?.[0] || null;
                  setFile(selectedFile);
                  setImportError(null);
                  setImportStatus(null);
                }}
                className="block w-full sm:w-auto text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 transition-colors cursor-pointer"
              />
              <button
                onClick={handleImport}
                disabled={!file}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  file
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                📤 Uploader et importer
              </button>
            </div>

            {importStatus && (
              <div className="mt-4 bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">
                {importStatus}
              </div>
            )}

            {importError && (
              <div className="mt-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                {importError}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
