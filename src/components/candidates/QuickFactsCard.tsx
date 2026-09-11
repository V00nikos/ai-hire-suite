import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Briefcase,
  MapPin,
  Clock,
  DollarSign,
  Linkedin,
  FileText,
  Globe,
  ExternalLink,
} from "lucide-react";
import { QuickFact, detectLinkType } from "@/lib/documentUtils";

interface QuickFactsCardProps {
  facts: QuickFact[];
  className?: string;
}

const iconMap: Record<string, React.ElementType> = {
  'Experience': Briefcase,
  'Location': MapPin,
  'Notice Period': Clock,
  'Current CTC': DollarSign,
  'Expected CTC': DollarSign,
  'LinkedIn': Linkedin,
  'Resume': FileText,
  'Portfolio': Globe,
};

export function QuickFactsCard({ facts, className = "" }: QuickFactsCardProps) {
  if (facts.length === 0) return null;

  return (
    <Card className={`glass-card ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Briefcase className="h-4 w-4" />
          Quick Facts
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {facts.map((fact, index) => {
            const Icon = iconMap[fact.label] || Briefcase;
            const link = fact.type === 'url' ? detectLinkType(fact.value) : null;
            
            return (
              <div key={index} className="flex items-start gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">{fact.label}</p>
                  {link ? (
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-primary hover:underline flex items-center gap-1 truncate"
                    >
                      View
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  ) : (
                    <p className="text-sm font-medium text-foreground truncate" title={fact.value}>
                      {fact.type === 'currency' && !fact.value.includes('₹') && !fact.value.includes('$') ? `₹${fact.value}` : fact.value}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
