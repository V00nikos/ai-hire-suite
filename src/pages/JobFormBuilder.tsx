import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FormPreviewDialog } from "@/components/dialogs/FormPreviewDialog";
import { FormVersionHistoryDialog } from "@/components/dialogs/FormVersionHistoryDialog";
import { v4 as uuidv4 } from "uuid";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Type,
  Mail,
  Phone,
  AlignLeft,
  Hash,
  Link,
  Calendar,
  Upload,
  Video,
  ChevronDown,
  CheckSquare,
  GripVertical,
  Trash2,
  Plus,
  Eye,
  Save,
  Loader2,
  Globe,
  GlobeLock,
  FileText,
  History,
  Users,
} from "lucide-react";
import { FormField, FormFieldType, FIELD_TYPES } from "@/types/form";
import { useToast } from "@/hooks/use-toast";
import { useCreateJobWithForm, useJob, useUpdateJobWithForm } from "@/hooks/useJobs";
import { useFormPublishStatus, useToggleFormPublish } from "@/hooks/useFormPublish";
import { useJobFormFields } from "@/hooks/useJobFormFields";
import { useFormVersionHistory } from "@/hooks/useFormVersionHistory";
import { ShareCandidateLinkCard } from "@/components/ShareCandidateLinkCard";
import { JobBuilderSidebar } from "@/components/form-builder/JobBuilderSidebar";
import { RubricEditor } from "@/components/form-builder/RubricEditor";
import { EMPTY_RUBRIC, type EvaluationRubric } from "@/types/form";
import { InlineFieldEditor } from "@/components/form-builder/InlineFieldEditor";
import { Badge } from "@/components/ui/badge";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Type,
  Mail,
  Phone,
  AlignLeft,
  Hash,
  Link,
  Calendar,
  Upload,
  Video,
  ChevronDown,
  CheckSquare,
  FileText,
};

const DEFAULT_FIELDS: FormField[] = [
  { id: uuidv4(), type: "text", label: "Full Name", required: true },
  { id: uuidv4(), type: "email", label: "Email", required: true },
  { id: uuidv4(), type: "file", label: "Resume", required: true, accept: ".pdf,.doc,.docx" },
];

