import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ThemeProvider } from "@/components/ThemeProvider";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Jobs from "./pages/Jobs";
import JobFormBuilder from "./pages/JobFormBuilder";
import JobCandidates from "./pages/JobCandidates";
import CandidateReview from "./pages/CandidateReview";
import Candidates from "./pages/Candidates";
import CandidateProfile from "./pages/CandidateProfile";
import BulkUpload from "./pages/BulkUpload";
import Shortlisted from "./pages/Shortlisted";
import Settings from "./pages/Settings";
import Help from "./pages/Help";
import Notifications from "./pages/Notifications";
import CandidateApplicationForm from "./pages/CandidateApplicationForm";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/jobs" element={<ProtectedRoute><Jobs /></ProtectedRoute>} />
              <Route path="/jobs/new" element={<ProtectedRoute><JobFormBuilder /></ProtectedRoute>} />
              <Route path="/jobs/:jobId/edit" element={<ProtectedRoute><JobFormBuilder /></ProtectedRoute>} />
              <Route path="/jobs/:jobId/candidates" element={<ProtectedRoute><JobCandidates /></ProtectedRoute>} />
              <Route path="/jobs/:jobId/review" element={<ProtectedRoute><CandidateReview /></ProtectedRoute>} />
              <Route path="/candidates" element={<ProtectedRoute><Candidates /></ProtectedRoute>} />
              <Route path="/candidates/bulk-upload" element={<ProtectedRoute><BulkUpload /></ProtectedRoute>} />
              <Route path="/candidates/:candidateId" element={<ProtectedRoute><CandidateProfile /></ProtectedRoute>} />
              <Route path="/shortlisted" element={<ProtectedRoute><Shortlisted /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
              <Route path="/help" element={<ProtectedRoute><Help /></ProtectedRoute>} />
              <Route path="/apply/:jobId" element={<CandidateApplicationForm />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
