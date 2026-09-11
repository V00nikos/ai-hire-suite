import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Mail,
  Phone,
  Linkedin,
  Globe,
  FileText,
  Video,
  Star,
  Check,
  AlertTriangle,
  Calendar,
  MessageSquare,
  Send,
  ExternalLink,
  ClipboardList,
  Loader2,
  Play,
  Link as LinkIcon,
} from "lucide-react";
import { LaurelWreath } from "@/components/LaurelWreath";
import { QuickFactsCard } from "@/components/candidates/QuickFactsCard";
import { AIEvaluationCard } from "@/components/candidates/AIEvaluationCard";
import { ResumeEmbed } from "@/components/candidates/ResumeEmbed";
import { CandidateNotesSection } from "@/components/candidates/CandidateNotesSection";
import { useToast } from "@/hooks/use-toast";
import { useCandidate } from "@/hooks/useCandidates";
import { useUpdateApplicationStatus } from "@/hooks/useApplications";
import { ScheduleDialog } from "@/components/dialogs/ScheduleDialog";
import { detectLinkType, extractQuickFacts } from "@/lib/documentUtils";
import { useAIEvaluationRealtime } from "@/hooks/useAIEvaluationRealtime";
import type { Json } from "@/integrations/supabase/types";

const statusColors: Record<string, string> = {
  pending: "bg-warning/10 text-warning border-warning/20",
  evaluated: "bg-muted text-muted-foreground border-border",
  shortlisted: "bg-success/10 text-success border-success/20",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
  on_hold: "bg-muted text-muted-foreground border-border",
  hired: "bg-success/10 text-success border-success/20",
  withdrawn: "bg-muted text-muted-foreground border-border",
};

// Helper to format form response values for display
function formatResponseValue(value: Json, fieldType: string): string {
  if (value === null || value === undefined) return '—';
  
  if (typeof value === 'string') {
    return value;
  }
  
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  
  return String(value);
}

// Render link with appropriate icon
function renderSmartLink(value: string, fieldType: string) {
  const link = detectLinkType(value);
  
  if (!link) {
    return <span>{value}</span>;
  }
  
  const iconMap: Record<string, React.ReactNode> = {
    linkedin: <Linkedin className="h-3 w-3" />,
    drive: <FileText className="h-3 w-3" />,
    loom: <Play className="h-3 w-3" />,
    video: <Video className="h-3 w-3" />,
    url: <LinkIcon className="h-3 w-3" />,
  };
  
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-primary hover:underline"
    >
      {iconMap[link.type]}
      <span>{link.label}</span>
      <ExternalLink className="h-3 w-3" />
    </a>
  );
}

