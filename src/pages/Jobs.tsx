import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, Calendar, MoreHorizontal, Copy, Edit, XCircle, Trash2, Loader2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useJobs, useUpdateJob, useDeleteJob } from "@/hooks/useJobs";
import { ShareCandidateLinkCard } from "@/components/ShareCandidateLinkCard";

const statusColors: Record<string, string> = {
  active: "bg-success/10 text-success border-success/20",
  draft: "bg-muted text-muted-foreground border-border",
  closed: "bg-secondary text-secondary-foreground border-border",
  paused: "bg-warning/10 text-warning border-warning/20",
};

export default function Jobs() {
  const { toast } = useToast();
  const { data: jobs = [], isLoading } = useJobs();
  const updateJob = useUpdateJob();
  const deleteJob = useDeleteJob();

  const copyApplicationLink = (jobId: string, jobTitle: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/apply/${jobId}`);
    toast({ title: "Link copied", description: `Application URL for ${jobTitle} copied` });
  };

  const handleCloseJob = (jobId: string) => {
    updateJob.mutate({ id: jobId, status: 'closed' }, { onSuccess: () => toast({ title: "Job closed" }) });
  };

  const handleDeleteJob = (jobId: string) => {
    deleteJob.mutate(jobId);
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
      <div className="animate-fade-in bg-liquid min-h-screen -m-4 md:-m-6 lg:-m-8 p-4 md:p-6 lg:p-8">
        <div className="mb-6 md:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-foreground">Jobs</h1>
            <p className="mt-1 text-sm text-muted-foreground">Manage your job postings</p>
          </div>
          <Button asChild><Link to="/jobs/new"><Plus className="mr-2 h-4 w-4" />New Job</Link></Button>
        </div>

        {jobs.length === 0 ? (
          <Card variant="glass">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">No jobs yet</p>
              <Button asChild><Link to="/jobs/new"><Plus className="mr-2 h-4 w-4" />Create your first job</Link></Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3 md:space-y-4">
            {jobs.map((job) => (
              <Card key={job.id} variant="glass" className="glass-hover">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <Link to={`/jobs/${job.id}/candidates`} className="text-base font-medium hover:underline">{job.title}</Link>
                        <Badge variant="outline" className={statusColors[job.status || 'draft']}>{job.status}</Badge>
                      </div>
                      <div className="mt-2 flex items-center gap-6 text-sm text-muted-foreground">
                        <span>{job.department || 'No department'}</span>
                        <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{job.candidateCount || 0} candidates</span>
                        <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{new Date(job.created_at || '').toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" asChild className="glass"><Link to={`/jobs/${job.id}/candidates`}>View Candidates</Link></Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="glass-card">
                          <DropdownMenuItem asChild><Link to={`/jobs/${job.id}/edit`}><Edit className="mr-2 h-4 w-4" />Edit</Link></DropdownMenuItem>
                          <DropdownMenuItem onClick={() => copyApplicationLink(job.id, job.title)}><Copy className="mr-2 h-4 w-4" />Copy Link</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleCloseJob(job.id)}><XCircle className="mr-2 h-4 w-4" />Close</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteJob(job.id)}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
