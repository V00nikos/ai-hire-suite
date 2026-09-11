import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Check, Circle, AlertTriangle, HelpCircle, X } from 'lucide-react';
import type { FieldMapping } from '@/types/bulkUpload';
import { validateMappings, getConfidenceIndicator } from '@/lib/fieldMappingUtils';

interface FieldMappingStepProps {
  fieldMappings: FieldMapping[];
  csvHeaders: string[];
  csvPreviewData: Record<string, string>[];
  onMappingChange: (fieldId: string, csvColumn: string | null) => void;
}

export function FieldMappingStep({
  fieldMappings,
  csvHeaders,
  csvPreviewData,
  onMappingChange,
}: FieldMappingStepProps) {
  const validation = useMemo(() => validateMappings(fieldMappings), [fieldMappings]);

  // Get preview value for a mapping from first row
  const getPreviewValue = (csvColumn: string | null): string => {
    if (!csvColumn || csvPreviewData.length === 0) return '—';
    return csvPreviewData[0][csvColumn] || '—';
  };

  // Get used columns to prevent double-mapping
  const usedColumns = useMemo(() => {
    return new Set(fieldMappings.filter(m => m.csvColumn).map(m => m.csvColumn));
  }, [fieldMappings]);

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-2 md:pb-3 p-4 md:p-6">
        <CardTitle className="text-sm font-medium">Step 3: Map CSV Columns to Form Fields</CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          Match your CSV columns to the job application form fields. Auto-suggestions are provided where possible.
        </p>
      </CardHeader>
      <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
        {/* Validation Errors */}
        {!validation.isValid && (
          <Alert variant="destructive" className="mb-4">
            <X className="h-4 w-4" />
            <AlertDescription>
              {validation.errors.map((err, i) => (
                <div key={i}>{err}</div>
              ))}
            </AlertDescription>
          </Alert>
        )}

        {/* Validation Warnings */}
        {validation.warnings.length > 0 && (
          <Alert className="mb-4 border-warning/50 bg-warning/10">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <AlertDescription className="text-warning">
              {validation.warnings.map((warn, i) => (
                <div key={i}>{warn}</div>
              ))}
            </AlertDescription>
          </Alert>
        )}

        {/* Mapping Table */}
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[30%]">Form Field</TableHead>
                <TableHead className="w-[35%]">CSV Column</TableHead>
                <TableHead className="w-[15%]">Match</TableHead>
                <TableHead className="w-[20%]">Preview</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fieldMappings.map((mapping) => {
                const indicator = getConfidenceIndicator(mapping.matchConfidence);
                return (
                  <TableRow key={mapping.formFieldId}>
                    {/* Form Field */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{mapping.formFieldLabel}</span>
                        {mapping.isRequired && (
                          <Badge variant="outline" className="text-[10px] px-1 py-0 border-destructive text-destructive">
                            Required
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground capitalize">
                        {mapping.formFieldType.replace('_', ' ')}
                      </span>
                    </TableCell>

                    {/* CSV Column Dropdown */}
                    <TableCell>
                      <Select
                        value={mapping.csvColumn || 'none'}
                        onValueChange={(value) => 
                          onMappingChange(mapping.formFieldId, value === 'none' ? null : value)
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select column..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">
                            <span className="text-muted-foreground">-- Not mapped --</span>
                          </SelectItem>
                          {csvHeaders.map((header) => {
                            const isUsed = usedColumns.has(header) && mapping.csvColumn !== header;
                            return (
                              <SelectItem 
                                key={header} 
                                value={header}
                                disabled={isUsed}
                              >
                                {header}
                                {isUsed && <span className="text-muted-foreground ml-2">(used)</span>}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </TableCell>

                    {/* Match Confidence */}
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {indicator.icon === 'exact' && (
                          <Check className={`h-4 w-4 ${indicator.color}`} />
                        )}
                        {indicator.icon === 'fuzzy' && (
                          <HelpCircle className={`h-4 w-4 ${indicator.color}`} />
                        )}
                        {indicator.icon === 'manual' && (
                          <Circle className={`h-4 w-4 ${indicator.color}`} />
                        )}
                        {indicator.icon === 'unmapped' && (
                          <X className={`h-4 w-4 ${indicator.color}`} />
                        )}
                        <span className={`text-xs ${indicator.color}`}>
                          {mapping.csvColumn ? `${mapping.matchConfidence}%` : '—'}
                        </span>
                      </div>
                    </TableCell>

                    {/* Preview Value */}
                    <TableCell>
                      <span className="text-sm text-muted-foreground truncate block max-w-[150px]">
                        {getPreviewValue(mapping.csvColumn)}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Check className="h-3 w-3 text-success" />
            <span>Exact match</span>
          </div>
          <div className="flex items-center gap-1">
            <HelpCircle className="h-3 w-3 text-warning" />
            <span>Suggested match</span>
          </div>
          <div className="flex items-center gap-1">
            <Circle className="h-3 w-3 text-muted-foreground" />
            <span>Manual selection</span>
          </div>
          <div className="flex items-center gap-1">
            <X className="h-3 w-3 text-destructive" />
            <span>Not mapped</span>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <div className="flex flex-wrap gap-4 text-sm">
            <span>
              <strong>{fieldMappings.filter(m => m.csvColumn).length}</strong> of{' '}
              <strong>{fieldMappings.length}</strong> fields mapped
            </span>
            <span className="text-muted-foreground">|</span>
            <span>
              <strong>{fieldMappings.filter(m => m.isRequired && m.csvColumn).length}</strong> of{' '}
              <strong>{fieldMappings.filter(m => m.isRequired).length}</strong> required fields mapped
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
