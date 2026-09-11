import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormField } from "@/types/form";
import { Upload } from "lucide-react";

interface FormPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  jobTitle: string;
  fields: FormField[];
}

export function FormPreviewDialog({
  isOpen,
  onClose,
  jobTitle,
  fields,
}: FormPreviewDialogProps) {
  const renderField = (field: FormField) => {
    switch (field.type) {
      case "text":
      case "email":
      case "phone":
      case "url":
        return (
          <Input
            type={field.type === "email" ? "email" : field.type === "phone" ? "tel" : field.type === "url" ? "url" : "text"}
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
            disabled
          />
        );
      case "number":
        return (
          <Input
            type="number"
            placeholder={field.placeholder || "Enter number"}
            disabled
          />
        );
      case "textarea":
        return (
          <Textarea
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
            rows={4}
            disabled
          />
        );
      case "date":
        return <Input type="date" disabled />;
      case "select":
        return (
          <Select disabled>
            <SelectTrigger>
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case "multiselect":
        return (
          <div className="space-y-2">
            {field.options?.map((opt) => (
              <div key={opt} className="flex items-center gap-2">
                <Checkbox id={opt} disabled />
                <Label htmlFor={opt} className="text-sm font-normal">
                  {opt}
                </Label>
              </div>
            ))}
          </div>
        );
      case "file":
      case "video":
        return (
          <div className="rounded-lg border-2 border-dashed border-border p-6 text-center">
            <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              {field.type === "video" ? "Upload video file" : "Upload file"}
            </p>
            <p className="text-xs text-muted-foreground">
              {field.accept || (field.type === "video" ? ".mp4, .mov, .webm" : ".pdf, .doc, .docx")}
            </p>
          </div>
        );
      default:
        return <Input placeholder={field.placeholder} disabled />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Form Preview</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 p-6 text-center">
            <h2 className="text-xl font-semibold text-foreground">
              {jobTitle || "Job Title"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Application Form Preview
            </p>
          </div>

          {fields.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No fields added yet
            </p>
          ) : (
            <div className="space-y-4">
              {fields.map((field) => (
                <div key={field.id} className="space-y-2">
                  <Label className="flex items-center gap-1">
                    {field.label}
                    {field.required && (
                      <span className="text-destructive">*</span>
                    )}
                  </Label>
                  {renderField(field)}
                </div>
              ))}
            </div>
          )}

          <Button className="w-full" disabled>
            Submit Application
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
