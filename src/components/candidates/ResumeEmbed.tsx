import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, ExternalLink, Maximize2, AlertCircle } from "lucide-react";
import { convertToEmbedUrl, isEmbeddable } from "@/lib/documentUtils";

interface ResumeEmbedProps {
  url: string;
  filename?: string;
  className?: string;
}

export function ResumeEmbed({ url, filename = "Resume", className = "" }: ResumeEmbedProps) {
  const [embedError, setEmbedError] = useState(false);
  const embedUrl = convertToEmbedUrl(url);
  const canEmbed = isEmbeddable(url) && embedUrl && !embedError;

  const handleOpenExternal = () => {
    window.open(url, '_blank');
  };

  return (
    <Card className={`glass-card ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Resume Preview
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenExternal}
              className="text-xs"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Open
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {canEmbed ? (
          <div className="relative rounded-lg overflow-hidden bg-muted/30 border">
            <iframe
              src={embedUrl}
              className="w-full h-[500px] md:h-[600px]"
              title={filename}
              allow="autoplay"
              onError={() => setEmbedError(true)}
            />
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm"
              onClick={handleOpenExternal}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="rounded-lg bg-muted/30 p-8 text-center border border-dashed">
            <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              {embedError ? (
                <AlertCircle className="h-6 w-6 text-warning" />
              ) : (
                <FileText className="h-6 w-6 text-primary" />
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              {embedError 
                ? "Unable to embed this document. Open it in a new tab instead."
                : "This document type cannot be previewed inline."
              }
            </p>
            <Button variant="default" size="sm" onClick={handleOpenExternal}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in New Tab
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
