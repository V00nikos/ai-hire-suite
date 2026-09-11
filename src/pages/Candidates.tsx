import { useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Upload, Search, FileText, Video, Loader2 } from "lucide-react";
import { useCandidates } from "@/hooks/useCandidates";
import { useAIEvaluationRealtime } from "@/hooks/useAIEvaluationRealtime";

const statusColors: Record<string, string> = {
  pending: "bg-warning/10 text-warning border-warning/20",
  evaluated: "bg-muted text-muted-foreground border-border",
  shortlisted: "bg-success/10 text-success border-success/20",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
};

export default function Candidates() {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: candidatesData = [], isLoading } = useCandidates();
  
  // Subscribe to AI evaluation realtime updates
  useAIEvaluationRealtime();

  // Transform data to flat list with application info
  const candidates = candidatesData.flatMap((candidate: any) => {
    const apps = candidate.applications || [];
    if (apps.length === 0) {
      return [{
        id: candidate.id,
        name: candidate.name,
        email: candidate.email,
        phone: candidate.phone,
        jobTitle: null,
        jobId: null,
        score: null,
        status: 'pending',
        hasResume: false,
        hasVideo: false,
      }];
    }
    return apps.map((app: any) => ({
      id: candidate.id,
      name: candidate.name,
      email: candidate.email,
      phone: candidate.phone,
      jobTitle: app.jobs?.title || null,
      jobId: app.jobs?.id || app.job_id,
      score: app.ai_evaluations?.score || null,
      status: app.status || 'pending',
      hasResume: true,
      hasVideo: false,
    }));
  });

  const filteredCandidates = candidates.filter((c: any) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(query) ||
      c.email.toLowerCase().includes(query) ||
      (c.jobTitle?.toLowerCase().includes(query) || false)
    );
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="animate-fade-in">
        <div className="mb-6 md:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-foreground">All Candidates</h1>
            <p className="mt-1 text-sm text-muted-foreground">View and manage candidates across all jobs</p>
          </div>
          <Button asChild className="w-full sm:w-auto">
            <Link to="/candidates/bulk-upload">
              <Upload className="mr-2 h-4 w-4" />Bulk Upload
            </Link>
          </Button>
        </div>

        <div className="mb-4 md:mb-6">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search candidates..." className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </div>

        <div className="space-y-3 md:space-y-4">
          {filteredCandidates.length === 0 ? (
            <Card className="shadow-card">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground mb-4">{searchQuery ? "No candidates found" : "No candidates yet"}</p>
                {searchQuery ? (
                  <Button variant="outline" onClick={() => setSearchQuery("")}>Clear Search</Button>
                ) : (
                  <Button asChild><Link to="/candidates/bulk-upload"><Upload className="mr-2 h-4 w-4" />Upload Candidates</Link></Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredCandidates.map((candidate: any, index: number) => (
              <Card key={`${candidate.id}-${index}`} className="shadow-card transition-shadow hover:shadow-card-hover">
                <CardContent className="p-4 md:p-6">
                  <div className="md:hidden">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="text-sm font-medium text-foreground">{candidate.name}</span>
                        <Badge variant="outline" className={`ml-2 text-[10px] ${statusColors[candidate.status]}`}>
                          {candidate.status.charAt(0).toUpperCase() + candidate.status.slice(1)}
                        </Badge>
                      </div>
                      {candidate.score !== null && (
                        <span className="text-sm font-semibold text-foreground">{candidate.score}</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">{candidate.email}</p>
                    <div className="flex items-center justify-between">
                      {candidate.jobTitle && (
                        <Link to={`/jobs/${candidate.jobId}/candidates`} className="text-xs text-muted-foreground hover:underline">
                          {candidate.jobTitle}
                        </Link>
                      )}
                      <div className="flex items-center gap-2">
                        {candidate.hasResume && <FileText className="h-3 w-3 text-muted-foreground" />}
                        {candidate.hasVideo && <Video className="h-3 w-3 text-muted-foreground" />}
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full mt-3" asChild>
                      <Link to={`/candidates/${candidate.id}`}>View Profile</Link>
                    </Button>
                  </div>

                  <div className="hidden md:flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-base font-medium text-foreground">{candidate.name}</span>
                        <Badge variant="outline" className={statusColors[candidate.status]}>
                          {candidate.status.charAt(0).toUpperCase() + candidate.status.slice(1)}
                        </Badge>
                        {candidate.score !== null && (
                          <span className="text-sm font-medium text-muted-foreground">Score: {candidate.score}/100</span>
                        )}
                      </div>
                      <div className="mt-2 flex items-center gap-6 text-sm text-muted-foreground">
                        <span>{candidate.email}</span>
                        {candidate.jobTitle && (
                          <Link to={`/jobs/${candidate.jobId}/candidates`} className="hover:underline">{candidate.jobTitle}</Link>
                        )}
                        <div className="flex items-center gap-2">
                          {candidate.hasResume && <span className="flex items-center gap-1"><FileText className="h-3.5 w-3.5" /> Resume</span>}
                          {candidate.hasVideo && <span className="flex items-center gap-1"><Video className="h-3.5 w-3.5" /> Video</span>}
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/candidates/${candidate.id}`}>View Profile</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
