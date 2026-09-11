#!/usr/bin/env node
// shoot-screens.mjs — capture README screenshots of the deployed app with a signed-in demo session.
//
//   APP_URL=https://... SUPABASE_URL=... SUPABASE_ANON_KEY=... DEMO_EMAIL=... DEMO_PASSWORD=... \
//   OUT_DIR=docs/media CHROMIUM=/path/to/chrome node scripts/shoot-screens.mjs
//
// Signs in through the Supabase auth REST API (no password typed into any web form), injects the
// session into localStorage under the key supabase-js reads (sb-<ref>-auth-token), then screenshots
// each route at 1440x900 @2x. Uses playwright-core with an existing Chromium binary.

import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const APP = (process.env.APP_URL || "").replace(/\/$/, "");
const SUPA = process.env.SUPABASE_URL; const ANON = process.env.SUPABASE_ANON_KEY;
const EMAIL = process.env.DEMO_EMAIL; const PASS = process.env.DEMO_PASSWORD;
const OUT = process.env.OUT_DIR || "docs/media"; const EXE = process.env.CHROMIUM;
if (!APP || !SUPA || !ANON || !EMAIL || !PASS || !EXE) { console.error("missing env (APP_URL, SUPABASE_URL, SUPABASE_ANON_KEY, DEMO_EMAIL, DEMO_PASSWORD, CHROMIUM)"); process.exit(2); }
mkdirSync(OUT, { recursive: true });

const ref = new URL(SUPA).hostname.split(".")[0];
const res = await fetch(`${SUPA}/auth/v1/token?grant_type=password`, { method: "POST", headers: { apikey: ANON, "Content-Type": "application/json" }, body: JSON.stringify({ email: EMAIL, password: PASS }) });
const session = await res.json();
if (!session.access_token) { console.error("sign-in failed:", session.error_description || session.msg || res.status); process.exit(1); }

const browser = await chromium.launch({ executablePath: EXE, headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, colorScheme: "light" });
await ctx.addInitScript(([key, value]) => { try { localStorage.setItem(key, value); } catch {} }, [`sb-${ref}-auth-token`, JSON.stringify(session)]);
const page = await ctx.newPage();

// discover ids we need for deep links
const api = async (path) => (await fetch(`${SUPA}/rest/v1/${path}`, { headers: { apikey: ANON, Authorization: `Bearer ${session.access_token}` } })).json();
const jobs = await api("jobs?select=id,title,status&order=created_at.asc");
const pmJob = jobs.find((j) => j.title.startsWith("Senior Product Manager")) || jobs[0];
const topEval = (await api(`ai_evaluations?select=application_id,score,applications(candidate_id,job_id)&order=score.desc&limit=1`))[0];
const topCandidateId = topEval?.applications?.candidate_id;

const shots = [
  { name: "landing", path: "/", wait: 2500, full: false },
  { name: "dashboard", path: "/dashboard", wait: 6000 },
  { name: "dashboard-full", path: "/dashboard", wait: 6000, full: true },
  { name: "jobs", path: "/jobs", wait: 5000 },
  { name: "job-candidates", path: `/jobs/${pmJob.id}/candidates`, wait: 6000 },
  { name: "job-candidates-full", path: `/jobs/${pmJob.id}/candidates`, wait: 6000, full: true },
  { name: "quick-review", path: `/jobs/${pmJob.id}/review`, wait: 6000 },
  { name: "candidate-profile", path: topCandidateId ? `/candidates/${topCandidateId}` : "/candidates", wait: 6000 },
  { name: "candidate-profile-full", path: topCandidateId ? `/candidates/${topCandidateId}` : "/candidates", wait: 6000, full: true },
  { name: "candidates", path: "/candidates", wait: 6000 },
  { name: "shortlisted", path: "/shortlisted", wait: 6000 },
  { name: "form-builder", path: `/jobs/${pmJob.id}/edit`, wait: 6000 },
  { name: "bulk-upload", path: "/candidates/bulk-upload", wait: 4000 },
  { name: "apply-form", path: `/apply/${pmJob.id}`, wait: 5000, full: true, anon: true },
  { name: "notifications", path: "/notifications", wait: 5000 },
  { name: "settings", path: "/settings", wait: 5000 },
  { name: "dashboard-mobile", path: "/dashboard", wait: 6000, mobile: true, full: true },
  { name: "job-candidates-mobile", path: `/jobs/${pmJob.id}/candidates`, wait: 6000, mobile: true },
];

for (const s of shots) {
  const c = s.mobile || s.anon
    ? await browser.newContext({ viewport: s.mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 }, deviceScaleFactor: 2, isMobile: !!s.mobile, hasTouch: !!s.mobile, colorScheme: "light" })
    : ctx;
  if (c !== ctx && !s.anon) await c.addInitScript(([key, value]) => { try { localStorage.setItem(key, value); } catch {} }, [`sb-${ref}-auth-token`, JSON.stringify(session)]);
  const p = c === ctx ? page : await c.newPage();
  try {
    await p.goto(APP + s.path, { waitUntil: "load", timeout: 60000 });
    await p.waitForTimeout(s.wait);
    if (s.full) { await p.evaluate(async () => { const h = document.body.scrollHeight; for (let y = 0; y < h; y += 700) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 150)); } window.scrollTo(0, 0); }); await p.waitForTimeout(800); }
    const file = join(OUT, `${s.name}.png`);
    await p.screenshot({ path: file, fullPage: !!s.full });
    console.log(`OK   ${s.name}  ${APP + s.path}`);
  } catch (e) { console.log(`FAIL ${s.name}: ${String(e.message).split("\n")[0]}`); }
  if (c !== ctx) await c.close();
}
await browser.close();
