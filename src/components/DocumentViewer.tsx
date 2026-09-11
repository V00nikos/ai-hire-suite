import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  Download,
  Maximize2,
  Minimize2,
  ExternalLink,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

interface DocumentViewerProps {
  fileId: string;
  fileName?: string;
  showDownload?: boolean;
  className?: string;
}

export function DocumentViewer({
  fileId,
  fileName = "Document",
  showDownload = true,
  className = "",
}: DocumentViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Generate URLs from file ID
  const previewUrl = `https://drive.google.com/file/d/${fileId}/preview`;
  const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
  const viewUrl = `https://drive.google.com/file/d/${fileId}/view`;

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const handleRetry = () => {
    setIsLoading(true);
    setHasError(false);
    // Force iframe reload by updating key
    const iframe = document.getElementById("doc-viewer-iframe") as HTMLIFrameElement;
    if (iframe) {
      iframe.src = previewUrl;
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col">
        {/* Fullscreen Header */}
        <div className="flex items-center justify-between p-4 border-b border-border glass">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <span className="font-medium text-foreground">{fileName}</span>
          </div>
          <div className="flex items-center gap-2">
            {showDownload && (
              <Button
                variant="outline"
                size="sm"
                asChild
                className="glass"
              >
                <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
                  <Download className="mr-1 h-4 w-4" />
                  Download
                </a>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={toggleFullscreen}
              className="glass"
            >
              <Minimize2 className="mr-1 h-4 w-4" />
              Exit Fullscreen
            </Button>
          </div>
        </div>

        {/* Fullscreen Content */}
        <div className="flex-1 p-4">
          <iframe
            id="doc-viewer-iframe-fullscreen"
            src={previewUrl}
            className="w-full h-full rounded-lg border border-border"
            title={fileName}
            allow="autoplay"
            aria-label={`Document viewer for ${fileName}`}
          />
        </div>
      </div>
    );
  }

  return (
    <Card variant="glass" className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <FileText className="h-4 w-4 text-primary" />
            {fileName}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              className="h-8 w-8"
              title="Fullscreen"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
            {showDownload && (
              <Button
                variant="ghost"
                size="icon"
                asChild
                className="h-8 w-8"
                title="Download"
              >
                <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4" />
                </a>
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="h-8 w-8"
              title="Open in new tab"
            >
              <a href={viewUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Loading State */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-lg z-10">
              <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span className="text-sm text-muted-foreground">Loading document...</span>
              </div>
            </div>
          )}

          {/* Error State */}
          {hasError && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-lg z-10">
              <div className="flex flex-col items-center gap-3 text-center p-4">
                <AlertCircle className="h-10 w-10 text-destructive" />
                <div>
                  <p className="font-medium text-foreground">Failed to load document</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    The document may be private or unavailable
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleRetry}>
                    <RefreshCw className="mr-1 h-4 w-4" />
                    Retry
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href={viewUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-1 h-4 w-4" />
                      Open in Drive
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Loading Skeleton */}
          {isLoading && <Skeleton className="w-full h-[600px] rounded-lg" />}

          {/* Document Iframe */}
          <iframe
            id="doc-viewer-iframe"
            src={previewUrl}
            className={`w-full h-[400px] sm:h-[500px] md:h-[600px] rounded-lg border border-border ${
              isLoading || hasError ? "invisible" : "visible"
            }`}
            onLoad={handleLoad}
            onError={handleError}
            title={fileName}
            allow="autoplay"
            aria-label={`Document viewer for ${fileName}`}
          />
        </div>
      </CardContent>
    </Card>
  );
}
