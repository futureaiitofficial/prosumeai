// Job application status enum - matches values in PostgreSQL enum
export enum JobApplicationStatus {
  Applied = 'applied',
  Screening = 'screening',
  Interview = 'interview',
  Assessment = 'assessment',
  Offer = 'offer',
  Rejected = 'rejected',
  Accepted = 'accepted'
}

// Status colors associated with each status
export const statusColors: Record<string, string> = {
  [JobApplicationStatus.Applied]: "blue",
  [JobApplicationStatus.Screening]: "purple",
  [JobApplicationStatus.Interview]: "cyan",
  [JobApplicationStatus.Assessment]: "green",
  [JobApplicationStatus.Offer]: "orange",
  [JobApplicationStatus.Rejected]: "red",
  [JobApplicationStatus.Accepted]: "emerald",
  'default': "gray"
};

// Interface for status history entries
export interface StatusHistoryEntry {
  id: string;
  status: string;
  date: string;
  notes: string | null;
}

// Job application interface
export interface JobApplication {
  id: number;
  userId: number;
  company: string;
  jobTitle: string;
  jobDescription?: string;
  location?: string;
  workType?: string;
  salary?: string;
  jobUrl?: string;
  status: JobApplicationStatus;
  statusHistory?: StatusHistoryEntry[];
  appliedAt: string;
  resumeId?: number;
  coverLetterId?: number;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  notes?: string;
  priority?: string;
  deadlineDate?: string;
  updatedAt: string;
  interviewDate?: string;
  interviewType?: string;
  interviewNotes?: string;
}

// Form data interface for job applications
export interface JobApplicationFormData {
  company: string;
  jobTitle: string;
  jobDescription?: string;
  location?: string;
  workType?: string;
  salary?: string;
  jobUrl?: string;
  status: JobApplicationStatus;
  statusNotes?: string;
  resumeId?: string;
  coverLetterId?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  notes?: string;
  priority?: string;
  deadlineDate?: Date | string | null;
  interviewDate?: Date | string | null;
  interviewType?: string;
  interviewNotes?: string;
} 