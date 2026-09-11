import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Check,
  FileText,
  Upload,
  ListChecks,
  MessageSquare,
  Gauge,
  Scale,
  ShieldCheck,
  Star,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

const DEMO_EMAIL = "demo.recruiter@aihiresuite.app";
const DEMO_PASSWORD = "Demo-Recruiter-d82c50b2!";
const REPO_URL = "https://github.com/V00nikos/ai-hire-suite";

function Mark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-soft ${className}`}
      aria-hidden="true"
    >
      <span className="font-vortex text-base tracking-wide pt-0.5">AI</span>
    </span>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground shadow-soft backdrop-blur">
      {children}
    </span>
  );
}

function Shot({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-3xl border border-border/70 bg-card shadow-elevated ${className}`}>
      <img src={src} alt={alt} loading="lazy" className="block w-full" />
    </div>
  );
}

const STEPS: { icon: LucideIcon; title: string; body: string; shot: string; alt: string }[] = [
  {
    icon: FileText,
    title: "Build the form and the rubric",
    body: "Twelve field types, drag-and-drop ordering, a published version history. The rubric is written down with the form, so a score can always be traced to the criteria that produced it.",
    shot: "/landing/form-builder.png",
    alt: "Job form builder",
  },
  {
    icon: Upload,
    title: "Applicants arrive, or you bring them",
    body: "A public apply link that needs no account, or a CSV of an existing pipeline with a column mapper that suggests each match and shows its confidence.",
    shot: "/landing/job-candidates.png",
    alt: "Ranked candidate list",
  },
  {
    icon: ListChecks,
    title: "Scored, ranked, reviewed",
    body: "Each applicant gets a 0 to 100 match score, a recommendation from Strong Yes to Strong No, strengths, gaps and interview questions. Quick Review turns the list into fast, recorded decisions.",
    shot: "/landing/candidate-profile.png",
    alt: "Candidate profile with AI evaluation",
  },
];

const SCORING_POINTS: [string, string][] = [
  ["Per-criterion scores, weighted the way you chose", "Five criteria, five weights, one 0 to 100 match score and a 0 to 5 overall band."],
  ["Resume and video scored separately", "So you can see which evidence carried the decision, and whether the video added anything."],
  ["Strengths, gaps and interview questions", "Written for this candidate, aimed at what the score could not settle."],
  ["Fixed recommendation bands", "85 and up is Strong Yes, below 45 is Strong No. Two recruiters read the same number the same way."],
];

