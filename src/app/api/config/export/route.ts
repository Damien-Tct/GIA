import { NextResponse } from "next/server";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { n8nModules } from "@/lib/config";
import { N8nModule } from "@/lib/types";

const CUSTOM_CONFIG_PATH = join(process.cwd(), "data", "config-custom.json");

/**
 * GET /api/config/export
 * Télécharge la configuration actuelle des modules au format JSON.
 * Si data/config-custom.json existe, c'est lui qui est exporté.
 */
export async function GET() {
  let modules: N8nModule[];

  try {
    if (existsSync(CUSTOM_CONFIG_PATH)) {
      const raw = readFileSync(CUSTOM_CONFIG_PATH, "utf-8");
      modules = JSON.parse(raw);
    } else {
      modules = n8nModules;
    }
  } catch {
    modules = n8nModules;
  }

  const json = JSON.stringify(modules, null, 2);

  return new NextResponse(json, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="n8n-config-export.json"`,
    },
  });
}
