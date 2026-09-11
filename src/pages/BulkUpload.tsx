import { useState, useCallback, useEffect, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Papa from "papaparse";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Upload, 
  FileText, 
  Check, 
  X, 
  Loader2, 
  ArrowLeft, 
  ArrowRight,
  ChevronRight,
  AlertCircle,
  Download
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useJobs } from "@/hooks/useJobs";
import { useBulkUpload } from "@/hooks/useApplications";
import { useJobFormFieldsForMapping } from "@/hooks/useJobFormFieldsForMapping";
import { FieldMappingStep } from "@/components/bulk-upload/FieldMappingStep";
import { createInitialMappings, validateMappings } from "@/lib/fieldMappingUtils";
import { downloadCsvTemplate } from "@/lib/csvTemplateUtils";
import type { FieldMapping, BulkCandidate } from "@/types/bulkUpload";

interface ParsedCsvRow {
  [key: string]: string;
}

export default function BulkUpload() {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const preselectedJobId = searchParams.get("jobId");
  
  const { data: jobs = [], isLoading: isLoadingJobs } = useJobs();
  const bulkUpload = useBulkUpload();
  
  // Step state: 1=Select Job, 2=Upload CSV, 3=Field Mapping, 4=Upload Files, 5=Processing
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  
  // CSV state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<ParsedCsvRow[]>([]);
  
  // Field mapping state
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
  
  // File upload state
  const [resumeFiles, setResumeFiles] = useState<File[]>([]);
  const [isUploaded, setIsUploaded] = useState(false);

  // Fetch form fields for the selected job
  const { data: formFieldsData, isLoading: isLoadingFormFields } = useJobFormFieldsForMapping(selectedJobId);

  const activeJobs = jobs.filter((j) => j.status === 'active' || j.status === 'draft');
  const selectedJob = jobs.find((j) => j.id === selectedJobId);

  // Pre-select job from query params
  useEffect(() => {
    if (preselectedJobId && jobs.length > 0) {
      const jobExists = jobs.some((j) => j.id === preselectedJobId);
      if (jobExists) {
        setSelectedJobId(preselectedJobId);
      }
    }
  }, [preselectedJobId, jobs]);

  // Initialize field mappings when form fields are loaded and CSV is parsed
  useEffect(() => {
    if (formFieldsData?.fields && csvHeaders.length > 0 && fieldMappings.length === 0) {
      const initialMappings = createInitialMappings(formFieldsData.fields, csvHeaders);
      setFieldMappings(initialMappings);
    }
  }, [formFieldsData, csvHeaders, fieldMappings.length]);

  // Validation
  const validation = useMemo(() => validateMappings(fieldMappings), [fieldMappings]);

  // Step navigation
  const canProceedToStep2 = !!selectedJobId;
  const canProceedToStep3 = csvFile && csvHeaders.length > 0 && formFieldsData?.fields;
  const canProceedToStep4 = validation.isValid;
  const canProcess = canProceedToStep4 && csvData.length > 0;

  const handleCsvUpload = useCallback((file: File) => {
    setCsvFile(file);
    Papa.parse<ParsedCsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields || [];
        setCsvHeaders(headers);
        setCsvData(results.data);
        
        // Reset field mappings to trigger re-initialization
        setFieldMappings([]);
        
        toast({ title: "CSV Parsed", description: `Found ${results.data.length} rows with ${headers.length} columns` });
        
        // Auto-advance to step 3 if form fields are loaded
        if (formFieldsData?.fields) {
          setCurrentStep(3);
        }
      },
      error: (error) => {
        toast({ title: "Error parsing CSV", description: error.message, variant: "destructive" });
      },
    });
  }, [toast, formFieldsData]);

  const handleMappingChange = useCallback((fieldId: string, csvColumn: string | null) => {
    setFieldMappings(prev => prev.map(m => 
      m.formFieldId === fieldId 
        ? { ...m, csvColumn, matchConfidence: csvColumn ? 100 : 0 }
        : m
    ));
  }, []);

  const handleResumeFilesUpload = useCallback((files: FileList) => {
    const fileArray = Array.from(files);
    setResumeFiles(fileArray);
    toast({ title: "Files Uploaded", description: `${fileArray.length} files ready` });
  }, [toast]);

  const handleDrop = useCallback((type: "csv" | "resume", e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (type === "csv" && files[0]) handleCsvUpload(files[0]);
    else if (type === "resume") handleResumeFilesUpload(files);
  }, [handleCsvUpload, handleResumeFilesUpload]);

  // Find the name/email mapping for candidate matching
  const getFieldValue = (row: ParsedCsvRow, fieldLabel: string): string => {
    const mapping = fieldMappings.find(m => 
      m.formFieldLabel.toLowerCase().includes(fieldLabel.toLowerCase())
    );
    if (mapping?.csvColumn) {
      return row[mapping.csvColumn] || '';
    }
    // Fallback to common column names
    const commonKeys = Object.keys(row).filter(k => 
      k.toLowerCase().includes(fieldLabel.toLowerCase())
    );
    if (commonKeys.length > 0) {
      return row[commonKeys[0]] || '';
    }
    return '';
  };

  // Match resume files to candidates
  const matchResumeToCandidate = (candidateName: string, candidateEmail: string): File | undefined => {
    const normalizedName = candidateName.toLowerCase().replace(/\s+/g, '');
    const normalizedEmail = candidateEmail.toLowerCase().split('@')[0];
    
    return resumeFiles.find(file => {
      const fileName = file.name.toLowerCase().replace(/\.[^/.]+$/, '').replace(/[_-]/g, '');
      return fileName.includes(normalizedName) || fileName.includes(normalizedEmail);
    });
  };

  const handleProcess = async () => {
    if (!selectedJobId || !formFieldsData?.formVersionId) {
      toast({ title: "Missing job or form information", variant: "destructive" });
      return;
    }

    // Build candidates array with mapped data
    const candidates: BulkCandidate[] = csvData.map((row, index) => {
      const name = getFieldValue(row, 'name') || getFieldValue(row, 'full name') || row['candidate_name'] || row['name'] || 'Unknown';
      const email = getFieldValue(row, 'email') || row['candidate_email'] || row['email'] || '';
      const phone = getFieldValue(row, 'phone') || row['candidate_phone'] || row['phone'];
      
      const resumeFile = matchResumeToCandidate(name, email);

      return {
        rowIndex: index,
        rawData: row,
        name,
        email,
        phone,
        resumeFile,
      };
    });

    // Filter out candidates without email
    const validCandidates = candidates.filter(c => c.email);
    
    if (validCandidates.length === 0) {
      toast({ 
        title: "No valid candidates", 
        description: "All candidates are missing email addresses",
        variant: "destructive" 
      });
      return;
    }

    if (validCandidates.length < candidates.length) {
      toast({
        title: "Some candidates skipped",
        description: `${candidates.length - validCandidates.length} candidates without email will be skipped`,
      });
    }

    setCurrentStep(5); // Show processing state

    bulkUpload.mutate(
      { 
        jobId: selectedJobId, 
        formVersionId: formFieldsData.formVersionId,
        candidates: validCandidates,
        fieldMappings 
      },
      { 
        onSuccess: () => setIsUploaded(true),
        onError: () => setCurrentStep(4) // Go back to review step on error
      }
    );
  };

  // Step indicator
  const steps = [
    { num: 1, label: "Select Job" },
    { num: 2, label: "Upload CSV" },
    { num: 3, label: "Map Fields" },
    { num: 4, label: "Review & Upload" },
  ];

  return (
    <DashboardLayout>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          {preselectedJobId && selectedJob && (
            <Link 
              to={`/jobs/${preselectedJobId}/edit`}
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to {selectedJob.title}
            </Link>
          )}
          <h1 className="text-xl md:text-2xl font-semibold text-foreground">
            Bulk Upload Candidates
            {selectedJob && <span className="text-muted-foreground font-normal"> — {selectedJob.title}</span>}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload a CSV with candidate data and map columns to form fields
          </p>
        </div>

        {/* Step Indicator */}
        <div className="mb-6">
          <div className="flex items-center gap-2">
            {steps.map((step, i) => (
              <div key={step.num} className="flex items-center">
                <div 
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors ${
                    currentStep === step.num 
                      ? 'bg-primary text-primary-foreground' 
                      : currentStep > step.num
                        ? 'bg-success/10 text-success'
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {currentStep > step.num ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <span className="font-medium">{step.num}</span>
                  )}
                  <span className="hidden sm:inline">{step.label}</span>
                </div>
                {i < steps.length - 1 && (
                  <ChevronRight className="h-4 w-4 text-muted-foreground mx-1" />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4 md:space-y-6">
          {/* Step 1: Select Job */}
          {currentStep >= 1 && (
            <Card className={`shadow-card ${currentStep > 1 ? 'opacity-60' : ''}`}>
              <CardHeader className="pb-2 md:pb-3 p-4 md:p-6">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  {currentStep > 1 && <Check className="h-4 w-4 text-success" />}
                  Step 1: Select Job
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
                {preselectedJobId && selectedJob ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{selectedJob.title}</Badge>
                    <span className="text-sm text-muted-foreground">(Pre-selected)</span>
                  </div>
                ) : (
                  <Select 
                    value={selectedJobId} 
                    onValueChange={(value) => {
                      setSelectedJobId(value);
                      // Reset mappings when job changes
                      setFieldMappings([]);
                    }}
                    disabled={currentStep > 1}
                  >
                    <SelectTrigger className="w-full md:max-w-md">
                      <SelectValue placeholder={isLoadingJobs ? "Loading jobs..." : "Choose a job"} />
                    </SelectTrigger>
                    <SelectContent>
                      {activeJobs.map((job) => (
                        <SelectItem key={job.id} value={job.id}>{job.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {currentStep === 1 && canProceedToStep2 && (
                  <Button 
                    className="mt-4" 
                    size="sm"
                    onClick={() => setCurrentStep(2)}
                  >
                    Continue <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 2: Upload CSV */}
          {currentStep >= 2 && (
            <Card className={`shadow-card ${currentStep > 2 ? 'opacity-60' : ''}`}>
              <CardHeader className="pb-2 md:pb-3 p-4 md:p-6">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  {currentStep > 2 && <Check className="h-4 w-4 text-success" />}
                  Step 2: Upload CSV
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
                {/* Download Template Button */}
                {formFieldsData?.fields && formFieldsData.fields.length > 0 && (
                  <div className="mb-4 p-3 bg-muted/50 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">Need a template?</p>
                      <p className="text-xs text-muted-foreground">
                        Download a CSV with all the form field columns pre-configured
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadCsvTemplate(formFieldsData.fields, selectedJob?.title || 'candidates')}
                    >
                      <Download className="mr-1 h-4 w-4" />
                      Download Template
                    </Button>
                  </div>
                )}

                <div
                  className={`rounded-lg border-2 border-dashed p-6 text-center ${
                    csvFile ? "border-success bg-success/5" : "border-border"
                  }`}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop("csv", e)}
                >
                  {csvFile ? (
                    <div className="flex items-center justify-center gap-3">
                      <FileText className="h-5 w-5 text-success" />
                      <span className="text-sm">{csvFile.name}</span>
                      <Badge variant="outline">{csvData.length} rows</Badge>
                      <Badge variant="outline">{csvHeaders.length} columns</Badge>
                    </div>
                  ) : (
                    <>
                      <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        Drag & drop CSV or{" "}
                        <label className="cursor-pointer underline">
                          browse
                          <input 
                            type="file" 
                            className="hidden" 
                            accept=".csv" 
                            onChange={(e) => e.target.files?.[0] && handleCsvUpload(e.target.files[0])} 
                          />
                        </label>
                      </p>
                    </>
                  )}
                </div>
                
                {/* Loading form fields */}
                {currentStep === 2 && isLoadingFormFields && (
                  <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading form fields...
                  </div>
                )}

                {/* No form fields warning */}
                {currentStep === 2 && !isLoadingFormFields && !formFieldsData?.fields?.length && selectedJobId && (
                  <div className="mt-4 flex items-center gap-2 text-sm text-warning">
                    <AlertCircle className="h-4 w-4" />
                    This job has no form fields configured. Create a form first.
                  </div>
                )}

                {currentStep === 2 && canProceedToStep3 && (
                  <Button 
                    className="mt-4" 
                    size="sm"
                    onClick={() => setCurrentStep(3)}
                  >
                    Continue to Field Mapping <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 3: Field Mapping */}
          {currentStep >= 3 && formFieldsData?.fields && (
            <div className={currentStep > 3 ? 'opacity-60' : ''}>
              <FieldMappingStep
                fieldMappings={fieldMappings}
                csvHeaders={csvHeaders}
                csvPreviewData={csvData.slice(0, 3)}
                onMappingChange={handleMappingChange}
              />
              {currentStep === 3 && (
                <div className="flex gap-2 mt-4">
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentStep(2)}
                  >
                    <ArrowLeft className="mr-1 h-4 w-4" /> Back
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => setCurrentStep(4)}
                    disabled={!canProceedToStep4}
                  >
                    Continue <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Upload Files & Review */}
          {currentStep >= 4 && (
            <>
              <Card className="shadow-card">
                <CardHeader className="pb-2 md:pb-3 p-4 md:p-6">
                  <CardTitle className="text-sm font-medium">Step 4: Upload Resumes (Optional)</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
                  <div
                    className={`rounded-lg border-2 border-dashed p-6 text-center ${
                      resumeFiles.length > 0 ? "border-success bg-success/5" : "border-border"
                    }`}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDrop("resume", e)}
                  >
                    {resumeFiles.length > 0 ? (
                      <div className="flex items-center justify-center gap-3">
                        <FileText className="h-5 w-5 text-success" />
                        <span className="text-sm">{resumeFiles.length} files uploaded</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">
                          Drag & drop PDFs or{" "}
                          <label className="cursor-pointer underline">
                            browse
                            <input 
                              type="file" 
                              className="hidden" 
                              accept=".pdf" 
                              multiple 
                              onChange={(e) => e.target.files && handleResumeFilesUpload(e.target.files)} 
                            />
                          </label>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Files will be matched by candidate name or email
                        </p>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Preview Table */}
              <Card className="shadow-card">
                <CardHeader className="pb-2 p-4 md:p-6">
                  <CardTitle className="text-sm font-medium">
                    Preview ({Math.min(csvData.length, 10)} of {csvData.length} candidates)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 md:p-6 md:pt-0 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Resume</TableHead>
                        <TableHead>Mapped Fields</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {csvData.slice(0, 10).map((row, i) => {
                        const name = getFieldValue(row, 'name') || getFieldValue(row, 'full name') || row['candidate_name'] || row['name'] || 'Unknown';
                        const email = getFieldValue(row, 'email') || row['candidate_email'] || row['email'] || '';
                        const phone = getFieldValue(row, 'phone') || row['candidate_phone'] || row['phone'] || '';
                        const hasResume = !!matchResumeToCandidate(name, email);
                        const mappedCount = fieldMappings.filter(m => m.csvColumn && row[m.csvColumn]).length;
                        
                        return (
                          <TableRow key={i}>
                            <TableCell className="font-medium">{name}</TableCell>
                            <TableCell>{email || <span className="text-destructive">Missing</span>}</TableCell>
                            <TableCell>{phone || '—'}</TableCell>
                            <TableCell>
                              {hasResume ? (
                                <Check className="h-4 w-4 text-success" />
                              ) : (
                                <X className="h-4 w-4 text-muted-foreground" />
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{mappedCount}/{fieldMappings.length}</Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end pb-4">
                <Button 
                  variant="outline"
                  onClick={() => setCurrentStep(3)}
                  disabled={bulkUpload.isPending}
                >
                  <ArrowLeft className="mr-1 h-4 w-4" /> Back
                </Button>
                <Button 
                  onClick={handleProcess} 
                  disabled={!canProcess || bulkUpload.isPending || isUploaded}
                >
                  {bulkUpload.isPending ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</>
                  ) : isUploaded ? (
                    <><Check className="mr-2 h-4 w-4" />Uploaded</>
                  ) : (
                    <>Process & Upload ({csvData.filter(row => {
                      const email = getFieldValue(row, 'email') || row['candidate_email'] || row['email'] || '';
                      return !!email;
                    }).length} candidates)</>
                  )}
                </Button>
              </div>
            </>
          )}

          {/* Step 5: Processing */}
          {currentStep === 5 && bulkUpload.isPending && (
            <Card className="shadow-card">
              <CardContent className="p-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                <p className="mt-4 text-sm text-muted-foreground">
                  Processing {csvData.length} candidates...
                </p>
                <Progress value={33} className="mt-4 max-w-xs mx-auto" />
              </CardContent>
            </Card>
          )}

          {/* Success State */}
          {isUploaded && (
            <Card className="shadow-card border-success">
              <CardContent className="p-8 text-center">
                <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center mx-auto">
                  <Check className="h-6 w-6 text-success" />
                </div>
                <h3 className="mt-4 font-semibold text-foreground">Upload Complete!</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  All candidates have been uploaded with their form responses.
                </p>
                <div className="flex gap-2 justify-center mt-4">
                  <Button variant="outline" asChild>
                    <Link to={`/jobs/${selectedJobId}/candidates`}>
                      View Candidates
                    </Link>
                  </Button>
                  <Button asChild>
                    <Link to="/jobs">
                      Back to Jobs
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
