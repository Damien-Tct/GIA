import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";
import { listUsers, deleteUser } from "@/lib/auth/users";
import { cookies } from "next/headers";

async function checkAdmin(): Promise<NextResponse | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  if (!token) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Session invalide" }, { status: 401 });
  if (payload.role !== "admin") return NextResponse.json({ error: "Accès refusé (admin requis)" }, { status: 403 });
  return null;
}

export async function GET() {
  const err = await checkAdmin();
  if (err) return err;
  const users = listUsers();
  return NextResponse.json({ users });
}

export async function DELETE(request: NextRequest) {
  const err = await checkAdmin();
  if (err) return err;

  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  const payload = token ? await verifyToken(token) : null;

  const { email } = await request.json();
  if (!email) return NextResponse.json({ error: "Email requis" }, { status: 400 });
  if (email === payload?.email) return NextResponse.json({ error: "Vous ne pouvez pas vous supprimer vous-même" }, { status: 400 });

  const deleted = deleteUser(email);
  if (!deleted) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  return NextResponse.json({ success: true });
}
