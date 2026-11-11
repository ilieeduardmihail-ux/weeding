#!/usr/bin/env node
/**
 * Creates an admin account in Supabase, or resets the password of an existing one.
 *
 * Usage:
 *   npm run create-admin -- email@exemplu.ro            (parolă generată automat)
 *   npm run create-admin -- email@exemplu.ro ParolaMea1! (parolă dată de tine)
 *
 * Needs SUPABASE_SERVICE_ROLE_KEY in .env.local (Project Settings → API keys).
 * The key bypasses Row Level Security, so it must never reach the browser or git.
 *
 * Accounts created here get `must_change_password: true`, which makes the admin
 * show the "choose your own password" notice after the first login.
 */
import { randomInt } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
loadEnv(join(root, ".env.local"));

const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "").trim();
const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();

if (!url || !serviceKey) {
  console.error(
    [
      "Lipsește configurarea pentru crearea conturilor.",
      "",
      "Adaugă în .env.local (fișier ignorat de git):",
      "  SUPABASE_SERVICE_ROLE_KEY=...",
      "",
      "Cheia o găsești în Supabase → Project Settings → API keys → service_role",
      "(secret key). Nu o pune în Vercel și nu o prefixa cu NEXT_PUBLIC_.",
    ].join("\n"),
  );
  process.exit(1);
}

const [emailArg, passwordArg] = process.argv.slice(2);
if (!emailArg || emailArg === "--help") {
  console.log("Folosire: npm run create-admin -- email@exemplu.ro [parolă]");
  process.exit(emailArg ? 0 : 1);
}

const email = emailArg.trim().toLowerCase();
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error(`Email invalid: ${emailArg}`);
  process.exit(1);
}

const password = passwordArg ?? generatePassword();
if (password.length < 6) {
  console.error("Supabase cere o parolă de minim 6 caractere.");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const existing = await findUser(email);
let created = false;

if (existing) {
  const { error } = await supabase.auth.admin.updateUserById(existing.id, {
    password,
    email_confirm: true,
    user_metadata: {
      ...(existing.user_metadata ?? {}),
      must_change_password: true,
    },
  });
  if (error) fail("Nu am putut actualiza contul existent", error);
} else {
  const { error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { must_change_password: true },
  });
  if (error) fail("Nu am putut crea contul", error);
  created = true;
}

// Being in auth.users is not enough: the app only trusts the `admins` table.
const { error: adminError } = await supabase
  .from("admins")
  .upsert({ email }, { onConflict: "email" });
if (adminError) fail("Contul există, dar nu am putut adăuga emailul în tabela admins", adminError);

console.log("");
console.log(created ? "✔ Cont admin creat" : "✔ Cont admin existent — parolă resetată");
console.log(`  Email:  ${email}`);
console.log(`  Parolă: ${password}`);
console.log("");
console.log("La prima autentificare, adminul cere trimiterea emailului de schimbare a parolei.");
if (!passwordArg) {
  console.log("Păstrează parola până la prima logare, apoi nu mai e necesară.");
}

/* ------------------------------------------------------------------ helpers */

async function findUser(target) {
  for (let page = 1; page <= 25; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) fail("Nu am putut citi lista de utilizatori", error);
    const user = data.users.find((item) => item.email?.toLowerCase() === target);
    if (user) return user;
    if (data.users.length < 200) return null;
  }
  return null;
}

function generatePassword(length = 16) {
  const sets = [
    "ABCDEFGHJKLMNPQRSTUVWXYZ",
    "abcdefghijkmnopqrstuvwxyz",
    "23456789",
    "!@#$%^&*-_=+",
  ];
  const all = sets.join("");
  const chars = sets.map((set) => set[randomInt(set.length)]);
  while (chars.length < length) chars.push(all[randomInt(all.length)]);
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

function loadEnv(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[match[1]]) process.env[match[1]] = value;
  }
}

function fail(message, error) {
  console.error(`\n✖ ${message}.`);
  if (error?.message) console.error(`  ${error.message}`);
  process.exit(1);
}
