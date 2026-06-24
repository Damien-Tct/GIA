/**
 * Validation d'URL anti-SSRF.
 * Vérifie qu'une URL est bien formée et ne pointe pas vers des adresses internes.
 */
const BLOCKED_HOSTS = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^0\./,
  /^169\.254\./,
  /^::1$/,
  /^fc00:/i,
  /^fe80:/i,
  /^localhost$/i,
];

export function validateWebhookUrl(urlString: string): {
  valid: boolean;
  error?: string;
  url?: URL;
} {
  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    return { valid: false, error: "URL invalide" };
  }

  // Protocole autorisé
  if (!["http:", "https:"].includes(url.protocol)) {
    return { valid: false, error: "Protocole non autorisé (http/https uniquement)" };
  }

  // Résolution DNS basique
  const hostname = url.hostname.toLowerCase();

  // Bloquer les IP privées/réservées
  for (const pattern of BLOCKED_HOSTS) {
    if (pattern.test(hostname)) {
      return { valid: false, error: "Les adresses internes ne sont pas autorisées" };
    }
  }

  return { valid: true, url };
}
