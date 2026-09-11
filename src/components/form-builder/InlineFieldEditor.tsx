import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormField, FormFieldType, FIELD_TYPES } from "@/types/form";

interface InlineFieldEditorProps {
  field: FormField;
  onUpdate: (updates: Partial<FormField>) => void;
}

export function InlineFieldEditor({ field, onUpdate }: InlineFieldEditorProps) {
  const isDescriptionBlock = field.type === "description_block";

  return (
    <div className="space-y-4 pt-4 border-t border-border mt-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Field Type</Label>
          <Select
            value={field.type}
            onValueChange={(value: FormFieldType) => onUpdate({ type: value })}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FIELD_TYPES.map((ft) => (
                <SelectItem key={ft.type} value={ft.type}>
                  {ft.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">
            {isDescriptionBlock ? "Title (optional)" : "Label"}
          </Label>
          <Input
            className="h-9"
            value={field.label}
            onChange={(e) => onUpdate({ label: e.target.value })}
            placeholder={isDescriptionBlock ? "Section title..." : "Field label..."}
          />
        </div>
      </div>

      {!isDescriptionBlock && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Placeholder</Label>
          <Input
            className="h-9"
            value={field.placeholder || ""}
            onChange={(e) => onUpdate({ placeholder: e.target.value })}
            placeholder="Placeholder text..."
          />
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">
          {isDescriptionBlock ? "Content" : "Description (helps candidates understand what to enter)"}
        </Label>
        <Textarea
          value={field.description || ""}
          onChange={(e) => onUpdate({ description: e.target.value })}
          placeholder={
            isDescriptionBlock
              ? "Enter the descriptive text to display..."
              : "e.g., Please provide a brief overview of your experience..."
          }
          rows={3}
          className="text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Supports markdown: **bold**, *italic*, bullet points
        </p>
      </div>

      {!isDescriptionBlock && (
        <>
          <Separator />
          <div className="flex items-center justify-between">
            <Label className="text-sm">Required field</Label>
            <Switch
              checked={field.required}
              onCheckedChange={(checked) => onUpdate({ required: checked })}
            />
          </div>
        </>
      )}

      {(field.type === "select" || field.type === "multiselect") && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Options (one per line)</Label>
          <Textarea
            value={(field.options || []).join("\n")}
            onChange={(e) =>
              onUpdate({
                options: e.target.value.split("\n").filter(Boolean),
              })
            }
            rows={4}
            placeholder="Option 1&#10;Option 2&#10;Option 3"
          />
        </div>
      )}

      {field.type === "textarea" && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Max Characters (optional)</Label>
          <Input
            type="number"
            className="h-9"
            value={field.maxLength || ""}
            onChange={(e) =>
              onUpdate({ maxLength: parseInt(e.target.value) || undefined })
            }
            placeholder="No limit"
          />
        </div>
      )}
    </div>
  );
}
