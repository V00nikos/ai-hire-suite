#!/usr/bin/env node
// seed-demo.mjs — fill the DEMO Supabase project with realistic, entirely fictional hiring data:
// 7 jobs with versioned application forms and weighted evaluation rubrics, 50+ candidates,
// applications with form responses, AI evaluations (match score, rubric breakdown, strengths,
// gaps, interview questions, recommendation), shortlist decisions, recruiter notes, activity +
// notifications, sync audit rows, and a few generated resume PDFs / intro videos in storage.
//
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... DEMO_EMAIL=... DEMO_PASSWORD=... node scripts/seed-demo.mjs [--wipe]
//
// Safety: refuses to run against the original production project. Deterministic (seeded PRNG),
// so re-seeding produces the same fleet of candidates. Every name, email (example.com), phone
// (555-01xx / reserved ranges), company and URL is fictional.

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";

const URL = process.env.SUPABASE_URL;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DEMO_EMAIL = process.env.DEMO_EMAIL || "demo.recruiter@aihiresuite.app";
const DEMO_PASSWORD = process.env.DEMO_PASSWORD;
const WIPE = process.argv.includes("--wipe");
const VIDEO_FILE = process.env.DEMO_VIDEO_FILE; // optional .webm to attach as "video introduction"

if (!URL || !SERVICE || !DEMO_PASSWORD) {
  console.error("need SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DEMO_PASSWORD");
  process.exit(2);
}
if (URL.includes("rgefclqekqkkmaexqsxp")) {
  console.error("REFUSING: this is the original production project, not the demo project");
  process.exit(3);
}

const sb = createClient(URL, SERVICE, { auth: { persistSession: false, autoRefreshToken: false } });

// ---------------------------------------------------------------- deterministic PRNG
let seed = 20260911;
const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const pickN = (arr, n) => { const c = [...arr]; const out = []; while (out.length < n && c.length) out.push(c.splice(Math.floor(rnd() * c.length), 1)[0]); return out; };
const between = (a, b) => Math.round(a + rnd() * (b - a));
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const NOW = Date.now();
const daysAgo = (d, jitterH = 0) => new Date(NOW - d * 86400e3 - rnd() * jitterH * 3600e3).toISOString();
const die = (where, error) => { if (error) { console.error(`✗ ${where}:`, error.message || error); process.exit(1); } };

// ---------------------------------------------------------------- fictional org + jobs
const ORG = "Aurora Labs";

