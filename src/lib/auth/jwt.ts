import { SignJWT, jwtVerify } from "jose";

const SECRET_ENV = process.env.AUTH_SECRET;
if (!SECRET_ENV) {
  console.warn(
    "\x1b[33m⚠️  AUTH_SECRET non défini — utilisation d'un secret par défaut.\x1b[0m\n" +
    "  → Définissez AUTH_SECRET dans .env.local pour sécuriser les sessions.\n" +
    "  → Exemple : AUTH_SECRET=\"$(openssl rand -base64 32)\"\n"
  );
} else if (SECRET_ENV === "dev-secret-change-me-in-production") {
  console.warn(
    "\x1b[33m⚠️  AUTH_SECRET est le secret par défaut — CHANGEZ-LE en production !\x1b[0m\n" +
    "  → Générez-en un nouveau : AUTH_SECRET=\"$(openssl rand -base64 32)\"\n"
  );
}
const SECRET = new TextEncoder().encode(
  SECRET_ENV || "dev-secret-change-me-in-production"
);

export interface JwtPayload {
  id: string;
  email: string;
  name: string;
  role: "admin" | "user";
}

export async function createToken(payload: JwtPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as JwtPayload;
  } catch {
    return null;
  }
}
