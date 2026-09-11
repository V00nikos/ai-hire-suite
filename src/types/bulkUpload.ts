import type { FormFieldType } from './form';

export interface FieldMapping {
  formFieldId: string;
  formFieldLabel: string;
  formFieldType: FormFieldType;
  isRequired: boolean;
  csvColumn: string | null;
  matchConfidence: number; // 0-100
}

export interface BulkCandidate {
  rowIndex: number;
  rawData: Record<string, string>;
  name: string;
  email: string;
  phone?: string;
  resumeFile?: File;
  videoFile?: File;
}

export interface BulkUploadPayload {
  jobId: string;
  formVersionId: string;
  candidates: BulkCandidate[];
  fieldMappings: FieldMapping[];
}

export interface MappingSuggestion {
  formFieldId: string;
  suggestedCsvColumn: string | null;
  confidence: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}