const JOBS = [
  {
    key: "pm", title: "Senior Product Manager, AI Platform", department: "Product", location: "Bengaluru (hybrid)",
    status: "active", employment_type: "full-time", salary_min: 4500000, salary_max: 6500000, deadlineDays: 21,
    description: `Own the roadmap for ${ORG}'s talent-intelligence platform: match scoring, resume parsing, skills inference and the evaluation harness behind them. You will translate model-quality problems into shippable product work and define the metrics that tell us whether the system is getting better.`,
    requirements: "4+ years in AI, data or platform PM (or 2+ years hands-on ML engineering moving into product). Comfortable reading model outputs, eval metrics and data pipelines. Python or SQL literacy. Experience with skills ontologies, labour-market data or HR tech is a strong plus.",
    skills: ["Product strategy", "ML evaluation", "SQL", "Python", "Ranking systems", "Skills ontologies", "Experimentation", "Stakeholder management", "Data pipelines", "Prompt engineering"],
    titles: ["Product Manager", "Senior Product Manager", "Group PM", "Technical PM", "ML Engineer moving into product", "Data Product Manager"],
    rubric: [
      ["product_sense", "Product sense", 25, "Frames problems as user outcomes, sequences ruthlessly, shows judgement on trade-offs."],
      ["ai_ml_fluency", "AI/ML fluency", 25, "Can discuss embeddings, ranking, evaluation and failure modes credibly with engineers."],
      ["data_and_metrics", "Data & metrics", 20, "Defines quality metrics, has run evaluations or experiments, reads dashboards fluently."],
      ["technical_depth", "Technical depth", 15, "Understands APIs, data infrastructure and how platform decisions compound."],
      ["communication", "Communication", 15, "Explains complex systems plainly to technical and non-technical audiences."],
    ],
  },
  {
    key: "ml", title: "Machine Learning Engineer, Matching & Ranking", department: "Engineering", location: "Remote (US)",
    status: "active", employment_type: "full-time", salary_min: 165000, salary_max: 215000, deadlineDays: 30,
    description: "Build and evaluate the models that turn a profile and a job into a calibrated match score: embeddings, learning-to-rank, skills inference and the offline/online evaluation loop that keeps them honest.",
    requirements: "3+ years shipping ML in production. Strong Python, PyTorch or JAX, and SQL. Experience with retrieval, ranking or recommendation systems. You have owned an evaluation harness and can talk about calibration, drift and bias.",
    skills: ["Python", "PyTorch", "Learning-to-rank", "Embeddings", "Feature stores", "Spark", "SQL", "MLOps", "A/B testing", "Fairness auditing"],
    titles: ["ML Engineer", "Senior ML Engineer", "Applied Scientist", "Data Scientist", "Search Engineer", "Recommendation Engineer"],
    rubric: [
      ["ml_depth", "ML depth", 30, "Ranking, retrieval, embeddings and evaluation beyond textbook level."],
      ["production_experience", "Production experience", 25, "Has shipped, monitored and rolled back models in the real world."],
      ["evaluation_rigor", "Evaluation rigour", 20, "Designs offline metrics that predict online outcomes; understands calibration and bias."],
      ["engineering_quality", "Engineering quality", 15, "Clean, tested, observable pipelines."],
      ["collaboration", "Collaboration", 10, "Works well with product and data partners."],
    ],
  },
  {
    key: "fe", title: "Frontend Engineer, Recruiter Workspace", department: "Engineering", location: "San Francisco, CA",
    status: "active", employment_type: "full-time", salary_min: 150000, salary_max: 190000, deadlineDays: 25,
    description: "Design and build the recruiter-facing workspace: candidate review flows, form builder, real-time pipeline views. Accessibility and performance are product features here.",
    requirements: "4+ years with React and TypeScript. Deep comfort with state management, data fetching and accessibility. Experience with design systems and real-time UIs.",
    skills: ["React", "TypeScript", "Accessibility", "Design systems", "Data visualisation", "Testing", "Performance", "GraphQL", "Tailwind", "Realtime UIs"],
    titles: ["Frontend Engineer", "Senior Frontend Engineer", "Full-stack Engineer", "UI Engineer", "Design Engineer"],
    rubric: [
      ["react_typescript", "React & TypeScript", 30, "Idiomatic, well-typed, componentised code."],
      ["ux_craft", "UX craft", 25, "Cares about states, edge cases, motion and accessibility."],
      ["systems_thinking", "Systems thinking", 20, "Understands data flow, caching and realtime updates."],
      ["testing", "Testing", 15, "Tests behaviour, not implementation."],
      ["collaboration", "Collaboration", 10, "Partners well with design and product."],
    ],
  },
  {
    key: "data", title: "Data Analyst, Talent Insights", department: "Data", location: "Bengaluru (hybrid)",
    status: "active", employment_type: "full-time", salary_min: 1800000, salary_max: 2800000, deadlineDays: 18,
    description: "Turn hiring-funnel and skills data into decisions: pipeline health, model-quality dashboards, bias monitoring and the weekly metrics review.",
    requirements: "2+ years in analytics. Expert SQL, working Python, strong visual communication. Bonus: experience with HR or labour-market datasets.",
    skills: ["SQL", "Python", "dbt", "Looker", "Statistics", "Experimentation", "Data modelling", "Storytelling", "Airflow", "Spreadsheets"],
    titles: ["Data Analyst", "Senior Data Analyst", "Analytics Engineer", "Business Analyst", "People Analytics Analyst"],
    rubric: [
      ["sql_and_modelling", "SQL & modelling", 30, "Writes correct, efficient SQL; models data sensibly."],
      ["statistical_reasoning", "Statistical reasoning", 25, "Knows what a metric can and cannot say."],
      ["communication", "Communication", 25, "Turns numbers into a decision."],
      ["domain_curiosity", "Domain curiosity", 20, "Interested in talent, skills and hiring outcomes."],
    ],
  },
  {
    key: "recruiter", title: "Technical Recruiter", department: "People", location: "London (hybrid)",
    status: "paused", employment_type: "full-time", salary_min: 55000, salary_max: 70000, deadlineDays: 40,
    description: "Run full-cycle recruiting for engineering and product roles across Europe, partnering with hiring managers on structured, evidence-based processes.",
    requirements: "3+ years technical recruiting. Structured interviewing experience. Comfortable with data and tooling.",
    skills: ["Sourcing", "Structured interviewing", "Stakeholder management", "ATS administration", "Employer branding", "Offer negotiation", "Data literacy"],
    titles: ["Technical Recruiter", "Senior Recruiter", "Talent Partner", "Sourcer"],
    rubric: [
      ["sourcing", "Sourcing", 30, ""], ["process_rigor", "Process rigour", 30, ""], ["stakeholder_management", "Stakeholder management", 25, ""], ["data_literacy", "Data literacy", 15, ""],
    ],
  },
  {
    key: "cs", title: "Customer Success Manager, Enterprise", department: "Customer", location: "Remote (EU)",
    status: "closed", employment_type: "full-time", salary_min: 70000, salary_max: 90000, deadlineDays: -10,
    description: "Own a book of enterprise customers through onboarding, adoption and renewal.",
    requirements: "4+ years in customer success or account management for B2B SaaS.",
    skills: ["Account management", "Onboarding", "Renewals", "Executive communication", "SaaS metrics", "Salesforce"],
    titles: ["Customer Success Manager", "Account Manager", "Implementation Lead"],
    rubric: [["customer_empathy", "Customer empathy", 35, ""], ["commercial_acumen", "Commercial acumen", 35, ""], ["communication", "Communication", 30, ""]],
  },
  {
    key: "design", title: "Head of Design", department: "Design", location: "Bengaluru (hybrid)",
    status: "draft", employment_type: "full-time", salary_min: null, salary_max: null, deadlineDays: null,
    description: "Draft — lead product design across the platform.", requirements: "", skills: [], titles: [], rubric: [],
  },
];

