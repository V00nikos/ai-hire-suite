import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Search, BookOpen, MessageCircle, Mail, ExternalLink } from "lucide-react";

const faqs = [
  {
    question: "How does AI evaluation work?",
    answer:
      "Our AI analyzes candidate resumes, video introductions, and form responses against your job requirements. It scores candidates on a 0-100 scale and provides detailed insights on strengths and areas to probe during interviews.",
  },
  {
    question: "How do I bulk upload candidates?",
    answer:
      "Go to Candidates → Bulk Upload. Upload a CSV file with candidate information (name, email, resume filename), then drag and drop the matching resume PDF files. The system will automatically match files by filename.",
  },
  {
    question: "Can I customize the evaluation criteria?",
    answer:
      "Yes! When creating or editing a job, you can define custom evaluation rubrics in the Job Form Builder. Specify what skills and qualifications matter most, and the AI will weight its scoring accordingly.",
  },
  {
    question: "How do I share application links?",
    answer:
      "Navigate to any job's candidate list and click 'Copy Application Link'. This generates a unique URL you can share with candidates to apply directly through your custom application form.",
  },
  {
    question: "What file formats are supported for resumes?",
    answer:
      "We support PDF files for resumes. For video introductions, we accept MP4, MOV, and WebM formats up to 100MB in size.",
  },
  {
    question: "How do I shortlist candidates?",
    answer:
      "Click the star icon on any candidate card to add them to your shortlist. You can view all shortlisted candidates from the Shortlisted page in the sidebar navigation.",
  },
];

export default function Help() {
  return (
    <DashboardLayout>
      <div className="animate-fade-in max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-display font-bold text-foreground">Help Center</h1>
          <p className="mt-1 text-muted-foreground">
            Find answers and get support
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search for help..." className="pl-10" />
        </div>

        {/* Quick Links */}
        <div className="grid gap-4 sm:grid-cols-3 mb-8">
          <Card className="shadow-card hover:shadow-card-hover transition-shadow cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm text-foreground">Documentation</p>
                <p className="text-xs text-muted-foreground">Learn the basics</p>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-card hover:shadow-card-hover transition-shadow cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm text-foreground">Live Chat</p>
                <p className="text-xs text-muted-foreground">Talk to support</p>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-card hover:shadow-card-hover transition-shadow cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm text-foreground">Email Us</p>
                <p className="text-xs text-muted-foreground">Get in touch</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FAQ */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left text-sm">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* Contact Support */}
        <Card className="shadow-card mt-6">
          <CardContent className="p-6 text-center">
            <h3 className="font-medium text-foreground mb-2">Still need help?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Our support team is available 24/7 to assist you
            </p>
            <Button>
              Contact Support
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
