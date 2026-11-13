#!/usr/bin/env node
/**
 * Seeds the public demo wedding at /demo with fictional data.
 *
 * Usage:
 *   npm run seed-demo            create or refresh the demo tenant
 *   npm run seed-demo -- --reset delete the tenant and rebuild it from scratch
 *
 * Needs SUPABASE_SERVICE_ROLE_KEY in .env.local (it bypasses Row Level Security,
 * so it must never reach the browser, Vercel or git).
 *
 * Everything here is fictional: the couple, the guests, the venues, the money.
 * The tenant is separate from every real client, so the demo can be reset at any
 * time without touching anyone's data.
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
const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://wedding-ro.vercel.app").replace(/\/+$/, "");
const SLUG = "demo";
const ADMIN_EMAIL = "demo@ne-casatorim.ro";
const reset = process.argv.includes("--reset");

if (!url || !serviceKey) {
  console.error(
    [
      "Lipsește configurarea pentru demo.",
      "",
      "Adaugă în .env.local (fișier ignorat de git):",
      "  SUPABASE_SERVICE_ROLE_KEY=...",
      "",
      "Cheia o găsești în Supabase → Project Settings → API keys → service_role.",
    ].join("\n")
  );
  process.exit(1);
}

const db = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/* --------------------------------------------------------------- demo content */

const settings = {
  partner_1: "Daria",
  partner_2: "Radu",
  event_date: "2027-06-12",
  event_time: "16:00",
  city: "Brașov",
  timezone: "Europe/Bucharest",
  contact_email: "contact.necasatorim@gmail.com",
  rsvp_cutoff_date: "2027-05-20",
  seating_published: true,
  public_url: `${SITE}/${SLUG}`,
  invite_message:
    "Bună, {nume}! Cu mare drag te invităm la nunta noastră, pe {data}, la Brașov. " +
    "Toate detaliile și confirmarea prezenței sunt aici: {link}",
  locations_intro:
    "Vă așteptăm cu drag la Brașov. Mai jos găsiți locurile, orele și harta.",
};

const theme = {
  palette: "ivory",
  colors: {},
  floral: { enabled: true, set: "watercolor", intensity: "medium", placement: "frame" },
};

const locations = [
  {
    key: "church",
    label: "Cununia religioasă",
    name: "Biserica Sfânta Treime",
    address: "Strada Toamnei 12, Brașov",
    event_time: "16:00",
    embed_url: null,
  },
  {
    key: "venue",
    label: "Petrecerea",
    name: "Conacul Belvedere",
    address: "Strada Stejerisului 45, Brașov",
    event_time: "19:30",
    embed_url: null,
  },
];

const tables = [
  { number: 1, capacity: 8 },
  { number: 2, capacity: 8 },
  { number: 3, capacity: 8 },
  { number: 4, capacity: 8 },
  { number: 5, capacity: 8 },
  { number: 6, capacity: 8 },
];

/** Confirmations, with their plus-ones. Seat numbers point at `tables`. */
const replies = [
  {
    name: "Ana Ionescu",
    attending: true,
    message: "Abia așteptăm! Venim cu drag la cununie și la petrecere.",
    table_number: 1,
    guests: [
      { name: "Dan Ionescu", is_child: false, table_number: 1 },
      { name: "Mara Ionescu", is_child: true, table_number: 1 },
    ],
  },
  {
    name: "Elena Popescu",
    attending: true,
    message: "Ce veste bună — ne vedem în iunie!",
    table_number: 2,
    guests: [{ name: "Radu Popescu", is_child: false, table_number: 2 }],
  },
  {
    name: "Mihai Dumitrescu",
    attending: false,
    message: "Ne pare rău, suntem plecați exact în acea săptămână. Casă de piatră!",
    table_number: null,
    guests: [],
  },
  {
    name: "Ioana Munteanu",
    attending: true,
    message: "Vom fi acolo, cu toată familia.",
    table_number: null,
    guests: [
      { name: "Vlad Munteanu", is_child: false, table_number: null },
      { name: "Sofia Munteanu", is_child: true, table_number: null },
      { name: "Tudor Munteanu", is_child: true, table_number: null },
    ],
  },
  {
    name: "Cristian Stan",
    attending: true,
    message: "Prezent la petrecere!",
    table_number: 2,
    guests: [],
  },
];

const imported = [
  { full_name: "Alexandru Georgescu", table_number: 2 },
  { full_name: "Bianca Radu", table_number: null },
  { full_name: "Cătălin Marin", table_number: 3 },
  { full_name: "Diana Voicu", table_number: null },
];

