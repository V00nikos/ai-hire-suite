import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  FileText,
  Video,
  Check,
  AlertTriangle,
  Star,
  Copy,
  Filter,
  ChevronDown,
  Loader2,
  RefreshCw,
  Bot,
} from "lucide-react";
import { RecommendationBadge } from "@/components/candidates/AIEvaluationCard";
import { useToast } from "@/hooks/use-toast";
import { useJob } from "@/hooks/useJobs";
import { useCandidatesForJob } from "@/hooks/useCandidates";
import { useUpdateApplicationStatus } from "@/hooks/useApplications";
import { ShareCandidateLinkCard } from "@/components/ShareCandidateLinkCard";
import { useAIEvaluationRealtime } from "@/hooks/useAIEvaluationRealtime";
import { useSyncEvaluations } from "@/hooks/useSyncEvaluations";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const statusColors: Record<string, string> = {
  pending: "bg-warning/10 text-warning border-warning/20",
  evaluated: "bg-muted text-muted-foreground border-border",
  shortlisted: "bg-success/10 text-success border-success/20",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
};

export default function JobCandidates() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showShortlistedOnly, setShowShortlistedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<string>("score");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Subscribe to AI evaluation realtime updates
  useAIEvaluationRealtime(jobId);
  
  // Manual sync for evaluations
  const { syncEvaluations, isSyncing } = useSyncEvaluations(jobId);

  const { data: job, isLoading: isLoadingJob } = useJob(jobId);
  const { data: candidates = [], isLoading: isLoadingCandidates } = useCandidatesForJob(jobId);
  const updateStatus = useUpdateApplicationStatus();

  const filteredCandidates = candidates
    .filter((c) => {
      if (showShortlistedOnly && !c.shortlisted) return false;
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          c.name.toLowerCase().includes(query) ||
          c.email.toLowerCase().includes(query)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "score") {
        return (b.score || 0) - (a.score || 0);
      }
      if (sortBy === "recommendation") {
        const order = ['STRONG YES', 'YES', 'MAYBE', 'NO', 'STRONG NO', null];
        const aIndex = order.indexOf(a.recommendation);
        const bIndex = order.indexOf(b.recommendation);
        return aIndex - bIndex;
      }
      return 0; // Keep default order for "submitted"
    });

  const handleShortlist = (applicationId: string, currentlyShortlisted: boolean) => {
    updateStatus.mutate(
      { applicationId, shortlisted: !currentlyShortlisted, status: !currentlyShortlisted ? 'shortlisted' : 'evaluated' },
      { onSuccess: () => toast({ title: currentlyShortlisted ? "Removed from shortlist" : "Added to shortlist" }) }
    );
  };

  const copyApplicationLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/apply/${jobId}`);
    toast({ title: "Link copied", description: "Application URL copied to clipboard" });
  };

  const shortlistedCount = candidates.filter((c) => c.shortlisted).length;
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

  return (
    <DashboardLayout>
      <div className="animate-fade-in">
        <div className="mb-6 md:mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/jobs" className="hover:text-foreground">Jobs</Link>
            <span>/</span>
            <span className="truncate">{job?.title || 'Job'}</span>
          </div>
          
          <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-lg md:text-2xl font-semibold text-foreground">
                <span className="hidden sm:inline">{job?.title} - </span>
                Candidates ({candidates.length})
              </h1>
              <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                {job?.status}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={syncEvaluations}
                disabled={isSyncing}
              >
                <RefreshCw className={`h-4 w-4 md:mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                <span className="hidden md:inline">{isSyncing ? 'Syncing...' : 'Sync Evaluations'}</span>
              </Button>
              <Link to={`/jobs/${jobId}/review`} className="flex-1 md:flex-none">
                <Button className="w-full md:w-auto" size="sm">Quick Review</Button>
              </Link>
              <Button variant="outline" size="sm" onClick={copyApplicationLink}>
                <Copy className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Copy Link</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Share Card */}
        {jobId && (
          <div className="mb-6">
            <ShareCandidateLinkCard jobId={jobId} jobTitle={job?.title} />
          </div>
        )}

        <div className="mb-4 md:mb-6">
          <div className="hidden md:flex flex-wrap items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search candidates..." className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Stages" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="evaluated">Evaluated</SelectItem>
                <SelectItem value="shortlisted">Shortlisted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Sort by" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="submitted">Most Recent</SelectItem>
                <SelectItem value="score">Highest Score</SelectItem>
                <SelectItem value="recommendation">Recommendation</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Checkbox id="shortlisted" checked={showShortlistedOnly} onCheckedChange={(checked) => setShowShortlistedOnly(!!checked)} />
              <Label htmlFor="shortlisted" className="text-sm font-normal">Show only shortlisted ({shortlistedCount})</Label>
            </div>
          </div>

          <div className="md:hidden space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search candidates..." className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm" className="w-full justify-between">
                  <span className="flex items-center gap-2"><Filter className="h-4 w-4" />Filters</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${filtersOpen ? "rotate-180" : ""}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 pt-3">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger><SelectValue placeholder="All Stages" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stages</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="evaluated">Evaluated</SelectItem>
                    <SelectItem value="shortlisted">Shortlisted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>

        <div className="space-y-3 md:space-y-4">
          {filteredCandidates.length === 0 ? (
            <Card className="shadow-card">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">No candidates match your filters</p>
                <Button variant="outline" className="mt-4" onClick={() => { setSearchQuery(""); setStatusFilter("all"); setShowShortlistedOnly(false); }}>
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredCandidates.map((candidate) => (
              <Card key={candidate.id} className="shadow-card transition-shadow hover:shadow-card-hover">
                <CardContent className="p-4 md:p-6">
                  <div className="flex gap-4 md:gap-6">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-medium text-foreground">{candidate.name}</h3>
                            {candidate.score !== null && candidate.score !== undefined && (
                              <Badge variant="secondary" className="text-sm font-semibold">
                                {candidate.score}/5
                              </Badge>
                            )}
                            <Badge variant="outline" className={statusColors[candidate.status || 'pending']}>
                              {candidate.status}
                            </Badge>
                            <RecommendationBadge recommendation={candidate.recommendation} />
                            {!candidate.hasEvaluation && (
                              <Badge variant="outline" className="text-xs bg-muted/50 text-muted-foreground animate-pulse">
                                <Bot className="h-3 w-3 mr-1 animate-spin" />
                                Evaluating...
                              </Badge>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">{candidate.email}</p>
                        </div>
                      </div>

                      {candidate.strengths.length > 0 && (
                        <div className="mt-4">
                          <div className="flex items-center gap-2 text-sm font-medium text-success">
                            <Check className="h-4 w-4" />Strengths
                          </div>
                          <ul className="mt-2 space-y-1">
                            {candidate.strengths.slice(0, 3).map((s, i) => (
                              <li key={i} className="text-sm text-muted-foreground">• {s}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {candidate.weaknesses.length > 0 && (
                        <div className="mt-4">
                          <div className="flex items-center gap-2 text-sm font-medium text-warning">
                            <AlertTriangle className="h-4 w-4" />Weaknesses
                          </div>
                          <ul className="mt-2 space-y-1">
                            {candidate.weaknesses.slice(0, 3).map((w, i) => (
                              <li key={i} className="text-sm text-muted-foreground">• {w}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="mt-6 flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {candidate.hasResume && <span className="flex items-center gap-1"><FileText className="h-3.5 w-3.5" /> Resume</span>}
                          {candidate.hasVideo && <span className="flex items-center gap-1"><Video className="h-3.5 w-3.5" /> Video</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => navigate(`/candidates/${candidate.candidateId || candidate.id}`)}>
                            View Profile
                          </Button>
                          <Button
                            variant={candidate.shortlisted ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleShortlist(candidate.applicationId, candidate.shortlisted)}
                            disabled={updateStatus.isPending}
                          >
                            <Star className={`mr-1 h-4 w-4 ${candidate.shortlisted ? "fill-current" : ""}`} />
                            {candidate.shortlisted ? "Shortlisted" : "Shortlist"}
                          </Button>
                        </div>
                      </div>
                    </div>
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
