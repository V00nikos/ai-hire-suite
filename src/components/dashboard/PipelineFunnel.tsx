import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePipelineStats } from "@/hooks/useDashboardStats";
import { Loader2, FileText, Brain, Star, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function PipelineFunnel() {
  const { data: stats, isLoading } = usePipelineStats();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card variant="glass" className="glass-hover">
        <CardHeader>
          <CardTitle className="text-base font-medium">Pipeline Overview</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px]">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const stages = [
    { 
      label: 'Applied', 
      count: stats?.applied || 0, 
      icon: FileText, 
      color: 'bg-primary/10 text-primary',
      onClick: () => navigate('/candidates')
    },
    { 
      label: 'Evaluated', 
      count: stats?.evaluated || 0, 
      icon: Brain, 
      color: 'bg-blue-500/10 text-blue-500',
      onClick: () => navigate('/candidates')
    },
    { 
      label: 'Shortlisted', 
      count: stats?.shortlisted || 0, 
      icon: Star, 
      color: 'bg-warning/10 text-warning',
      onClick: () => navigate('/shortlisted')
    },
    { 
      label: 'Hired', 
      count: stats?.hired || 0, 
      icon: Trophy, 
      color: 'bg-success/10 text-success',
      onClick: () => navigate('/candidates')
    },
  ];

  const maxCount = Math.max(...stages.map(s => s.count), 1);

  return (
    <Card variant="glass" className="glass-hover">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Pipeline Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {stages.map((stage, index) => {
            const percentage = (stage.count / maxCount) * 100;
            const conversionRate = index > 0 && stages[index - 1].count > 0
              ? ((stage.count / stages[index - 1].count) * 100).toFixed(0)
              : null;

            return (
              <div 
                key={stage.label}
                className="cursor-pointer group"
                onClick={stage.onClick}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-md ${stage.color}`}>
                      <stage.icon className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-sm font-medium">{stage.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">{stage.count}</span>
                    {conversionRate && (
                      <span className="text-xs text-muted-foreground">
                        ({conversionRate}%)
                      </span>
                    )}
                  </div>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      index === 0 ? 'bg-primary' :
                      index === 1 ? 'bg-blue-500' :
                      index === 2 ? 'bg-warning' :
                      'bg-success'
                    } group-hover:opacity-80`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
