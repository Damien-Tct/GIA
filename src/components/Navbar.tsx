"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { n8nModules } from "@/lib/config";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [chatsOpen, setChatsOpen] = useState(false);
  const [webhooksOpen, setWebhooksOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.authenticated) setUser(d.user);
      })
      .catch(() => {});
  }, []);

  const chatModules = n8nModules.filter((m) => m.type === "chat" && m.enabled !== false);
  const webhookModules = n8nModules.filter((m) => m.type === "webhook" && m.enabled !== false);

  const isActive = (path: string) =>
    pathname === path || pathname.startsWith(path + "/");

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-bold text-gray-900 shrink-0"
          >
            <span className="text-xl">⚡</span>
            <span className="hidden sm:inline">n8n Integration Hub</span>
            <span className="sm:hidden">Hub</span>
          </Link>

          {/* Desktop */}
          <div className="hidden md:flex items-center gap-1">
            {/* Dropdown Chats */}
            <div className="relative">
              <button
                onClick={() => {
                  setChatsOpen(!chatsOpen);
                  setWebhooksOpen(false);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive("/n8n-chat")
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                💬 Chats
              </button>
              {chatsOpen && (
                <div
                  className="absolute top-full left-0 mt-1 w-72 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50"
                  onMouseLeave={() => setChatsOpen(false)}
                >
                  {chatModules.map((mod) => (
                    <Link
                      key={mod.id}
                      href={`/n8n-chat/${mod.id}`}
                      onClick={() => setChatsOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 transition-colors ${
                        pathname === `/n8n-chat/${mod.id}`
                          ? "bg-blue-50 text-blue-700"
                          : "text-gray-700"
                      }`}
                    >
                      <span className="text-lg shrink-0">{mod.icon}</span>
                      <div className="min-w-0">
                        <div className="font-medium truncate">{mod.title}</div>
                        <div className="text-xs text-gray-500 truncate">
                          {mod.description}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Dropdown Webhooks */}
            <div className="relative">
              <button
                onClick={() => {
                  setWebhooksOpen(!webhooksOpen);
                  setChatsOpen(false);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive("/webhook-form")
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                📋 Formulaires
              </button>
              {webhooksOpen && (
                <div
                  className="absolute top-full left-0 mt-1 w-72 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50"
                  onMouseLeave={() => setWebhooksOpen(false)}
                >
                  {webhookModules.map((mod) => (
                    <Link
                      key={mod.id}
                      href={`/webhook-form/${mod.id}`}
                      onClick={() => setWebhooksOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 transition-colors ${
                        pathname === `/webhook-form/${mod.id}`
                          ? "bg-blue-50 text-blue-700"
                          : "text-gray-700"
                      }`}
                    >
                      <span className="text-lg shrink-0">{mod.icon}</span>
                      <div className="min-w-0">
                        <div className="font-medium truncate">{mod.title}</div>
                        <div className="text-xs text-gray-500 truncate">
                          {mod.description}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Utilisateur + Déconnexion */}
            {user && (
              <div className="flex items-center gap-2 ml-4 pl-4 border-l border-gray-200">
                <span className="text-xs text-gray-500 truncate max-w-[120px]">
                  {user.name || user.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-xs px-3 py-1.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Déconnexion
                </button>
              </div>
            )}
          </div>

          {/* Hamburger mobile */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            aria-label="Menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Menu mobile */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-3 space-y-2">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 pt-1 pb-1">
              💬 Chats
            </div>
            {chatModules.map((mod) => (
              <Link
                key={mod.id}
                href={`/n8n-chat/${mod.id}`}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                  pathname === `/n8n-chat/${mod.id}`
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span className="text-lg shrink-0">{mod.icon}</span>
                <div className="min-w-0">
                  <div className="font-medium truncate">{mod.title}</div>
                  <div className="text-xs text-gray-500 truncate">
                    {mod.description}
                  </div>
                </div>
              </Link>
            ))}
            <div className="pt-3 text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 pb-1">
              📋 Formulaires
            </div>
            {webhookModules.map((mod) => (
              <Link
                key={mod.id}
                href={`/webhook-form/${mod.id}`}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                  pathname === `/webhook-form/${mod.id}`
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span className="text-lg shrink-0">{mod.icon}</span>
                <div className="min-w-0">
                  <div className="font-medium truncate">{mod.title}</div>
                  <div className="text-xs text-gray-500 truncate">
                    {mod.description}
                  </div>
                </div>
              </Link>
            ))}

            {user && (
              <div className="pt-3 border-t border-gray-200 flex items-center justify-between px-2">
                <span className="text-sm text-gray-500 truncate">{user.name || user.email}</span>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="text-xs px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                >
                  Déconnexion
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
