import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { findUserByEmail } from "@/lib/auth/users";
import { createToken } from "@/lib/auth/jwt";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email et mot de passe requis" }, { status: 400 });
    }

    // 1. Authentification locale
    const user = findUserByEmail(email);
    if (user && user.password) {
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return NextResponse.json({ error: "Email ou mot de passe incorrect" }, { status: 401 });
      }

      const token = await createToken({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      });

      const cookieStore = await cookies();
      cookieStore.set("auth-token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24, // 24h
        path: "/",
      });

      return NextResponse.json({ success: true, user: { email: user.email, name: user.name, role: user.role } });
    }

    // 2. LDAP si configuré
    if (process.env.AUTH_LDAP_ENABLED === "true") {
      try {
        const ldap = await import("ldapjs");
        const client = ldap.createClient({ url: process.env.AUTH_LDAP_URL || "" });

        const ldapUser = await new Promise<any>((resolve) => {
          const searchFilter = (process.env.AUTH_LDAP_SEARCH_FILTER || "(&(objectClass=inetOrgPerson)(mail={{email}}))").replace("{{email}}", email);

          client.bind(process.env.AUTH_LDAP_BIND_DN || "", process.env.AUTH_LDAP_BIND_PASSWORD || "", (bindErr: any) => {
            if (bindErr) { resolve(null); return; }
            client.search(process.env.AUTH_LDAP_SEARCH_BASE || "", { filter: searchFilter, scope: "sub" }, (searchErr: any, res: any) => {
              if (searchErr) { resolve(null); return; }
              let found: any = null;
              res.on("searchEntry", (entry: any) => {
                const testClient = ldap.createClient({ url: process.env.AUTH_LDAP_URL || "" });
                testClient.bind(entry.dn.toString(), password, (err2: any) => {
                  if (!err2) {
                    found = {
                      email: entry.object.mail || email,
                      name: entry.object.cn || entry.object.displayName || email,
                    };
                  }
                  testClient.unbind();
                });
              });
              res.on("end", () => {
                client.unbind();
                resolve(found);
              });
            });
          });
        });

        if (ldapUser) {
          const token = await createToken({
            id: `ldap_${ldapUser.email}`,
            email: ldapUser.email,
            name: ldapUser.name,
            role: "user",
          });

          const cookieStore = await cookies();
          cookieStore.set("auth-token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24,
            path: "/",
          });

          return NextResponse.json({ success: true, user: ldapUser });
        }
      } catch (ldapErr) {
        console.error("[LDAP] Erreur:", ldapErr);
      }
    }

    return NextResponse.json({ error: "Email ou mot de passe incorrect" }, { status: 401 });
  } catch (err) {
    console.error("[Login] Erreur:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

