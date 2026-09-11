#!/usr/bin/env node
// provision-demo-project.mjs — create a fresh Supabase project for the PUBLIC demo through the
// Management API, wait until it is healthy, and write its connection details to local files.
//
//   node scripts/provision-demo-project.mjs [--name ai-hire-suite-demo] [--region ap-south-1] [--org <id>]
//
// Token: SUPABASE_ACCESS_TOKEN or ~/.config/supabase/pat (never printed).
// Outputs:
//   .env.demo                       VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY / VITE_SUPABASE_PROJECT_ID
//                                   (public client keys; the file is gitignored anyway)
//   $DEMO_SECRETS_FILE (default ~/.config/supabase/ai-hire-suite-demo.env)
//                                   SUPABASE_SERVICE_ROLE_KEY + DB password, chmod 600 — never inside the repo
//
// Re-running with an existing project of the same name reuses it instead of creating a second one.

import { readFileSync, writeFileSync, existsSync, mkdirSync, chmodSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";
import { randomBytes } from "node:crypto";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const opt = (flag, dflt) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : dflt;
};
const NAME = opt("--name", "ai-hire-suite-demo");
const REGION = opt("--region", "ap-south-1");
let ORG = opt("--org", null);
const SECRETS_FILE =
  process.env.DEMO_SECRETS_FILE || join(homedir(), ".config", "supabase", "ai-hire-suite-demo.env");

function token() {
  if (process.env.SUPABASE_ACCESS_TOKEN) return process.env.SUPABASE_ACCESS_TOKEN.trim();
  const p = join(homedir(), ".config", "supabase", "pat");
  if (existsSync(p)) return readFileSync(p, "utf8").trim();
  console.error("no SUPABASE_ACCESS_TOKEN and no ~/.config/supabase/pat");
  process.exit(2);
}
const TOKEN = token();
const API = "https://api.supabase.com/v1";

async function api(path, init = {}) {
  const res = await fetch(API + path, {
    ...init,
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json", ...(init.headers || {}) },
  });
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  if (!res.ok) throw new Error(`${init.method || "GET"} ${path} -> HTTP ${res.status}: ${typeof body === "string" ? body.slice(0, 500) : JSON.stringify(body).slice(0, 500)}`);
  return body;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  // 1) organization
  const orgs = await api("/organizations");
  if (!ORG) {
    if (orgs.length === 0) throw new Error("token has no organizations");
    ORG = orgs[0].id;
    if (orgs.length > 1) console.log(`note: ${orgs.length} orgs visible, using "${orgs[0].name}" — pass --org to choose another`);
  }
  console.log(`org: ${orgs.find((o) => o.id === ORG)?.name ?? ORG}`);

  // 2) reuse or create
  const existing = (await api("/projects")).filter((p) => p.name === NAME);
  let project = existing[0];
  let dbPass = null;
  if (project) {
    console.log(`reusing existing project "${NAME}" (${project.id}, ${project.region}, ${project.status})`);
  } else {
    dbPass = randomBytes(18).toString("base64url") + "Aa1!";
    project = await api("/projects", {
      method: "POST",
      body: JSON.stringify({ name: NAME, organization_id: ORG, region: REGION, db_pass: dbPass }),
    });
    console.log(`created project "${NAME}" -> ref ${project.id} in ${project.region}`);
  }
  const ref = project.id;

  // 3) wait until healthy
  let status = project.status;
  for (let i = 0; i < 60 && status !== "ACTIVE_HEALTHY"; i++) {
    await sleep(10_000);
    const p = await api(`/projects/${ref}`);
    status = p.status;
    process.stdout.write(`  status: ${status}\n`);
  }
  if (status !== "ACTIVE_HEALTHY") throw new Error(`project not healthy after 10 minutes (status ${status})`);

  // 4) keys
  const keys = await api(`/projects/${ref}/api-keys?reveal=true`);
  const anon = keys.find((k) => k.name === "anon")?.api_key || keys.find((k) => k.type === "publishable")?.api_key;
  const service = keys.find((k) => k.name === "service_role")?.api_key || keys.find((k) => k.type === "secret")?.api_key;
  if (!anon || !service) throw new Error(`could not find anon/service keys (got: ${keys.map((k) => k.name || k.type).join(", ")})`);
  const url = `https://${ref}.supabase.co`;

  // 5) write outputs
  writeFileSync(
    join(root, ".env.demo"),
    `VITE_SUPABASE_URL="${url}"\nVITE_SUPABASE_PUBLISHABLE_KEY="${anon}"\nVITE_SUPABASE_PROJECT_ID="${ref}"\n`,
  );
  mkdirSync(dirname(SECRETS_FILE), { recursive: true });
  const prev = existsSync(SECRETS_FILE) ? readFileSync(SECRETS_FILE, "utf8") : "";
  const prevPass = prev.match(/^DEMO_DB_PASSWORD=(.*)$/m)?.[1];
  writeFileSync(
    SECRETS_FILE,
    `SUPABASE_URL=${url}\nSUPABASE_PROJECT_REF=${ref}\nSUPABASE_ANON_KEY=${anon}\nSUPABASE_SERVICE_ROLE_KEY=${service}\nDEMO_DB_PASSWORD=${dbPass ?? prevPass ?? ""}\n`,
  );
  chmodSync(SECRETS_FILE, 0o600);
  console.log(`\nproject ref: ${ref}\nurl:         ${url}\nclient env:  ${join(root, ".env.demo")}\nsecrets:     ${SECRETS_FILE} (chmod 600)`);
})().catch((e) => {
  console.error("provision failed:", e.message);
  process.exit(1);
});
