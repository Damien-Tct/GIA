"use client";

export default function DarkModeToggle() {
  const toggle = () => {
    const isDark = document.documentElement.classList.contains("dark");
    const next = !isDark;
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      aria-label="Basculer le mode sombre"
    >
      {/* Les deux icônes sont rendues côté serveur → pas de mismatch hydration.
          Le CSS dark:inline/hidden basé sur la classe .dark (déjà posée par
          l'anti-flash script) affiche la bonne icône dès le premier paint. */}
      <span className="dark:hidden">🌙</span>
      <span className="hidden dark:inline">☀️</span>
    </button>
  );
}
