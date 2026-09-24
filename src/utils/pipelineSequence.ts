import { CandidateStage, RoleType } from "../types";

export interface StageDefinition {
  stage: CandidateStage;
  stepNumber: number;
  label: string;
  shortLabel: string;
  roleOwner: "recruiter" | "pm" | "both";
  description: string;
  actionRequired: string;
  completionPrompt: string;
}

export const SEQUENTIAL_STAGES: StageDefinition[] = [
  {
    stage: "cv_screening",
    stepNumber: 1,
    label: "Step 1: CV Screening",
    shortLabel: "1. Screening",
    roleOwner: "recruiter",
    description: "Recruiter screens candidate profile, checks CV details, and verifies availability.",
    actionRequired: "Recruiter to review and verify CV details with candidate.",
    completionPrompt: "Screening complete. Ready to submit to PM?",
  },
  {
    stage: "submitted_to_pm",
    stepNumber: 2,
    label: "Step 2: Submit to PM",
    shortLabel: "2. Submit to PM",
    roleOwner: "recruiter",
    description: "Recruiter hands off screened candidate to the assigned Client PM.",
    actionRequired: "PM needs to review candidate for client presentation.",
    completionPrompt: "PM approved profile. Forward to client?",
  },
  {
    stage: "forwarded_to_client",
    stepNumber: 3,
    label: "Step 3: Forward to Client",
    shortLabel: "3. To Client",
    roleOwner: "pm",
    description: "PM presents candidate profile & resume to client hiring manager.",
    actionRequired: "Waiting for client hiring manager feedback or interview request.",
    completionPrompt: "Client interested! Proceed to propose interview dates?",
  },
  {
    stage: "date_negotiation",
    stepNumber: 4,
    label: "Step 4: Propose Dates",
    shortLabel: "4. Propose Dates",
    roleOwner: "pm",
    description: "PM coordinates mutual interview slots between candidate and client.",
    actionRequired: "Lock mutual time slot between client and candidate.",
    completionPrompt: "Interview slot selected! Confirm and schedule interview?",
  },
  {
    stage: "interview_scheduled",
    stepNumber: 5,
    label: "Step 5: Interview Scheduled",
    shortLabel: "5. Scheduled",
    roleOwner: "pm",
    description: "Date, time, and meeting link are confirmed with both parties.",
    actionRequired: "Interview is scheduled. Awaiting interview completion.",
    completionPrompt: "Interview conducted! Collect debrief and feedback?",
  },
  {
    stage: "post_interview_debrief",
    stepNumber: 6,
    label: "Step 6: Interview Debrief",
    shortLabel: "6. Debrief",
    roleOwner: "both",
    description: "Collect interview impressions and scores from both candidate and client.",
    actionRequired: "Gather feedback and determine if moving to offer.",
    completionPrompt: "Positive debrief! Advance to offer discussion?",
  },
  {
    stage: "offer_stage",
    stepNumber: 7,
    label: "Step 7: Offer & Negotiation",
    shortLabel: "7. Offer",
    roleOwner: "pm",
    description: "Formal offer package discussion, salary alignment, and start date.",
    actionRequired: "Finalize offer letter and get candidate signature.",
    completionPrompt: "Offer accepted! Mark candidate as Placed?",
  },
  {
    stage: "placed",
    stepNumber: 8,
    label: "Step 8: Placed / Hired",
    shortLabel: "8. Placed",
    roleOwner: "both",
    description: "Candidate has officially accepted and successfully placed with the client.",
    actionRequired: "Process complete. Candidate successfully hired!",
    completionPrompt: "Successfully placed!",
  },
];

export function getStageDefinition(stage: CandidateStage): StageDefinition | undefined {
  return SEQUENTIAL_STAGES.find((s) => s.stage === stage);
}

export function getStepNumber(stage: CandidateStage): number {
  if (stage === "rejected") return -1;
  const def = getStageDefinition(stage);
  return def ? def.stepNumber : 1;
}

export function getNextSequentialStage(currentStage: CandidateStage): CandidateStage | null {
  if (currentStage === "rejected" || currentStage === "placed") return null;
  const currentStep = getStepNumber(currentStage);
  const nextDef = SEQUENTIAL_STAGES.find((s) => s.stepNumber === currentStep + 1);
  return nextDef ? nextDef.stage : null;
}

