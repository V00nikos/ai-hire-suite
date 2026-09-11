import { useState, useCallback } from "react";
import { Candidate } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";

export function useCandidateActions(initialCandidates: Candidate[]) {
  const { toast } = useToast();
  const [candidates, setCandidates] = useState(initialCandidates);
  const [shortlistedIds, setShortlistedIds] = useState<string[]>(
    initialCandidates.filter((c) => c.shortlisted).map((c) => c.id)
  );
  const [rejectedIds, setRejectedIds] = useState<string[]>(
    initialCandidates.filter((c) => c.status === "rejected").map((c) => c.id)
  );

  const handleShortlist = useCallback(
    (candidateId: string) => {
      setCandidates((prev) =>
        prev.map((c) =>
          c.id === candidateId
            ? { ...c, shortlisted: !c.shortlisted, status: c.shortlisted ? "evaluated" : "shortlisted" }
            : c
        )
      );
      setShortlistedIds((prev) => {
        const isCurrentlyShortlisted = prev.includes(candidateId);
        if (isCurrentlyShortlisted) {
          return prev.filter((id) => id !== candidateId);
        }
        return [...prev, candidateId];
      });
      toast({
        title: "Candidate updated",
        description: "Shortlist status changed",
      });
    },
    [toast]
  );

  const handleReject = useCallback(
    (candidateId: string) => {
      setCandidates((prev) =>
        prev.map((c) =>
          c.id === candidateId ? { ...c, status: "rejected", shortlisted: false } : c
        )
      );
      setRejectedIds((prev) => [...prev, candidateId]);
      setShortlistedIds((prev) => prev.filter((id) => id !== candidateId));
    },
    []
  );

  const handleUndo = useCallback(
    (candidateId: string, previousStatus: Candidate["status"]) => {
      setCandidates((prev) =>
        prev.map((c) =>
          c.id === candidateId
            ? { ...c, status: previousStatus, shortlisted: previousStatus === "shortlisted" }
            : c
        )
      );
      setRejectedIds((prev) => prev.filter((id) => id !== candidateId));
      if (previousStatus === "shortlisted") {
        setShortlistedIds((prev) => [...prev, candidateId]);
      }
    },
    []
  );

  const shortlistedCount = shortlistedIds.length;
  const rejectedCount = rejectedIds.length;
  const pendingCandidates = candidates.filter(
    (c) => !shortlistedIds.includes(c.id) && !rejectedIds.includes(c.id)
  );

  return {
    candidates,
    setCandidates,
    shortlistedIds,
    rejectedIds,
    shortlistedCount,
    rejectedCount,
    pendingCandidates,
    handleShortlist,
    handleReject,
    handleUndo,
  };
}
