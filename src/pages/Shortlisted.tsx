import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, FileText, Video, Calendar, Star, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScheduleDialog } from "@/components/dialogs/ScheduleDialog";
import { useShortlistedCandidates } from "@/hooks/useCandidates";
import { useUpdateApplicationStatus } from "@/hooks/useApplications";

export default function Shortlisted() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const { data: candidates = [], isLoading } = useShortlistedCandidates();
  const updateStatus = useUpdateApplicationStatus();
  const [scheduleDialog, setScheduleDialog] = useState<{ open: boolean; name: string; email: string }>({ open: false, name: "", email: "" });

  const filteredCandidates = candidates.filter((c) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return c.name.toLowerCase().includes(query) || c.email.toLowerCase().includes(query);
  });

  const removeFromShortlist = (applicationId: string, name: string) => {
    updateStatus.mutate(
      { applicationId, shortlisted: false, status: 'evaluated' },
      { onSuccess: () => toast({ title: "Removed from shortlist", description: `${name} has been removed` }) }
    );
  };

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
        <div className="mb-6 md:mb-8">
          <h1 className="text-xl md:text-2xl font-semibold text-foreground flex items-center gap-2">
            <Star className="h-5 w-5 md:h-6 md:w-6 text-warning fill-warning" />
            Shortlisted Candidates ({candidates.length})
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Candidates you've selected for further review</p>
        </div>

        <div className="mb-4 md:mb-6">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search shortlisted..." className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </div>

        {filteredCandidates.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Star className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground mb-4">{searchQuery ? "No candidates match your search" : "No shortlisted candidates yet"}</p>
              {searchQuery ? (
                <Button variant="outline" onClick={() => setSearchQuery("")}>Clear Search</Button>
              ) : (
                <Button variant="outline" asChild><Link to="/jobs">Browse Jobs</Link></Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3 md:space-y-4">
            {filteredCandidates.map((candidate) => (
              <Card key={candidate.id} className="shadow-card transition-shadow hover:shadow-card-hover">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-base font-medium text-foreground">{candidate.name}</span>
                        <Badge variant="outline" className="bg-success/10 text-success border-success/20">Shortlisted</Badge>
                        {candidate.score && <span className="text-sm font-medium text-muted-foreground">Score: {candidate.score}/100</span>}
                      </div>
                      <div className="mt-2 flex items-center gap-6 text-sm text-muted-foreground">
                        <span>{candidate.email}</span>
                        {candidate.jobTitle && (
                          <Link to={`/jobs/${candidate.appliedTo[0]}/candidates`} className="hover:underline">{candidate.jobTitle}</Link>
                        )}
                        <div className="flex items-center gap-2">
                          {candidate.hasResume && <span className="flex items-center gap-1"><FileText className="h-3.5 w-3.5" /> Resume</span>}
                          {candidate.hasVideo && <span className="flex items-center gap-1"><Video className="h-3.5 w-3.5" /> Video</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => setScheduleDialog({ open: true, name: candidate.name, email: candidate.email })}>
                        <Calendar className="mr-1.5 h-4 w-4" />Schedule
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => navigate(`/candidates/${candidate.id}`)}>View Profile</Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => removeFromShortlist(candidate.applicationId, candidate.name)}
                        disabled={updateStatus.isPending}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <ScheduleDialog
        isOpen={scheduleDialog.open}
        onClose={() => setScheduleDialog({ open: false, name: "", email: "" })}
        candidateName={scheduleDialog.name}
        candidateEmail={scheduleDialog.email}
      />
    </DashboardLayout>
  );
}
