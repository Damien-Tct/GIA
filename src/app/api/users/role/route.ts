import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";
import { findUserByEmail, updateUser } from "@/lib/auth/users";
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

export async function POST(request: NextRequest) {
  const err = await checkAdmin();
  if (err) return err;

  const { email, role } = await request.json();
  if (!email) return NextResponse.json({ error: "Email requis" }, { status: 400 });
  if (!["admin", "user"].includes(role)) return NextResponse.json({ error: "Rôle invalide (admin ou user)" }, { status: 400 });

  const user = findUserByEmail(email);
  if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

  updateUser(email, { role });
  return NextResponse.json({ success: true, user: { email, name: user.name, role } });
}
