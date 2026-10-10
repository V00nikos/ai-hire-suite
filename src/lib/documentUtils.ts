// Document utility functions for URL handling and detection

export type LinkType = 'linkedin' | 'drive' | 'loom' | 'video' | 'url' | 'text';

export interface DetectedLink {
  type: LinkType;
  url: string;
  label: string;
}

/**
 * Detect the type of URL and return appropriate metadata
 */
export function detectLinkType(value: string): DetectedLink | null {
  if (!value || typeof value !== 'string') return null;
  
  const trimmed = value.trim();
  
  // Check if it's a URL
  if (!trimmed.match(/^https?:\/\//i)) return null;
  
  // LinkedIn
  if (trimmed.includes('linkedin.com')) {
    return { type: 'linkedin', url: trimmed, label: 'LinkedIn Profile' };
  }
  
  // Google Drive
  if (trimmed.includes('drive.google.com') || trimmed.includes('docs.google.com')) {
    return { type: 'drive', url: trimmed, label: 'Google Drive' };
  }
  
  // Loom
  if (trimmed.includes('loom.com')) {
    return { type: 'loom', url: trimmed, label: 'Loom Video' };
  }
  
  // YouTube
  if (trimmed.includes('youtube.com') || trimmed.includes('youtu.be')) {
    return { type: 'video', url: trimmed, label: 'YouTube Video' };
  }
  
  // Vimeo
  if (trimmed.includes('vimeo.com')) {
    return { type: 'video', url: trimmed, label: 'Vimeo Video' };
  }
  
  // Generic URL
  return { type: 'url', url: trimmed, label: 'External Link' };
}

/**
 * Convert Google Drive URL to embeddable preview URL
 */
export function convertToEmbedUrl(url: string): string | null {
  if (!url) return null;
  
  // Handle drive.google.com/open?id=XXX
  const openIdMatch = url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
  if (openIdMatch) {
    return `https://drive.google.com/file/d/${openIdMatch[1]}/preview`;
  }
  
  // Handle drive.google.com/file/d/XXX/view
  const fileIdMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileIdMatch) {
    return `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`;
  }
  
  // Handle docs.google.com/document/d/XXX
  const docsMatch = url.match(/docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/);
  if (docsMatch) {
    return `https://docs.google.com/document/d/${docsMatch[1]}/preview`;
  }
  
  return null;
}

/**
 * Check if URL is embeddable (Google Drive, etc.)
 */
export function isEmbeddable(url: string): boolean {
  if (!url) return false;
  return url.includes('drive.google.com') || url.includes('docs.google.com');
}

/**
 * Extract key fields from form responses for Quick Facts display
 */
export interface QuickFact {
  label: string;
  value: string;
  type: 'text' | 'url' | 'currency';
  icon?: string;
}

const QUICK_FACT_FIELDS = [
  { patterns: ['experience', 'years of experience', 'total experience'], label: 'Experience', type: 'text' as const },
  { patterns: ['expected ctc', 'expected salary', 'expected'], label: 'Expected CTC', type: 'currency' as const },
  { patterns: ['ctc', 'current ctc', 'current salary', 'salary'], label: 'Current CTC', type: 'currency' as const },
  { patterns: ['notice period', 'notice'], label: 'Notice Period', type: 'text' as const },
  { patterns: ['location', 'city', 'current location'], label: 'Location', type: 'text' as const },
  { patterns: ['linkedin', 'linkedin url', 'linkedin profile'], label: 'LinkedIn', type: 'url' as const },
  { patterns: ['resume', 'resume url', 'cv', 'cv url'], label: 'Resume', type: 'url' as const },
  { patterns: ['portfolio', 'portfolio url'], label: 'Portfolio', type: 'url' as const },
];

export function extractQuickFacts(formResponses: any[]): QuickFact[] {
  if (!formResponses || !Array.isArray(formResponses)) return [];
  
  const facts: QuickFact[] = [];
  
  for (const response of formResponses) {
    const label = (response.field_label || '').toLowerCase();
    const value = response.response_value;
    
    if (!value || value === '' || value === null) continue;
    
    for (const field of QUICK_FACT_FIELDS) {
      if (field.patterns.some(p => label.includes(p))) {
        const stringValue = typeof value === 'string' ? value : String(value);
        
        // Skip if already added
        if (!facts.find(f => f.label === field.label)) {
          facts.push({
            label: field.label,
            value: stringValue,
            type: field.type,
          });
        }
        break;
      }
    }
  }
  
  return facts;
}
