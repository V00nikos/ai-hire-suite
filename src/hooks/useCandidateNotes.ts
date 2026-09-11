import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface CandidateNote {
  id: string;
  candidate_id: string;
  application_id: string | null;
  content: string;
  author_id: string;
  created_at: string;
  updated_at: string;
  author?: {
    full_name: string | null;
    email: string;
  };
}

export function useCandidateNotes(candidateId: string | undefined) {
  return useQuery({
    queryKey: ["candidate-notes", candidateId],
    queryFn: async () => {
      if (!candidateId) return [];
      
      const { data, error } = await supabase
        .from("candidate_notes")
        .select(`
          *,
          author:profiles!candidate_notes_author_id_fkey(full_name, email)
        `)
        .eq("candidate_id", candidateId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as CandidateNote[];
    },
    enabled: !!candidateId,
  });
}

export function useCreateCandidateNote() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      candidateId,
      content,
      applicationId,
    }: {
      candidateId: string;
      content: string;
      applicationId?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("candidate_notes")
        .insert({
          candidate_id: candidateId,
          content,
          author_id: user.id,
          application_id: applicationId || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["candidate-notes", variables.candidateId],
      });
      toast({ title: "Note added successfully" });
    },
    onError: (error) => {
      console.error("Error creating note:", error);
      toast({
        title: "Failed to add note",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateCandidateNote() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      noteId,
      content,
      candidateId,
    }: {
      noteId: string;
      content: string;
      candidateId: string;
    }) => {
      const { data, error } = await supabase
        .from("candidate_notes")
        .update({ content })
        .eq("id", noteId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["candidate-notes", variables.candidateId],
      });
      toast({ title: "Note updated" });
    },
    onError: (error) => {
      console.error("Error updating note:", error);
      toast({
        title: "Failed to update note",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteCandidateNote() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      noteId,
      candidateId,
    }: {
      noteId: string;
      candidateId: string;
    }) => {
      const { error } = await supabase
        .from("candidate_notes")
        .delete()
        .eq("id", noteId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["candidate-notes", variables.candidateId],
      });
      toast({ title: "Note deleted" });
    },
    onError: (error) => {
      console.error("Error deleting note:", error);
      toast({
        title: "Failed to delete note",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
