import fs from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "users.json");

interface StoredUser {
  id: string;
  email: string;
  name: string;
  password: string;
  role: "admin" | "user";
  createdAt: string;
}

interface UsersData {
  users: StoredUser[];
}

function readUsers(): UsersData {
  try {
    if (!fs.existsSync(DATA_FILE)) return { users: [] };
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  } catch {
    return { users: [] };
  }
}

function writeUsers(data: UsersData): void {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export function countUsers(): number {
  return readUsers().users.length;
}

export function findUserByEmail(email: string): StoredUser | undefined {
  return readUsers().users.find((u) => u.email === email);
}

export function findUserById(id: string): StoredUser | undefined {
  return readUsers().users.find((u) => u.id === id);
}

export function addUser(user: StoredUser): void {
  const data = readUsers();
  if (data.users.some((u) => u.email === user.email)) {
    throw new Error("Un utilisateur avec cet email existe déjà");
  }
  data.users.push(user);
  writeUsers(data);
}

export function updateUser(email: string, updates: Partial<StoredUser>): StoredUser | undefined {
  const data = readUsers();
  const idx = data.users.findIndex((u) => u.email === email);
  if (idx === -1) return undefined;
  data.users[idx] = { ...data.users[idx], ...updates };
  writeUsers(data);
  return data.users[idx];
}
