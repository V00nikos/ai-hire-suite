import { useState, useCallback } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  X,
  AlertTriangle,
  FileText,
  Video,
  Star,
  RotateCcw,
  ExternalLink,
  Linkedin,
  IndianRupee,
  Clock,
} from "lucide-react";

interface Candidate {
  id: string;
  name: string;
  email: string;
  currentRole: string;
  experience: string;
  score: number | null;
  hasResume: boolean;
  hasVideo: boolean;
  shortlisted: boolean;
  status: string;
  strengths: string[];
  weaknesses: string[];
  recommendation?: string | null;
  linkedinUrl?: string | null;
  ctc?: string | null;
  noticePeriod?: string | null;
}

interface CandidateCardStackProps {
  candidates: Candidate[];
  onShortlist: (id: string) => void;
  onReject: (id: string) => void;
  onViewProfile: (id: string) => void;
}

const SWIPE_THRESHOLD = 80;

export function CandidateCardStack({
  candidates,
  onShortlist,
  onReject,
  onViewProfile,
}: CandidateCardStackProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<"left" | "right" | null>(null);
  const [history, setHistory] = useState<{ index: number; action: "shortlist" | "reject" }[]>([]);

  const currentCandidate = candidates[currentIndex];
  const hasMore = currentIndex < candidates.length;
  const canUndo = history.length > 0;

  const handleSwipe = useCallback(
    (swipeDirection: "left" | "right") => {
      if (!currentCandidate) return;

      setDirection(swipeDirection);
      
      if (swipeDirection === "right") {
        onShortlist(currentCandidate.id);
        setHistory((prev) => [...prev, { index: currentIndex, action: "shortlist" }]);
      } else {
        onReject(currentCandidate.id);
        setHistory((prev) => [...prev, { index: currentIndex, action: "reject" }]);
      }

      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
        setDirection(null);
      }, 200);
    },
    [currentCandidate, currentIndex, onShortlist, onReject]
  );

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (info.offset.x > SWIPE_THRESHOLD) {
        handleSwipe("right");
      } else if (info.offset.x < -SWIPE_THRESHOLD) {
        handleSwipe("left");
      }
    },
    [handleSwipe]
  );

  const handleUndo = useCallback(() => {
    if (!canUndo) return;
    const lastAction = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setCurrentIndex(lastAction.index);
  }, [canUndo, history]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "l") {
        handleSwipe("right");
      } else if (e.key === "ArrowLeft" || e.key === "h") {
        handleSwipe("left");
      } else if (e.key === "z" && (e.metaKey || e.ctrlKey)) {
        handleUndo();
      }
    },
    [handleSwipe, handleUndo]
  );

  if (!hasMore) {
    return (
      <div className="flex flex-col items-center justify-center py-12 md:py-20 px-4">
        <div className="text-5xl md:text-6xl mb-4">🎉</div>
        <h3 className="text-lg md:text-xl font-semibold text-foreground mb-2 text-center">All caught up!</h3>
        <p className="text-sm md:text-base text-muted-foreground mb-6 text-center">
          You've reviewed all {candidates.length} candidates
        </p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => {
              setCurrentIndex(0);
              setHistory([]);
            }}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Start Over
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative flex flex-col items-center w-full max-w-xl"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {/* Progress indicator */}
      <div className="mb-4 md:mb-6 flex items-center gap-3 md:gap-4 w-full justify-center">
        <span className="text-xs md:text-sm text-muted-foreground">
          {currentIndex + 1} of {candidates.length}
        </span>
        <div className="h-1.5 w-32 md:w-48 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${((currentIndex + 1) / candidates.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        {canUndo && (
          <Button variant="ghost" size="sm" onClick={handleUndo} className="h-8 px-2">
            <RotateCcw className="mr-1 h-3.5 w-3.5" />
            <span className="hidden sm:inline">Undo</span>
          </Button>
        )}
      </div>

      {/* Card stack - Responsive height */}
      <div className="relative h-[420px] md:h-[520px] w-full">
        {/* Background cards for depth */}
        {candidates.slice(currentIndex + 1, currentIndex + 3).map((_, i) => (
          <div
            key={`bg-${i}`}
            className="absolute inset-0 rounded-2xl bg-card border shadow-soft"
            style={{
              transform: `scale(${1 - (i + 1) * 0.03}) translateY(${(i + 1) * 8}px)`,
              zIndex: -i - 1,
              opacity: 1 - (i + 1) * 0.2,
            }}
          />
        ))}

        {/* Active card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentCandidate.id}
            className="absolute inset-0 cursor-grab active:cursor-grabbing touch-pan-y"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.7}
            onDragEnd={handleDragEnd}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{
              scale: 1,
              opacity: 1,
              x: direction === "left" ? -300 : direction === "right" ? 300 : 0,
              rotate: direction === "left" ? -10 : direction === "right" ? 10 : 0,
            }}
            exit={{
              x: direction === "left" ? -500 : 500,
              opacity: 0,
              rotate: direction === "left" ? -15 : 15,
            }}
            transition={{ duration: 0.2 }}
            whileDrag={{ scale: 1.02 }}
          >
            <Card className="h-full shadow-elevated overflow-hidden">
              {/* Swipe indicators */}
              <motion.div
                className="absolute inset-0 bg-success/20 rounded-2xl flex items-center justify-center pointer-events-none z-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: direction === "right" ? 1 : 0 }}
              >
                <div className="bg-success text-success-foreground px-4 md:px-6 py-2 md:py-3 rounded-full font-semibold text-base md:text-lg flex items-center gap-2">
                  <Star className="h-4 w-4 md:h-5 md:w-5 fill-current" />
                  SHORTLIST
                </div>
              </motion.div>
              <motion.div
                className="absolute inset-0 bg-destructive/20 rounded-2xl flex items-center justify-center pointer-events-none z-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: direction === "left" ? 1 : 0 }}
              >
                <div className="bg-destructive text-destructive-foreground px-4 md:px-6 py-2 md:py-3 rounded-full font-semibold text-base md:text-lg flex items-center gap-2">
                  <X className="h-4 w-4 md:h-5 md:w-5" />
                  PASS
                </div>
              </motion.div>

              <CardContent className="p-4 md:p-6 h-full flex flex-col overflow-y-auto">
                {/* Header */}
                <div className="flex items-start gap-3 md:gap-4 mb-3 md:mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="text-lg md:text-xl font-semibold text-foreground truncate">
                        {currentCandidate.name}
                      </h2>
                      {currentCandidate.score !== null && currentCandidate.score !== undefined && (
                        <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                          <span className="text-xl md:text-2xl font-bold text-foreground">
                            {currentCandidate.score}
                          </span>
                          <span className="text-muted-foreground text-sm">/5</span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs md:text-sm text-muted-foreground mt-0.5 md:mt-1 truncate">
                      {currentCandidate.email}
                    </p>
                    {currentCandidate.currentRole && (
                      <p className="text-xs md:text-sm text-muted-foreground">
                        {currentCandidate.currentRole}
                        {currentCandidate.experience && ` • ${currentCandidate.experience}`}
                      </p>
                    )}
                  </div>
                </div>

                {/* Quick Info - LinkedIn, CTC, Notice Period */}
                <div className="flex flex-wrap items-center gap-2 mb-3 md:mb-4 text-xs text-muted-foreground">
                  {currentCandidate.linkedinUrl && (
                    <a
                      href={currentCandidate.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Linkedin className="h-3 w-3" />
                      LinkedIn
                    </a>
                  )}
                  {currentCandidate.ctc && (
                    <span className="inline-flex items-center gap-1">
                      <IndianRupee className="h-3 w-3" />
                      {currentCandidate.ctc}
                    </span>
                  )}
                  {currentCandidate.noticePeriod && (
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {currentCandidate.noticePeriod}
                    </span>
                  )}
                </div>

                {/* Badges */}
                <div className="flex items-center gap-2 mb-3 md:mb-4">
                  {currentCandidate.hasResume && (
                    <Badge variant="secondary" className="gap-1 text-xs">
                      <FileText className="h-3 w-3" />
                      Resume
                    </Badge>
                  )}
                  {currentCandidate.hasVideo && (
                    <Badge variant="secondary" className="gap-1 text-xs">
                      <Video className="h-3 w-3" />
                      Video
                    </Badge>
                  )}
                </div>

                {/* Strengths */}
                <div className="mb-3 md:mb-4 flex-1">
                  <div className="flex items-center gap-2 mb-1.5 md:mb-2">
                    <div className="flex items-center justify-center w-4 h-4 md:w-5 md:h-5 rounded-full bg-success/10">
                      <Check className="h-2.5 w-2.5 md:h-3 md:w-3 text-success" />
                    </div>
                    <span className="text-xs md:text-sm font-medium text-foreground">Strengths</span>
                  </div>
                  <ul className="space-y-1 md:space-y-1.5 pl-6 md:pl-7">
                    {currentCandidate.strengths.slice(0, 3).map((s, i) => (
                      <li key={i} className="text-xs md:text-sm text-muted-foreground line-clamp-2">
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Weaknesses */}
                <div className="mb-4 md:mb-6">
                  <div className="flex items-center gap-2 mb-1.5 md:mb-2">
                    <div className="flex items-center justify-center w-4 h-4 md:w-5 md:h-5 rounded-full bg-warning/10">
                      <AlertTriangle className="h-2.5 w-2.5 md:h-3 md:w-3 text-warning" />
                    </div>
                    <span className="text-xs md:text-sm font-medium text-foreground">Weaknesses</span>
                  </div>
                  <ul className="space-y-1 md:space-y-1.5 pl-6 md:pl-7">
                    {currentCandidate.weaknesses.slice(0, 2).map((w, i) => (
                      <li key={i} className="text-xs md:text-sm text-muted-foreground line-clamp-2">
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* View Profile */}
                <Button
                  variant="outline"
                  className="w-full mt-auto"
                  onClick={() => onViewProfile(currentCandidate.id)}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Full Profile
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Action buttons - Larger on mobile for touch */}
      <div className="mt-6 md:mt-8 flex items-center gap-4 md:gap-6">
        <Button
          size="lg"
          variant="outline"
          className="h-14 w-14 md:h-14 md:w-14 rounded-full border-2 border-destructive/30 hover:bg-destructive/10 hover:border-destructive active:scale-95 transition-transform"
          onClick={() => handleSwipe("left")}
        >
          <X className="h-6 w-6 text-destructive" />
        </Button>

        <Button
          size="lg"
          variant="outline"
          className="h-16 w-16 md:h-16 md:w-16 rounded-full border-2 border-success/30 hover:bg-success/10 hover:border-success active:scale-95 transition-transform"
          onClick={() => handleSwipe("right")}
        >
          <Star className="h-7 w-7 text-success" />
        </Button>
      </div>

      {/* Keyboard shortcuts hint - Hide on mobile */}
      <p className="mt-4 text-xs text-muted-foreground hidden md:block">
        Swipe or use <kbd className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground">←</kbd>{" "}
        <kbd className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground">→</kbd> keys •{" "}
        <kbd className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground">⌘Z</kbd> to undo
      </p>
    </div>
  );
}
