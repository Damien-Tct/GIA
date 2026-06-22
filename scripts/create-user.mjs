import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import * as readline from "readline";

const DATA_FILE = path.join(process.cwd(), "data", "users.json");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function prompt(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

function readUsers() {
  try {
    if (!fs.existsSync(DATA_FILE)) return { users: [] };
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  } catch {
    return { users: [] };
  }
}

function writeUsers(data) {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

async function main() {
  console.log("\n🔧 Création d'un utilisateur\n");

  const email = await prompt("Email : ");
  if (!email || !email.includes("@")) {
    console.error("❌ Email invalide");
    process.exit(1);
  }

  const name = await prompt("Nom (optionnel) : ") || email;

  const password = await prompt("Mot de passe (min 6 caractères) : ");
  if (!password || password.length < 6) {
    console.error("❌ Mot de passe trop court");
    process.exit(1);
  }

  const role = (await prompt("Rôle [user] (user/admin) : ") || "user").toLowerCase();
  if (role !== "user" && role !== "admin") {
    console.error("❌ Rôle invalide (user ou admin)");
    process.exit(1);
  }

  const hashed = await bcrypt.hash(password, 12);
  const data = readUsers();

  if (data.users.some((u) => u.email === email)) {
    console.error("❌ Cet email existe déjà");
    process.exit(1);
  }

  data.users.push({
    id: `user_${Date.now()}`,
    email,
    name: name || email,
    password: hashed,
    role,
    createdAt: new Date().toISOString(),
  });

  writeUsers(data);
  console.log(`\n✅ Utilisateur créé : ${email} (${role})`);
  console.log("🚀 Vous pouvez vous connecter\n");

  rl.close();
}

main().catch(console.error);
