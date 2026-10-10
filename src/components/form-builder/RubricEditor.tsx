import { useState } from "react";
import { Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { EvaluationRubric, RubricCriterion } from "@/types/form";

interface RubricEditorProps {
  rubric: EvaluationRubric;
  onChange: (rubric: EvaluationRubric) => void;
  job: { title: string; department: string; description: string; requirements: string };
}

const toKey = (label: string) =>
  label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "criterion";

// Edits the rubric every applicant to this job is scored against: weighted 0-5 criteria rolled
// up to a 0-100 match score, plus must-haves and disqualifiers the model is told to check.
export function RubricEditor({ rubric, onChange, job }: RubricEditorProps) {
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();
  const criteria = rubric.criteria;
  const totalWeight = criteria.reduce((s, c) => s + (Number(c.weight) || 0), 0);

  const setCriteria = (next: RubricCriterion[]) => onChange({ ...rubric, criteria: next });
  const updateCriterion = (i: number, updates: Partial<RubricCriterion>) =>
    setCriteria(criteria.map((c, j) => (j === i ? { ...c, ...updates } : c)));

  const generate = async () => {
    if (criteria.length > 0 && !window.confirm("Replace the current rubric with an AI draft?")) return;
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-rubric", { body: job });
      if (error || data?.error) throw new Error(data?.error ?? error?.message);
      onChange({
        ...rubric,
        criteria: data.criteria,
        must_haves: data.must_haves,
        disqualifiers: data.disqualifiers,
      });
      toast({ title: "Rubric drafted", description: `Review and adjust the weights, then save. (${data.model})` });
    } catch (e) {
      toast({
        title: "Could not draft a rubric",
        description: e instanceof Error ? e.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const listField = (field: "must_haves" | "disqualifiers") => (
    <Textarea
      rows={3}
      value={(rubric[field] ?? []).join("\n")}
      onChange={(e) => onChange({ ...rubric, [field]: e.target.value.split("\n") })}
      onBlur={(e) => onChange({ ...rubric, [field]: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) })}
      placeholder="One per line"
    />
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-lg border border-dashed p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium">Draft from the job description</p>
          <p className="text-xs text-muted-foreground">AI reads the title, description and requirements and proposes weighted criteria.</p>
        </div>
        <Button onClick={generate} disabled={generating} className="gap-2 shrink-0">
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {generating ? "Drafting…" : "Generate with AI"}
        </Button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Criteria</Label>
          <Badge
            variant="outline"
            className={cn(totalWeight === 100 ? "text-success border-success/30" : "text-warning border-warning/30")}
          >
            Weights total {totalWeight}%{totalWeight !== 100 && " · scores are normalised"}
          </Badge>
        </div>

        {criteria.length === 0 && (
          <p className="rounded-lg bg-muted/30 p-6 text-center text-sm text-muted-foreground">
            No criteria yet. Generate a draft or add one. Without a rubric, the AI derives criteria from the job description for each applicant.
          </p>
        )}

        {criteria.map((c, i) => (
          <div key={i} className="space-y-2 rounded-lg border p-3">
            <div className="flex gap-2">
              <Input
                value={c.label}
                onChange={(e) => updateCriterion(i, { label: e.target.value, key: toKey(e.target.value) })}
                placeholder="Criterion, e.g. Stakeholder management"
                className="flex-1"
              />
              <div className="relative w-24">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={c.weight}
                  onChange={(e) => updateCriterion(i, { weight: Number(e.target.value) })}
                  className="pr-7"
                  aria-label="Weight"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setCriteria(criteria.filter((_, j) => j !== i))} aria-label="Remove criterion">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <Input
              value={c.description ?? ""}
              onChange={(e) => updateCriterion(i, { description: e.target.value })}
              placeholder="What does a 5/5 look like?"
              className="text-sm"
            />
          </div>
        ))}

        <Button
          variant="outline"
          className="w-full"
          onClick={() => setCriteria([...criteria, { key: `criterion_${criteria.length + 1}`, label: "", weight: 0, description: "" }])}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Criterion
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Must-haves</Label>
          {listField("must_haves")}
        </div>
        <div className="space-y-2">
          <Label>Disqualifiers</Label>
          {listField("disqualifiers")}
        </div>
      </div>
    </div>
  );
}
