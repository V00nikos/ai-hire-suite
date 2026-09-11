import { Bot, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface PendingEvaluationIndicatorProps {
  variant?: "compact" | "card" | "inline";
  className?: string;
}

export function PendingEvaluationIndicator({ 
  variant = "compact", 
  className = "" 
}: PendingEvaluationIndicatorProps) {
  if (variant === "inline") {
    return (
      <Badge variant="outline" className={`text-xs bg-muted/50 text-muted-foreground animate-pulse ${className}`}>
        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
        Evaluating...
      </Badge>
    );
  }

  if (variant === "compact") {
    return (
      <div className={`flex items-center gap-2 text-muted-foreground ${className}`}>
        <div className="relative">
          <Bot className="h-4 w-4 text-primary/60" />
          <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary animate-ping" />
        </div>
        <span className="text-xs">AI analysis pending...</span>
      </div>
    );
  }

  // Card variant - full skeleton
  return (
    <div className={`space-y-4 p-4 rounded-lg border border-dashed border-border/50 bg-muted/20 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-primary/60 animate-pulse" />
          <span className="text-sm font-medium text-muted-foreground">AI Evaluation</span>
        </div>
        <Badge variant="outline" className="text-xs bg-muted/50 border-muted">
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          Processing
        </Badge>
      </div>
      
      <div className="space-y-3">
        {/* Score skeleton */}
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-2 w-3/4" />
          </div>
        </div>
        
        {/* Summary skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
          <Skeleton className="h-3 w-4/6" />
        </div>
        
        {/* Strengths/Weaknesses skeleton */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-2 w-4/5" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-2 w-3/4" />
          </div>
        </div>
      </div>
      
      <p className="text-xs text-center text-muted-foreground/70">
        Analyzing resume and application data...
      </p>
    </div>
  );
}
