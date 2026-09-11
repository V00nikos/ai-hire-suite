import { Check, FileText, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";

interface JobBuilderSidebarProps {
  currentStep: number;
  onStepChange: (step: number) => void;
  jobTitle: string;
  fieldsCount: number;
}

export function JobBuilderSidebar({
  currentStep,
  onStepChange,
  jobTitle,
  fieldsCount,
}: JobBuilderSidebarProps) {
  const steps = [
    {
      id: 1,
      title: "Job Details",
      description: "Title, description & requirements",
      icon: FileText,
      isComplete: !!jobTitle.trim(),
    },
    {
      id: 2,
      title: "Application Form",
      description: "Build your form fields",
      icon: ListChecks,
      isComplete: fieldsCount >= 3,
    },
  ];

  return (
    <div className="space-y-2">
      {steps.map((step) => {
        const isActive = currentStep === step.id;
        const Icon = step.icon;

        return (
          <button
            key={step.id}
            onClick={() => onStepChange(step.id)}
            className={cn(
              "w-full flex items-start gap-3 rounded-lg p-3 text-left transition-all",
              isActive
                ? "bg-primary text-primary-foreground"
                : "hover:bg-secondary"
            )}
          >
            <div
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium",
                step.isComplete
                  ? isActive
                    ? "bg-primary-foreground text-primary"
                    : "bg-success text-success-foreground"
                  : isActive
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {step.isComplete ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                step.id
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div
                className={cn(
                  "text-sm font-medium",
                  isActive ? "text-primary-foreground" : "text-foreground"
                )}
              >
                {step.title}
              </div>
              <div
                className={cn(
                  "text-xs truncate",
                  isActive
                    ? "text-primary-foreground/70"
                    : "text-muted-foreground"
                )}
              >
                {step.description}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
