// Centralized mock data store - single source of truth

export interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  status: "active" | "paused" | "closed" | "draft";
  candidates: number;
  newApplications: number;
  createdAt: string;
  deadline?: string;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone?: string;
  currentRole: string;
  experience: string;
  score: number;
  rank: number;
  hasResume: boolean;
  hasVideo: boolean;
  shortlisted: boolean;
  status: "pending" | "evaluated" | "shortlisted" | "rejected";
  strengths: string[];
  weaknesses: string[];
  appliedTo: string[]; // job IDs
  appliedAt: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
}

// Mock Jobs
export const mockJobs: Job[] = [
  {
    id: "1",
    title: "Senior Product Manager",
    department: "Product",
    location: "San Francisco, CA",
    status: "active",
    candidates: 47,
    newApplications: 12,
    createdAt: "2024-01-10",
    deadline: "2024-02-15",
  },
  {
    id: "2",
    title: "Frontend Engineer",
    department: "Engineering",
    location: "Remote",
    status: "active",
    candidates: 89,
    newApplications: 23,
    createdAt: "2024-01-05",
    deadline: "2024-02-20",
  },
  {
    id: "3",
    title: "UX Designer",
    department: "Design",
    location: "New York, NY",
    status: "active",
    candidates: 34,
    newApplications: 8,
    createdAt: "2024-01-12",
  },
  {
    id: "4",
    title: "Backend Developer",
    department: "Engineering",
    location: "Austin, TX",
    status: "paused",
    candidates: 56,
    newApplications: 0,
    createdAt: "2023-12-20",
  },
  {
    id: "5",
    title: "Marketing Manager",
    department: "Marketing",
    location: "Chicago, IL",
    status: "closed",
    candidates: 42,
    newApplications: 0,
    createdAt: "2023-11-15",
  },
];

