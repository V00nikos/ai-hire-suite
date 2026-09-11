export interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  maxLength?: number;
  accept?: string;
  maxSize?: number;
  description?: string; // Rich text description for Google Forms-style help text
}

export type FormFieldType =
  | "text"
  | "email"
  | "phone"
  | "textarea"
  | "number"
  | "url"
  | "date"
  | "file"
  | "video"
  | "select"
  | "multiselect"
  | "description_block"; // Display-only text block

export interface Job {
  id: string;
  title: string;
  department?: string;
  description?: string;
  requirements?: string;
  form_config: FormField[];
  evaluation_rubric?: Record<string, unknown>;
  status: "draft" | "active" | "closed";
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Application {
  id: string;
  job_id: string;
  candidate_email: string;
  candidate_name: string;
  candidate_phone?: string;
  resume_url?: string;
  resume_filename?: string;
  video_url?: string;
  video_filename?: string;
  form_responses: Record<string, unknown>;
  ai_score?: number;
  ai_ranking?: number;
  ai_strengths?: string[];
  ai_weaknesses?: string[];
  ai_summary?: string;
  ai_interview_questions?: string[];
  status: "pending" | "evaluated" | "shortlisted" | "rejected";
  shortlisted: boolean;
  shortlisted_at?: string;
  submitted_at: string;
  evaluated_at?: string;
  bulk_uploaded: boolean;
}

export const FIELD_TYPES: { type: FormFieldType; label: string; icon: string }[] = [
  { type: "text", label: "Text Input", icon: "Type" },
  { type: "email", label: "Email", icon: "Mail" },
  { type: "phone", label: "Phone", icon: "Phone" },
  { type: "textarea", label: "Long Text", icon: "AlignLeft" },
  { type: "number", label: "Number", icon: "Hash" },
  { type: "url", label: "URL", icon: "Link" },
  { type: "date", label: "Date", icon: "Calendar" },
  { type: "file", label: "File Upload", icon: "Upload" },
  { type: "video", label: "Video Upload", icon: "Video" },
  { type: "select", label: "Dropdown", icon: "ChevronDown" },
  { type: "multiselect", label: "Multi-select", icon: "CheckSquare" },
  { type: "description_block", label: "Description Block", icon: "FileText" },
];
