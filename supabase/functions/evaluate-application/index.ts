// evaluate-application — score one application against its job description and rubric with OpenAI.
//
//   POST { application_id: uuid, force?: boolean, wait_for_documents?: boolean }
//
// Called by the on_application_created database trigger (wait_for_documents: true, because the
// apply form uploads the resume a few seconds after the application row is inserted) and by the
// "Run AI evaluation" button on the candidate profile (force: true re-scores an existing evaluation).
//
// Secrets: OPENAI_API_KEY (required), OPENAI_MODEL (default gpt-6-luna), OPENAI_FALLBACK_MODEL
// (default gpt-5.4-mini). SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are injected by the platform.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") ?? "";
const MODEL = Deno.env.get("OPENAI_MODEL") ?? "gpt-6-luna";
const FALLBACK_MODEL = Deno.env.get("OPENAI_FALLBACK_MODEL") ?? "gpt-5.4-mini";
const MAX_PDF_BYTES = 8 * 1024 * 1024;

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

type Criterion = { key: string; label: string; weight: number; description?: string };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Same bands the README documents — the recommendation is a fixed function of the score.
function recommendation(score: number) {
  if (score >= 85) return "STRONG YES";
  if (score >= 72) return "YES";
  if (score >= 58) return "MAYBE";
  if (score >= 45) return "NO";
  return "STRONG NO";
}

function bytesToBase64(bytes: Uint8Array) {
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

// Public URL → (bucket, path) so private buckets also work through the service role.
async function downloadDocument(fileUrl: string): Promise<Uint8Array | null> {
  const m = fileUrl.match(/\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.+?)(?:\?|$)/);
  if (m) {
    const { data, error } = await sb.storage.from(m[1]).download(decodeURIComponent(m[2]));
    if (!error && data) return new Uint8Array(await data.arrayBuffer());
  }
  const res = await fetch(fileUrl);
  return res.ok ? new Uint8Array(await res.arrayBuffer()) : null;
}

function evaluationSchema(criteria: Criterion[] | null) {
  const rubricItem = {
    type: "object",
    additionalProperties: false,
    required: ["key", "label", "score", "evidence"],
    properties: {
      key: criteria ? { type: "string", enum: criteria.map((c) => c.key) } : { type: "string" },
      label: { type: "string" },
      score: { type: "integer", minimum: 0, maximum: 5 },
      evidence: { type: "string" },
    },
  };
  return {
    type: "object",
    additionalProperties: false,
    required: ["rubric", "resume_score", "summary", "strengths", "weaknesses", "interview_questions", "candidate"],
    properties: {
      rubric: { type: "array", items: rubricItem },
      resume_score: { type: "integer", minimum: 0, maximum: 100 },
      summary: { type: "string" },
      strengths: { type: "array", items: { type: "string" } },
      weaknesses: { type: "array", items: { type: "string" } },
      interview_questions: { type: "array", items: { type: "string" } },
      candidate: {
        type: "object",
        additionalProperties: false,
        required: ["current_title", "current_company", "years_experience", "skills"],
        properties: {
          current_title: { type: "string" },
          current_company: { type: "string" },
          years_experience: { type: "number" },
          skills: { type: "array", items: { type: "string" } },
        },
      },
    },
  };
}

const SYSTEM_PROMPT = `You are a senior recruiter screening an applicant for a specific job. Score strictly on evidence in the resume and application answers — never on name, gender, age, nationality, school prestige or anything not job-relevant.

Scoring per rubric criterion (integer 0-5):
5 = clear, repeated, recent evidence at or above the level the role needs
4 = solid evidence, minor gaps
3 = some relevant evidence, notable gaps
2 = thin or indirect evidence
1 = barely any evidence
0 = no evidence or contradicts the requirement

Be calibrated: most applicants are 2-4. Reserve 5 for genuinely exceptional evidence. If the resume is missing or unreadable, score from the form answers only and say so in the summary.

Output:
- rubric: one entry per criterion with a one-sentence evidence note that cites the resume.
- resume_score: 0-100, how well the resume alone fits the job.
- summary: 2-3 sentences a hiring manager can read in 10 seconds.
- strengths: exactly 3, specific and evidence-based.
- weaknesses: 1-3 gaps worth probing in interview.
- interview_questions: 3-5 questions aimed at the gaps the score could not settle.
- candidate: what the resume says (use "" or 0 when unknown); skills = up to 8 job-relevant skills.`;

