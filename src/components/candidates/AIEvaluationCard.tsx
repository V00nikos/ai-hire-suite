import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Bot, 
  Check, 
  AlertTriangle, 
  MessageSquare, 
  ClipboardList,
  Trophy,
  ThumbsUp,
  ThumbsDown,
  HelpCircle,
  Clock
} from "lucide-react";
import type { Json } from "@/integrations/supabase/types";

interface AIEvaluationCardProps {
  evaluation: {
    score?: number | null;
    overall_score?: number | null;
    rubric_scores?: Json | null;
    raw_response?: Json | null;
    model_used?: string | null;
    resume_score?: number | null;
    video_score?: number | null;
    recommendation?: string | null;
    summary?: string | null;
    strengths?: Json | null;
    weaknesses?: Json | null;
    interview_questions?: Json | null;
    hiring_manager_notes?: string | null;
    evaluated_at?: string | null;
  } | null;
  className?: string;
}

const recommendationConfig: Record<string, { 
  label: string; 
  color: string; 
  bgColor: string;
  icon: React.ComponentType<{ className?: string }>;
}> = {
  'STRONG YES': { 
    label: 'Strong Yes', 
    color: 'text-success', 
    bgColor: 'bg-success/10 border-success/20',
    icon: Trophy
  },
  'YES': { 
    label: 'Yes', 
    color: 'text-success', 
    bgColor: 'bg-success/10 border-success/20',
    icon: ThumbsUp
  },
  'MAYBE': { 
    label: 'Maybe', 
    color: 'text-warning', 
    bgColor: 'bg-warning/10 border-warning/20',
    icon: HelpCircle
  },
  'NO': { 
    label: 'No', 
    color: 'text-destructive', 
    bgColor: 'bg-destructive/10 border-destructive/20',
    icon: ThumbsDown
  },
  'STRONG NO': { 
    label: 'Strong No', 
    color: 'text-destructive', 
    bgColor: 'bg-destructive/10 border-destructive/20',
    icon: ThumbsDown
  },
};

export function RecommendationBadge({ recommendation }: { recommendation: string | null | undefined }) {
  if (!recommendation) return null;
  
  const config = recommendationConfig[recommendation];
  if (!config) return null;
  
  const Icon = config.icon;
  
  return (
    <Badge variant="outline" className={`${config.bgColor} ${config.color} gap-1`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

function ScoreBar({ label, score, color }: { label: string; score: number | null | undefined; color: string }) {
  if (score === null || score === undefined) return null;
  
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{score}/100</span>
      </div>
      <Progress value={score} className={`h-2 ${color}`} />
    </div>
  );
}

export function AIEvaluationCard({ evaluation, className = "" }: AIEvaluationCardProps) {
  if (!evaluation) {
    return (
      <Card variant="glass" className={`border-dashed ${className}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Bot className="h-4 w-4" />
              AI Evaluation
            </CardTitle>
            <Badge variant="outline" className="text-xs bg-muted/50">
              <Clock className="h-3 w-3 mr-1" />
              Pending
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-muted/30 p-6 text-center">
            <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="h-6 w-6 text-primary/60 animate-pulse" />
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              AI evaluation in progress
            </p>
            <p className="text-xs text-muted-foreground/70">
              The candidate's application is being analyzed. Results will appear here once complete.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Safely parse JSON arrays
  const parseJsonArray = (value: Json | null | undefined): string[] => {
    if (!value) return [];
    if (Array.isArray(value)) return value.filter((v): v is string => typeof v === 'string');
    return [];
  };

  const strengths = parseJsonArray(evaluation.strengths);
  const weaknesses = parseJsonArray(evaluation.weaknesses);
  const interviewQuestions = parseJsonArray(evaluation.interview_questions);

  // Per-criterion scores (0-5); live evaluations also carry a label and an evidence note in raw_response.
  const rubricScores = (evaluation.rubric_scores && typeof evaluation.rubric_scores === 'object' && !Array.isArray(evaluation.rubric_scores))
    ? (evaluation.rubric_scores as Record<string, number>)
    : {};
  const rawRubric = (evaluation.raw_response as { rubric?: { key: string; label?: string; evidence?: string }[] } | null)?.rubric ?? [];
  const rubricRows = Object.entries(rubricScores).map(([key, value]) => {
    const detail = rawRubric.find((r) => r.key === key);
    return {
      key,
      label: detail?.label || key.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase()),
      value: Number(value),
      evidence: detail?.evidence,
    };
  });

  return (
    <Card variant="glass" className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Bot className="h-4 w-4" />
            AI Evaluation
          </CardTitle>
          <RecommendationBadge recommendation={evaluation.recommendation} />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Match Score */}
        {evaluation.score !== null && evaluation.score !== undefined ? (
          <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-muted/30">
            <span className="text-4xl font-bold text-foreground">
              {evaluation.score}<span className="text-lg text-muted-foreground font-medium">/100</span>
            </span>
            <span className="text-xs text-muted-foreground mt-1">Rubric-weighted match score</span>
          </div>
        ) : evaluation.overall_score !== null && evaluation.overall_score !== undefined && (
          <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-muted/30">
            <span className="text-3xl font-bold text-foreground">{evaluation.overall_score}/5</span>
            <span className="text-xs text-muted-foreground mt-1">Overall Score</span>
          </div>
        )}

        {/* Summary */}
        {evaluation.summary && (
          <p className="text-sm text-foreground/80 leading-relaxed">{evaluation.summary}</p>
        )}

        {/* Rubric breakdown */}
        {rubricRows.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Rubric Breakdown
            </h4>
            {rubricRows.map((row) => (
              <div key={row.key} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-foreground/80 font-medium">{row.label}</span>
                  <span className="font-medium">{row.value}/5</span>
                </div>
                <Progress value={(row.value / 5) * 100} className="h-1.5" />
                {row.evidence && <p className="text-xs text-muted-foreground leading-relaxed">{row.evidence}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Strengths & Weaknesses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Strengths */}
          {strengths.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2 text-success">
                <Check className="h-4 w-4" />
                Strengths
              </h4>
              <ul className="space-y-1.5">
                {strengths.map((strength, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-success mt-0.5">•</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Weaknesses */}
          {weaknesses.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2 text-warning">
                <AlertTriangle className="h-4 w-4" />
                Weaknesses
              </h4>
              <ul className="space-y-1.5">
                {weaknesses.map((weakness, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-warning mt-0.5">•</span>
                    <span>{weakness}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Interview Questions */}
        {interviewQuestions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Suggested Interview Questions
            </h4>
            <ol className="space-y-2">
              {interviewQuestions.map((question, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="font-medium text-foreground/70 min-w-[1.5rem]">{i + 1}.</span>
                  <span>{question}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Hiring Manager Notes */}
        {evaluation.hiring_manager_notes && (
          <div className="space-y-2 p-3 rounded-lg bg-muted/30 border border-border/50">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Hiring Manager Notes
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {evaluation.hiring_manager_notes}
            </p>
          </div>
        )}

        {/* Evaluation timestamp */}
        {evaluation.evaluated_at && (
          <p className="text-xs text-muted-foreground/70 text-right">
            Evaluated {new Date(evaluation.evaluated_at).toLocaleString()}
            {evaluation.model_used && ` · ${evaluation.model_used}`}
          </p>
        )}
      </CardContent>
    </Card>
  );
}