// Mock Candidates
export const mockCandidates: Candidate[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    phone: "+1 (555) 123-4567",
    currentRole: "Senior PM @ Stripe",
    experience: "8 years",
    score: 94,
    rank: 1,
    hasResume: true,
    hasVideo: true,
    shortlisted: false,
    status: "evaluated",
    strengths: [
      "8 years PM with 3 successful 0-1 launches",
      "Led team that grew revenue $50M → $200M",
      "Strong technical: SQL, Python proficiency",
    ],
    weaknesses: [
      "Salary 13% above budget → assess flexibility",
      "Limited startup experience → probe comfort with ambiguity",
    ],
    appliedTo: ["1"],
    appliedAt: "2024-01-15",
    linkedinUrl: "https://linkedin.com/in/johndoe",
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane@example.com",
    phone: "+1 (555) 234-5678",
    currentRole: "Product Lead @ Meta",
    experience: "6 years",
    score: 91,
    rank: 2,
    hasResume: true,
    hasVideo: true,
    shortlisted: true,
    status: "shortlisted",
    strengths: [
      "Led Facebook Marketplace's search team",
      "Excellent stakeholder management skills",
      "Strong data-driven decision making",
    ],
    weaknesses: [
      "May need adjustment to smaller team dynamics",
      "Heavy focus on consumer products",
    ],
    appliedTo: ["1"],
    appliedAt: "2024-01-14",
    linkedinUrl: "https://linkedin.com/in/janesmith",
    portfolioUrl: "https://janesmith.design",
  },
  {
    id: "3",
    name: "Mike Johnson",
    email: "mike@example.com",
    currentRole: "PM @ Airbnb",
    experience: "5 years",
    score: 87,
    rank: 3,
    hasResume: true,
    hasVideo: false,
    shortlisted: false,
    status: "evaluated",
    strengths: [
      "Deep experience with marketplace dynamics",
      "Strong technical background (former SWE)",
      "Excellent communication in writing samples",
    ],
    weaknesses: [
      "No video introduction provided",
      "Shorter tenure at current role (1 year)",
    ],
    appliedTo: ["1", "2"],
    appliedAt: "2024-01-13",
  },
  {
    id: "4",
    name: "Sarah Wilson",
    email: "sarah@example.com",
    phone: "+1 (555) 345-6789",
    currentRole: "Product Manager @ Shopify",
    experience: "4 years",
    score: 82,
    rank: 4,
    hasResume: true,
    hasVideo: true,
    shortlisted: false,
    status: "evaluated",
    strengths: [
      "E-commerce domain expertise",
      "Led 3 major product launches",
    ],
    weaknesses: [
      "Less experience than other candidates",
      "B2B experience may not translate",
    ],
    appliedTo: ["1"],
    appliedAt: "2024-01-12",
  },
  {
    id: "5",
    name: "Alex Chen",
    email: "alex@example.com",
    currentRole: "Associate PM @ Google",
    experience: "3 years",
    score: 78,
    rank: 5,
    hasResume: true,
    hasVideo: true,
    shortlisted: false,
    status: "evaluated",
    strengths: [
      "Strong analytical skills",
      "Google caliber experience",
    ],
    weaknesses: [
      "Junior level experience",
      "No leadership experience yet",
    ],
    appliedTo: ["1", "2"],
    appliedAt: "2024-01-11",
  },
  {
    id: "6",
    name: "Emily Davis",
    email: "emily@example.com",
    phone: "+1 (555) 456-7890",
    currentRole: "Senior Frontend @ Netflix",
    experience: "7 years",
    score: 92,
    rank: 1,
    hasResume: true,
    hasVideo: true,
    shortlisted: true,
    status: "shortlisted",
    strengths: [
      "Built Netflix's design system from scratch",
      "Expert in React, TypeScript, accessibility",
      "Led team of 8 engineers",
    ],
    weaknesses: [
      "May be overqualified for current opening",
      "Salary expectations on higher end",
    ],
    appliedTo: ["2"],
    appliedAt: "2024-01-10",
    linkedinUrl: "https://linkedin.com/in/emilydavis",
    portfolioUrl: "https://emilydavis.dev",
  },
  {
    id: "7",
    name: "David Kim",
    email: "david@example.com",
    currentRole: "UX Lead @ Figma",
    experience: "6 years",
    score: 89,
    rank: 1,
    hasResume: true,
    hasVideo: true,
    shortlisted: true,
    status: "shortlisted",
    strengths: [
      "Award-winning portfolio",
      "Led design for Figma's collaboration features",
      "Strong user research background",
    ],
    weaknesses: [
      "Limited B2B experience",
      "Prefers remote work exclusively",
    ],
    appliedTo: ["3"],
    appliedAt: "2024-01-16",
    portfolioUrl: "https://davidkim.design",
  },
];

// Helper functions
export function getJobById(id: string): Job | undefined {
  return mockJobs.find((job) => job.id === id);
}

export function getCandidateById(id: string): Candidate | undefined {
  return mockCandidates.find((candidate) => candidate.id === id);
}

export function getCandidatesForJob(jobId: string): Candidate[] {
  return mockCandidates.filter((candidate) => candidate.appliedTo.includes(jobId));
}

export function getShortlistedCandidates(): Candidate[] {
  return mockCandidates.filter((candidate) => candidate.shortlisted);
}

export function getActiveJobs(): Job[] {
  return mockJobs.filter((job) => job.status === "active");
}

// Stats calculations
export function getDashboardStats() {
  const activeJobs = mockJobs.filter((j) => j.status === "active").length;
  const totalCandidates = mockCandidates.length;
  const shortlisted = mockCandidates.filter((c) => c.shortlisted).length;
  const avgScore = Math.round(
    mockCandidates.reduce((sum, c) => sum + c.score, 0) / mockCandidates.length
  );

  return {
    activeJobs,
    totalCandidates,
    shortlisted,
    avgScore,
  };
}
