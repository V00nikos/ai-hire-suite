import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, ExternalLink, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ShareCandidateLinkCardProps {
  jobId: string;
  jobTitle?: string;
}

export function getPublicBaseUrl(): string {
  // Public apply links are always served from the same origin as the console.
  return window.location.origin;
}

export function ShareCandidateLinkCard({ jobId, jobTitle }: ShareCandidateLinkCardProps) {
  const { toast } = useToast();
  const publicUrl = `${getPublicBaseUrl()}/apply/${jobId}`;

  const copyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    toast({
      title: "Link copied!",
      description: "Share this with candidates - no login required",
    });
  };

  const openInNewTab = () => {
    window.open(publicUrl, '_blank');
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground">Share with Candidates</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Candidates do NOT need an account to apply
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Input
                readOnly
                value={publicUrl}
                className="flex-1 bg-background text-xs sm:text-sm"
                onClick={(e) => e.currentTarget.select()}
              />
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyLink} className="flex-1 sm:flex-none">
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </Button>
                <Button variant="outline" size="sm" onClick={openInNewTab} className="flex-1 sm:flex-none">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