const expenses = [
  {
    item_name: "Avans locație",
    category: "Locație",
    currency: "RON",
    total_cost: 4500,
    amount_paid: 4500,
    notes: "Rezervarea sălii și a terasei.",
    daysAgo: 120,
  },
  {
    item_name: "Meniuri (85 de persoane)",
    category: "Catering",
    currency: "RON",
    total_cost: 21250,
    amount_paid: 10000,
    notes: "Avans 50%, restul la final.",
    daysAgo: 96,
  },
  {
    item_name: "Fotograf și album",
    category: "Foto & video",
    currency: "RON",
    total_cost: 6500,
    amount_paid: 2000,
    notes: null,
    daysAgo: 74,
  },
  {
    item_name: "Aranjamente florale",
    category: "Flori & decor",
    currency: "RON",
    total_cost: 3200,
    amount_paid: 0,
    notes: "Ofertă aprobată, plata în mai.",
    daysAgo: 45,
  },
  {
    item_name: "Formație",
    category: "Muzică",
    currency: "RON",
    total_cost: 5500,
    amount_paid: 1500,
    notes: null,
    daysAgo: 30,
  },
  {
    item_name: "Invitații tipărite",
    category: "Papetărie",
    currency: "EUR",
    total_cost: 180,
    amount_paid: 180,
    notes: "120 de invitații, cu plic.",
    daysAgo: 20,
  },
];

/* --------------------------------------------------------------------- seed */

console.log(reset ? "› Reconstruiesc demo-ul de la zero…" : "› Actualizez demo-ul…");

const { data: existing, error: findError } = await db
  .from("tenants")
  .select("id, slug")
  .eq("slug", SLUG)
  .maybeSingle();
if (findError) fail("Nu am putut citi tenantul demo", findError);

let tenantId = existing?.id ?? null;

if (tenantId && reset) {
  // Every tenant-owned table has `on delete cascade`, so this one row takes the
  // demo's settings, guests, tables and expenses with it. Real clients are
  // untouched: only the row with this slug is removed.
  const { error } = await db.from("tenants").delete().eq("id", tenantId);
  if (error) fail("Nu am putut șterge demo-ul vechi", error);
  tenantId = null;
  console.log("  ✓ demo vechi șters");
}

const tenantRow = {
  slug: SLUG,
  display_name: "Daria & Radu",
  status: "active",
  activated_at: new Date().toISOString(),
  expires_at: "2099-12-31T23:59:59Z",
  theme,
};

if (tenantId) {
  const { error } = await db.from("tenants").update(tenantRow).eq("id", tenantId);
  if (error) fail("Nu am putut actualiza tenantul demo", error);
  console.log("  ✓ tenant actualizat");
} else {
  const { data, error } = await db.from("tenants").insert(tenantRow).select("id").single();
  if (error) fail("Nu am putut crea tenantul demo", error);
  tenantId = data.id;
  console.log("  ✓ tenant creat");
}

// Clean the demo's own rows, so running the script twice never duplicates them.
await clearTenantData(tenantId);

// Settings -------------------------------------------------------------------
const { data: settingsRow, error: settingsError } = await db
  .from("event_settings")
  .insert({ tenant_id: tenantId, budget_currency: "RON", ...settings })
  .select("id")
  .single();
if (settingsError) fail("Nu am putut scrie setările demo", settingsError);
console.log(`  ✓ setări (event_settings #${settingsRow.id})`);

// Locations, tables ----------------------------------------------------------
const { error: locationsError } = await db
  .from("locations")
  .insert(locations.map((row) => ({ tenant_id: tenantId, ...row })));
if (locationsError) fail("Nu am putut scrie locațiile demo", locationsError);

const { error: tablesError } = await db
  .from("seating_tables")
  .insert(tables.map((row) => ({ tenant_id: tenantId, ...row })));
if (tablesError) fail("Nu am putut scrie mesele demo", tablesError);
console.log(`  ✓ ${locations.length} locații, ${tables.length} mese`);