export default function CandidateProfile() {
  const { candidateId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Subscribe to AI evaluation realtime updates
  useAIEvaluationRealtime();
  
  // Fetch real candidate data from database
  const { data: candidateData, isLoading, error } = useCandidate(candidateId);
  const updateStatus = useUpdateApplicationStatus();
  
  const [scheduleDialog, setScheduleDialog] = useState(false);

  // Loading state
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="animate-fade-in max-w-5xl mx-auto">
          <Skeleton className="h-8 w-48 mb-4" />
          <div className="glass-card rounded-2xl p-6 mb-6">
            <Skeleton className="h-32 w-full" />
          </div>
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  // Error or not found state
  if (error || !candidateData) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-muted-foreground mb-4">
            {error ? 'Error loading candidate' : 'Candidate not found'}
          </p>
          <Button variant="outline" onClick={() => navigate("/candidates")}>
            Back to Candidates
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  // Get the first/primary application for display
  const applications = candidateData.applications || [];
  const primaryApp = applications[0];
  const aiEval = primaryApp?.ai_evaluations;
  
  // Extract form responses from the primary application
  const formResponses = (primaryApp as any)?.form_responses || [];
  
  // Extract quick facts from form responses
  const quickFacts = extractQuickFacts(formResponses);
  
  // Get documents from application
  const documents = (primaryApp as any)?.application_documents || [];
  const hasResume = documents.some((d: any) => d.document_type === 'resume');
  const hasVideo = documents.some((d: any) => d.document_type === 'video');
  const resumeDoc = documents.find((d: any) => d.document_type === 'resume');
  const videoDoc = documents.find((d: any) => d.document_type === 'video');
  
  // Also check form responses for resume URL
  const resumeFromResponses = formResponses.find((r: any) => 
    r.field_label?.toLowerCase().includes('resume') && 
    typeof r.response_value === 'string' && 
    r.response_value.startsWith('http')
  );
  const resumeUrl = resumeDoc?.file_url || resumeFromResponses?.response_value;
  
  // Get LinkedIn from form responses if not in candidate data
  const linkedInFromResponses = formResponses.find((r: any) =>
    r.field_label?.toLowerCase().includes('linkedin') &&
    typeof r.response_value === 'string'
  );
  const linkedInUrl = candidateData.linkedin_url || linkedInFromResponses?.response_value;

  const handleShortlist = () => {
    if (!primaryApp) return;
    
    const newShortlisted = !primaryApp.shortlisted;
    updateStatus.mutate({
      applicationId: primaryApp.id,
      shortlisted: newShortlisted,
      status: newShortlisted ? 'shortlisted' : 'evaluated',
    }, {
      onSuccess: () => {
        toast({
          title: newShortlisted ? "Added to shortlist" : "Removed from shortlist",
        });
      }
    });
  };


  const handleViewDocument = (url: string, type: "resume" | "video") => {
    if (url) {
      window.open(url, '_blank');
    } else {
      toast({
        title: type === "resume" ? "Resume not available" : "Video not available",
        variant: "destructive",
      });
    }
  };

  // Parse AI evaluation data
  const strengths = (aiEval?.strengths as string[]) || [];
  const weaknesses = (aiEval?.weaknesses as string[]) || [];
  const interviewQuestions = (aiEval?.interview_questions as string[]) || [];
  const score = aiEval?.score;
  const ranking = aiEval?.ranking;

  return (
    <DashboardLayout>
      <div className="animate-fade-in max-w-5xl mx-auto bg-liquid min-h-screen -m-6 p-6">
        {/* Breadcrumb */}
        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/candidates" className="hover:text-foreground flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            All Candidates
          </Link>
          <span>/</span>
          <span>{candidateData.name}</span>
        </div>

        {/* Header Card - Glassmorphic */}
        <Card variant="glass" className="mb-6">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row gap-4 md:gap-6">
              {/* Rank Badge - Only show if candidate has score */}
              <div className="flex-shrink-0 flex justify-center md:justify-start">
                <LaurelWreath rank={ranking || 0} score={score} />
              </div>

              {/* Main Info */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 mb-2">
                  <h1 className="text-xl md:text-2xl font-display font-bold text-foreground">
                    {candidateData.name}
                  </h1>
                  {primaryApp && (
                    <Badge variant="outline" className={statusColors[primaryApp.status || "pending"]}>
                      {(primaryApp.status || "pending").replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </Badge>
                  )}
                  {primaryApp?.bulk_uploaded && (
                    <Badge variant="secondary" className="text-xs">Bulk Uploaded</Badge>
                  )}
                </div>
                
                {candidateData.source && (
                  <p className="text-muted-foreground mb-3 text-sm">
                    Source: {candidateData.source}
                  </p>
                )}

                {/* Contact Links */}
                <div className="flex flex-wrap justify-center md:justify-start gap-3 text-sm">
                  <a
                    href={`mailto:${candidateData.email}`}
                    className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Mail className="h-4 w-4" />
                    <span className="hidden sm:inline">{candidateData.email}</span>
                    <span className="sm:hidden">Email</span>
                  </a>
                  {candidateData.phone && (
                    <a
                      href={`tel:${candidateData.phone}`}
                      className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Phone className="h-4 w-4" />
                      <span className="hidden sm:inline">{candidateData.phone}</span>
                      <span className="sm:hidden">Call</span>
                    </a>
                  )}
                  {linkedInUrl && (
                    <a
                      href={linkedInUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors"
                    >
                      <Linkedin className="h-4 w-4" />
                      <span>LinkedIn</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {candidateData.portfolio_url && (
                    <a
                      href={candidateData.portfolio_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Globe className="h-4 w-4" />
                      <span>Portfolio</span>
                    </a>
                  )}
                  {resumeUrl && (
                    <a
                      href={resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors"
                    >
                      <FileText className="h-4 w-4" />
                      <span>Resume</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>

              {/* Score & Actions */}
              <div className="flex flex-col items-center md:items-end gap-3">
                {score !== null && score !== undefined && (
                  <div className="text-center md:text-right">
                    <div className="text-3xl font-bold text-foreground">{score}</div>
                    <div className="text-sm text-muted-foreground">AI Score</div>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setScheduleDialog(true)}
                    className="glass"
                  >
                    <Calendar className="mr-1 h-4 w-4" />
                    <span className="hidden sm:inline">Schedule</span>
                  </Button>
                  <Button
                    variant={primaryApp?.shortlisted ? "default" : "outline"}
                    size="sm"
                    onClick={handleShortlist}
                    disabled={updateStatus.isPending || !primaryApp}
                    className={!primaryApp?.shortlisted ? "glass" : ""}
                  >
                    {updateStatus.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Star className={cn("mr-1 h-4 w-4", primaryApp?.shortlisted && "fill-current")} />
                        <span className="hidden sm:inline">
                          {primaryApp?.shortlisted ? "Shortlisted" : "Shortlist"}
                        </span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="w-full justify-start overflow-x-auto glass">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="responses" className="flex items-center gap-1">
              <ClipboardList className="h-4 w-4" />
              Form Responses
              {formResponses.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">{formResponses.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="applications">Applications</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {/* Quick Facts - Static Data from Form Responses */}
            <QuickFactsCard facts={quickFacts} />
            
            {/* AI Evaluation Card */}
            <AIEvaluationCard evaluation={aiEval} />

            {/* No AI data message */}
            {!aiEval && quickFacts.length === 0 && (
              <Card variant="glass">
                <CardContent className="p-8 text-center">
                  <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    AI evaluation not yet available for this candidate.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Form Responses Tab */}
          <TabsContent value="responses" className="space-y-4">
            {formResponses.length > 0 ? (
              <Card variant="glass">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium">
                    <ClipboardList className="h-4 w-4" />
                    Application Form Responses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {formResponses.map((response: any) => {
                      const value = response.response_value;
                      const stringValue = typeof value === 'string' ? value : formatResponseValue(value, response.field_type);
                      const isUrl = typeof value === 'string' && value.startsWith('http');
                      
                      return (
                        <div key={response.id} className="border-b border-border/50 pb-4 last:border-0 last:pb-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <p className="font-medium text-sm text-foreground mb-1">
                                {response.field_label}
                              </p>
                              <div className="text-sm text-muted-foreground">
                                {isUrl ? (
                                  renderSmartLink(stringValue, response.field_type)
                                ) : (
                                  <span>{stringValue}</span>
                                )}
                              </div>
                            </div>
                            <Badge variant="outline" className="text-xs shrink-0">
                              {response.field_type}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card variant="glass">
                <CardContent className="p-8 text-center">
                  <ClipboardList className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    No form responses available for this candidate.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Form responses are created when candidates apply via the public form or are bulk uploaded with field mapping.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-4">
            {/* Resume Embed */}
            {resumeUrl && (
              <ResumeEmbed url={resumeUrl} filename={resumeDoc?.filename || "Resume"} />
            )}
            
            <div className="grid gap-4 sm:grid-cols-2">
              {hasResume && resumeDoc && !resumeUrl && (
                <Card variant="glass">
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{resumeDoc.filename}</p>
                      <p className="text-sm text-muted-foreground">
                        {resumeDoc.file_size ? `${Math.round(resumeDoc.file_size / 1024)} KB` : 'PDF Document'}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDocument(resumeDoc.file_url, "resume")}
                      className="glass"
                    >
                      <ExternalLink className="mr-1 h-4 w-4" />
                      View
                    </Button>
                  </CardContent>
                </Card>
              )}
              {hasVideo && videoDoc && (
                <Card variant="glass">
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Video className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{videoDoc.filename}</p>
                      <p className="text-sm text-muted-foreground">Video Introduction</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDocument(videoDoc.file_url, "video")}
                      className="glass"
                    >
                      <ExternalLink className="mr-1 h-4 w-4" />
                      Watch
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
            {!hasResume && !hasVideo && !resumeUrl && (
              <Card variant="glass">
                <CardContent className="p-8 text-center">
                  <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No documents uploaded for this candidate.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Applications Tab */}
          <TabsContent value="applications" className="space-y-4">
            {applications.length > 0 ? (
              applications.map((app: any) => (
                <Card key={app.id} variant="glass">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <Link
                          to={`/jobs/${app.job_id}/candidates`}
                          className="font-medium text-foreground hover:underline"
                        >
                          {app.jobs?.title || 'Unknown Job'}
                        </Link>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-muted-foreground">
                          <Badge variant="outline" className={statusColors[app.status || 'pending']}>
                            {(app.status || 'pending').replace('_', ' ').split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                          </Badge>
                          {app.ai_evaluations?.score && (
                            <span>Score: {app.ai_evaluations.score}/100</span>
                          )}
                          <span>Applied: {new Date(app.submitted_at).toLocaleDateString()}</span>
                          {app.bulk_uploaded && (
                            <Badge variant="secondary" className="text-xs">Bulk</Badge>
                          )}
                        </div>
                      </div>
                      <Button variant="outline" size="sm" asChild className="glass">
                        <Link to={`/jobs/${app.job_id}/candidates`}>View Job</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card variant="glass">
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No applications found.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes" className="space-y-4">
            <CandidateNotesSection 
              candidateId={candidateId!} 
              applicationId={primaryApp?.id}
            />
          </TabsContent>
        </Tabs>
      </div>

      <ScheduleDialog
        isOpen={scheduleDialog}
        onClose={() => setScheduleDialog(false)}
        candidateName={candidateData.name || ""}
        candidateEmail={candidateData.email || ""}
      />
    </DashboardLayout>
  );
}
