import type { FormField } from '@/types/form';
import type { FieldMapping, MappingSuggestion, ValidationResult } from '@/types/bulkUpload';

/**
 * Calculate match score between a CSV header and form field label
 * Returns a score from 0-100
 */
export function calculateMatchScore(csvHeader: string, formLabel: string): number {
  const normalizedCsv = csvHeader.toLowerCase().trim().replace(/[_-]/g, ' ');
  const normalizedLabel = formLabel.toLowerCase().trim().replace(/[_-]/g, ' ');

  // Exact match
  if (normalizedCsv === normalizedLabel) {
    return 100;
  }

  // Check for common field name variations
  const commonMappings: Record<string, string[]> = {
    'name': ['full name', 'candidate name', 'applicant name', 'first name', 'fullname'],
    'email': ['email address', 'e-mail', 'candidate email', 'mail'],
    'phone': ['phone number', 'telephone', 'mobile', 'cell', 'contact number'],
    'linkedin': ['linkedin url', 'linkedin profile', 'linkedin link'],
    'experience': ['years of experience', 'work experience', 'total experience', 'years exp'],
    'resume': ['resume file', 'cv', 'curriculum vitae'],
    'video': ['video file', 'intro video', 'video introduction'],
    'portfolio': ['portfolio url', 'portfolio link', 'website'],
    'cover letter': ['cover', 'letter'],
    'education': ['degree', 'qualification', 'academic'],
    'skills': ['skill set', 'technical skills', 'competencies'],
    'salary': ['expected salary', 'salary expectation', 'compensation'],
    'notice period': ['notice', 'availability'],
    'location': ['city', 'address', 'current location'],
  };

  // Check if either matches a common mapping
  for (const [key, variations] of Object.entries(commonMappings)) {
    const allVariations = [key, ...variations];
    const csvMatches = allVariations.some(v => 
      normalizedCsv === v || normalizedCsv.includes(v) || v.includes(normalizedCsv)
    );
    const labelMatches = allVariations.some(v => 
      normalizedLabel === v || normalizedLabel.includes(v) || v.includes(normalizedLabel)
    );
    
    if (csvMatches && labelMatches) {
      return 90;
    }
  }

  // Contains match (one contains the other)
  if (normalizedCsv.includes(normalizedLabel) || normalizedLabel.includes(normalizedCsv)) {
    return 80;
  }

  // Word overlap
  const csvWords = new Set(normalizedCsv.split(/\s+/));
  const labelWords = new Set(normalizedLabel.split(/\s+/));
  const intersection = [...csvWords].filter(w => labelWords.has(w));
  const union = new Set([...csvWords, ...labelWords]);
  const similarity = intersection.length / union.size;
  
  if (similarity > 0.5) {
    return Math.round(50 + similarity * 30);
  }

  // Simple Levenshtein-based similarity for short strings
  if (normalizedCsv.length < 20 && normalizedLabel.length < 20) {
    const distance = levenshteinDistance(normalizedCsv, normalizedLabel);
    const maxLen = Math.max(normalizedCsv.length, normalizedLabel.length);
    const ratio = 1 - distance / maxLen;
    if (ratio > 0.6) {
      return Math.round(40 + ratio * 30);
    }
  }

  return 0;
}

/**
 * Simple Levenshtein distance implementation
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Suggest mappings between CSV headers and form fields
 */
export function suggestMappings(
  csvHeaders: string[],
  formFields: FormField[]
): MappingSuggestion[] {
  const suggestions: MappingSuggestion[] = [];
  const usedColumns = new Set<string>();

  // Filter out description_block fields (display-only)
  const mappableFields = formFields.filter(f => f.type !== 'description_block');

  for (const field of mappableFields) {
    let bestMatch: { column: string; score: number } | null = null;

    for (const header of csvHeaders) {
      if (usedColumns.has(header)) continue;

      const score = calculateMatchScore(header, field.label);
      if (score > 0 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { column: header, score };
      }
    }

    if (bestMatch && bestMatch.score >= 50) {
      usedColumns.add(bestMatch.column);
      suggestions.push({
        formFieldId: field.id,
        suggestedCsvColumn: bestMatch.column,
        confidence: bestMatch.score,
      });
    } else {
      suggestions.push({
        formFieldId: field.id,
        suggestedCsvColumn: null,
        confidence: 0,
      });
    }
  }

  return suggestions;
}

/**
 * Create initial field mappings from form fields and CSV headers
 */
export function createInitialMappings(
  formFields: FormField[],
  csvHeaders: string[]
): FieldMapping[] {
  const suggestions = suggestMappings(csvHeaders, formFields);
  const mappableFields = formFields.filter(f => f.type !== 'description_block');

  return mappableFields.map(field => {
    const suggestion = suggestions.find(s => s.formFieldId === field.id);
    return {
      formFieldId: field.id,
      formFieldLabel: field.label,
      formFieldType: field.type,
      isRequired: field.required,
      csvColumn: suggestion?.suggestedCsvColumn || null,
      matchConfidence: suggestion?.confidence || 0,
    };
  });
}

/**
 * Validate that all required fields are mapped
 */
export function validateMappings(
  mappings: FieldMapping[]
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required fields
  const unmappedRequired = mappings.filter(m => m.isRequired && !m.csvColumn);
  if (unmappedRequired.length > 0) {
    errors.push(
      `Missing required fields: ${unmappedRequired.map(m => m.formFieldLabel).join(', ')}`
    );
  }

  // Warnings for unmapped optional fields
  const unmappedOptional = mappings.filter(m => !m.isRequired && !m.csvColumn);
  if (unmappedOptional.length > 0) {
    warnings.push(
      `${unmappedOptional.length} optional field(s) not mapped`
    );
  }

  // Check for low confidence mappings
  const lowConfidence = mappings.filter(m => m.csvColumn && m.matchConfidence < 50);
  if (lowConfidence.length > 0) {
    warnings.push(
      `${lowConfidence.length} field(s) have low-confidence mappings - please verify`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Get confidence indicator for UI display
 */
export function getConfidenceIndicator(confidence: number): {
  icon: 'exact' | 'fuzzy' | 'manual' | 'unmapped';
  color: string;
  label: string;
} {
  if (confidence >= 90) {
    return { icon: 'exact', color: 'text-success', label: 'Exact match' };
  }
  if (confidence >= 50) {
    return { icon: 'fuzzy', color: 'text-warning', label: 'Suggested match' };
  }
  if (confidence > 0) {
    return { icon: 'manual', color: 'text-muted-foreground', label: 'Manual selection' };
  }
  return { icon: 'unmapped', color: 'text-destructive', label: 'Not mapped' };
}