// Confirmations, with plus-ones -------------------------------------------------
const now = Date.now();
for (const [index, reply] of replies.entries()) {
  const { guests, ...row } = reply;
  const { data, error } = await db
    .from("rsvps")
    .insert({
      tenant_id: tenantId,
      ...row,
      created_at: new Date(now - (replies.length - index) * 36 * 60 * 60 * 1000).toISOString(),
      consent_at: new Date(now - (replies.length - index) * 36 * 60 * 60 * 1000).toISOString(),
      policy_version: "2026-11",
    })
    .select("id")
    .single();
  if (error) fail(`Nu am putut scrie confirmarea lui ${reply.name}`, error);

  if (guests.length > 0) {
    const { error: guestsError } = await db
      .from("rsvp_guests")
      .insert(guests.map((guest) => ({ tenant_id: tenantId, rsvp_id: data.id, ...guest })));
    if (guestsError) fail(`Nu am putut scrie însoțitorii lui ${reply.name}`, guestsError);
  }
}
console.log(`  ✓ ${replies.length} confirmări`);

// Imported invite list ----------------------------------------------------------
const { error: importedError } = await db
  .from("guests")
  .insert(imported.map((row) => ({ tenant_id: tenantId, ...row })));
if (importedError) fail("Nu am putut scrie lista importată", importedError);
console.log(`  ✓ ${imported.length} invitați importați`);

// Budget, with the payments behind the paid amounts ------------------------------
for (const expense of expenses) {
  const { daysAgo, ...row } = expense;
  const createdAt = new Date(now - daysAgo * 86_400_000).toISOString();
  const { data, error } = await db
    .from("expenses")
    .insert({ tenant_id: tenantId, ...row, created_at: createdAt })
    .select("id")
    .single();
  if (error) fail(`Nu am putut scrie cheltuiala „${expense.item_name}”`, error);

  if (row.amount_paid > 0) {
    const { error: paymentError } = await db.from("expense_payments").insert({
      tenant_id: tenantId,
      expense_id: data.id,
      amount: row.amount_paid,
      note: "Plată demo",
      paid_at: createdAt,
    });
    if (paymentError) fail("Nu am putut scrie plata demo", paymentError);
  }
}
console.log(`  ✓ ${expenses.length} cheltuieli`);

// The demo admin: only for looking at the panel, never linked from the site ------
const password = reset || !existing ? generatePassword() : "(neschimbată)";
let adminId = await findUser(ADMIN_EMAIL);

if (adminId) {
  if (password !== "(neschimbată)") {
    const { error } = await db.auth.admin.updateUserById(adminId, {
      password,
      email_confirm: true,
      user_metadata: { must_change_password: false, demo: true },
    });
    if (error) fail("Nu am putut reseta parola contului demo", error);
  }
} else {
  const { data, error } = await db.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: password === "(neschimbată)" ? generatePassword() : password,
    email_confirm: true,
    user_metadata: { must_change_password: false, demo: true },
  });
  if (error) fail("Nu am putut crea contul demo", error);
  adminId = data.user.id;
}

const { error: memberError } = await db
  .from("tenant_admins")
  .upsert({ tenant_id: tenantId, email: ADMIN_EMAIL }, { onConflict: "tenant_id,email" });
if (memberError) fail("Nu am putut da contului demo acces la panou", memberError);

console.log("");
console.log("✔ Demo gata");
console.log(`  Site public:  ${SITE}/${SLUG}`);
console.log(`  Panou:        ${SITE}/${SLUG}/admin`);
console.log(`  Cont demo:    ${ADMIN_EMAIL}`);
console.log(`  Parolă:       ${password}`);
console.log("");
console.log("Datele sunt fictive. Rulează din nou cu --reset ca să le pui la loc.");

/* ------------------------------------------------------------------ helpers */

async function clearTenantData(id) {
  // Order matters only for tables without a cascade; these all reference rsvps
  // or expenses. `delete().eq()` on an empty table is a no-op.
  const steps = [
    ["rsvp_guests", "tenant_id"],
    ["rsvps", "tenant_id"],
    ["guests", "tenant_id"],
    ["expense_payments", "tenant_id"],
    ["expenses", "tenant_id"],
    ["seating_tables", "tenant_id"],
    ["locations", "tenant_id"],
    ["event_settings", "tenant_id"],
  ];
  for (const [table, column] of steps) {
    const { error } = await db.from(table).delete().eq(column, id);
    if (error) fail(`Nu am putut curăța ${table}`, error);
  }
}

async function findUser(email) {
  for (let page = 1; page <= 25; page += 1) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
    if (error) fail("Nu am putut citi lista de utilizatori", error);
    const user = data.users.find((item) => item.email?.toLowerCase() === email);
    if (user) return user.id;
    if (data.users.length < 200) return null;
  }
  return null;
}

function generatePassword(length = 18) {
  const sets = ["ABCDEFGHJKLMNPQRSTUVWXYZ", "abcdefghijkmnopqrstuvwxyz", "23456789", "!@#$%^&*-_=+"];
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
