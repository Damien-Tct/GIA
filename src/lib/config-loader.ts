import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { n8nModules as defaultModules } from "./config";
import { N8nModule } from "./types";

const CUSTOM_CONFIG_PATH = join(process.cwd(), "data", "config-custom.json");

/**
 * Charge les modules : fichier custom s'il existe, sinon la config par défaut.
 * Utilisable côté serveur uniquement (page.tsx, layout.tsx, api routes).
 */
export function loadModules(): N8nModule[] {
  try {
    if (existsSync(CUSTOM_CONFIG_PATH)) {
      const raw = readFileSync(CUSTOM_CONFIG_PATH, "utf-8");
      return JSON.parse(raw) as N8nModule[];
    }
  } catch {
    // Fallback silencieux
  }
  return defaultModules;
}
