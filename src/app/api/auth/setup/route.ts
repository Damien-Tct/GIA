import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { countUsers, addUser } from "@/lib/auth/users";
import { createToken } from "@/lib/auth/jwt";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    // Vérifier qu'aucun utilisateur n'existe déjà
    if (countUsers() > 0) {
      return NextResponse.json({ error: "Un utilisateur existe déjà" }, { status: 400 });
    }

    const { email, name, password } = await request.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json({ error: "Mot de passe trop court (min 6 caractères)" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    addUser({
      id: `user_${Date.now()}`,
      email,
      name: name || email,
      password: hashedPassword,
      role: "admin",
      createdAt: new Date().toISOString(),
    });

    // Créer le token de session
    const token = await createToken({
      id: `user_${Date.now()}`,
      email,
      name: name || email,
      role: "admin",
    });

    const cookieStore = await cookies();
    cookieStore.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Setup] Erreur:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