function SortableFieldCard({
  field,
  onSelect,
  onDelete,
  onUpdate,
  isSelected,
}: {
  field: FormField;
  onSelect: () => void;
  onDelete: () => void;
  onUpdate: (updates: Partial<FormField>) => void;
  isSelected: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: field.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const fieldTypeInfo = FIELD_TYPES.find((f) => f.type === field.type);
  const Icon = iconMap[fieldTypeInfo?.icon || "Type"];
  const isDescriptionBlock = field.type === "description_block";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border bg-card transition-all ${
        isSelected ? "border-foreground ring-1 ring-foreground" : "border-border"
      }`}
    >
      <div className="group flex items-center gap-3 p-4">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab text-muted-foreground hover:text-foreground"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <Icon className="h-4 w-4 text-muted-foreground" />
        <button onClick={onSelect} className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">{field.label}</span>
            {!isDescriptionBlock && field.required && (
              <span className="text-xs text-muted-foreground">*Required</span>
            )}
          </div>
          <span className="text-xs text-muted-foreground">{fieldTypeInfo?.label}</span>
          {field.description && (
            <p className="mt-1 text-xs text-muted-foreground/70 line-clamp-1">
              {field.description}
            </p>
          )}
        </button>
        <button
          onClick={onDelete}
          className="opacity-0 transition-opacity group-hover:opacity-100"
        >
          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
        </button>
      </div>

      {/* Inline Editor */}
      {isSelected && (
        <div className="px-4 pb-4">
          <InlineFieldEditor field={field} onUpdate={onUpdate} />
        </div>
      )}
    </div>
  );
}

export default function JobFormBuilder() {
  const navigate = useNavigate();
  const { jobId } = useParams();
  const isEditMode = !!jobId;
  const { toast } = useToast();

  const { data: existingJob, isLoading: isLoadingJob } = useJob(jobId);
  const { data: formFieldsData, isLoading: isLoadingFields } = useJobFormFields(jobId);
  const { data: publishStatus } = useFormPublishStatus(jobId);
  const { data: versionHistory, isLoading: isLoadingHistory } = useFormVersionHistory(jobId);
  const togglePublish = useToggleFormPublish();
  const createJobWithForm = useCreateJobWithForm();
  const updateJobWithForm = useUpdateJobWithForm();

  const [currentStep, setCurrentStep] = useState(1);
  const [jobTitle, setJobTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [fields, setFields] = useState<FormField[]>(DEFAULT_FIELDS);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [rubric, setRubric] = useState<EvaluationRubric>(EMPTY_RUBRIC);
  
  // Track if we've hydrated from backend to prevent overwriting local edits
  const isHydratedRef = useRef(false);

  // Load existing job details in edit mode
  useEffect(() => {
    if (existingJob) {
      setJobTitle(existingJob.title);
      setDepartment(existingJob.department || "");
      setDescription(existingJob.description || "");
      setRequirements(existingJob.requirements || "");
    }
  }, [existingJob]);

  // Load existing form fields in edit mode (only once on initial load)
  useEffect(() => {
    if (formFieldsData?.fields && formFieldsData.fields.length > 0 && !isHydratedRef.current) {
      setFields(formFieldsData.fields);
      setRubric({ ...EMPTY_RUBRIC, ...(formFieldsData.rubric ?? {}), criteria: formFieldsData.rubric?.criteria ?? [] });
      isHydratedRef.current = true;
    }
  }, [formFieldsData]);

  // Drop half-filled rows before saving; null means "no rubric" (the AI derives criteria from the JD).
  const rubricForSave = (): EvaluationRubric | null => {
    const criteria = rubric.criteria
      .filter((c) => c.label.trim())
      .map((c) => ({ ...c, label: c.label.trim(), weight: Math.max(0, Number(c.weight) || 0) }));
    if (criteria.length === 0) return null;
    return {
      ...rubric,
      criteria,
      must_haves: (rubric.must_haves ?? []).map((s) => s.trim()).filter(Boolean),
      disqualifiers: (rubric.disqualifiers ?? []).map((s) => s.trim()).filter(Boolean),
    };
  };

  // Reset hydration flag when jobId changes (navigating to different job)
  useEffect(() => {
    isHydratedRef.current = false;
  }, [jobId]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setFields((items) => {
        const oldIndex = items.findIndex((f) => f.id === active.id);
        const newIndex = items.findIndex((f) => f.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const addField = (type: FormFieldType) => {
    const fieldTypeInfo = FIELD_TYPES.find((f) => f.type === type);
    const newField: FormField = {
      id: uuidv4(),
      type,
      label: type === "description_block" ? "Instructions" : fieldTypeInfo?.label || "New Field",
      required: false,
      placeholder: "",
    };
    if (type === "select" || type === "multiselect") {
      newField.options = ["Option 1", "Option 2"];
    }
    if (type === "file") {
      newField.accept = ".pdf,.doc,.docx";
    }
    if (type === "video") {
      newField.accept = ".mp4,.mov,.webm";
      newField.maxSize = 50;
    }
    // Use functional update to avoid stale closure issues
    setFields((prev) => [...prev, newField]);
    setSelectedFieldId(newField.id);
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    // Use functional update to avoid stale closure issues
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const deleteField = (id: string) => {
    // Use functional update to avoid stale closure issues
    setFields((prev) => prev.filter((f) => f.id !== id));
    if (selectedFieldId === id) {
      setSelectedFieldId(null);
    }
  };

  const handleSaveDraft = async () => {
    if (!jobTitle.trim()) {
      toast({ title: "Error", description: "Please enter a job title", variant: "destructive" });
      return;
    }

    if (isEditMode && jobId) {
      updateJobWithForm.mutate(
        { 
          jobId, 
          job: { title: jobTitle, department, description, requirements },
          formFields: fields,
          evaluationRubric: rubricForSave(),
        },
        {
          onSuccess: () => {
            const isCurrentlyPublished = publishStatus?.isPublished;
            toast({ 
              title: "Saved!", 
              description: isCurrentlyPublished 
                ? "Changes are now live for candidates." 
                : "Changes saved. Publish to make the form live.",
            });
          },
        }
      );
    } else {
      createJobWithForm.mutate(
        {
          job: { title: jobTitle, department, description, requirements, status: "draft" },
          formFields: fields,
          evaluationRubric: rubricForSave(),
        },
        {
          onSuccess: (data) => {
            toast({ title: "Draft Saved", description: "Your job draft has been saved" });
            navigate(`/jobs/${data.id}/edit`);
          },
        }
      );
    }
  };

  // handlePublish is only for new jobs (not edit mode)
  const handlePublish = async () => {
    if (!jobTitle.trim()) {
      toast({ title: "Error", description: "Please enter a job title", variant: "destructive" });
      return;
    }
    if (fields.length === 0) {
      toast({ title: "Error", description: "Please add at least one field", variant: "destructive" });
      return;
    }

    createJobWithForm.mutate(
      {
        job: { title: jobTitle, department, description, requirements, status: "active" },
        formFields: fields,
        evaluationRubric: rubricForSave(),
      },
      {
        onSuccess: (data) => {
          toast({
            title: "Job Published!",
            description: `Application form is now live.`,
          });
          navigate(`/jobs/${data.id}/edit`);
        },
      }
    );
  };

  const isSubmitting = createJobWithForm.isPending || updateJobWithForm.isPending;

  const handleTogglePublish = () => {
    if (!publishStatus?.versionId || !jobId) return;
    togglePublish.mutate({
      versionId: publishStatus.versionId,
      jobId: jobId,
      publish: !publishStatus.isPublished,
    });
  };

  if (isLoadingJob && isEditMode) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="mb-6 md:mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-semibold text-foreground">
                {isEditMode ? "Edit Job" : "Create New Job"}
              </h1>
              {isEditMode && publishStatus && (
                <Badge
                  variant={publishStatus.isPublished ? "default" : "secondary"}
                  className={publishStatus.isPublished ? "bg-success text-success-foreground" : ""}
                >
                  {publishStatus.isPublished ? (
                    <>
                      <Globe className="mr-1 h-3 w-3" />
                      Published
                    </>
                  ) : (
                    <>
                      <GlobeLock className="mr-1 h-3 w-3" />
                      Unpublished
                    </>
                  )}
                </Badge>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Define job details and build your application form
            </p>
          </div>
          <div className="flex items-center gap-2 md:gap-3 flex-wrap">
            {isEditMode && (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate(`/candidates/bulk-upload?jobId=${jobId}`)}
                >
                  <Users className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Bulk Upload</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowVersionHistory(true)}
                >
                  <History className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">History</span>
                </Button>
              </>
            )}
            <Button variant="outline" size="sm" onClick={() => setShowPreview(true)}>
              <Eye className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Preview</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handleSaveDraft} disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              <span className="hidden sm:inline">Save</span>
            </Button>
            {isEditMode && publishStatus ? (
              <Button
                variant={publishStatus.isPublished ? "outline" : "default"}
                size="sm"
                onClick={handleTogglePublish}
                disabled={togglePublish.isPending}
              >
                {togglePublish.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : publishStatus.isPublished ? (
                  <GlobeLock className="mr-2 h-4 w-4" />
                ) : (
                  <Globe className="mr-2 h-4 w-4" />
                )}
                {publishStatus.isPublished ? "Unpublish" : "Publish"}
              </Button>
            ) : (
              <Button size="sm" onClick={handlePublish} disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  "Publish Job"
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Share Link Card - Top position */}
        {isEditMode && jobId && publishStatus?.isPublished && (
          <div className="mb-6">
            <ShareCandidateLinkCard jobId={jobId} jobTitle={jobTitle} />
          </div>
        )}

        {/* Main Layout - 3 column with step sidebar */}
        <div className="grid gap-6 lg:grid-cols-[220px_1fr_280px]">
          {/* Left - Step Sidebar */}
          <div className="space-y-6">
            <Card className="shadow-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Steps</CardTitle>
              </CardHeader>
              <CardContent>
                <JobBuilderSidebar
                  currentStep={currentStep}
                  onStepChange={setCurrentStep}
                  jobTitle={jobTitle}
                  fieldsCount={fields.length}
                  criteriaCount={rubric.criteria.filter((c) => c.label.trim()).length}
                />
              </CardContent>
            </Card>

            {/* Available Fields (only show in Step 2) */}
            {currentStep === 2 && (
              <Card className="shadow-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Add Field</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  {FIELD_TYPES.map((fieldType) => {
                    const Icon = iconMap[fieldType.icon];
                    return (
                      <button
                        key={fieldType.type}
                        onClick={() => addField(fieldType.type)}
                        className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                      >
                        <Icon className="h-4 w-4" />
                        {fieldType.label}
                      </button>
                    );
                  })}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Center - Content based on step */}
          <div className="space-y-6">
            {currentStep === 1 && (
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="text-base font-medium">Job Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="title">Job Title *</Label>
                      <Input
                        id="title"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        placeholder="e.g. Senior Product Manager"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <Input
                        id="department"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        placeholder="e.g. Product"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe the role, responsibilities, and what you're looking for..."
                      rows={6}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="requirements">Requirements</Label>
                    <Textarea
                      id="requirements"
                      value={requirements}
                      onChange={(e) => setRequirements(e.target.value)}
                      placeholder="List key requirements, skills, and qualifications..."
                      rows={6}
                    />
                  </div>
                  <div className="pt-4">
                    <Button onClick={() => setCurrentStep(2)} className="w-full sm:w-auto">
                      Continue to Form Builder
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === 2 && (
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="text-base font-medium">Application Form</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Click on a field to edit. Drag to reorder.
                  </p>
                </CardHeader>
                <CardContent>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={fields.map((f) => f.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-3">
                        {fields.map((field) => (
                          <SortableFieldCard
                            key={field.id}
                            field={field}
                            isSelected={selectedFieldId === field.id}
                            onSelect={() =>
                              setSelectedFieldId(selectedFieldId === field.id ? null : field.id)
                            }
                            onDelete={() => deleteField(field.id)}
                            onUpdate={(updates) => updateField(field.id, updates)}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>

                  {fields.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <p className="text-muted-foreground">No fields yet</p>
                      <p className="text-sm text-muted-foreground">
                        Click a field type on the left to add it
                      </p>
                    </div>
                  )}

                  <Button
                    variant="outline"
                    className="mt-4 w-full"
                    onClick={() => addField("text")}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Field
                  </Button>
                  <div className="pt-4">
                    <Button onClick={() => setCurrentStep(3)} className="w-full sm:w-auto">
                      Continue to Scoring Rubric
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === 3 && (
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="text-base font-medium">Scoring Rubric</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Every applicant is scored 0-5 on each criterion; the weights roll those up into the 0-100 match score.
                  </p>
                </CardHeader>
                <CardContent>
                  <RubricEditor
                    rubric={rubric}
                    onChange={setRubric}
                    job={{ title: jobTitle, department, description, requirements }}
                  />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right - Quick Actions */}
          <div className="space-y-6">

            <Card className="shadow-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Quick Tips</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-3">
                {currentStep === 1 ? (
                  <>
                    <p>• Add a compelling job title that stands out</p>
                    <p>• Write a clear description of the role</p>
                    <p>• List specific requirements and qualifications</p>
                  </>
                ) : currentStep === 3 ? (
                  <>
                    <p>• Start from the AI draft, then adjust the weights</p>
                    <p>• 4-6 criteria works best; weights should total 100%</p>
                    <p>• Describe what a 5/5 looks like for each criterion</p>
                    <p>• Save to apply it to new applicants; existing scores keep the rubric they were scored with</p>
                  </>
                ) : (
                  <>
                    <p>• Click a field to expand its editor</p>
                    <p>• Add descriptions to help candidates</p>
                    <p>• Use "Description Block" for instructions</p>
                    <p>• Drag fields to reorder them</p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <FormPreviewDialog
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        jobTitle={jobTitle}
        fields={fields}
      />

      {isEditMode && jobId && formFieldsData && (
        <FormVersionHistoryDialog
          open={showVersionHistory}
          onOpenChange={setShowVersionHistory}
          versions={versionHistory || []}
          isLoading={isLoadingHistory}
          jobId={jobId}
          formId={formFieldsData.formId}
          currentVersionNumber={formFieldsData.versionNumber}
          onVersionRestored={(restoredFields) => {
            setFields(restoredFields);
            isHydratedRef.current = true;
          }}
        />
      )}
    </DashboardLayout>
  );
}
