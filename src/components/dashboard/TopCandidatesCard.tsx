import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTopCandidates } from "@/hooks/useDashboardStats";
import { LaurelWreath } from "@/components/LaurelWreath";
import { Star, Loader2, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function TopCandidatesCard() {
  const { data: candidates = [], isLoading } = useTopCandidates(3);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const shortlistMutation = useMutation({
    mutationFn: async (applicationId: string) => {
      const { error } = await supabase
        .from('applications')
        .update({ shortlisted: true, shortlisted_at: new Date().toISOString() })
        .eq('id', applicationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['top-candidates'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Candidate shortlisted!');
    },
    onError: () => {
      toast.error('Failed to shortlist candidate');
    }
  });

  const renderStars = (score: number) => {
    const fullStars = Math.floor(score);
    const hasHalfStar = score % 1 >= 0.5;
    
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-3 w-3 ${
              i < fullStars
                ? 'fill-warning text-warning'
                : i === fullStars && hasHalfStar
                ? 'fill-warning/50 text-warning'
                : 'text-muted-foreground/30'
            }`}
          />
        ))}
        <span className="ml-1 text-xs text-muted-foreground">{score.toFixed(1)}</span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card variant="glass" className="glass-hover">
        <CardHeader>
          <CardTitle className="text-base font-medium">Top Candidates</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[250px]">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (candidates.length === 0) {
    return (
      <Card variant="glass" className="glass-hover">
        <CardHeader>
          <CardTitle className="text-base font-medium">Top Candidates</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[250px] text-muted-foreground">
          No AI evaluations yet
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="glass" className="glass-hover">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Top Candidates</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {candidates.map((candidate, index) => (
          <div
            key={candidate.id}
            className="flex items-center gap-3 p-2 rounded-lg bg-background/30 hover:bg-background/50 transition-colors cursor-pointer"
            onClick={() => navigate(`/candidates/${candidate.candidateId}`)}
          >
            {/* Rank indicator with laurel for #1 */}
            <div className="relative flex-shrink-0">
              {index === 0 ? (
                <LaurelWreath rank={1} score={candidate.score} className="w-10 h-10" />
              ) : (
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  index === 1 ? 'bg-muted text-muted-foreground' : 
                  index === 2 ? 'bg-muted/50 text-muted-foreground' : 
                  'bg-background text-muted-foreground'
                }`}>
                  {index + 1}
                </div>
              )}
            </div>

            {/* Candidate info */}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{candidate.candidateName}</p>
              <p className="text-xs text-muted-foreground truncate">{candidate.jobTitle}</p>
              {renderStars(candidate.score)}
            </div>

            {/* Quick shortlist button */}
            <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              {candidate.shortlisted ? (
                <div className="flex items-center gap-1 text-xs text-success">
                  <CheckCircle className="h-4 w-4" />
                  <span>Shortlisted</span>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs glass"
                  onClick={() => shortlistMutation.mutate(candidate.applicationId)}
                  disabled={shortlistMutation.isPending}
                >
                  Shortlist
                </Button>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
