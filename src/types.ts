export type RoleType = "recruiter" | "pm" | "admin";

export interface TeamMember {
  id: string;
  name: string;
  role: RoleType;
  team: string; // "Team X (Recruitment)" or "Project Management"
  avatar: string;
  email: string;
  phone: string;
}

export interface ClientCompany {
  id: string;
  name: string;
  industry: string;
  assignedPmId: string; // The PM managing this client
  assignedRecruiterIds?: string[]; // Team X recruiters assigned to this client
  contactPerson: string;
  contactEmail: string;
  contactPhone?: string;
  activeRoles: string[];
  notes?: string;
}

export interface UploadedCvFile {
  fileName: string;
  fileSize: string;
  fileType: string;
  uploadedAt: string;
  fileDataUrl?: string;
}

export type CandidateStage =
  | "cv_screening" // Recruiter talking to candidate, getting availability, revising CV
  | "submitted_to_pm" // Handed off to PM
  | "forwarded_to_client" // PM sent to client, waiting for client review
  | "date_negotiation" // Date proposed, loop in progress
  | "interview_scheduled" // Date confirmed & locked
  | "post_interview_debrief" // Interview completed, collecting feedback
  | "offer_stage" // Offer discussion
  | "placed" // Successfully placed
  | "rejected"; // Closed / Rejected

export type ActionOwner = "recruiter" | "pm" | "none";

export interface DateOption {
  id: string;
  dateStr: string; // e.g. "Tuesday, Oct 14 at 10:00 AM"
  proposedBy: "candidate" | "client";
  status: "pending" | "accepted" | "declined";
  createdAt: string;
}

export interface ScheduledInterview {
  confirmedDate: string;
  interviewType: "In-Person / Office" | "Phone Call";
  locationOrContact?: string;
  interviewerNames: string;
  prepNotes?: string;
  scheduledAt: string;
}

export interface InterviewRoundRecord {
  id: string;
  roundNumber: number;
  roundName: string; // e.g. "Round 1 - Technical", "Round 2 - Managerial"
  interviewDate: string;
  interviewMode: "In-Person / Office" | "Phone Call";
  locationOrContact?: string;
  interviewerNames: string;
  status: "scheduled" | "completed" | "cancelled";
  interviewHappenedAt?: string;
  completedAt?: string;
  feedback?: string;
  rating?: number; // 1-10
  verdict?: "proceed" | "hold" | "reject" | "pending";
  notes?: string;
  createdAt: string;
}

export interface PlacementDetails {
  placedDate: string;
  joiningDate?: string;
  offeredCtc?: string;
  billingRateOrFee?: string;
  notes?: string;
  recordedBy?: string;
}

export interface InterviewDebrief {
  candidateFeedback?: {
    overallImpression: string; // e.g. "Loved the culture, technical challenge was fair"
    sentiment: "positive" | "neutral" | "negative";
    interestLevel: number; // 1-10
    salaryExpectationConfirmed: boolean;
    loggedAt: string;
  };
  clientFeedback?: {
    technicalRating: number; // 1-10
    cultureFitRating: number; // 1-10
    verdict: "proceed" | "hold" | "reject";
    notes: string;
    loggedAt: string;
  };
  aiAnalysis?: {
    alignmentScore: number;
    alignmentVerdict: string;
    candidateSentiment: string;
    clientSentiment: string;
    potentialGaps: string;
    recommendedAction: string;
    analyzedAt: string;
  };
}

export interface ThreadMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: RoleType;
  timestamp: string;
  text: string;
  isSystemEvent?: boolean;
  actionRequiredFrom?: ActionOwner;
}

export interface DirectChatMessage {
  id: string;
  candidateId?: string; // Optional: associated candidate ID if tied to candidate pipeline
  candidateName?: string;
  candidateStage?: CandidateStage;
  senderId: string;
  senderName: string;
  senderRole: RoleType;
  recipientId: string; // Recipient recruiter / PM / Owner
  recipientName: string;
  recipientRole: RoleType;
  text: string;
  isUrgentNudge?: boolean; // PM or Owner nudging Team X to look into matter immediately
  isImportantDetail?: boolean; // Key takeaway / critical term (CTC, joining date, candidate decision, client feedback)
  importantSummary?: string; // Summarized highlight of this message
  createdAt: string; // ISO string
  read: boolean;
  archived?: boolean; // When candidate placed/rejected, transient chat is ignored/archived, retaining only important details
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  targetRole: string;
  targetClientId: string;
  assignedRecruiterId: string; // Team X member
  addedByRecruiterId?: string; // Recruiter who created/added the candidate
  assignedPmId: string; // PM managing the client
  stage: CandidateStage;
  actionOwner: ActionOwner;
  actionDescription: string; // e.g. "Confirm client's counter-dates with candidate"
  experienceYears: number;
  keySkills: string[];
  currentCompany?: string;
  expectedSalary?: string;
  noticePeriod?: string;
  location?: string;
  screeningNotes?: string;
  revisedCvSummary: string;
  uploadedCv?: UploadedCvFile;
  proposedDates: DateOption[];
  negotiationRound: number; // starts at 1, increments on counter-proposals
  scheduledInterview?: ScheduledInterview;
  cancellationReason?: string;
  // Key milestone timestamps & historical records
  cvSubmittedToPmAt?: string; // When CV was screened and submitted to PM
  cvSubmittedToClientAt?: string; // When PM forwarded CV to client
  interviewHappenedAt?: string; // When the interview occurred/concluded
  placedAt?: string; // When placement was concluded & accepted
  placementDetails?: PlacementDetails; // Stored offer/joining details
  interviewRounds?: InterviewRoundRecord[]; // All interview rounds conducted with timestamps and verdicts
  debrief: InterviewDebrief;
  thread: ThreadMessage[];
  importantChatHighlights?: string[]; // Stored key details from chats after candidate is placed or rejected
  lastActionTimestamp?: string; // ISO timestamp when action was assigned or status changed
  createdAt: string;
  updatedAt: string;
}

export type NotificationType =
  | "submission"
  | "update"
  | "interview"
  | "process_advanced"
  | "red_alert_reminder";

export interface InAppNotification {
  id: string;
  candidateId: string;
  candidateName: string;
  targetRole: string;
  targetClientName: string;
  actionRequiredFrom: ActionOwner;
  actionDescription: string;
  stage: CandidateStage;
  timestamp: string;
  isRead: boolean;
  priority: "normal" | "urgent_red_alert";
  overdueMinutes?: number;
  type: NotificationType;
  title: string;
  message: string;
}
