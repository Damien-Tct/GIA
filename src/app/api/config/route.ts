import { NextRequest, NextResponse } from "next/server";
import { existsSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { loadModules } from "@/lib/config-loader";
import { N8nModule } from "@/lib/types";

const CUSTOM_CONFIG_PATH = join(process.cwd(), "data", "config-custom.json");

/**
 * GET /api/config
 * Retourne le tableau n8nModules en JSON.
 * Si data/config-custom.json existe, le retourne à la place.
 */
export async function GET() {
  return NextResponse.json(loadModules());
}

/**
 * POST /api/config
 * Reçoit un body JSON (tableau N8nModule[]) et le sauvegarde dans data/config-custom.json.
 */
export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();

    if (!Array.isArray(body)) {
      return NextResponse.json(
        { error: "Le body doit être un tableau de modules" },
        { status: 400 }
      );
    }

    // Validation minimale : chaque élément doit avoir au moins un id et un title
    for (const mod of body) {
      if (!mod || typeof mod !== "object") {
        return NextResponse.json(
          { error: "Chaque module doit être un objet" },
          { status: 400 }
        );
      }
      if (typeof (mod as Record<string, unknown>).id !== "string" || typeof (mod as Record<string, unknown>).title !== "string") {
        return NextResponse.json(
          { error: "Chaque module doit avoir un id (string) et un title (string)" },
          { status: 400 }
        );
      }
    }

    // Créer le répertoire data s'il n'existe pas
    const dataDir = join(process.cwd(), "data");
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }

    writeFileSync(CUSTOM_CONFIG_PATH, JSON.stringify(body, null, 2), "utf-8");

    return NextResponse.json({
      success: true,
      message: "Configuration sauvegardée avec succès",
      count: body.length,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Erreur lors de la sauvegarde de la configuration" },
      { status: 500 }
    );
  }
}
