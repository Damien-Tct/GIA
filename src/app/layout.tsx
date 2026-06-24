import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import DarkModeToggle from "@/components/DarkModeToggle";
import { theme } from "@/lib/theme";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: theme.appTitle,
  description: "Intégration de chats et formulaires",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="h-full flex flex-col transition-colors duration-200"
        style={{
          backgroundColor: "var(--bg-primary)",
          color: "var(--text-primary)",
        }}
      >
        {/* Script anti-flash : exécuté avant le premier rendu par Next.js */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark')}else{document.documentElement.classList.remove('dark')}})();`,
          }}
        />
        <div className="relative">
          <Navbar />
          <div className="absolute right-4 sm:right-6 lg:right-8 top-1/2 -translate-y-1/2 z-10">
            <DarkModeToggle />
          </div>
        </div>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </body>
    </html>
  );
}