const METRICS: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: Gauge, title: "Coverage and speed", body: "What share of applications has a score, and how long after submission did it arrive?" },
  { icon: Scale, title: "Agreement", body: "Of the candidates the AI called Yes, how many did a recruiter shortlist? Who did it miss?" },
  { icon: ListChecks, title: "Calibration", body: "Does a 4 out of 5 mean the same thing for an engineering role as for a sales role?" },
  { icon: ShieldCheck, title: "Fairness", body: "Do score distributions look the same across source, experience level and location?" },
  { icon: MessageSquare, title: "Rubric health", body: "Which criteria actually separate the shortlisted from the rejected? Dead weight goes in the next version." },
  { icon: Star, title: "Everything versioned", body: "Change the rubric and old candidates keep their old scores. New ones get the new rubric." },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border/40 bg-background/70 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-3">
            <Mark />
            <span className="font-vortex text-2xl tracking-wide">AI Hire Suite</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex" aria-label="Sections">
            <a href="#how" className="transition-colors hover:text-foreground">How it works</a>
            <a href="#scoring" className="transition-colors hover:text-foreground">Scoring</a>
            <a href="#metrics" className="transition-colors hover:text-foreground">Metrics</a>
            <a href="#demo" className="transition-colors hover:text-foreground">Demo</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="rounded-full" asChild>
              <Link to="/auth">Log in</Link>
            </Button>
            <Button size="sm" className="rounded-full px-5" asChild>
              <Link to="/dashboard">Open the demo</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden pt-36 pb-16 md:pt-44 md:pb-24">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -top-24 left-[8%] h-80 w-80 rounded-full bg-sky-light/70 blur-3xl" />
          <div className="absolute top-32 right-[10%] h-72 w-72 rounded-full bg-sky/50 blur-3xl" />
          <div className="absolute bottom-0 left-[38%] h-96 w-96 rounded-full bg-white/60 blur-3xl" />
        </div>

        <div className="container relative mx-auto px-6 text-center">
          <div className="animate-fade-in">
            <Eyebrow>
              <Sparkles className="h-3.5 w-3.5" /> Screening · Scoring · Interview prep
            </Eyebrow>
          </div>
          <h1 className="mx-auto mt-6 max-w-4xl font-display text-4xl font-black tracking-tight md:text-6xl lg:text-7xl">
            Every applicant scored against your rubric.
            <span className="mt-2 block text-muted-foreground">Every score explained.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
            AI Hire Suite turns screening into a system: versioned application forms, rubric-weighted
            scores with evidence, and interview questions written for each candidate.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" className="min-w-[200px] rounded-full px-8 text-base shadow-card" asChild>
              <Link to="/dashboard">
                Open the demo <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="min-w-[200px] rounded-full px-8 text-base" asChild>
              <a href="#how">See how it works</a>
            </Button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">Fictional demo data. Log in with the demo account to look around.</p>
        </div>

        {/* Floating product cards */}
        <div className="container relative mx-auto mt-16 px-6">
          <div className="relative mx-auto max-w-6xl">
            <Shot src="/landing/dashboard.png" alt="AI Hire Suite dashboard with the recruiting pipeline" />
            <div className="pointer-events-none absolute -bottom-8 -left-2 hidden w-[42%] rotate-[-2deg] md:block lg:-left-10">
              <Shot src="/landing/quick-review.png" alt="Quick Review card with strengths, gaps and a recommendation" />
            </div>
            <div className="pointer-events-none absolute -right-2 -top-10 hidden w-[34%] rotate-[2deg] lg:block lg:-right-10">
              <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-elevated">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-lg font-semibold">Maya Rao</span>
                  <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold">5/5</span>
                  <span className="rounded-full bg-success/15 px-3 py-1 text-xs font-semibold text-success">Strong Yes</span>
                </div>
                <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                  <p className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-success" /> Ran an evaluation harness and tied it to an online metric</p>
                  <p className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-success" /> Two 0→1 launches in data-heavy products</p>
                  <p className="flex items-start gap-2"><Star className="mt-0.5 h-4 w-4 shrink-0 text-warning" /> Probe: salary expectation above band</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="container mx-auto px-6 pt-28 pb-8 md:pt-40">
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow>How it works</Eyebrow>
          <h2 className="mt-5 font-display text-3xl font-black tracking-tight md:text-5xl">From job post to shortlist, in one loop</h2>
          <p className="mt-4 text-lg text-muted-foreground">Three steps. Every one of them leaves a record.</p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, body, shot, alt }) => (
            <article key={title} className="flex flex-col rounded-3xl border border-border/70 bg-card p-6 shadow-card transition-shadow hover:shadow-card-hover">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-muted">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-xl font-semibold">{title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
              <div className="mt-6 overflow-hidden rounded-2xl border border-border/60">
                <img src={shot} alt={alt} loading="lazy" className="block w-full" />
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Scoring */}
      <section id="scoring" className="container mx-auto px-6 py-24 md:py-32">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <Eyebrow>Scoring</Eyebrow>
            <h2 className="mt-5 font-display text-3xl font-black tracking-tight md:text-5xl">Scores you can read, not just rank by</h2>
            <p className="mt-5 text-lg text-muted-foreground">
              A match score on its own is a guess with a number on it. Here every score carries its
              reasons, and every reason points back to the rubric you wrote.
            </p>
            <ul className="mt-8 space-y-4">
              {SCORING_POINTS.map(([t, d]) => (
                <li key={t} className="flex gap-3">
                  <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success/15">
                    <Check className="h-3.5 w-3.5 text-success" />
                  </span>
                  <div>
                    <p className="font-semibold">{t}</p>
                    <p className="text-sm text-muted-foreground">{d}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <Shot src="/landing/candidate-profile.png" alt="Candidate profile showing the AI evaluation" className="lg:rotate-[1deg]" />
        </div>
      </section>

      {/* Metrics */}
      <section id="metrics" className="relative overflow-hidden py-24 md:py-32">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-sky-light/70 blur-3xl" />
          <div className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-sky/40 blur-3xl" />
        </div>
        <div className="container relative mx-auto px-6">
          <div className="mx-auto max-w-2xl text-center">
            <Eyebrow>Metrics</Eyebrow>
            <h2 className="mt-5 font-display text-3xl font-black tracking-tight md:text-5xl">The questions that keep it honest</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Because your decisions are stored next to the AI's, the weekly review runs on data instead of memory.
            </p>
          </div>
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {METRICS.map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-3xl border border-border/70 bg-card/90 p-6 shadow-card backdrop-blur">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo CTA */}
      <section id="demo" className="container mx-auto px-6 pb-24 md:pb-32">
        <div className="relative overflow-hidden rounded-[2rem] bg-primary px-8 py-14 text-primary-foreground shadow-elevated md:px-16 md:py-20">
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" aria-hidden="true" />
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div>
              <h2 className="font-display text-3xl font-black tracking-tight md:text-5xl">See it with a full pipeline</h2>
              <p className="mt-4 text-lg text-primary-foreground/75">
                Seven jobs, fifty-two candidates, every one of them fictional. Open the demo, shortlist someone, watch the board update.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button size="lg" variant="secondary" className="rounded-full px-8 text-base" asChild>
                  <Link to="/dashboard">
                    Open the demo <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="ghost" className="rounded-full px-8 text-base text-primary-foreground hover:bg-white/10 hover:text-primary-foreground" asChild>
                  <a href={REPO_URL} target="_blank" rel="noreferrer">View the source</a>
                </Button>
              </div>
            </div>
            <div className="rounded-3xl border border-white/15 bg-white/5 p-6 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground/60">Demo login</p>
              <dl className="mt-4 space-y-3 font-mono text-sm">
                <div>
                  <dt className="text-primary-foreground/60">email</dt>
                  <dd className="mt-1 select-all break-all rounded-xl bg-white/10 px-3 py-2">{DEMO_EMAIL}</dd>
                </div>
                <div>
                  <dt className="text-primary-foreground/60">password</dt>
                  <dd className="mt-1 select-all break-all rounded-xl bg-white/10 px-3 py-2">{DEMO_PASSWORD}</dd>
                </div>
              </dl>
              <p className="mt-4 text-xs text-primary-foreground/60">Shared sandbox. Anything you change is visible to the next visitor.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-6 py-8 md:flex-row">
          <div className="flex items-center gap-3">
            <Mark />
            <span className="font-vortex text-xl tracking-wide">AI Hire Suite</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Built by Pranav Shelke · <a className="underline-offset-4 hover:underline" href={REPO_URL} target="_blank" rel="noreferrer">Source on GitHub</a> · MIT License
          </p>
        </div>
      </footer>
    </div>
  );
}