// ---------------------------------------------------------------- fictional people
const FIRST = ["Aarav", "Ishita", "Rohan", "Meera", "Kabir", "Ananya", "Vikram", "Sneha", "Arjun", "Priyanka", "Devansh", "Nandini", "Kunal", "Tanvi", "Rahul", "Diya", "Farhan", "Zoya", "Neel", "Ira", "Maya", "Liam", "Sofia", "Noah", "Elena", "Mateo", "Amara", "Lucas", "Hana", "Omar", "Chloe", "Tomas", "Yuki", "Ines", "Jonas", "Leila", "Felix", "Aisha", "Daniel", "Nia", "Ethan", "Camila", "Ravi", "Sara", "Adil", "Grace", "Kenji", "Lena", "Marcus", "Rhea", "Samir", "Tara", "Anika", "Bilal"];
const LAST = ["Sharma", "Iyer", "Menon", "Kapoor", "Nair", "Reddy", "Bose", "Desai", "Khan", "Pillai", "Joshi", "Rao", "Okafor", "Nguyen", "Alvarez", "Schmidt", "Rossi", "Tanaka", "Novak", "Haddad", "Brennan", "Kowalski", "Moreau", "Andersen", "Patel", "Mehta", "Fernandes", "Varma", "Oyelaran", "Lindqvist"];
const COMPANIES = ["Northwind Analytics", "Bluefin Labs", "Helio Systems", "Kestrel Health", "Marigold Commerce", "Quanta Payments", "Ridgeline Robotics", "Saffron Learning", "Tidewater Logistics", "Vantage Cloud", "Orbit Talent", "Larkspur Media"];
const UNIVERSITIES = ["IIT Bombay", "BITS Pilani", "IIIT Hyderabad", "University of Michigan", "TU Munich", "NUS", "University of Toronto", "Georgia Tech", "IIM Ahmedabad", "UCL"];

function makePeople(n) {
  const used = new Set(); const out = [];
  while (out.length < n) {
    const f = pick(FIRST), l = pick(LAST); const key = `${f}.${l}`.toLowerCase();
    if (used.has(key)) continue; used.add(key);
    out.push({ name: `${f} ${l}`, email: `${key}@example.com`, phone: rnd() < 0.5 ? `+91 98${between(100, 999)} 01${between(100, 999)}` : `+1 (555) 01${between(10, 99)}-${between(1000, 9999)}` });
  }
  return out;
}

