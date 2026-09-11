import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, Users, Star, Clock, Loader2, Plus, ArrowRight } from "lucide-react";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { PipelineFunnel } from "@/components/dashboard/PipelineFunnel";
import { useNavigate, Link } from "react-router-dom";

export default function Dashboard() {
  const { data: stats, isLoading } = useDashboardStats();
  const navigate = useNavigate();

  const statCards = [
    { 
      name: "Active Jobs", 
      value: stats?.activeJobs || 0, 
      icon: Briefcase, 
      href: "/jobs",
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    { 
      name: "Total Candidates", 
      value: stats?.totalCandidates || 0, 
      icon: Users, 
      href: "/candidates",
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    { 
      name: "Shortlisted", 
      value: stats?.shortlisted || 0, 
      icon: Star, 
      href: "/shortlisted",
      color: "text-warning",
      bgColor: "bg-warning/10"
    },
    { 
      name: "Pending Review", 
      value: stats?.pendingReview || 0, 
      icon: Clock, 
      href: "/candidates",
      color: "text-muted-foreground",
      bgColor: "bg-muted"
    },
  ];

  return (
    <DashboardLayout>
      <div className="animate-fade-in min-h-screen -m-4 md:-m-6 lg:-m-8 p-4 md:p-6 lg:p-8">
        {/* Header with quick actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-xl md:text-2xl font-display font-bold text-foreground">Dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">Overview of your recruiting pipeline</p>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link to="/jobs/new">
                <Plus className="mr-2 h-4 w-4" />
                New Job
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/candidates">
                Review Candidates
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats Grid - Interactive Cards */}
            <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
              {statCards.map((stat) => (
                <Card 
                  key={stat.name} 
                  className="cursor-pointer group hover:shadow-md transition-shadow"
                  onClick={() => navigate(stat.href)}
                >
                  <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 md:p-6 md:pb-2">
                    <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
                      {stat.name}
                    </CardTitle>
                    <div className={`p-1.5 rounded-lg ${stat.bgColor}`}>
                      <stat.icon className={`h-3.5 w-3.5 md:h-4 md:w-4 ${stat.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
                    <div className="flex items-end justify-between">
                      <div className="text-xl md:text-2xl font-semibold text-foreground">
                        {stat.value}
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pipeline Funnel */}
            <PipelineFunnel />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
