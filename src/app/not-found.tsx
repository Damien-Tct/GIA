import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <div className="text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h1 className="text-3xl font-bold mb-2">Module non trouvé</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Ce module n&apos;existe pas ou a été supprimé.
        </p>
        <Link
          href="/"
          className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium inline-block"
        >
          ← Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
