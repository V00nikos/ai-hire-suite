import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RunEvaluationButtonProps {
  applicationId: string;
  hasEvaluation: boolean;
}

// Calls the evaluate-application edge function; force re-scores an existing evaluation.
export function RunEvaluationButton({ applicationId, hasEvaluation }: RunEvaluationButtonProps) {
  const [running, setRunning] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const run = async () => {
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke("evaluate-application", {
        body: { application_id: applicationId, force: true },
      });
      if (error || data?.error) throw new Error(data?.error ?? error?.message);
      queryClient.invalidateQueries({ queryKey: ["candidate"] });
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
      toast({
        title: `Scored ${data.score}/100 · ${data.recommendation}`,
        description: `Evaluated against the job rubric with ${data.model}.`,
      });
    } catch (e) {
      toast({
        title: "AI evaluation failed",
        description: e instanceof Error ? e.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setRunning(false);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={run} disabled={running} className="gap-2">
      {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
      {running ? "Scoring resume against the JD…" : hasEvaluation ? "Re-run AI evaluation" : "Run AI evaluation"}
    </Button>
  );
}
