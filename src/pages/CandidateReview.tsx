import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { CandidateCardStack } from "@/components/candidates/CandidateCardStack";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { List, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useJob } from "@/hooks/useJobs";
import { useCandidatesForJob } from "@/hooks/useCandidates";
import { useUpdateApplicationStatus } from "@/hooks/useApplications";

export default function CandidateReview() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { data: job, isLoading: isLoadingJob } = useJob(jobId);
  const { data: candidates = [], isLoading: isLoadingCandidates } = useCandidatesForJob(jobId);
  const updateStatus = useUpdateApplicationStatus();
  
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());

  // Sort candidates by score descending (out of 5)
  const sortedCandidates = [...candidates].sort((a, b) => (b.score || 0) - (a.score || 0));

  // Filter to only show candidates that haven't been reviewed in this session
  // and are not already shortlisted or rejected
  const pendingCandidates = sortedCandidates.filter(
    (c) => !reviewedIds.has(c.applicationId) && c.status !== 'shortlisted' && c.status !== 'rejected'
  );

  const shortlistedCount = candidates.filter((c) => c.shortlisted).length;
  const rejectedCount = candidates.filter((c) => c.status === 'rejected').length;

  const handleShortlist = (id: string) => {
    const candidate = candidates.find((c) => c.id === id || c.applicationId === id);
    if (candidate) {
      updateStatus.mutate(
        { applicationId: candidate.applicationId, shortlisted: true, status: 'shortlisted' },
        {
          onSuccess: () => {
            setReviewedIds((prev) => new Set([...prev, candidate.applicationId]));
            toast({
              title: "Candidate shortlisted",
              description: `${candidate.name} added to your shortlist`,
            });
          },
        }
      );
    }
  };

  const handleReject = (id: string) => {
    const candidate = candidates.find((c) => c.id === id || c.applicationId === id);
    if (candidate) {
      updateStatus.mutate(
        { applicationId: candidate.applicationId, status: 'rejected' },
        {
          onSuccess: () => {
            setReviewedIds((prev) => new Set([...prev, candidate.applicationId]));
            toast({
              title: "Candidate passed",
              description: `${candidate.name} marked as passed`,
            });
          },
        }
      );
    }
  };

  const handleViewProfile = (id: string) => {
    const candidate = candidates.find((c) => c.id === id || c.applicationId === id);
    navigate(`/candidates/${candidate?.candidateId || id}`);
  };

  const isLoading = isLoadingJob || isLoadingCandidates;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  // Transform candidates for the card stack component
  const cardStackCandidates = pendingCandidates.map((c) => ({
    id: c.applicationId || c.id,
    name: c.name,
    email: c.email,
    currentRole: c.currentRole || '',
    experience: c.experience || '',
    score: c.score,
    shortlisted: c.shortlisted,
    status: c.status,
    hasResume: c.hasResume,
    hasVideo: c.hasVideo,
    strengths: c.strengths,
    weaknesses: c.weaknesses,
    recommendation: c.recommendation,
    linkedinUrl: c.linkedinUrl,
    ctc: c.ctc,
    noticePeriod: c.noticePeriod,
  }));

  return (
    <DashboardLayout>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground mb-2">
            <Link to="/jobs" className="hover:text-foreground">
              Jobs
            </Link>
            <span>/</span>
            <Link to={`/jobs/${jobId}/candidates`} className="hover:text-foreground truncate">
              {job?.title || 'Job'}
            </Link>
            <span>/</span>
            <span>Review</span>
          </div>

          {/* Mobile: Stack layout, Desktop: Row */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl md:text-2xl font-semibold text-foreground">
                Quick Review
              </h1>
              <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                {pendingCandidates.length} pending
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-xs md:text-sm text-muted-foreground">
                <span className="text-success font-medium">{shortlistedCount}</span> shortlisted
                <span className="mx-2">•</span>
                <span className="text-destructive font-medium">{rejectedCount}</span> passed
              </div>
              <Link to={`/jobs/${jobId}/candidates`}>
                <Button variant="outline" size="sm">
                  <List className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">List View</span>
                  <span className="sm:hidden">List</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Card Stack - Centered with responsive sizing */}
        <div className="flex justify-center px-2 md:px-0">
          {pendingCandidates.length > 0 ? (
            <CandidateCardStack
              candidates={cardStackCandidates}
              onShortlist={handleShortlist}
              onReject={handleReject}
              onViewProfile={handleViewProfile}
            />
          ) : (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground mb-4">All candidates have been reviewed!</p>
              <Link to={`/jobs/${jobId}/candidates`}>
                <Button>View All Candidates</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