async function callOpenAI(model: string, content: unknown[], schema: unknown) {
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      instructions: SYSTEM_PROMPT,
      input: [{ role: "user", content }],
      text: { format: { type: "json_schema", name: "candidate_evaluation", strict: true, schema } },
    }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`OpenAI ${model} HTTP ${res.status}: ${JSON.stringify(body.error ?? body).slice(0, 400)}`);
  const text = body.output
    ?.filter((o: { type: string }) => o.type === "message")
    .flatMap((o: { content: { type: string; text?: string }[] }) => o.content)
    .find((c: { type: string }) => c.type === "output_text")?.text;
  if (!text) throw new Error(`OpenAI ${model} returned no text`);
  return { result: JSON.parse(text), usage: body.usage, model: body.model ?? model };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  if (!OPENAI_API_KEY) return json({ error: "OPENAI_API_KEY is not configured" }, 500);

  let applicationId: string | undefined;
  try {
    const { application_id, force = false, wait_for_documents = false } = await req.json();
    applicationId = application_id;
    if (!application_id || typeof application_id !== "string") return json({ error: "application_id is required" }, 400);

    const { data: existing } = await sb.from("ai_evaluations").select("id").eq("application_id", application_id).maybeSingle();
    if (existing && !force) return json({ status: "already_evaluated", application_id });

    const { data: app, error: appErr } = await sb
      .from("applications")
      .select("id, job_id, candidate_id, form_version_id, status, candidates(name, email, tags), jobs(title, department, description, requirements, location, employment_type)")
      .eq("id", application_id)
      .single();
    if (appErr || !app) return json({ error: "application not found" }, 404);

    // The public form inserts the application first and uploads the resume afterwards.
    let docs: { document_type: string; file_url: string; filename: string }[] = [];
    for (let i = 0; i < (wait_for_documents ? 10 : 1); i++) {
      const { data } = await sb.from("application_documents").select("document_type, file_url, filename").eq("application_id", application_id);
      docs = data ?? [];
      if (docs.some((d) => d.document_type === "resume") || !wait_for_documents) break;
      await sleep(3000);
    }
    if (wait_for_documents) await sleep(1500); // let form_responses settle too

    // Rubric: the version the application was collected under, else the job's published version.
    let versionId = app.form_version_id as string | null;
    let rubric: Record<string, unknown> | null = null;
    if (versionId) {
      const { data } = await sb.from("form_versions").select("evaluation_rubric").eq("id", versionId).single();
      rubric = (data?.evaluation_rubric as Record<string, unknown>) ?? null;
    }
    if (!rubric) {
      const { data } = await sb
        .from("form_versions")
        .select("id, evaluation_rubric, forms!inner(job_id)")
        .eq("forms.job_id", app.job_id)
        .eq("is_published", true)
        .order("version_number", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data?.evaluation_rubric) {
        rubric = data.evaluation_rubric as Record<string, unknown>;
        versionId = versionId ?? data.id;
      }
    }
    const criteria = (Array.isArray(rubric?.criteria) && (rubric!.criteria as Criterion[]).length > 0)
      ? (rubric!.criteria as Criterion[])
      : null;

    const { data: responses } = await sb
      .from("form_responses")
      .select("field_label, field_type, response_value")
      .eq("application_id", application_id);

    const job = app.jobs as Record<string, string | null>;
    const candidate = app.candidates as { name: string; email: string; tags: string[] | null };

    const answers = (responses ?? [])
      .filter((r) => !["file", "video"].includes(r.field_type))
      .map((r) => `- ${r.field_label}: ${typeof r.response_value === "string" ? r.response_value : JSON.stringify(r.response_value)}`)
      .join("\n");

    const rubricText = criteria
      ? criteria.map((c) => `- ${c.key} — ${c.label} (weight ${c.weight})${c.description ? `: ${c.description}` : ""}`).join("\n")
      : "No rubric is configured for this job. Derive 4-5 criteria from the job description (snake_case keys, short labels) and score each.";
    const extras = rubric
      ? [
          Array.isArray(rubric.must_haves) && rubric.must_haves.length ? `Must-haves: ${(rubric.must_haves as string[]).join("; ")}` : "",
          Array.isArray(rubric.disqualifiers) && rubric.disqualifiers.length ? `Disqualifiers: ${(rubric.disqualifiers as string[]).join("; ")}` : "",
        ].filter(Boolean).join("\n")
      : "";

    const prompt = `# Job
Title: ${job.title}
Department: ${job.department ?? ""}
Location: ${job.location ?? ""} · ${job.employment_type ?? ""}

Description:
${job.description ?? "(none)"}

Requirements:
${job.requirements ?? "(none)"}

# Rubric
${rubricText}
${extras}

# Applicant
Name: ${candidate?.name ?? "Unknown"}
Application answers:
${answers || "(none)"}

The applicant's resume is attached${docs.some((d) => d.document_type === "resume") ? "" : " — NOTE: no resume was uploaded"}.`;

    const content: unknown[] = [];
    const resumeDoc = docs.find((d) => d.document_type === "resume");
    let resumeAttached = false;
    if (resumeDoc) {
      const bytes = await downloadDocument(resumeDoc.file_url);
      const isPdf = bytes && bytes.length >= 4 && String.fromCharCode(...bytes.subarray(0, 4)) === "%PDF";
      if (bytes && isPdf && bytes.length <= MAX_PDF_BYTES) {
        content.push({ type: "input_file", filename: resumeDoc.filename || "resume.pdf", file_data: `data:application/pdf;base64,${bytesToBase64(bytes)}` });
        resumeAttached = true;
      } else if (bytes && !isPdf && bytes.length <= 200_000) {
        content.push({ type: "input_text", text: `# Resume (text)\n${new TextDecoder().decode(bytes)}` });
        resumeAttached = true;
      }
    }
    content.push({ type: "input_text", text: prompt + (resumeDoc && !resumeAttached ? "\n(The resume file could not be read.)" : "") });

    const schema = evaluationSchema(criteria);
    let out;
    try {
      out = await callOpenAI(MODEL, content, schema);
    } catch (e) {
      console.error(`[evaluate] primary model failed, falling back: ${(e as Error).message}`);
      out = await callOpenAI(FALLBACK_MODEL, content, schema);
    }
    const r = out.result;

    // Weighted roll-up is computed here, not by the model, so it is exact and reproducible.
    const weights: Record<string, number> = criteria
      ? Object.fromEntries(criteria.map((c) => [c.key, Number(c.weight) || 1]))
      : Object.fromEntries(r.rubric.map((x: { key: string }) => [x.key, 1]));
    const rubricScores: Record<string, number> = {};
    let num = 0, den = 0;
    for (const item of r.rubric as { key: string; score: number }[]) {
      const w = weights[item.key];
      if (w === undefined || item.key in rubricScores) continue;
      const s = Math.max(0, Math.min(5, Math.round(item.score)));
      rubricScores[item.key] = s;
      num += w * s;
      den += w * 5;
    }
    const score = den > 0 ? Math.round((num / den) * 100) : r.resume_score;
    const rec = recommendation(score);

    const evalRow = {
      application_id,
      form_version_id: versionId,
      score,
      overall_score: Math.max(0, Math.min(5, Math.round(score / 20))),
      resume_score: r.resume_score,
      video_score: null,
      recommendation: rec,
      summary: r.summary,
      strengths: r.strengths.slice(0, 3),
      weaknesses: r.weaknesses.slice(0, 3),
      interview_questions: r.interview_questions.slice(0, 5),
      rubric_scores: rubricScores,
      model_used: out.model,
      raw_response: { ...r, usage: out.usage, resume_attached: resumeAttached },
      evaluated_at: new Date().toISOString(),
    };
    const { error: upErr } = await sb.from("ai_evaluations").upsert(evalRow, { onConflict: "application_id" });
    if (upErr) throw upErr;

    if (app.status === "pending") await sb.from("applications").update({ status: "evaluated" }).eq("id", application_id);

    // Re-rank every evaluated application for this job.
    const { data: jobEvals } = await sb
      .from("ai_evaluations")
      .select("id, score, applications!inner(job_id)")
      .eq("applications.job_id", app.job_id)
      .order("score", { ascending: false });
    await Promise.all((jobEvals ?? []).map((e, i) => sb.from("ai_evaluations").update({ ranking: i + 1 }).eq("id", e.id)));

    // Fill candidate skills from the resume when the profile has none yet.
    if (!candidate?.tags || (Array.isArray(candidate.tags) && candidate.tags.length === 0)) {
      const skills = (r.candidate?.skills ?? []).map((s: string) => s.toLowerCase()).slice(0, 8);
      if (skills.length) await sb.from("candidates").update({ tags: skills }).eq("id", app.candidate_id);
    }

    await sb.from("activity_log").insert({
      event_type: "ai_evaluation_complete",
      actor_id: null,
      job_id: app.job_id,
      application_id,
      candidate_id: app.candidate_id,
      event_data: { candidate_name: candidate?.name, job_title: job.title, score, recommendation: rec },
    });

    console.log(`[evaluate] ${application_id} → ${score} ${rec} via ${out.model}`);
    return json({ status: "evaluated", application_id, score, recommendation: rec, model: out.model, resume_attached: resumeAttached });
  } catch (e) {
    console.error(`[evaluate] ${applicationId ?? "?"} failed:`, e);
    return json({ error: (e as Error).message ?? String(e) }, 500);
  }
});
