import Link from "next/link";
import { n8nModules } from "@/lib/config";

export default function Home() {
  const chatModules = n8nModules.filter((m) => m.type === "chat" && m.enabled !== false);
  const webhookModules = n8nModules.filter((m) => m.type === "webhook" && m.enabled !== false);

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      {/* Hero */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
          <span className="text-blue-600">Hub d'intégration n8n</span>
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Interface centralisée pour interagir avec vos agents n8n.
        </p>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Discutez avec vos assistants IA ou soumettez des données via des webhooks.
        </p>
      </div>

      {/* Section Chats */}
      <section className="mb-16">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-2xl font-semibold">💬 Chats</h2>
          <span className="text-sm text-gray-500">
            — Agents conversationnels spécialisés
          </span>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {chatModules.map((mod) => (
            <Link
              key={mod.id}
              href={`/n8n-chat/${mod.id}`}
              className="group bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg hover:border-blue-300 transition-all relative"
            >
              {mod.enabled !== false && (
                <span className="absolute top-3 right-3 flex items-center gap-1 text-[10px] text-green-600 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  En ligne
                </span>
              )}
              <div className="text-3xl mb-3">{mod.icon}</div>
              <h3 className="font-semibold text-lg mb-1 group-hover:text-blue-600 transition-colors">
                {mod.title}
              </h3>
              <p className="text-sm text-gray-500">
                {mod.description}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Section Webhooks */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-2xl font-semibold">📋 Formulaires</h2>
          <span className="text-sm text-gray-500">
            — Envoi de données vers les webhook
          </span>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {webhookModules.map((mod) => (
            <Link
              key={mod.id}
              href={`/webhook-form/${mod.id}`}
              className="group bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg hover:border-green-300 transition-all relative"
            >
              {mod.enabled !== false && (
                <span className="absolute top-3 right-3 flex items-center gap-1 text-[10px] text-green-600 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  En ligne
                </span>
              )}
              <div className="text-3xl mb-3">{mod.icon}</div>
              <h3 className="font-semibold text-lg mb-1 group-hover:text-green-600 transition-colors">
                {mod.title}
              </h3>
              <p className="text-sm text-gray-500">
                {mod.description}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