// ---------------------------------------------------------------- evaluation text banks
const STRENGTHS = {
  pm: ["{years} years of product ownership with two 0→1 launches in data-heavy products", "Ran an offline evaluation harness for a ranking feature and tied it to an online metric", "Comfortable reading model outputs: wrote SQL to slice precision by cohort in the take-home", "Clear articulation of trade-offs between coverage and accuracy in the skills graph", "Has shipped platform APIs consumed by three internal teams", "Writes crisply — the strategy memo in the application was the strongest in the pool", "Hands-on with {skill1} and {skill2}; can prototype before asking engineering"],
  ml: ["Shipped a learning-to-rank model with {skill1} that is still in production", "Strong grasp of calibration and why offline AUC lied to the team once", "Built the feature store and monitoring for a recommendation system at {company}", "{years} years across retrieval and ranking with a clear evaluation philosophy", "Ran a fairness audit on a matching model and changed the objective as a result", "Fluent in {skill1}, {skill2} and pragmatic MLOps"],
  fe: ["Deep React and TypeScript craft; the take-home was fully typed and tested", "Built an accessible design system used across {company}", "Real experience with realtime UIs (subscriptions, optimistic updates)", "{years} years shipping recruiter- or ops-facing tooling", "Performance mindset: measured before optimising in the interview exercise", "Thoughtful about empty, loading and error states"],
  data: ["Expert SQL: window functions and incremental models came naturally in the exercise", "Turned a messy funnel dataset into one clear recommendation in the case study", "Has built model-quality dashboards for a data science team", "Statistical reasoning is sound — flagged a Simpson's paradox in the sample data", "{years} years in analytics including people or hiring data at {company}", "Strong storytelling; the deck read like a decision, not a report"],
  recruiter: ["Structured-interview advocate with a written scorecard process", "Sourced and closed senior ML roles across three markets", "{years} years of technical recruiting with strong hiring-manager references", "Comfortable in the ATS data and reports on funnel conversion weekly"],
  cs: ["Grew net revenue retention above 115% on a mid-market book at {company}", "Excellent executive communication in the mock QBR", "{years} years in enterprise SaaS success roles"],
};
const WEAKNESSES = {
  pm: ["Limited direct ML experience — probe how they would evaluate a match-score change", "Metrics vocabulary is broad but not deep; ask for a metric they killed", "Has not worked on developer-facing or platform products", "Salary expectation is above band — assess flexibility", "Portfolio is consumer-heavy; check adaptability to enterprise HR buyers"],
  ml: ["No production experience with ranking specifically — mostly classification", "Weaker on data engineering; may need a partner for pipelines", "Discussion of bias stayed generic — probe for a concrete audit", "Short tenures; understand the reasons"],
  fe: ["Little experience with realtime data or subscriptions", "Accessibility knowledge is theoretical; check for shipped examples", "Has worked mostly in a single framework version", "Test coverage in the take-home was thin"],
  data: ["Python is basic; most work has been SQL-only", "No exposure to experimentation platforms", "Visual design of dashboards could be sharper", "Has not worked with HR or skills data before"],
  recruiter: ["Limited experience with product roles", "Data tooling is spreadsheet-level"],
  cs: ["Book size was smaller than our enterprise accounts", "No experience with HR-tech buyers"],
};
const QUESTIONS = {
  pm: ["Walk me through how you would define 'match quality' for a recruiter and how you would measure it.", "Tell me about a metric you introduced that changed what the team built.", "A model update improves precision but drops coverage for early-career profiles. What do you ship?", "How would you evaluate a resume parser before it touches production data?", "Describe a platform decision you made that other teams had to live with."],
  ml: ["How did you validate that your offline ranking metric predicted online outcomes?", "Explain how you would calibrate a match score so a 0.8 means the same thing across job families.", "Tell me about a model you rolled back and what you learned.", "How would you audit a matching model for disparate impact?"],
  fe: ["How do you handle a realtime update that conflicts with an in-progress edit?", "Walk me through making a candidate card stack keyboard-accessible.", "Tell me about a performance problem you measured before fixing.", "How do you decide what to test in a UI?"],
  data: ["A dashboard shows shortlist rate falling for one job. Walk me through your investigation.", "How would you measure whether AI evaluations are consistent across recruiters?", "Tell me about a time a number you reported turned out to be misleading.", "How would you model a hiring funnel for weekly review?"],
  recruiter: ["How do you keep a structured process when a hiring manager wants to move fast?", "What data do you look at weekly and what did it change?"],
  cs: ["Walk me through rescuing an at-risk renewal.", "How do you run a QBR that the CFO actually attends?"],
};
const SUMMARY = [
  "{first} brings {years} years as a {title} at {company} and scores well on {topcrit}. The evaluation flags {gap} as the area to probe; overall a {rec_word} candidate for {job}.",
  "Strong signal on {topcrit} and hands-on {skill1}. {first} has not yet worked on {gap}, which matters for this role — worth a focused interview. Recommendation: {rec_word}.",
  "{first} ({title}, {company}) is a {rec_word} fit for {job}: the resume evidences {skill1} and {skill2}, and the written answers show clear thinking. Gaps are around {gap}.",
];
const REC_WORD = { "STRONG YES": "standout", YES: "strong", MAYBE: "plausible", NO: "weak", "STRONG NO": "poor" };
const fill = (t, v) => t.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? "");

function recommendation(score) {
  if (score >= 85) return "STRONG YES"; if (score >= 72) return "YES"; if (score >= 58) return "MAYBE"; if (score >= 45) return "NO"; return "STRONG NO";
}

