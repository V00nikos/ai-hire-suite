// generate-rubric — draft a weighted scoring rubric from a job description with OpenAI.
//
//   POST { title, department?, description?, requirements? }  →  { criteria, must_haves, disqualifiers, model }
//
// Recruiter-only (verify_jwt on). The recruiter edits the draft in the job builder before saving;
// evaluate-application then scores every applicant against whatever was saved.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") ?? "";
const MODEL = Deno.env.get("OPENAI_MODEL") ?? "gpt-6-luna";
const FALLBACK_MODEL = Deno.env.get("OPENAI_FALLBACK_MODEL") ?? "gpt-5.4-mini";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const schema = {
  type: "object",
  additionalProperties: false,
  required: ["criteria", "must_haves", "disqualifiers"],
  properties: {
    criteria: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["key", "label", "weight", "description"],
        properties: {
          key: { type: "string" },
          label: { type: "string" },
          weight: { type: "integer" },
          description: { type: "string" },
        },
      },
    },
    must_haves: { type: "array", items: { type: "string" } },
    disqualifiers: { type: "array", items: { type: "string" } },
  },
};

const INSTRUCTIONS = `You design screening rubrics for recruiters. From the job below, produce 4-6 criteria that separate strong applicants from weak ones for THIS role.
- key: snake_case, label: 2-4 words, description: one sentence saying what a 5/5 looks like, citing the job's own requirements.
- weights are integers that sum to exactly 100; weight what the job description stresses most.
- must_haves: 1-3 hard requirements stated in the job (empty if none). disqualifiers: 0-2 job-relevant deal-breakers.
- Never use protected attributes (age, gender, nationality, etc.) or school prestige as criteria.`;

async function callOpenAI(model: string, input: string) {
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      instructions: INSTRUCTIONS,
      input,
      text: { format: { type: "json_schema", name: "rubric", strict: true, schema } },
    }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`OpenAI ${model} HTTP ${res.status}: ${JSON.stringify(body.error ?? body).slice(0, 300)}`);
  const text = body.output
    ?.filter((o: { type: string }) => o.type === "message")
    .flatMap((o: { content: { type: string; text?: string }[] }) => o.content)
    .find((c: { type: string }) => c.type === "output_text")?.text;
  if (!text) throw new Error(`OpenAI ${model} returned no text`);
  return { result: JSON.parse(text), model: body.model ?? model };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  if (!OPENAI_API_KEY) return json({ error: "OPENAI_API_KEY is not configured" }, 500);

  try {
    const { title, department, description, requirements } = await req.json();
    if (!title?.trim()) return json({ error: "A job title is required" }, 400);
    if (!description?.trim() && !requirements?.trim()) {
      return json({ error: "Add a description or requirements first, so the rubric has something to work from" }, 400);
    }

    const input = `Title: ${title}\nDepartment: ${department ?? ""}\n\nDescription:\n${description ?? ""}\n\nRequirements:\n${requirements ?? ""}`;
    let out;
    try {
      out = await callOpenAI(MODEL, input);
    } catch (e) {
      console.error(`[generate-rubric] primary model failed, falling back: ${(e as Error).message}`);
      out = await callOpenAI(FALLBACK_MODEL, input);
    }

    // Normalise weights to sum to exactly 100 and keys to unique snake_case.
    const criteria = (out.result.criteria as { key: string; label: string; weight: number; description: string }[]).slice(0, 6);
    const total = criteria.reduce((s, c) => s + Math.max(1, c.weight), 0);
    const seen = new Set<string>();
    const normalised = criteria.map((c) => {
      let key = (c.key || c.label).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "criterion";
      while (seen.has(key)) key += "_2";
      seen.add(key);
      return { key, label: c.label, weight: Math.round((Math.max(1, c.weight) / total) * 100), description: c.description };
    });
    const drift = 100 - normalised.reduce((s, c) => s + c.weight, 0);
    if (normalised.length) normalised[0].weight += drift;

    return json({
      criteria: normalised,
      must_haves: out.result.must_haves.slice(0, 3),
      disqualifiers: out.result.disqualifiers.slice(0, 2),
      model: out.model,
    });
  } catch (e) {
    console.error("[generate-rubric] failed:", e);
    return json({ error: (e as Error).message ?? String(e) }, 500);
  }
});
