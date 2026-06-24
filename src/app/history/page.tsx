"use client";

import { useEffect, useState } from "react";
import { SubmissionLog } from "@/lib/types";

export default function HistoryPage() {
  const [logs, setLogs] = useState<SubmissionLog[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const limit = 50;

  const fetchLogs = async (newOffset: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/logs?limit=${limit}&offset=${newOffset}`);
      const data = await res.json();
      setLogs(data.logs ?? []);
      setTotal(data.total ?? 0);
      setOffset(newOffset);
    } catch {
      setLogs([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(0);
  }, []);

  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">📋 Historique des soumissions</h1>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Chargement…</div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 text-gray-500">Aucune soumission enregistrée.</div>
      ) : (
        <>
          {/* Compteur */}
          <p className="text-sm text-gray-500 mb-4">
            {total} soumission{total > 1 ? "s" : ""} au total
          </p>

          {/* Tableau */}
          <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Module</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Date</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Statut</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Erreur</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {log.moduleTitle}
                      <span className="ml-2 text-xs text-gray-400">({log.moduleId})</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString("fr-FR")}
                    </td>
                    <td className="px-4 py-3">
                      {log.success ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                          ✅ Succès
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
                          ❌ Échec
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-red-600 max-w-xs truncate" title={log.error}>
                      {log.error || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <button
                onClick={() => fetchLogs(Math.max(offset - limit, 0))}
                disabled={offset === 0}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ← Page précédente
              </button>
              <span className="text-sm text-gray-500">
                Page {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => fetchLogs(offset + limit)}
                disabled={offset + limit >= total}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Page suivante →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
