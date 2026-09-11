#!/usr/bin/env node
// apply-migrations.mjs — apply supabase/migrations/*.sql to a Supabase project through the
// Management API (no Supabase CLI or direct Postgres connection needed).
//
//   SUPABASE_ACCESS_TOKEN=sbp_... node scripts/apply-migrations.mjs <project-ref> [--skip <filename-fragment>]...
//
// Reads the token from SUPABASE_ACCESS_TOKEN or ~/.config/supabase/pat. Never prints it.
// Each migration file runs as ONE statement batch, in filename order. A file that matches any
// --skip fragment is reported and skipped (used to leave out the personal-DB sync triggers,
// which hard-code another project's URL and are not part of the public demo).

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const ref = args.find((a) => !a.startsWith("--"));
const skips = [];
for (let i = 0; i < args.length; i++) if (args[i] === "--skip") skips.push(args[++i]);
if (!ref) {
  console.error("usage: apply-migrations.mjs <project-ref> [--skip fragment]...");
  process.exit(2);
}

function token() {
  if (process.env.SUPABASE_ACCESS_TOKEN) return process.env.SUPABASE_ACCESS_TOKEN.trim();
  const p = join(homedir(), ".config", "supabase", "pat");
  if (existsSync(p)) return readFileSync(p, "utf8").trim();
  console.error("no SUPABASE_ACCESS_TOKEN and no ~/.config/supabase/pat");
  process.exit(2);
}
const TOKEN = token();

async function runSql(query) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 600)}`);
  return text;
}

const dir = join(root, "supabase", "migrations");
const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
let applied = 0;
for (const f of files) {
  if (skips.some((s) => f.includes(s))) {
    console.log(`SKIP    ${f}`);
    continue;
  }
  const sql = readFileSync(join(dir, f), "utf8");
  try {
    await runSql(sql);
    console.log(`APPLIED ${f}`);
    applied++;
  } catch (e) {
    console.error(`FAILED  ${f}\n  ${e.message}`);
    process.exit(1);
  }
}
console.log(`done: ${applied}/${files.length} migrations applied to ${ref}`);
