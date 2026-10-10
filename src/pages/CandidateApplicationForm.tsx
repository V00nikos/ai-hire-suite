import { useState, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Upload, CheckCircle, FileText, Video, X, Loader2, MapPin, Briefcase, Building2, ArrowDown } from "lucide-react";
import { FormField } from "@/types/form";
import { useToast } from "@/hooks/use-toast";
import { usePublicJob } from "@/hooks/usePublicJob";
import { supabase } from "@/integrations/supabase/client";

// Simple markdown-like parser for field descriptions
function parseDescription(text: string): React.ReactNode[] {
  if (!text) return [];
  
  const lines = text.split('\n');
  return lines.map((line, i) => {
    // Bold text: **text**
    let processed: React.ReactNode = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Italic text: *text*
    processed = (processed as string).replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    return (
      <span 
        key={i} 
        className="block"
        dangerouslySetInnerHTML={{ __html: processed as string }}
      />
    );
  });
}

export default function CandidateApplicationForm() {
  const { jobId } = useParams();
  const { toast } = useToast();
  const { data: job, isLoading, error } = usePublicJob(jobId);
  const [formData, setFormData] = useState<Record<string, string | string[]>>({});
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (fieldId: string, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleFileChange = (fieldId: string, file: File | null) => {
    setFiles((prev) => ({ ...prev, [fieldId]: file }));
  };

  const handleDrop = useCallback(
    (fieldId: string, e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) {
        handleFileChange(fieldId, file);
      }
    },
    []
  );

  const scrollToForm = () => {
    setShowForm(true);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!job) return;

    // Validate required fields (skip description_block fields)
    for (const field of job.form_config) {
      if (field.type === "description_block") continue;
      
      if (field.required) {
        if (field.type === "file" || field.type === "video") {
          if (!files[field.id]) {
            toast({
              title: "Missing Required Field",
              description: `Please upload ${field.label}`,
              variant: "destructive",
            });
            return;
          }
        } else {
          if (!formData[field.id]) {
            toast({
              title: "Missing Required Field",
              description: `Please fill in ${field.label}`,
              variant: "destructive",
            });
            return;
          }
        }
      }
    }

    // Get email and name from form data
    const emailField = job.form_config.find(f => f.type === 'email');
    const nameField = job.form_config.find(f => f.type === 'text' && f.label.toLowerCase().includes('name'));
    const phoneField = job.form_config.find(f => f.type === 'phone');

    const email = emailField ? formData[emailField.id] as string : '';
    const name = nameField ? formData[nameField.id] as string : 'Unknown';
    const phone = phoneField ? formData[phoneField.id] as string : null;

    if (!email) {
      toast({
        title: "Email Required",
        description: "Please provide an email address",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Find-or-create the candidate, create the application and save the form responses in one
      // SECURITY DEFINER call — anonymous applicants can insert but not read rows back under RLS.
      // Skip description_block fields and empty values (response_value is NOT NULL).
      const responses = job.form_config
        .filter(field => field.type !== "description_block")
        .filter(field => {
          const value = formData[field.id];
          if (value === undefined || value === null) return false;
          if (typeof value === 'string' && value.trim() === '') return false;
          if (Array.isArray(value) && value.length === 0) return false;
          return true;
        })
        .map(field => ({
          field_id: field.id,
          field_label: field.label,
          field_type: field.type,
          response_value: formData[field.id],
        }));

      const { data: applicationId, error: submitError } = await (supabase.rpc as any)('submit_application', {
        p_job_id: job.id,
        p_form_version_id: job.form_version_id ?? null,
        p_name: name,
        p_email: email,
        p_phone: phone,
        p_responses: responses,
      });

      if (submitError || !applicationId) {
        if (submitError?.message?.includes('already_applied')) {
          toast({
            title: "Already applied",
            description: "An application with this email already exists for this job.",
            variant: "destructive",
          });
          return;
        }
        throw new Error(submitError?.message ?? 'Failed to submit application');
      }
      const application = { id: applicationId as string };

      // Upload files if any
      for (const [fieldId, file] of Object.entries(files)) {
        if (file) {
          const field = job.form_config.find(f => f.id === fieldId);
          const filePath = `applications/${application.id}/${file.name}`;
          
          const { error: uploadError } = await supabase.storage
            .from('application-files')
            .upload(filePath, file);

          if (!uploadError) {
            const { data: publicUrl } = supabase.storage
              .from('application-files')
              .getPublicUrl(filePath);

            await supabase.from('application_documents').insert({
              application_id: application.id,
              document_type: field?.type === 'video' ? 'video' : 'resume',
              filename: file.name,
              file_url: publicUrl.publicUrl,
              file_size: file.size,
            });
          }
        }
      }

      setIsSubmitted(true);
    } catch (err) {
      console.error('Submission error:', err);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md shadow-card">
          <CardContent className="py-12 text-center">
            <h2 className="mb-2 text-xl font-semibold text-foreground">Job Not Found</h2>
            <p className="text-muted-foreground">
              This job posting is no longer available or doesn't exist.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md shadow-card">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <h2 className="mb-2 text-xl font-semibold text-foreground">Application Submitted!</h2>
            <p className="text-muted-foreground">
              Thank you for applying. We'll review your application and get back to you soon.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section - Job Landing */}
      <div className="bg-gradient-to-b from-primary/5 to-background py-12 md:py-20">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <Badge variant="secondary" className="mb-4">
            Now Hiring
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            {job.title}
          </h1>
          
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-muted-foreground">
            {job.department && (
              <span className="flex items-center gap-1.5">
                <Building2 className="h-4 w-4" />
                {job.department}
              </span>
            )}
            {job.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                {job.location}
              </span>
            )}
            {job.employment_type && (
              <span className="flex items-center gap-1.5">
                <Briefcase className="h-4 w-4" />
                {job.employment_type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </span>
            )}
          </div>

          <Button size="lg" className="mt-8" onClick={scrollToForm}>
            Apply Now
            <ArrowDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Job Details Section */}
      <div className="mx-auto max-w-3xl px-4 py-12">
        {(job.description || job.requirements) && (
          <div className="space-y-8 mb-12">
            {job.description && (
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-4">About the Role</h2>
                <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {job.description}
                </p>
              </div>
            )}
            
            {job.requirements && (
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-4">Requirements</h2>
                <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {job.requirements}
                </p>
              </div>
            )}
            
            <Separator />
          </div>
        )}

        {/* Application Form */}
        <div ref={formRef}>
          {showForm || !job.description ? (
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-base font-medium">Application Form</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {job.form_config.map((field) => (
                    <div key={field.id} className="space-y-2">
                      {/* Description Block - Display only */}
                      {field.type === "description_block" ? (
                        <div className="rounded-lg bg-muted/50 p-4">
                          {field.label && field.label !== "Instructions" && (
                            <h3 className="font-medium text-foreground mb-2">{field.label}</h3>
                          )}
                          {field.description && (
                            <div className="text-sm text-muted-foreground leading-relaxed">
                              {parseDescription(field.description)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <>
                          <Label htmlFor={field.id}>
                            {field.label}
                            {field.required && <span className="ml-1 text-destructive">*</span>}
                          </Label>

                          {/* Field Description */}
                          {field.description && (
                            <div className="text-sm text-muted-foreground leading-relaxed mb-2">
                              {parseDescription(field.description)}
                            </div>
                          )}

                          {field.type === "text" && (
                            <Input
                              id={field.id}
                              placeholder={field.placeholder}
                              value={(formData[field.id] as string) || ""}
                              onChange={(e) => handleInputChange(field.id, e.target.value)}
                            />
                          )}

                          {field.type === "email" && (
                            <Input
                              id={field.id}
                              type="email"
                              placeholder={field.placeholder}
                              value={(formData[field.id] as string) || ""}
                              onChange={(e) => handleInputChange(field.id, e.target.value)}
                            />
                          )}

                          {field.type === "phone" && (
                            <Input
                              id={field.id}
                              type="tel"
                              placeholder={field.placeholder}
                              value={(formData[field.id] as string) || ""}
                              onChange={(e) => handleInputChange(field.id, e.target.value)}
                            />
                          )}

                          {field.type === "number" && (
                            <Input
                              id={field.id}
                              type="number"
                              placeholder={field.placeholder}
                              value={(formData[field.id] as string) || ""}
                              onChange={(e) => handleInputChange(field.id, e.target.value)}
                            />
                          )}

                          {field.type === "url" && (
                            <Input
                              id={field.id}
                              type="url"
                              placeholder={field.placeholder || "https://"}
                              value={(formData[field.id] as string) || ""}
                              onChange={(e) => handleInputChange(field.id, e.target.value)}
                            />
                          )}

                          {field.type === "date" && (
                            <Input
                              id={field.id}
                              type="date"
                              value={(formData[field.id] as string) || ""}
                              onChange={(e) => handleInputChange(field.id, e.target.value)}
                            />
                          )}

                          {field.type === "textarea" && (
                            <div className="space-y-1">
                              <Textarea
                                id={field.id}
                                placeholder={field.placeholder}
                                value={(formData[field.id] as string) || ""}
                                onChange={(e) => handleInputChange(field.id, e.target.value)}
                                rows={4}
                                maxLength={field.maxLength}
                              />
                              {field.maxLength && (
                                <p className="text-xs text-muted-foreground">
                                  {((formData[field.id] as string) || "").length}/{field.maxLength} characters
                                </p>
                              )}
                            </div>
                          )}

                          {field.type === "select" && (
                            <Select
                              value={(formData[field.id] as string) || ""}
                              onValueChange={(value) => handleInputChange(field.id, value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select an option" />
                              </SelectTrigger>
                              <SelectContent>
                                {(field.options || []).map((option) => (
                                  <SelectItem key={option} value={option}>
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}

                          {field.type === "multiselect" && (
                            <div className="space-y-2">
                              {(field.options || []).map((option) => (
                                <div key={option} className="flex items-center gap-2">
                                  <Checkbox
                                    id={`${field.id}-${option}`}
                                    checked={((formData[field.id] as string[]) || []).includes(option)}
                                    onCheckedChange={(checked) => {
                                      const current = (formData[field.id] as string[]) || [];
                                      if (checked) {
                                        handleInputChange(field.id, [...current, option]);
                                      } else {
                                        handleInputChange(
                                          field.id,
                                          current.filter((o) => o !== option)
                                        );
                                      }
                                    }}
                                  />
                                  <Label htmlFor={`${field.id}-${option}`} className="font-normal">
                                    {option}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          )}

                          {(field.type === "file" || field.type === "video") && (
                            <div
                              className={`relative rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
                                files[field.id] ? "border-success bg-success/5" : "border-border hover:border-muted-foreground"
                              }`}
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={(e) => handleDrop(field.id, e)}
                            >
                              {files[field.id] ? (
                                <div className="flex items-center justify-center gap-3">
                                  {field.type === "video" ? (
                                    <Video className="h-5 w-5 text-success" />
                                  ) : (
                                    <FileText className="h-5 w-5 text-success" />
                                  )}
                                  <span className="text-sm text-foreground">{files[field.id]!.name}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleFileChange(field.id, null)}
                                    className="text-muted-foreground hover:text-foreground"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              ) : (
                                <label className="cursor-pointer">
                                  <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                                  <p className="mt-2 text-sm text-foreground">
                                    Drop your {field.type === "video" ? "video" : "file"} here, or click to browse
                                  </p>
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    {field.accept || (field.type === "video" ? ".mp4, .mov, .webm" : ".pdf, .doc, .docx")}
                                  </p>
                                  <input
                                    type="file"
                                    className="hidden"
                                    accept={field.accept}
                                    onChange={(e) => handleFileChange(field.id, e.target.files?.[0] || null)}
                                  />
                                </label>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Application"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center">
              <Button size="lg" onClick={scrollToForm}>
                Apply Now
                <ArrowDown className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