// ---------------------------------------------------------------- tiny PDF + storage helpers
function pdfEscape(s) { return String(s).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)"); }
function makeResumePdf(lines) {
  // single-page A4 PDF, Helvetica, one text line per entry ([text, size, bold])
  let y = 800; const ops = [];
  for (const [text, size = 11, bold = false] of lines) {
    if (text === "") { y -= size * 0.8; continue; }
    ops.push(`BT /${bold ? "F2" : "F1"} ${size} Tf 56 ${y} Td (${pdfEscape(text)}) Tj ET`); y -= size * 1.5;
  }
  const content = ops.join("\n");
  const objs = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
    `<< /Length ${Buffer.byteLength(content, "latin1")} >>\nstream\n${content}\nendstream`,
  ];
  let out = "%PDF-1.4\n"; const offsets = [];
  objs.forEach((o, i) => { offsets.push(Buffer.byteLength(out, "latin1")); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const xref = Buffer.byteLength(out, "latin1");
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offsets.map((o) => String(o).padStart(10, "0") + " 00000 n \n").join("") + `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(out, "latin1");
}
async function upload(bucket, path, body, contentType) {
  const { error } = await sb.storage.from(bucket).upload(path, body, { contentType, upsert: true });
  die(`upload ${path}`, error);
  return sb.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

// ---------------------------------------------------------------- main
(async () => {
  console.log(`seeding demo data into ${URL}`);

  // users -----------------------------------------------------------------
  async function ensureUser(email, password, full_name) {
    const { data: list } = await sb.auth.admin.listUsers({ perPage: 200 });
    const found = list?.users?.find((u) => u.email === email);
    if (found) { await sb.auth.admin.updateUserById(found.id, { password, user_metadata: { full_name } }); return found.id; }
    const { data, error } = await sb.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name } });
    die(`create user ${email}`, error);
    return data.user.id;
  }
  const recruiterId = await ensureUser(DEMO_EMAIL, DEMO_PASSWORD, "Demo Recruiter");
  const hmId = await ensureUser("priya.raman@aihiresuite.app", `hm-${Math.random().toString(36).slice(2)}A1!`, "Priya Raman");
  // the auth trigger created profiles + roles; make the demo user an admin too
  await sb.from("user_roles").upsert({ user_id: recruiterId, role: "admin" }, { onConflict: "user_id,role" });
  await sb.from("profiles").update({ full_name: "Demo Recruiter", last_login_at: new Date().toISOString() }).eq("id", recruiterId);
  console.log(`users: recruiter ${recruiterId.slice(0, 8)}…, hiring manager ${hmId.slice(0, 8)}…`);

  // wipe ------------------------------------------------------------------
  if (WIPE) {
    for (const t of ["user_notifications", "activity_log", "candidate_notes", "notes", "ai_evaluations", "application_documents", "form_responses", "applications", "candidate_documents", "candidates", "form_versions", "forms", "jobs", "sync_audit_log"]) {
      const { error } = await sb.from(t).delete().not("id", "is", null); die(`wipe ${t}`, error);
    }
    console.log("wiped existing rows");
  }

  // jobs + forms ----------------------------------------------------------
  const jobRows = {};
  for (const j of JOBS) {
    const { data, error } = await sb.from("jobs").insert({
      title: j.title, department: j.department, description: j.description, requirements: j.requirements, status: j.status,
      created_by: recruiterId, location: j.location, employment_type: j.employment_type, salary_min: j.salary_min, salary_max: j.salary_max,
      deadline: j.deadlineDays == null ? null : new Date(NOW + j.deadlineDays * 86400e3).toISOString(), created_at: daysAgo(between(35, 60)),
    }).select().single();
    die(`job ${j.title}`, error);
    jobRows[j.key] = data;
    if (j.status === "draft") continue;

    const fields = [
      { id: "full_name", type: "text", label: "Full name", required: true, placeholder: "Your name" },
      { id: "email", type: "email", label: "Email", required: true },
      { id: "phone", type: "phone", label: "Phone", required: false },
      { id: "current_role", type: "text", label: "Current role and company", required: true },
      { id: "years_experience", type: "number", label: "Years of experience", required: true },
      { id: "linkedin", type: "url", label: "LinkedIn profile", required: false },
      { id: "key_skills", type: "multiselect", label: "Key skills (pick up to 5)", required: true, options: j.skills },
      { id: "why_role", type: "textarea", label: "Why this role, and what would you ship in your first 90 days?", required: true, maxLength: 1500 },
      { id: "notice_period", type: "select", label: "Notice period", required: true, options: ["Immediate", "2 weeks", "1 month", "2 months", "3 months"] },
      { id: "expected_ctc", type: "text", label: "Expected CTC (annual)", required: false },
      { id: "resume", type: "file", label: "Resume (PDF)", required: true, accept: ".pdf", maxSize: 10 },
      { id: "video_intro", type: "video", label: "Two-minute video introduction (optional)", required: false, accept: ".mp4,.mov,.webm", maxSize: 100 },
    ];
    const rubric = {
      scale: "0-5 per criterion, weighted to a 0-100 match score",
      criteria: j.rubric.map(([key, label, weight, description]) => ({ key, label, weight, description })),
      must_haves: j.requirements.split(". ").slice(0, 2),
      disqualifiers: ["Fabricated credentials", "No work authorisation for the location"],
    };
    const { data: form, error: fe } = await sb.from("forms").insert({ job_id: data.id, name: `${j.title} — application`, current_version: 2, is_active: true }).select().single();
    die("form", fe);
    const v1 = await sb.from("form_versions").insert({ form_id: form.id, version_number: 1, fields: fields.slice(0, 8), evaluation_rubric: rubric, change_notes: "Initial form", created_by: recruiterId, is_published: false, created_at: daysAgo(40) });
    die("form v1", v1.error);
    const { data: v2, error: ve } = await sb.from("form_versions").insert({ form_id: form.id, version_number: 2, fields, evaluation_rubric: rubric, change_notes: "Added notice period, CTC, resume and optional video intro; rubric weights reviewed with hiring manager", created_by: recruiterId, is_published: true, created_at: daysAgo(34) }).select().single();
    die("form v2", ve);
    jobRows[j.key].formVersionId = v2.id;
    jobRows[j.key].fields = fields;
  }
  console.log(`jobs: ${Object.keys(jobRows).length}, forms published: ${Object.values(jobRows).filter((r) => r.formVersionId).length}`);

  // candidates + applications ----------------------------------------------
  const plan = [["pm", 14], ["ml", 12], ["fe", 11], ["data", 9], ["recruiter", 5], ["cs", 4]]; // 55 applications
  const people = makePeople(64);
  let pi = 0;
  const applications = []; // {app, person, job, score|null, ...}
  const video = VIDEO_FILE && existsSync(VIDEO_FILE) ? readFileSync(VIDEO_FILE) : null;
  const candidateIds = new Map();

  for (const [key, count] of plan) {
    const J = JOBS.find((j) => j.key === key); const jr = jobRows[key];
    for (let i = 0; i < count; i++) {
      // ~10% of people apply to a second job; otherwise take a new person
      const reuse = pi > 5 && rnd() < 0.1 ? people[between(0, pi - 1)] : people[pi++];
      const years = between(2, 14); const title = pick(J.titles); const company = pick(COMPANIES);
      const skills = pickN(J.skills, between(3, 5));
      const bulk = rnd() < 0.35;
      const submittedDays = between(1, 42);
      // fit tier drives the score
      const tier = rnd(); const score = tier < 0.2 ? between(85, 96) : tier < 0.55 ? between(72, 84) : tier < 0.85 ? between(56, 71) : between(38, 55);
      const pending = J.status === "active" && submittedDays <= 2 && rnd() < 0.7; // very recent → not yet evaluated

      let candidateId = candidateIds.get(reuse.email);
      if (!candidateId) {
        const { data: c, error } = await sb.from("candidates").insert({
          email: reuse.email, name: reuse.name, phone: reuse.phone, source: bulk ? "bulk_upload" : "application",
          tags: skills.map((s) => s.toLowerCase()), portfolio_url: rnd() < 0.3 ? `https://example.com/portfolio/${reuse.email.split("@")[0]}` : null,
          created_at: daysAgo(submittedDays),
        }).select().single();
        die(`candidate ${reuse.name}`, error);
        candidateId = c.id; candidateIds.set(reuse.email, c.id);
      }
      const { data: app, error: ae } = await sb.from("applications").insert({
        job_id: jr.id, candidate_id: candidateId, form_version_id: jr.formVersionId, status: "pending", bulk_uploaded: bulk, submitted_at: daysAgo(submittedDays, 12),
      }).select().single();
      if (ae) { if (ae.code === "23505") continue; die("application", ae); }

      // responses
      const resp = (id, label, type, value) => ({ application_id: app.id, form_version_id: jr.formVersionId, field_id: id, field_label: label, field_type: type, response_value: value });
      const why = pick([
        `I have spent the last ${years} years on ${skills[0].toLowerCase()} problems at ${company}. In the first 90 days I would map the current evaluation gaps, ship one measurable improvement, and set up the weekly quality review.`,
        `${J.title.split(",")[0]} work at ${ORG} is exactly where ${skills[0].toLowerCase()} and ${skills[1].toLowerCase()} meet. First 90 days: learn the data, fix the noisiest failure mode, publish the metric that proves it.`,
        `Because talent decisions deserve better evidence. I would start by shadowing recruiters, then instrument the funnel end to end and pick one bottleneck to remove.`,
      ]);
      const responses = [
        resp("full_name", "Full name", "text", reuse.name), resp("email", "Email", "email", reuse.email), resp("phone", "Phone", "phone", reuse.phone),
        resp("current_role", "Current role and company", "text", `${title} at ${company}`), resp("years_experience", "Years of experience", "number", String(years)),
        resp("key_skills", "Key skills (pick up to 5)", "multiselect", skills), resp("why_role", "Why this role, and what would you ship in your first 90 days?", "textarea", why),
        resp("notice_period", "Notice period", "select", pick(["Immediate", "2 weeks", "1 month", "2 months", "3 months"])),
        resp("expected_ctc", "Expected CTC (annual)", "text", J.salary_max ? `${Math.round((J.salary_min + rnd() * (J.salary_max - J.salary_min)) / 1000)}k` : "Open"),
      ];

      // resume PDF for strong candidates (keeps storage small), video for a few
      let hasResume = false, hasVideo = false;
      if (score >= 80 || (score >= 70 && rnd() < 0.4)) {
        const pdf = makeResumePdf([
          [reuse.name, 20, true], [`${title} · ${company}`, 12], [`${reuse.email} · ${reuse.phone}`, 10], [""],
          ["Summary", 13, true], [`${years} years working on ${skills.slice(0, 3).join(", ").toLowerCase()} in production settings.`, 11], [`Currently ${title.toLowerCase()} at ${company}, previously at ${pick(COMPANIES)}.`, 11], [""],
          ["Experience", 13, true], [`${company} — ${title} (${2026 - Math.min(years, 5)}–present)`, 11, true], [`Led ${skills[0].toLowerCase()} initiatives; partnered with product and data on evaluation and rollout.`, 11], [`${pick(COMPANIES)} — ${pick(J.titles)} (${2026 - years}–${2026 - Math.min(years, 5)})`, 11, true], [`Shipped ${skills[1].toLowerCase()} improvements measured on weekly quality metrics.`, 11], [""],
          ["Skills", 13, true], [skills.join(" · "), 11], [""], ["Education", 13, true], [`${pick(UNIVERSITIES)} — B.Tech / B.Sc`, 11], [""], ["Fictional resume generated for the AI Hire Suite demo. Not a real person.", 8],
        ]);
        const url = await upload("application-files", `demo/${app.id}/resume.pdf`, pdf, "application/pdf");
        await sb.from("application_documents").insert({ application_id: app.id, document_type: "resume", file_url: url, filename: `${reuse.name.replace(/ /g, "_")}_Resume.pdf`, file_size: pdf.length });
        responses.push(resp("resume", "Resume (PDF)", "file", url));
        hasResume = true;
        if (video && score >= 85 && rnd() < 0.6) {
          const vurl = await upload("application-files", `demo/${app.id}/intro.webm`, video, "video/webm");
          await sb.from("application_documents").insert({ application_id: app.id, document_type: "video", file_url: vurl, filename: "intro.webm", file_size: video.length });
          responses.push(resp("video_intro", "Two-minute video introduction (optional)", "video", vurl));
          hasVideo = true;
        }
      }
      const { error: re } = await sb.from("form_responses").insert(responses); die("responses", re);

      applications.push({ app, person: reuse, J, jr, years, title, company, skills, score: pending ? null : score, hasResume, hasVideo, submittedDays });
    }
  }
  console.log(`candidates: ${candidateIds.size}, applications: ${applications.length}`);

  // evaluations + statuses -----------------------------------------------------
  const activity = [];
  for (const key of Object.keys(jobRows)) {
    const evald = applications.filter((a) => a.J.key === key && a.score != null).sort((a, b) => b.score - a.score);
    for (let rank = 0; rank < evald.length; rank++) {
      const a = evald[rank]; const rec = recommendation(a.score);
      const crit = a.J.rubric; const top = crit[0][1].toLowerCase(); const gap = pick(WEAKNESSES[key]).split(" — ")[0].toLowerCase();
      const vars = { first: a.person.name.split(" ")[0], years: a.years, title: a.title, company: a.company, skill1: a.skills[0], skill2: a.skills[1] || a.skills[0], topcrit: top, gap, rec_word: REC_WORD[rec], job: a.J.title.split(",")[0] };
      const rubric_scores = Object.fromEntries(crit.map(([k]) => [k, clamp(Math.round(a.score / 20 + (rnd() - 0.5) * 1.6), 1, 5)]));
      const evalRow = {
        application_id: a.app.id, form_version_id: a.jr.formVersionId,
        score: a.score, ranking: rank + 1, overall_score: clamp(Math.round(a.score / 20), 1, 5),
        resume_score: a.hasResume ? clamp(a.score + between(-6, 6), 0, 100) : clamp(a.score + between(-12, 2), 0, 100),
        video_score: a.hasVideo ? clamp(a.score + between(-10, 8), 0, 100) : null,
        recommendation: rec,
        strengths: pickN(STRENGTHS[key], 3).map((t) => fill(t, vars)),
        weaknesses: pickN(WEAKNESSES[key], rec === "STRONG YES" ? 1 : 2).map((t) => fill(t, vars)),
        summary: fill(pick(SUMMARY), vars),
        interview_questions: pickN(QUESTIONS[key], 3),
        rubric_scores, model_used: "gpt-4o + gemini-2.0-flash", raw_response: null,
        evaluated_at: new Date(new Date(a.app.submitted_at).getTime() + between(4, 90) * 60e3).toISOString(),
        hiring_manager_notes: rank === 0 ? "Fast-track — schedule the panel this week." : null,
      };
      const { error } = await sb.from("ai_evaluations").insert(evalRow); die("evaluation", error);
      activity.push({ event_type: "ai_evaluation_complete", actor_id: null, job_id: a.jr.id, application_id: a.app.id, candidate_id: a.app.candidate_id, created_at: evalRow.evaluated_at, event_data: { candidate_name: a.person.name, job_title: a.J.title, score: a.score, recommendation: rec } });

      // status decisions
      let status = "evaluated", shortlisted = false, shortlisted_at = null;
      if (a.J.status === "closed") { status = rank === 0 ? "hired" : rank < 2 ? "shortlisted" : "rejected"; shortlisted = rank < 2; }
      else if (rank < 2 && rec !== "MAYBE") { status = "shortlisted"; shortlisted = true; }
      else if (rank === 2 && rnd() < 0.5) { status = "on_hold"; }
      else if (rec === "STRONG NO" || (rec === "NO" && rnd() < 0.5)) { status = "rejected"; }
      if (key === "pm" && rank === 1) { status = "hired"; shortlisted = true; }
      if (shortlisted) shortlisted_at = new Date(new Date(evalRow.evaluated_at).getTime() + between(60, 2000) * 60e3).toISOString();
      const { error: ue } = await sb.from("applications").update({ status, shortlisted, shortlisted_at }).eq("id", a.app.id); die("status", ue);
      if (shortlisted) activity.push({ event_type: "candidate_shortlisted", actor_id: hmId, job_id: a.jr.id, application_id: a.app.id, candidate_id: a.app.candidate_id, created_at: shortlisted_at, event_data: { candidate_name: a.person.name, job_title: a.J.title, actor_name: "Priya Raman" } });
      if (shortlisted && rank < 2) {
        const note = pick([
          `Strong on ${top}. Panel: probe ${gap}. ${a.hasVideo ? "Video intro was crisp and structured." : "Ask for a short intro at the start."}`,
          `Hiring manager wants to move fast on ${a.person.name.split(" ")[0]} — availability ${pick(["next week", "Thursday", "after the 15th"])}.`,
          `Reference from ${a.company} came back positive. Compensation expectation is within band.`,
        ]);
        const { error: ne } = await sb.from("candidate_notes").insert({ candidate_id: a.app.candidate_id, application_id: a.app.id, content: note, author_id: rank === 0 ? recruiterId : hmId, created_at: shortlisted_at });
        die("note", ne);
        activity.push({ event_type: "note_added", actor_id: rank === 0 ? recruiterId : hmId, job_id: a.jr.id, application_id: a.app.id, candidate_id: a.app.candidate_id, created_at: shortlisted_at, event_data: { candidate_name: a.person.name, job_title: a.J.title, actor_name: rank === 0 ? "Demo Recruiter" : "Priya Raman" } });
      }
    }
  }
  // application_submitted events for the most recent applications (feeds the notification feed)
  for (const a of applications.filter((x) => x.submittedDays <= 7)) {
    activity.push({ event_type: "application_submitted", actor_id: null, job_id: a.jr.id, application_id: a.app.id, candidate_id: a.app.candidate_id, created_at: a.app.submitted_at, event_data: { candidate_name: a.person.name, job_title: a.J.title, source: a.app.bulk_uploaded ? "bulk_upload" : "application" } });
  }
  activity.push({ event_type: "job_created", actor_id: hmId, job_id: jobRows.design.id, created_at: daysAgo(3), event_data: { job_title: JOBS[6].title, actor_name: "Priya Raman" } });
  activity.sort((x, y) => x.created_at.localeCompare(y.created_at));
  for (const ev of activity) { const { error } = await sb.from("activity_log").insert(ev); die("activity", error); }
  // read the older notifications so the bell shows a sane unread count
  await sb.from("user_notifications").update({ is_read: true, read_at: new Date().toISOString() }).eq("user_id", recruiterId).lt("created_at", daysAgo(4));

  // sync audit rows (Settings → Sync History)
  const audits = [
    { sync_type: "scheduled", table_name: "ai_evaluations", records_synced: 34, records_failed: 0, status: "completed", started_at: daysAgo(1), completed_at: daysAgo(0.99), created_by: null },
    { sync_type: "manual", table_name: "all", records_synced: 412, records_failed: 0, status: "completed", started_at: daysAgo(6), completed_at: daysAgo(5.99), created_by: recruiterId },
    { sync_type: "realtime", table_name: "applications", records_synced: 1, records_failed: 0, status: "completed", started_at: daysAgo(0.2), completed_at: daysAgo(0.19), created_by: null },
  ];
  for (const row of audits) { const { error } = await sb.from("sync_audit_log").insert(row); die("audit", error); }

  const evaluated = applications.filter((a) => a.score != null).length;
  console.log(`evaluations: ${evaluated}, pending review: ${applications.length - evaluated}, activity events: ${activity.length}`);
  console.log("done");
})().catch((e) => { console.error("seed failed:", e); process.exit(1); });
