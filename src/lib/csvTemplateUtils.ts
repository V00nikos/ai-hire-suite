import type { FormField } from '@/types/form';

/**
 * Generate a CSV template based on form fields
 * Includes standard candidate columns + all form field labels
 */
export function generateCsvTemplate(formFields: FormField[]): string {
  // Standard columns always included
  const standardColumns = ['candidate_name', 'candidate_email', 'candidate_phone'];
  
  // Form field columns (excluding description_block)
  const formColumns = formFields
    .filter(f => f.type !== 'description_block')
    .map(f => f.label);
  
  // File reference columns (for matching uploaded files)
  const fileColumns = ['resume_filename'];
  
  // Combine all columns
  const allColumns = [...standardColumns, ...formColumns, ...fileColumns];
  
  // Create header row
  const headerRow = allColumns.map(col => `"${col}"`).join(',');
  
  // Create example row
  const exampleRow = allColumns.map(col => {
    if (col === 'candidate_name') return '"John Doe"';
    if (col === 'candidate_email') return '"john@example.com"';
    if (col === 'candidate_phone') return '"+1234567890"';
    if (col === 'resume_filename') return '"john_doe_resume.pdf"';
    // For form fields, provide placeholder based on column name
    return '""';
  }).join(',');
  
  return `${headerRow}\n${exampleRow}`;
}

/**
 * Download CSV template as a file
 */
export function downloadCsvTemplate(formFields: FormField[], jobTitle: string): void {
  const csv = generateCsvTemplate(formFields);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${jobTitle.toLowerCase().replace(/\s+/g, '_')}_candidates_template.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Get column descriptions for help text
 */
export function getTemplateColumnDescriptions(formFields: FormField[]): Array<{
  column: string;
  description: string;
  required: boolean;
}> {
  const descriptions: Array<{ column: string; description: string; required: boolean }> = [
    { column: 'candidate_name', description: 'Full name of the candidate', required: true },
    { column: 'candidate_email', description: 'Email address (used for deduplication)', required: true },
    { column: 'candidate_phone', description: 'Phone number', required: false },
  ];
  
  // Add form field descriptions
  formFields
    .filter(f => f.type !== 'description_block')
    .forEach(field => {
      descriptions.push({
        column: field.label,
        description: field.description || `${field.type} field`,
        required: field.required,
      });
    });
  
  descriptions.push({
    column: 'resume_filename',
    description: 'Filename of resume PDF to match during upload',
    required: false,
  });
  
  return descriptions;
}
