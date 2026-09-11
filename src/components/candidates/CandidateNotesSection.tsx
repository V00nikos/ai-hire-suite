import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MessageSquare,
  Send,
  Trash2,
  Edit2,
  X,
  Check,
  Loader2,
  User,
} from "lucide-react";
import {
  useCandidateNotes,
  useCreateCandidateNote,
  useUpdateCandidateNote,
  useDeleteCandidateNote,
} from "@/hooks/useCandidateNotes";
import { formatDistanceToNow } from "date-fns";

interface CandidateNotesSectionProps {
  candidateId: string;
  applicationId?: string;
}

export function CandidateNotesSection({
  candidateId,
  applicationId,
}: CandidateNotesSectionProps) {
  const [newNote, setNewNote] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const { data: notes = [], isLoading } = useCandidateNotes(candidateId);
  const createNote = useCreateCandidateNote();
  const updateNote = useUpdateCandidateNote();
  const deleteNote = useDeleteCandidateNote();

  const handleAddNote = () => {
    if (!newNote.trim()) return;

    createNote.mutate(
      {
        candidateId,
        content: newNote.trim(),
        applicationId,
      },
      {
        onSuccess: () => setNewNote(""),
      }
    );
  };

  const handleEdit = (noteId: string, currentContent: string) => {
    setEditingId(noteId);
    setEditContent(currentContent);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent("");
  };

  const handleSaveEdit = (noteId: string) => {
    if (!editContent.trim()) return;

    updateNote.mutate(
      {
        noteId,
        content: editContent.trim(),
        candidateId,
      },
      {
        onSuccess: () => {
          setEditingId(null);
          setEditContent("");
        },
      }
    );
  };

  const handleDelete = (noteId: string) => {
    deleteNote.mutate({ noteId, candidateId });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add Note Form */}
      <Card variant="glass">
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Textarea
              placeholder="Add a note about this candidate..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="flex-1 min-h-[80px] bg-background/50"
              disabled={createNote.isPending}
            />
          </div>
          <div className="flex justify-end mt-2">
            <Button
              size="sm"
              onClick={handleAddNote}
              disabled={!newNote.trim() || createNote.isPending}
            >
              {createNote.isPending ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-1 h-4 w-4" />
              )}
              Add Note
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notes List */}
      {notes.length > 0 ? (
        <div className="space-y-3">
          {notes.map((note) => (
            <Card key={note.id} variant="glass">
              <CardContent className="p-4">
                {editingId === note.id ? (
                  /* Edit Mode */
                  <div className="space-y-3">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="min-h-[80px] bg-background/50"
                      disabled={updateNote.isPending}
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancelEdit}
                        disabled={updateNote.isPending}
                      >
                        <X className="mr-1 h-4 w-4" />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleSaveEdit(note.id)}
                        disabled={!editContent.trim() || updateNote.isPending}
                      >
                        {updateNote.isPending ? (
                          <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="mr-1 h-4 w-4" />
                        )}
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* View Mode */
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="text-sm text-foreground whitespace-pre-wrap">
                          {note.content}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleEdit(note.id, note.content)}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(note.id)}
                          disabled={deleteNote.isPending}
                        >
                          {deleteNote.isPending ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>
                          {note.author?.full_name || note.author?.email || "Unknown"}
                        </span>
                      </div>
                      <span>•</span>
                      <span>
                        {formatDistanceToNow(new Date(note.created_at), {
                          addSuffix: true,
                        })}
                      </span>
                      {note.updated_at !== note.created_at && (
                        <Badge variant="outline" className="text-[10px]">
                          Edited
                        </Badge>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card variant="glass">
          <CardContent className="p-8 text-center">
            <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No notes yet.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Add notes to track your thoughts about this candidate.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
