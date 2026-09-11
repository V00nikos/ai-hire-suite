import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { X, ChevronRight, Sparkles, MessageSquare, Users, FileText, BarChart3 } from "lucide-react";

interface AIAssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const suggestions = [
  { icon: Users, label: "Summarize top candidates", prompt: "Summarize the top 5 candidates" },
  { icon: BarChart3, label: "Compare candidates", prompt: "Compare the top 3 candidates" },
  { icon: FileText, label: "Draft rejection email", prompt: "Draft a polite rejection email" },
  { icon: MessageSquare, label: "Interview questions", prompt: "Suggest interview questions for..." },
];

export function AIAssistantPanel({ isOpen, onClose }: AIAssistantPanelProps) {
  const [message, setMessage] = useState("");

  return (
    <div
      className={cn(
        "fixed right-0 top-0 z-40 flex h-full w-80 flex-col border-l border-border bg-card transition-transform duration-300",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-medium text-foreground">AI Assistant</span>
        </div>
        <Button variant="ghost" size="icon" className="rounded-full h-8 w-8" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* New Chat */}
      <div className="border-b border-border p-4">
        <Button variant="outline" className="w-full justify-between rounded-xl" size="sm">
          <span className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            New Chat
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>

      {/* Suggestions */}
      <div className="flex-1 overflow-y-auto p-4">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Suggestions
        </p>
        <div className="space-y-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.label}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-foreground transition-smooth hover:bg-muted"
            >
              <suggestion.icon className="h-4 w-4 text-muted-foreground" />
              <span>{suggestion.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-border p-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Message AI Assistant..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full rounded-xl border border-input bg-background px-4 py-3 pr-12 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20"
          />
          <Button
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg"
            disabled={!message.trim()}
          >
            <Sparkles className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
