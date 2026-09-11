import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, ExternalLink, Clock } from "lucide-react";

interface ExternalFeedbackSectionProps {
  className?: string;
}

export function ExternalFeedbackSection({ className = "" }: ExternalFeedbackSectionProps) {
  return (
    <Card className={`glass-card border-dashed ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            External Feedback
          </CardTitle>
          <Badge variant="outline" className="text-xs bg-muted/50">
            <Clock className="h-3 w-3 mr-1" />
            Coming Soon
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg bg-muted/30 p-6 text-center">
          <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <ExternalLink className="h-6 w-6 text-primary/60" />
          </div>
          <p className="text-sm text-muted-foreground mb-2">
            External feedback from your ATS or other systems will appear here.
          </p>
          <p className="text-xs text-muted-foreground/70">
            Connect your external database to sync interview notes, hiring manager feedback, and reference checks.
          </p>
        </div>
        
        {/* Placeholder structure for future data */}
        <div className="mt-4 space-y-3 opacity-40 pointer-events-none">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/20">
            <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-24 bg-muted rounded animate-pulse" />
              <div className="h-4 w-full bg-muted rounded animate-pulse" />
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/20">
            <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-32 bg-muted rounded animate-pulse" />
              <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
