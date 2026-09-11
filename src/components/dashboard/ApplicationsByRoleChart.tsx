import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApplicationsByRole } from "@/hooks/useDashboardStats";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--primary) / 0.8)',
  'hsl(var(--primary) / 0.6)',
  'hsl(var(--primary) / 0.4)',
  'hsl(var(--primary) / 0.3)'
];

export function ApplicationsByRoleChart() {
  const { data: applications = [], isLoading } = useApplicationsByRole();
  const navigate = useNavigate();

  const chartData = applications.slice(0, 5).map(app => ({
    name: app.jobTitle.length > 15 ? app.jobTitle.substring(0, 15) + '...' : app.jobTitle,
    fullName: app.jobTitle,
    applications: app.count,
    shortlisted: app.shortlisted,
    jobId: app.jobId
  }));

  const handleBarClick = (data: any) => {
    if (data?.jobId) {
      navigate(`/jobs/${data.jobId}/candidates`);
    }
  };

  if (isLoading) {
    return (
      <Card variant="glass" className="glass-hover">
        <CardHeader>
          <CardTitle className="text-base font-medium">Applications by Role</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px]">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card variant="glass" className="glass-hover">
        <CardHeader>
          <CardTitle className="text-base font-medium">Applications by Role</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px] text-muted-foreground">
          No active jobs with applications
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="glass" className="glass-hover">
      <CardHeader>
        <CardTitle className="text-base font-medium">Applications by Role</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={chartData} 
              layout="vertical"
              margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
            >
              <XAxis type="number" hide />
              <YAxis 
                type="category" 
                dataKey="name" 
                width={100}
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="glass-card p-2 text-sm">
                        <p className="font-medium">{data.fullName}</p>
                        <p className="text-muted-foreground">{data.applications} applications</p>
                        <p className="text-muted-foreground">{data.shortlisted} shortlisted</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar 
                dataKey="applications" 
                radius={[0, 4, 4, 0]}
                cursor="pointer"
                onClick={handleBarClick}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