export function getPreviousSequentialStage(currentStage: CandidateStage): CandidateStage | null {
  if (currentStage === "rejected") return "cv_screening";
  const currentStep = getStepNumber(currentStage);
  if (currentStep <= 1) return null;
  const prevDef = SEQUENTIAL_STAGES.find((s) => s.stepNumber === currentStep - 1);
  return prevDef ? prevDef.stage : null;
}

/**
 * Validates whether transitioning from currentStage to targetStage is allowed.
 * STRICT ENFORCEMENT:
 * 1. Skipping intermediate steps is strictly prohibited.
 * 2. Team X members (recruiters) can only screen CVs (Step 1) and submit to PMs (Step 2).
 *    Subsequent stages (Forward to Client, Interview Scheduling, Offer) can ONLY be done by PMs.
 */
export function canTransitionToStage(
  currentStage: CandidateStage,
  targetStage: CandidateStage,
  userRole?: RoleType,
  currentUserId?: string,
  candidateAssignedRecruiterId?: string,
  candidateRecruiterName?: string
): { allowed: boolean; reason?: string } {
  // Same stage is always allowed
  if (currentStage === targetStage) {
    return { allowed: true };
  }

  // Recruiter Ownership Enforcement:
  // If the user is a recruiter (Team X), they can ONLY act on their own assigned candidates.
  // Other Team X members (e.g. Dheer) cannot submit or transition a candidate belonging to Bhavya.
  if (userRole === "recruiter" && candidateAssignedRecruiterId && currentUserId) {
    if (candidateAssignedRecruiterId !== currentUserId) {
      return {
        allowed: false,
        reason: `Permission Denied: This candidate belongs to ${candidateRecruiterName || "another recruiter"}. Only ${candidateRecruiterName || "the assigned recruiter who added this candidate"} can submit or advance this candidate's CV to PM. Other Team X members cannot submit candidates belonging to other recruiters.`,
      };
    }
  }

  // Role Constraint: Recruiters / Team X members can only screen (Step 1) and submit to PM (Step 2)
  if (userRole === "recruiter") {
    const allowedRecruiterTargetStages: CandidateStage[] = [
      "cv_screening",
      "submitted_to_pm",
    ];

    if (!allowedRecruiterTargetStages.includes(targetStage)) {
      return {
        allowed: false,
        reason:
          "Team X members (recruiters) are not permitted to close/reject candidates, mark them as placed/hired, or modify post-screening stages. Only Project Managers and Admins are authorized to perform these actions.",
      };
    }

    if (
      currentStage !== "cv_screening" &&
      currentStage !== "submitted_to_pm"
    ) {
      return {
        allowed: false,
        reason:
          "Candidate is already beyond the submission stage. Only Project Managers and Admins can update subsequent stages.",
      };
    }
  }

  // Rejecting is allowed for PMs and Admins from any active stage
  if (targetStage === "rejected") {
    return { allowed: true };
  }

  // Re-opening from rejected resets back to Step 1 or Step 2
  if (currentStage === "rejected") {
    if (targetStage === "cv_screening" || targetStage === "submitted_to_pm") {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: "To reopen a rejected candidate, start from Step 1 (CV Screening).",
    };
  }

  const currentStep = getStepNumber(currentStage);
  const targetStep = getStepNumber(targetStage);

  // Moving forward: MUST BE EXACTLY THE NEXT STEP (+1)
  if (targetStep === currentStep + 1) {
    return { allowed: true };
  }

  // Reverting to previous steps is strictly prohibited:
  // Once the process flows to the next step, previous steps are permanently locked.
  if (targetStep < currentStep) {
    return {
      allowed: false,
      reason: `Cannot revert to Step ${targetStep}. Once the pipeline advances to the next step, previous completed steps are locked and cannot be modified, reverted, or re-opened.`,
    };
  }

  // Jumping ahead (skipping steps) is blocked
  if (targetStep > currentStep + 1) {
    const nextDef = SEQUENTIAL_STAGES.find((s) => s.stepNumber === currentStep + 1);
    return {
      allowed: false,
      reason: `Cannot skip steps! You must first complete Step ${currentStep} and proceed sequentially to Step ${currentStep + 1} (${nextDef?.label || ""}).`,
    };
  }

  return { allowed: true };
}
