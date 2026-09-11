import { useState } from 'react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, RotateCcw, Eye, Clock, CheckCircle } from 'lucide-react';
import { FormVersion, useRestoreFormVersion } from '@/hooks/useFormVersionHistory';
import { FormField, FIELD_TYPES } from '@/types/form';

interface FormVersionHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  versions: FormVersion[];
  isLoading: boolean;
  jobId: string;
  formId: string;
  currentVersionNumber: number;
  onVersionRestored: (fields: FormField[]) => void;
}

export function FormVersionHistoryDialog({
  open,
  onOpenChange,
  versions,
  isLoading,
  jobId,
  formId,
  currentVersionNumber,
  onVersionRestored,
}: FormVersionHistoryDialogProps) {
  const [selectedVersion, setSelectedVersion] = useState<FormVersion | null>(null);
  const restoreVersion = useRestoreFormVersion();

  const handleRestore = async (version: FormVersion) => {
    if (version.versionNumber === currentVersionNumber) return;
    
    restoreVersion.mutate(
      {
        jobId,
        formId,
        fields: version.fields,
        sourceVersionNumber: version.versionNumber,
      },
      {
        onSuccess: () => {
          onVersionRestored(version.fields);
          onOpenChange(false);
          setSelectedVersion(null);
        },
      }
    );
  };

  const getFieldTypeLabel = (type: string) => {
    return FIELD_TYPES.find((f) => f.type === type)?.label || type;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Form Version History</DialogTitle>
          <DialogDescription>
            View previous versions of your application form and restore if needed.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : versions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No version history available.
          </div>
        ) : (
          <div className="grid grid-cols-[1fr_1.5fr] gap-4 flex-1 min-h-0">
            {/* Version List */}
            <ScrollArea className="h-[400px] border rounded-lg">
              <div className="p-2 space-y-1">
                {versions.map((version) => (
                  <button
                    key={version.id}
                    onClick={() => setSelectedVersion(version)}
                    className={`w-full text-left p-3 rounded-md transition-colors ${
                      selectedVersion?.id === version.id
                        ? 'bg-primary/10 border border-primary'
                        : 'hover:bg-secondary border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">
                        Version {version.versionNumber}
                      </span>
                      <div className="flex items-center gap-1">
                        {version.versionNumber === currentVersionNumber && (
                          <Badge variant="outline" className="text-xs">
                            Current
                          </Badge>
                        )}
                        {version.isPublished && (
                          <Badge className="text-xs bg-success text-success-foreground">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Live
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {version.createdAt
                        ? format(new Date(version.createdAt), 'MMM d, yyyy h:mm a')
                        : 'Unknown date'}
                    </div>
                    {version.changeNotes && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        {version.changeNotes}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </ScrollArea>

            {/* Version Preview */}
            <div className="border rounded-lg flex flex-col">
              {selectedVersion ? (
                <>
                  <div className="p-3 border-b bg-secondary/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-sm">
                          Version {selectedVersion.versionNumber}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {selectedVersion.fields.length} fields
                        </p>
                      </div>
                      {selectedVersion.versionNumber !== currentVersionNumber && (
                        <Button
                          size="sm"
                          onClick={() => handleRestore(selectedVersion)}
                          disabled={restoreVersion.isPending}
                        >
                          {restoreVersion.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <RotateCcw className="mr-2 h-4 w-4" />
                          )}
                          Restore
                        </Button>
                      )}
                    </div>
                  </div>
                  <ScrollArea className="flex-1 p-3">
                    <div className="space-y-2">
                      {selectedVersion.fields.map((field, index) => (
                        <div
                          key={field.id}
                          className="p-2 border rounded bg-background text-sm"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{field.label}</span>
                            <Badge variant="secondary" className="text-xs">
                              {getFieldTypeLabel(field.type)}
                            </Badge>
                          </div>
                          {field.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {field.description}
                            </p>
                          )}
                          <div className="flex gap-2 mt-1">
                            {field.required && (
                              <span className="text-xs text-muted-foreground">
                                Required
                              </span>
                            )}
                            {field.options && (
                              <span className="text-xs text-muted-foreground">
                                {field.options.length} options
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Select a version to preview</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
