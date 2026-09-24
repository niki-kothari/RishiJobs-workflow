import React, { useState, useRef, useEffect } from "react";
import {
  Candidate,
  TeamMember,
  ClientCompany,
  CandidateStage,
  UploadedCvFile,
  DateOption,
  InterviewRoundRecord,
  PlacementDetails,
} from "../types";
import {
  User,
  Building,
  Building2,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Send,
  ArrowRight,
  ArrowLeft,
  ThumbsUp,
  Award,
  Upload,
  Download,
  Lock,
  Pencil,
  Trash2,
  Paperclip,
  FileCheck,
  Phone,
  Briefcase,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  Sparkles,
  X,
  MapPin,
  Plus,
  History,
  Check,
  CalendarCheck,
  Zap,
  Star,
  Archive,
} from "lucide-react";
import { CandidateHandoffThread } from "./CandidateHandoffThread";
import { EditCandidateModal } from "./EditCandidateModal";
import {
  SEQUENTIAL_STAGES,
  getStepNumber,
  getNextSequentialStage,
  canTransitionToStage,
} from "../utils/pipelineSequence";
import { openWhatsappAlert } from "../utils/systemNotification";

interface CandidateDetailPageProps {
  candidate: Candidate;
  currentUser: TeamMember;
  allMembers: TeamMember[];
  allClients: ClientCompany[];
  returnTabName: string;
  onBack: () => void;
  onUpdateCandidate: (candidate: Candidate) => void;
  onDeleteCandidate?: (candidateId: string) => void;
  onOpenDirectChat?: (targetMemberId?: string, candidateId?: string) => void;
}

export const CandidateDetailPage: React.FC<CandidateDetailPageProps> = ({
  candidate,
  currentUser,
  allMembers,
  allClients,
  returnTabName,
  onBack,
  onUpdateCandidate,
  onDeleteCandidate,
  onOpenDirectChat,
}) => {
  const [activeTab, setActiveTab] = useState<"workflow" | "profile" | "cv" | "debrief">("workflow");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Local state for actions
  const [newSlotText, setNewSlotText] = useState("");
  const [clientCounterText, setClientCounterText] = useState("");
  const [scheduledInterviewer, setScheduledInterviewer] = useState(
    candidate.scheduledInterview?.interviewerNames || "Hiring Manager"
  );
  const [scheduledMode, setScheduledMode] = useState<"In-Person / Office" | "Phone Call">(
    candidate.scheduledInterview?.interviewType || "In-Person / Office"
  );
  const [scheduledLocationOrContact, setScheduledLocationOrContact] = useState(
    candidate.scheduledInterview?.locationOrContact || ""
  );
  const [showLockInterviewModal, setShowLockInterviewModal] = useState(false);
  const [selectedSlotForLock, setSelectedSlotForLock] = useState("");

  // Extra Interview Round Logging Modal
  const [showAddRoundModal, setShowAddRoundModal] = useState(false);
  const [roundModalName, setRoundModalName] = useState("");
  const [roundModalDate, setRoundModalDate] = useState("");
  const [roundModalMode, setRoundModalMode] = useState<"In-Person / Office" | "Phone Call">("In-Person / Office");
  const [roundModalInterviewer, setRoundModalInterviewer] = useState("");
  const [roundModalLocation, setRoundModalLocation] = useState("");
  const [roundModalNotes, setRoundModalNotes] = useState("");
  const [roundModalStatus, setRoundModalStatus] = useState<"completed" | "scheduled">("completed");

  // Placement Details Logging Modal
  const [showPlacementModal, setShowPlacementModal] = useState(false);
  const [placementDate, setPlacementDate] = useState(
    candidate.placementDetails?.placedDate ||
      new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  );
  const [placementJoiningDate, setPlacementJoiningDate] = useState(
    candidate.placementDetails?.joiningDate || ""
  );
  const [placementOfferedCtc, setPlacementOfferedCtc] = useState(
    candidate.placementDetails?.offeredCtc || candidate.expectedSalary || ""
  );
  const [placementBillingFee, setPlacementBillingFee] = useState(
    candidate.placementDetails?.billingRateOrFee || ""
  );
  const [placementNotes, setPlacementNotes] = useState(
    candidate.placementDetails?.notes || ""
  );

  const [candidateDebriefText, setCandidateDebriefText] = useState(
    candidate.debrief.candidateFeedback?.overallImpression || ""
  );
  const [candidateSentiment, setCandidateSentiment] = useState<"positive" | "neutral" | "negative">(
    candidate.debrief.candidateFeedback?.sentiment || "positive"
  );
  const [clientDebriefText, setClientDebriefText] = useState(
    candidate.debrief.clientFeedback?.notes || ""
  );
  const [clientVerdict, setClientVerdict] = useState<"proceed" | "hold" | "reject">(
    candidate.debrief.clientFeedback?.verdict || "proceed"
  );
  const cvFileInputRef = useRef<HTMLInputElement>(null);

  // Availability slot inline editing
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [editingSlotText, setEditingSlotText] = useState("");

  // Interview Cancellation / Postponement modal
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelType, setCancelType] = useState<"postpone" | "cancel">("postpone");
  const [cancelReason, setCancelReason] = useState("");

  const recruiter = allMembers.find((m) => m.id === candidate.assignedRecruiterId);
  const pm = allMembers.find((m) => m.id === candidate.assignedPmId);
  const client = allClients.find((c) => c.id === candidate.targetClientId);

  const isCandidateOwnerRecruiter =
    currentUser.role === "recruiter" &&
    (candidate.assignedRecruiterId === currentUser.id ||
      candidate.addedByRecruiterId === currentUser.id);

  const isOtherRecruiter =
    currentUser.role === "recruiter" && !isCandidateOwnerRecruiter;

  const isMyAction =
    (isCandidateOwnerRecruiter && candidate.actionOwner === "recruiter") ||
    (currentUser.role === "pm" && candidate.actionOwner === "pm");

  const isInterviewCurrentlyScheduled =
    candidate.stage === "interview_scheduled" && Boolean(candidate.scheduledInterview);

  const isInterviewConfirmed =
    isInterviewCurrentlyScheduled || Boolean(candidate.scheduledInterview);

  // Interview is done once moved to post_interview_debrief, offer_stage, placed, or interviewHappenedAt exists
  const isInterviewDone =
    candidate.stage === "post_interview_debrief" ||
    candidate.stage === "offer_stage" ||
    candidate.stage === "placed" ||
    Boolean(candidate.interviewHappenedAt);

  const isTeamX =
    currentUser.role === "recruiter" ||
    Boolean(currentUser.team?.toLowerCase().includes("team x"));

  const isPmOrAdmin =
    currentUser.role === "pm" || currentUser.role === "admin";

  const currentStepNumber = getStepNumber(candidate.stage);
  const nextStage = getNextSequentialStage(candidate.stage);
  const currentStageDef = SEQUENTIAL_STAGES.find((s) => s.stage === candidate.stage);
  const nextStageDef = nextStage ? SEQUENTIAL_STAGES.find((s) => s.stage === nextStage) : null;

  // Ensure viewing candidate always starts at the top of the page
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [candidate.id]);

  const handleUploadNewCv = (file: File) => {
    if (!file) return;
    if (isOtherRecruiter) {
      alert(
        `Permission Denied: This candidate is owned by ${recruiter?.name || "Bhavya"}. Only ${recruiter?.name || "Bhavya"} can upload revised CVs for ${candidate.name}.`
      );
      return;
    }
    if (currentStepNumber > 1) {
      alert("Step 1 (CV Screening) is already completed. CV document is locked and cannot be replaced in subsequent steps.");
      return;
    }
    const formatSize = (bytes: number) => {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };
    const reader = new FileReader();
    reader.onload = () => {
      const uploadedCv: UploadedCvFile = {
        fileName: file.name,
        fileSize: formatSize(file.size),
        fileType: file.type || "application/pdf",
        uploadedAt: new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        fileDataUrl: reader.result as string,
      };
      const updated: Candidate = {
        ...candidate,
        uploadedCv,
        updatedAt: new Date().toISOString(),
      };
      onUpdateCandidate(updated);
    };
    reader.readAsDataURL(file);
  };

  const handleDownloadCv = () => {
    if (!candidate.uploadedCv) return;
    if (candidate.uploadedCv.fileDataUrl) {
      const link = document.createElement("a");
      link.href = candidate.uploadedCv.fileDataUrl;
      link.download = candidate.uploadedCv.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert(`CV ${candidate.uploadedCv.fileName} recorded in database.`);
    }
  };

  // Manual status/stage update handler (always available)
  const handleManualStageChange = (newStage: CandidateStage) => {
    if (newStage === candidate.stage) return;

    if (isOtherRecruiter) {
      alert(
        `Permission Denied: This candidate belongs to ${recruiter?.name || "Bhavya"}. Only ${recruiter?.name || "Bhavya"} can advance or submit ${candidate.name}'s CV to PM.`
      );
      return;
    }

    if (isTeamX) {
      if (
        newStage === "placed" ||
        newStage === "rejected" ||
        (newStage !== "cv_screening" && newStage !== "submitted_to_pm")
      ) {
        alert(
          "Team X members are not permitted to close/reject candidates, mark them as placed/hired, or modify stages beyond submission. Only Project Managers and Admins can perform these actions."
        );
        return;
      }
    }

    // Strict sequential enforcement: users cannot skip in-between steps
    const transitionCheck = canTransitionToStage(
      candidate.stage,
      newStage,
      currentUser.role,
      currentUser.id,
      candidate.assignedRecruiterId,
      recruiter?.name
    );
    if (!transitionCheck.allowed) {
      alert(transitionCheck.reason);
      return;
    }

    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    let nextActionOwner: "recruiter" | "pm" | "none" = "none";
    let nextActionDesc = "";

    switch (newStage) {
      case "cv_screening":
        nextActionOwner = "recruiter";
        nextActionDesc = "Review CV & qualify candidate";
        break;
      case "submitted_to_pm":
        nextActionOwner = "pm";
        nextActionDesc = `Review candidate & submit to ${client?.name || "Client"}`;
        break;
      case "forwarded_to_client":
        nextActionOwner = "pm";
        nextActionDesc = `Awaiting feedback from ${client?.name || "Client"}`;
        break;
      case "date_negotiation":
        nextActionOwner = "recruiter";
        nextActionDesc = "Coordinate candidate availability with proposed slots";
        break;
      case "interview_scheduled":
        nextActionOwner = "none";
        nextActionDesc = `Interview locked with ${client?.name || "Client"}`;
        break;
      case "post_interview_debrief":
        nextActionOwner = "recruiter";
        nextActionDesc = "Collect candidate debrief and client feedback";
        break;
      case "offer_stage":
        nextActionOwner = "pm";
        nextActionDesc = "Negotiate package and extend official offer letter";
        break;
      case "placed":
        nextActionOwner = "none";
        nextActionDesc = `Candidate placed at ${client?.name || "Client"}! Congratulations 🎉`;
        break;
      case "rejected":
        nextActionOwner = "none";
        nextActionDesc = "Application closed / candidate passed";
        break;
    }

    onUpdateCandidate({
      ...candidate,
      stage: newStage,
      actionOwner: nextActionOwner,
      actionDescription: nextActionDesc,
      thread: [
        ...candidate.thread,
        {
          id: "m-" + Date.now(),
          senderId: currentUser.id,
          senderName: currentUser.name,
          senderRole: currentUser.role,
          timestamp: now,
          text: `Pipeline status manually updated to: ${newStage.replace(/_/g, " ").toUpperCase()}`,
          isSystemEvent: true,
        },
      ],
      updatedAt: new Date().toISOString(),
    });
  };

  // Step 1: CV Review complete
  const handleCvReview = () => {
    if (isOtherRecruiter) {
      alert(
        `Permission Denied: This candidate belongs to ${recruiter?.name || "Bhavya"}. Only ${recruiter?.name || "Bhavya"} can screen and submit ${candidate.name}'s CV to PM. Other Team X members cannot submit candidates belonging to other recruiters.`
      );
      return;
    }
    if (currentStepNumber > 1) {
      alert("Step 1 (CV Screening) has already been completed and locked.");
      return;
    }
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const nowIso = new Date().toISOString();
    onUpdateCandidate({
      ...candidate,
      stage: "submitted_to_pm",
      cvSubmittedToPmAt: candidate.cvSubmittedToPmAt || nowIso,
      actionOwner: "pm",
      actionDescription: `Review revised CV & submit candidate to ${client?.name || "Client"}`,
      thread: [
        ...candidate.thread,
        {
          id: "m-" + Date.now(),
          senderId: currentUser.id,
          senderName: currentUser.name,
          senderRole: currentUser.role,
          timestamp: now,
          text: `Screened CV and verified key skills (${candidate.keySkills.join(", ")}). Ready for PM review.`,
          isSystemEvent: true,
        },
      ],
      updatedAt: nowIso,
    });
  };

  // Step 2: Submit to PM
  const handleSubmitToPm = () => {
    if (isOtherRecruiter) {
      alert(
        `Permission Denied: This candidate belongs to ${recruiter?.name || "Bhavya"}. Only ${recruiter?.name || "Bhavya"} can submit ${candidate.name}'s CV to PM.`
      );
      return;
    }
    if (currentStepNumber > 2) {
      alert("Step 2 (Submit to PM) has already been completed and locked.");
      return;
    }
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const nowIso = new Date().toISOString();
    onUpdateCandidate({
      ...candidate,
      stage: "submitted_to_pm",
      cvSubmittedToPmAt: candidate.cvSubmittedToPmAt || nowIso,
      actionOwner: "pm",
      actionDescription: `PM review candidate & present to ${client?.name || "Client"}`,
      thread: [
        ...candidate.thread,
        {
          id: "m-" + Date.now(),
          senderId: currentUser.id,
          senderName: currentUser.name,
          senderRole: currentUser.role,
          timestamp: now,
          text: `Submitted candidate to PM ${pm?.name || "Team"}. Waiting for PM to present to client.`,
          isSystemEvent: true,
        },
      ],
      updatedAt: nowIso,
    });
  };

  // Reset to Step 1 Screening (e.g. for correcting accidental submission or restoring ownership to Bhavya)
  const handleResetToStep1Screening = () => {
    if (isOtherRecruiter) {
      alert(`Only ${recruiter?.name || "Bhavya"} or a Project Manager can reset this candidate to Step 1.`);
      return;
    }
    const nowIso = new Date().toISOString();
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    onUpdateCandidate({
      ...candidate,
      stage: "cv_screening",
      actionOwner: "recruiter",
      actionDescription: `Review revised CV highlights & submit to PM (${recruiter?.name || "Bhavya"}'s Candidate)`,
      cvSubmittedToPmAt: undefined,
      thread: [
        ...candidate.thread,
        {
          id: "m-" + Date.now(),
          senderId: currentUser.id,
          senderName: currentUser.name,
          senderRole: currentUser.role,
          timestamp: now,
          text: `Candidate workflow reset back to Step 1 (CV Screening) assigned to ${recruiter?.name || "Bhavya"}.`,
          isSystemEvent: true,
        },
      ],
      updatedAt: nowIso,
    });
  };

  // Step 3: PM Forward to Client
  const handleForwardToClient = () => {
    if (currentUser.role === "recruiter") {
      alert("Only Project Managers (or Admins) can forward profiles to clients.");
      return;
    }
    if (currentStepNumber > 3) {
      alert("Step 3 (Forward to Client) has already been completed and locked.");
      return;
    }
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const nowIso = new Date().toISOString();
    onUpdateCandidate({
      ...candidate,
      stage: "forwarded_to_client",
      cvSubmittedToClientAt: candidate.cvSubmittedToClientAt || nowIso,
      actionOwner: "pm",
      actionDescription: `Follow up with ${client?.name || "Client"} for interview shortlisting`,
      thread: [
        ...candidate.thread,
        {
          id: "m-" + Date.now(),
          senderId: currentUser.id,
          senderName: currentUser.name,
          senderRole: currentUser.role,
          timestamp: now,
          text: `Profile and revised CV officially presented to hiring manager at ${client?.name}.`,
          isSystemEvent: true,
        },
      ],
      updatedAt: nowIso,
    });
  };

  // Step 3 -> 4: Client responds with interest, proceed to date negotiation
  const handleStartSlotCoordination = () => {
    if (currentUser.role === "recruiter") {
      alert("Client coordination is managed exclusively by Project Managers.");
      return;
    }
    if (currentStepNumber > 3) {
      alert("Step 3 (Forward to Client) has already been completed.");
      return;
    }
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    onUpdateCandidate({
      ...candidate,
      stage: "date_negotiation",
      actionOwner: "pm",
      actionDescription: `Coordinate interview slots with ${client?.name || "Client"}`,
      thread: [
        ...candidate.thread,
        {
          id: "m-" + Date.now(),
          senderId: currentUser.id,
          senderName: currentUser.name,
          senderRole: currentUser.role,
          timestamp: now,
          text: `Client ${client?.name || "Hiring Manager"} shortlisted the candidate and requested interview availability! Step 4 (Date Negotiation & Slot Coordination) unlocked.`,
          isSystemEvent: true,
        },
      ],
      updatedAt: new Date().toISOString(),
    });
  };

  // Step 4a: Recruiter adds candidate availability slots
  const handleAddCandidateDates = () => {
    if (isOtherRecruiter) {
      alert(
        `Permission Denied: This candidate belongs to ${recruiter?.name || "Bhavya"}. Only ${recruiter?.name || "Bhavya"} can propose availability slots for ${candidate.name}.`
      );
      return;
    }
    if (currentStepNumber > 4) {
      alert("Step 4 (Date Negotiation) is already completed and locked.");
      return;
    }
    if (isInterviewConfirmed) {
      alert(
        "Interview is already confirmed! To propose new dates, please cancel or postpone the interview first."
      );
      return;
    }
    if (!newSlotText.trim()) return;
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const newSlot: DateOption = {
      id: "slot-" + Date.now(),
      dateStr: newSlotText.trim(),
      proposedBy: "candidate",
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    onUpdateCandidate({
      ...candidate,
      stage: "date_negotiation",
      actionOwner: "pm",
      actionDescription: `Pass candidate availability (${newSlotText.trim()}) to ${client?.name} for confirmation`,
      proposedDates: [...candidate.proposedDates, newSlot],
      thread: [
        ...candidate.thread,
        {
          id: "m-" + Date.now(),
          senderId: currentUser.id,
          senderName: currentUser.name,
          senderRole: currentUser.role,
          timestamp: now,
          text: `Candidate proposed availability: "${newSlotText.trim()}". Passed to PM ${pm?.name} to check with client.`,
          isSystemEvent: true,
        },
      ],
      updatedAt: new Date().toISOString(),
    });
    setNewSlotText("");
  };

  // Step 4b: PM adds client counter-proposal
  const handleClientCounterDates = () => {
    if (currentStepNumber > 4) {
      alert("Step 4 (Date Negotiation) is already completed and locked.");
      return;
    }
    if (isInterviewConfirmed) {
      alert(
        "Interview is already confirmed! To propose new dates, please cancel or postpone the interview first."
      );
      return;
    }
    if (!clientCounterText.trim()) return;
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const newSlot: DateOption = {
      id: "slot-" + Date.now(),
      dateStr: clientCounterText.trim(),
      proposedBy: "client",
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    onUpdateCandidate({
      ...candidate,
      stage: "date_negotiation",
      actionOwner: "recruiter",
      actionDescription: `Client proposed alternate slot: "${clientCounterText.trim()}". Check with candidate.`,
      proposedDates: [...candidate.proposedDates, newSlot],
      thread: [
        ...candidate.thread,
        {
          id: "m-" + Date.now(),
          senderId: currentUser.id,
          senderName: currentUser.name,
          senderRole: currentUser.role,
          timestamp: now,
          text: `Client proposed alternative slot: "${clientCounterText.trim()}". Passed back to Recruiter ${recruiter?.name}.`,
          isSystemEvent: true,
        },
      ],
      updatedAt: new Date().toISOString(),
    });
    setClientCounterText("");
  };

  // Inline editing of availability slots
  const handleStartEditSlot = (slotId: string, currentText: string) => {
    if (isOtherRecruiter) {
      alert(
        `Permission Denied: This candidate belongs to ${recruiter?.name || "Bhavya"}. Only ${recruiter?.name || "Bhavya"} can edit candidate availability slots.`
      );
      return;
    }
    if (currentStepNumber > 4) {
      alert("Step 4 (Date Negotiation) is completed and locked. Availability slots cannot be edited.");
      return;
    }
    if (isInterviewConfirmed) {
      alert("Cannot edit slots while an interview is confirmed. Please cancel or postpone first.");
      return;
    }
    setEditingSlotId(slotId);
    setEditingSlotText(currentText);
  };

  const handleSaveEditSlot = (slotId: string) => {
    if (isOtherRecruiter) {
      alert(`Only ${recruiter?.name || "Bhavya"} can edit candidate availability slots.`);
      return;
    }
    if (currentStepNumber > 4) {
      alert("Step 4 (Date Negotiation) is completed and locked.");
      return;
    }
    if (!editingSlotText.trim()) return;
    const updatedDates = candidate.proposedDates.map((slot) =>
      slot.id === slotId ? { ...slot, dateStr: editingSlotText.trim() } : slot
    );
    onUpdateCandidate({
      ...candidate,
      proposedDates: updatedDates,
      updatedAt: new Date().toISOString(),
    });
    setEditingSlotId(null);
    setEditingSlotText("");
  };

  const handleDeleteSlot = (slotId: string) => {
    if (isOtherRecruiter) {
      alert(
        `Permission Denied: This candidate belongs to ${recruiter?.name || "Bhavya"}. Only ${recruiter?.name || "Bhavya"} can delete candidate availability slots.`
      );
      return;
    }
    if (currentStepNumber > 4) {
      alert("Step 4 (Date Negotiation) is completed and locked. Availability slots cannot be deleted.");
      return;
    }
    if (isInterviewConfirmed) {
      alert("Cannot delete slots while an interview is confirmed.");
      return;
    }
    if (!confirm("Are you sure you want to remove this availability slot?")) return;
    const updatedDates = candidate.proposedDates.filter((slot) => slot.id !== slotId);
    onUpdateCandidate({
      ...candidate,
      proposedDates: updatedDates,
      updatedAt: new Date().toISOString(),
    });
  };

  // Confirm Interview Slot
  const handleConfirmInterview = (confirmedSlotString: string) => {
    if (currentStepNumber > 4) {
      alert("Step 4 has already been completed and locked.");
      return;
    }
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const nowIso = new Date().toISOString();
    const updatedDates = candidate.proposedDates.map((d) => ({
      ...d,
      status: d.dateStr === confirmedSlotString ? ("accepted" as const) : ("declined" as const),
    }));

    const currentRounds = candidate.interviewRounds ? [...candidate.interviewRounds] : [];
    const roundNumber = currentRounds.length + 1;
    const finalLocation =
      scheduledLocationOrContact.trim() ||
      (scheduledMode === "Phone Call" ? (candidate.phone ? `Candidate Phone: ${candidate.phone}` : "Phone Call") : `${client?.name || "Client"} Office`);

    const newRoundRecord: InterviewRoundRecord = {
      id: "rnd-" + Date.now(),
      roundNumber,
      roundName: `Round ${roundNumber} - Client Interview`,
      interviewDate: confirmedSlotString,
      interviewMode: scheduledMode,
      locationOrContact: finalLocation,
      interviewerNames: scheduledInterviewer.trim() || client?.contactPerson || "Hiring Manager",
      status: "scheduled",
      createdAt: nowIso,
    };

    onUpdateCandidate({
      ...candidate,
      stage: "interview_scheduled",
      actionOwner: "none",
      actionDescription: `Interview confirmed for ${confirmedSlotString}. Both candidate & client notified.`,
      scheduledInterview: {
        confirmedDate: confirmedSlotString,
        interviewType: scheduledMode,
        locationOrContact: finalLocation,
        interviewerNames: scheduledInterviewer.trim() || client?.contactPerson || "Hiring Manager",
        scheduledAt: nowIso,
      },
      interviewRounds: [...currentRounds, newRoundRecord],
      proposedDates: updatedDates,
      thread: [
        ...candidate.thread,
        {
          id: "m-" + Date.now(),
          senderId: currentUser.id,
          senderName: currentUser.name,
          senderRole: currentUser.role,
          timestamp: now,
          text: `🎉 INTERVIEW CONFIRMED: ${confirmedSlotString} (Mode: ${scheduledMode}, Location/Contact: ${finalLocation}). Interviewer(s): ${scheduledInterviewer || "Hiring Manager"}.`,
          isSystemEvent: true,
        },
      ],
      updatedAt: nowIso,
    });
    setShowLockInterviewModal(false);
  };

  // Add an Extra Interview Round (e.g. Round 2, Round 3)
  const handleSaveExtraRound = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roundModalDate.trim()) {
      alert("Please provide the interview date and time.");
      return;
    }
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const nowIso = new Date().toISOString();
    const currentRounds = candidate.interviewRounds ? [...candidate.interviewRounds] : [];
    const nextRoundNum = currentRounds.length + 1;
    const finalLocation =
      roundModalLocation.trim() ||
      (roundModalMode === "Phone Call" ? (candidate.phone ? `Phone: ${candidate.phone}` : "Phone Call") : `${client?.name || "Client"} Office`);

    const newRecord: InterviewRoundRecord = {
      id: "rnd-" + Date.now(),
      roundNumber: nextRoundNum,
      roundName: roundModalName.trim() || `Round ${nextRoundNum}`,
      interviewDate: roundModalDate.trim(),
      interviewMode: roundModalMode,
      locationOrContact: finalLocation,
      interviewerNames: roundModalInterviewer.trim() || "Hiring Team",
      status: roundModalStatus,
      interviewHappenedAt: roundModalStatus === "completed" ? nowIso : undefined,
      completedAt: roundModalStatus === "completed" ? nowIso : undefined,
      notes: roundModalNotes.trim() || undefined,
      createdAt: nowIso,
    };

    const updated = {
      ...candidate,
      interviewHappenedAt: candidate.interviewHappenedAt || (roundModalStatus === "completed" ? nowIso : undefined),
      interviewRounds: [...currentRounds, newRecord],
      thread: [
        ...candidate.thread,
        {
          id: "m-" + Date.now(),
          senderId: currentUser.id,
          senderName: currentUser.name,
          senderRole: currentUser.role,
          timestamp: now,
          text: `📋 INTERVIEW ROUND LOGGED: ${newRecord.roundName} on ${newRecord.interviewDate} via ${newRecord.interviewMode} (${newRecord.status.toUpperCase()}).`,
          isSystemEvent: true,
        },
      ],
      updatedAt: nowIso,
    };
    onUpdateCandidate(updated);
    setShowAddRoundModal(false);
    setRoundModalName("");
    setRoundModalDate("");
    setRoundModalInterviewer("");
    setRoundModalLocation("");
    setRoundModalNotes("");
  };

  // Cancel or Postpone Interview with mandatory reason
  const handleConfirmCancelOrPostpone = () => {
    if (currentStepNumber > 5 || candidate.stage !== "interview_scheduled") {
      alert("Cannot cancel or postpone from a previous step. The interview has already been conducted and candidate has progressed.");
      return;
    }
    if (!cancelReason.trim()) {
      alert("Please provide a reason for canceling or postponing the interview.");
      return;
    }

    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const isPostpone = cancelType === "postpone";
    const actionLabel = isPostpone ? "Postponed / Rescheduled" : "Cancelled";
    const prevDate = candidate.scheduledInterview?.confirmedDate || "the confirmed slot";

    const updatedDates = candidate.proposedDates.map((d) =>
      d.status === "accepted" ? { ...d, status: "declined" as const } : d
    );

    onUpdateCandidate({
      ...candidate,
      stage: "date_negotiation",
      scheduledInterview: undefined,
      cancellationReason: cancelReason.trim(),
      actionOwner: currentUser.role === "recruiter" ? "pm" : "recruiter",
      actionDescription: `Interview on ${prevDate} was ${actionLabel.toLowerCase()} (${cancelReason.trim()}). Propose new availability details.`,
      proposedDates: updatedDates,
      thread: [
        ...candidate.thread,
        {
          id: "m-" + Date.now(),
          senderId: currentUser.id,
          senderName: currentUser.name,
          senderRole: currentUser.role,
          timestamp: now,
          text: `⚠️ INTERVIEW ${actionLabel.toUpperCase()}: The interview on ${prevDate} was ${actionLabel.toLowerCase()} by ${currentUser.name}. Reason: "${cancelReason.trim()}". Status moved back to Step 4 (Propose Dates). New availability can now be proposed and rescheduled.`,
          isSystemEvent: true,
        },
      ],
      updatedAt: new Date().toISOString(),
    });

    setShowCancelModal(false);
    setCancelReason("");
  };

  // Mark Interview Complete -> Move to Debrief & Store interviewHappenedAt
  const handleMarkInterviewDone = () => {
    if (currentStepNumber > 5) {
      alert("Interview has already been completed.");
      return;
    }
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const nowIso = new Date().toISOString();

    const currentRounds = candidate.interviewRounds ? [...candidate.interviewRounds] : [];
    let updatedRounds = currentRounds.map((rnd, idx) => {
      if (idx === currentRounds.length - 1 && rnd.status === "scheduled") {
        return {
          ...rnd,
          status: "completed" as const,
          interviewHappenedAt: nowIso,
          completedAt: nowIso,
        };
      }
      return rnd;
    });

    if (updatedRounds.length === 0 && candidate.scheduledInterview) {
      updatedRounds = [
        {
          id: "rnd-" + Date.now(),
          roundNumber: 1,
          roundName: "Round 1 - Client Interview",
          interviewDate: candidate.scheduledInterview.confirmedDate,
          interviewMode: candidate.scheduledInterview.interviewType || "In-Person / Office",
          locationOrContact: candidate.scheduledInterview.locationOrContact || "Client Office",
          interviewerNames: candidate.scheduledInterview.interviewerNames,
          status: "completed",
          interviewHappenedAt: nowIso,
          completedAt: nowIso,
          createdAt: candidate.scheduledInterview.scheduledAt || nowIso,
        },
      ];
    }

    onUpdateCandidate({
      ...candidate,
      stage: "post_interview_debrief",
      interviewHappenedAt: candidate.interviewHappenedAt || nowIso,
      interviewRounds: updatedRounds,
      actionOwner: "recruiter",
      actionDescription: `Interview concluded. Recruiter call ${candidate.name} & PM call ${client?.name} for debrief.`,
      thread: [
        ...candidate.thread,
        {
          id: "m-" + Date.now(),
          senderId: currentUser.id,
          senderName: currentUser.name,
          senderRole: currentUser.role,
          timestamp: now,
          text: `Interview concluded! Now entering debrief. @${recruiter?.name} call candidate, @${pm?.name} follow up with client.`,
          isSystemEvent: true,
        },
      ],
      updatedAt: nowIso,
    });
  };

  // Save Recruiter Debrief
  const handleSaveCandidateDebrief = () => {
    if (isTeamX) {
      alert("Team X members are not permitted to save or modify candidate debrief notes. Only PMs and Admins can perform this action.");
      return;
    }
    if (currentStepNumber > 6) {
      alert("Step 6 (Debrief) has already been completed and locked. Debrief notes cannot be modified once the candidate has advanced to Offer or Placement.");
      return;
    }
    onUpdateCandidate({
      ...candidate,
      debrief: {
        ...candidate.debrief,
        candidateFeedback: {
          overallImpression: candidateDebriefText,
          sentiment: candidateSentiment,
          interestLevel: 9,
          salaryExpectationConfirmed: true,
          loggedAt: new Date().toISOString(),
        },
      },
      thread: [
        ...candidate.thread,
        {
          id: "m-" + Date.now(),
          senderId: currentUser.id,
          senderName: currentUser.name,
          senderRole: currentUser.role,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          text: `Recruiter debrief logged (${candidateSentiment}): "${candidateDebriefText}"`,
          isSystemEvent: true,
        },
      ],
      updatedAt: new Date().toISOString(),
    });
  };

  // Save PM Debrief
  const handleSaveClientDebrief = () => {
    if (isTeamX) {
      alert("Team X members are not permitted to save or modify client feedback. Only PMs and Admins can perform this action.");
      return;
    }
    if (currentStepNumber > 6) {
      alert("Step 6 (Debrief) has already been completed and locked. Client feedback cannot be modified once the candidate has advanced to Offer or Placement.");
      return;
    }
    onUpdateCandidate({
      ...candidate,
      debrief: {
        ...candidate.debrief,
        clientFeedback: {
          verdict: clientVerdict,
          notes: clientDebriefText,
          technicalRating: 8,
          cultureFitRating: 8,
          loggedAt: new Date().toISOString(),
        },
      },
      thread: [
        ...candidate.thread,
        {
          id: "m-" + Date.now(),
          senderId: currentUser.id,
          senderName: currentUser.name,
          senderRole: currentUser.role,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          text: `PM client feedback logged (Verdict: ${clientVerdict.toUpperCase()}): "${clientDebriefText}"`,
          isSystemEvent: true,
        },
      ],
      updatedAt: new Date().toISOString(),
    });
  };

  // Mark Offer Stage
  const handleMarkOffer = () => {
    if (isTeamX) {
      alert("Team X members are not permitted to advance candidates to Offer Stage. Only PMs and Admins can perform this action.");
      return;
    }
    if (currentStepNumber > 6) {
      alert("Candidate has already advanced beyond Offer initiation.");
      return;
    }
    onUpdateCandidate({
      ...candidate,
      stage: "offer_stage",
      actionOwner: "pm",
      actionDescription: `Negotiate offer terms and compensation package with ${client?.name}`,
      thread: [
        ...candidate.thread,
        {
          id: "m-" + Date.now(),
          senderId: currentUser.id,
          senderName: currentUser.name,
          senderRole: currentUser.role,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          text: `Candidate advanced to Step 7: Offer & Salary Negotiation!`,
          isSystemEvent: true,
        },
      ],
      updatedAt: new Date().toISOString(),
    });
  };

  // Mark Placed -> Open Placement Details Modal
  const handleMarkPlaced = () => {
    if (isTeamX) {
      alert("Team X members are not permitted to mark candidates as placed or hired. Only PMs and Admins can perform this action.");
      return;
    }
    setShowPlacementModal(true);
  };

  const handleSavePlacement = (e: React.FormEvent) => {
    e.preventDefault();
    const nowIso = new Date().toISOString();
    const finalPlacedDetails: PlacementDetails = {
      placedDate:
        placementDate.trim() ||
        new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      joiningDate: placementJoiningDate.trim() || "To be confirmed",
      offeredCtc: placementOfferedCtc.trim() || candidate.expectedSalary || "Agreed Package",
      billingRateOrFee: placementBillingFee.trim() || undefined,
      notes: placementNotes.trim() || undefined,
      recordedBy: currentUser.name,
    };

    onUpdateCandidate({
      ...candidate,
      stage: "placed",
      placedAt: candidate.placedAt || nowIso,
      placementDetails: finalPlacedDetails,
      actionOwner: "none",
      actionDescription: `Successfully Placed at ${client?.name || "Client"}! Joining: ${finalPlacedDetails.joiningDate}`,
      thread: [
        ...candidate.thread,
        {
          id: "m-" + Date.now(),
          senderId: currentUser.id,
          senderName: currentUser.name,
          senderRole: currentUser.role,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          text: `🏆 PLACEMENT RECORDED: ${candidate.name} accepted offer at ${client?.name}! Joining: ${finalPlacedDetails.joiningDate}. Package: ${finalPlacedDetails.offeredCtc}. Logged by ${currentUser.name}.`,
          isSystemEvent: true,
        },
      ],
      updatedAt: nowIso,
    });
    setShowPlacementModal(false);
  };

  // Mark Rejected
  const handleMarkRejected = () => {
    if (isTeamX) {
      alert("Team X members are not permitted to close or reject candidates. Only PMs and Admins can perform this action.");
      return;
    }
    if (!confirm("Mark this candidate application as closed/rejected?")) return;
    onUpdateCandidate({
      ...candidate,
      stage: "rejected",
      actionOwner: "none",
      actionDescription: `Application closed.`,
      thread: [
        ...candidate.thread,
        {
          id: "m-" + Date.now(),
          senderId: currentUser.id,
          senderName: currentUser.name,
          senderRole: currentUser.role,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          text: `Candidate loop concluded: Closed / Rejected.`,
          isSystemEvent: true,
        },
      ],
      updatedAt: new Date().toISOString(),
    });
  };

  // Send message in thread
  const handleSendMessage = (text: string, actionRequiredFrom?: "recruiter" | "pm" | "none") => {
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const updatedThread = [
      ...candidate.thread,
      {
        id: "m-" + Date.now(),
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderRole: currentUser.role,
        timestamp: now,
        text,
        actionRequiredFrom,
      },
    ];

    let newOwner = candidate.actionOwner;
    let newDesc = candidate.actionDescription;

    if (actionRequiredFrom === "recruiter") {
      newOwner = "recruiter";
      newDesc = text;
    } else if (actionRequiredFrom === "pm") {
      newOwner = "pm";
      newDesc = text;
    }

    onUpdateCandidate({
      ...candidate,
      actionOwner: newOwner,
      actionDescription: newDesc,
      thread: updatedThread,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="w-full space-y-6 pb-20 animate-in fade-in duration-200">
      {/* Top Navigation & Breadcrumb Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 shadow-2xs transition-all hover:-translate-x-0.5"
            title={`Return to ${returnTabName}`}
          >
            <ArrowLeft className="w-4 h-4 text-slate-600" />
            <span>Back to {returnTabName}</span>
          </button>

          <div className="hidden md:flex items-center gap-2 text-xs text-slate-500">
            <span className="text-slate-400">/</span>
            <span>Agency Portal</span>
            <span className="text-slate-400">/</span>
            <span className="text-slate-600 font-medium">{returnTabName}</span>
            <span className="text-slate-400">/</span>
            <span className="text-slate-900 font-bold">{candidate.name}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>Candidate ID: <strong className="font-mono text-slate-700">{candidate.id}</strong></span>
          <span className="text-slate-300">•</span>
          <span>Updated: <strong className="text-slate-700">{new Date(candidate.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</strong></span>
        </div>
      </div>

      {/* Delete Confirmation Alert Banner */}
      {showDeleteConfirm && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-rose-100 text-rose-700 rounded-xl shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm text-rose-950">
                Are you sure you want to permanently delete candidate "{candidate.name}"?
              </p>
              <p className="text-xs text-rose-800 mt-0.5">
                This will delete the candidate record, attached CV, and all internal handoff history.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-3.5 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (onDeleteCandidate) {
                  onDeleteCandidate(candidate.id);
                }
              }}
              className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
            >
              Yes, Delete Candidate
            </button>
          </div>
        </div>
      )}

      {/* HERO CANDIDATE IDENTITY CARD (Spacious & Clean) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-7">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Identity & Main Info */}
          <div className="flex items-start sm:items-center gap-4 min-w-0">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-indigo-600 text-white font-extrabold flex items-center justify-center text-xl sm:text-2xl shadow-md shrink-0 ring-4 ring-indigo-100">
              {candidate.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {candidate.name}
                </h1>
                <span className="text-xs sm:text-sm font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full whitespace-nowrap">
                  {candidate.targetRole}
                </span>
                <span className="text-xs sm:text-sm text-slate-700 font-semibold bg-slate-100 border border-slate-200 px-3.5 py-1 rounded-full flex items-center gap-1.5 whitespace-nowrap">
                  <Building className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>{client?.name || "Client"}</span>
                </span>
              </div>

              {/* Attribution and contact pills */}
              <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-slate-600 mt-2.5 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <User className="w-4 h-4 text-indigo-500" />
                  <span>Recruiter: <strong className="text-slate-900">{recruiter?.name || "Unassigned"}</strong></span>
                </div>
                <span className="text-slate-300">•</span>
                <div className="flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-emerald-500" />
                  <span>PM: <strong className="text-slate-900">{pm?.name || "Unassigned"}</strong></span>
                </div>
                <span className="text-slate-300">•</span>
                <div className="flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span><strong className="text-slate-800">{candidate.phone}</strong></span>
                </div>
                <span className="text-slate-300">•</span>
                <div>
                  Exp: <strong className="text-indigo-700 font-bold">{candidate.experienceYears} Years</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Controls: Status Dropdown, Edit, Delete */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap shrink-0 self-start lg:self-center">
            {/* Status Display - Auto-managed for all roles */}
            <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3.5 py-2 border border-slate-300 shadow-2xs select-none">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status:</span>
              <div
                className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5"
                title="Pipeline stage is auto-managed as workflow steps proceed in proper sequential order."
              >
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>{currentStageDef?.label || candidate.stage.replace(/_/g, " ").toUpperCase()}</span>
                <span className="text-[10px] text-indigo-700 font-semibold bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded">
                  Auto-Managed
                </span>
              </div>
            </div>

            {/* Edit Candidate */}
            <button
              onClick={() => setShowEditModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 shadow-2xs transition-colors whitespace-nowrap"
            >
              <Pencil className="w-4 h-4 text-slate-500" />
              <span>Edit Details</span>
            </button>

            {/* Delete Candidate */}
            {onDeleteCandidate && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl border border-transparent hover:border-rose-200 transition-colors"
                title="Delete Candidate"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 8-STEP PIPELINE PROGRESS TRACKER (Expansive & High Visibility) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <span>8-Step Sequential Pipeline</span>
            <span className="text-[11px] font-normal text-slate-500 lowercase">
              (steps must be completed in order)
            </span>
          </h3>
          <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
            Step {currentStepNumber} of 8: {currentStageDef?.shortLabel || candidate.stage}
          </span>
        </div>

        {/* Visual Stepper Nodes */}
        <div className="overflow-x-auto pb-2">
          <div className="flex items-center justify-between min-w-[760px] gap-2">
            {SEQUENTIAL_STAGES.map((stageItem, index) => {
              const isPast = stageItem.stepNumber < currentStepNumber;
              const isCurrent = candidate.stage === stageItem.stage;
              const isNext = stageItem.stepNumber === currentStepNumber + 1;
              const isLocked = stageItem.stepNumber > currentStepNumber;

              return (
                <React.Fragment key={stageItem.stage}>
                  <div
                    className={`flex items-center gap-2 shrink-0 select-none ${
                      isPast
                        ? "opacity-90"
                        : isCurrent
                        ? "opacity-100"
                        : "opacity-60"
                    }`}
                    title={
                      isPast
                        ? `Step ${stageItem.stepNumber} (${stageItem.label}) is completed and locked`
                        : isCurrent
                        ? `Currently at Step ${stageItem.stepNumber} (${stageItem.label})`
                        : `Step ${stageItem.stepNumber} (${stageItem.label}) unlocks when Step ${stageItem.stepNumber - 1} action is completed`
                    }
                  >
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-all ${
                        isCurrent
                          ? "bg-indigo-600 text-white ring-4 ring-indigo-100 shadow-xs"
                          : isPast
                          ? "bg-emerald-600 text-white shadow-2xs"
                          : isNext
                          ? "bg-white text-indigo-700 border-2 border-indigo-400"
                          : "bg-slate-100 text-slate-400 border border-slate-300"
                      }`}
                    >
                      {isPast ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : isLocked && !isNext ? (
                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                      ) : (
                        stageItem.stepNumber
                      )}
                    </div>
                    <span
                      className={`text-xs sm:text-sm font-semibold whitespace-nowrap ${
                        isCurrent
                          ? "text-indigo-950 font-bold"
                          : isPast
                          ? "text-slate-800"
                          : isNext
                          ? "text-indigo-700 font-semibold"
                          : "text-slate-400"
                      }`}
                    >
                      {stageItem.label}
                    </span>
                  </div>

                  {index < SEQUENTIAL_STAGES.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 min-w-[20px] transition-colors ${
                        isPast ? "bg-emerald-500" : isCurrent ? "bg-indigo-300" : "bg-slate-200"
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Sequential Step Advance Bar */}
        {nextStage && candidate.stage !== "rejected" && candidate.stage !== "placed" && (
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-2.5 text-xs sm:text-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse" />
              <span className="text-slate-600">Current:</span>
              <span className="font-bold text-slate-900">Step {currentStepNumber}: {currentStageDef?.label}</span>
              <span className="text-slate-400">→</span>
              <span className="text-slate-500">Next:</span>
              <span className="font-bold text-indigo-700">Step {currentStepNumber + 1}: {nextStageDef?.label}</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>
                {currentStepNumber === 1 && "Submit profile & revised CV to PM below to advance to Step 2"}
                {currentStepNumber === 2 && `Forward profile & revised CV to ${client?.name || "Client"} below to advance to Step 3`}
                {currentStepNumber === 3 && `Awaiting ${client?.name || "Client"} shortlisting feedback below to coordinate dates`}
                {currentStepNumber === 4 && "Propose availability & lock interview slot below to advance to Step 5"}
                {currentStepNumber === 5 && "Conclude interview below to advance to Step 6 (Debrief)"}
                {currentStepNumber === 6 && "Log debrief notes in Debrief Tab to advance to Step 7 (Offer)"}
                {currentStepNumber === 7 && "Negotiate offer terms with client below to finalize placement"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ACTION REQUIRED CALLOUT (Big & Readable) */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          isMyAction
            ? "bg-amber-50 border-amber-300 text-amber-950"
            : "bg-slate-50 border-slate-200 text-slate-800"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-xl shrink-0 ${
              isMyAction ? "bg-amber-200 text-amber-900" : "bg-slate-200 text-slate-700"
            }`}
          >
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider">
              {isMyAction
                ? "⚡ Your Action is Required Now"
                : isOtherRecruiter
                ? `Waiting On Assigned Recruiter (${recruiter?.name || "Bhavya"})`
                : `Waiting On: ${candidate.actionOwner.toUpperCase()}`}
            </div>
            <div className="text-sm sm:text-base font-semibold mt-0.5">
              {isOtherRecruiter
                ? `Assigned to ${recruiter?.name || "Bhavya"}. Only ${recruiter?.name || "Bhavya"} can perform candidate submissions and actions.`
                : candidate.actionDescription}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => {
              const assignedMember = allMembers.find(
                (m) => m.id === (candidate.actionOwner === "recruiter" ? candidate.assignedRecruiterId : candidate.assignedPmId)
              );
              const overdueMins = Math.max(0, Math.floor((Date.now() - new Date(candidate.updatedAt).getTime()) / 60000));
              openWhatsappAlert({
                candidate,
                clientName: client?.name || "Client",
                assignedMember,
                actionOwnerText: candidate.actionOwner === "recruiter" ? (recruiter?.name || "Recruiter") : (pm?.name || "PM"),
                overdueMinutes: overdueMins,
              });
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-xl transition-colors shadow-2xs"
            title="Ping assigned team member via WhatsApp"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
            <span>Notify on WhatsApp</span>
          </button>

          {onOpenDirectChat && (
            <button
              type="button"
              onClick={() => {
                const targetMemberId =
                  currentUser.role === "pm" || currentUser.role === "admin"
                    ? candidate.assignedRecruiterId
                    : candidate.assignedPmId;
                onOpenDirectChat(targetMemberId, candidate.id);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-800 bg-indigo-100 hover:bg-indigo-200 border border-indigo-300 rounded-xl transition-colors shadow-2xs"
              title="Open direct in-app chat with assigned team member"
            >
              <Zap className="w-3.5 h-3.5 text-indigo-700" />
              <span>
                {currentUser.role === "pm" || currentUser.role === "admin"
                  ? `Nudge ${recruiter?.name?.split(" ")[0] || "Recruiter"}`
                  : `Message ${pm?.name?.split(" ")[0] || "PM"}`}
              </span>
            </button>
          )}

          <div className="text-xs text-slate-500">
            Last update: {new Date(candidate.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT TABS (Clean, Large, Full Visibility) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Tabs Bar */}
        <div className="flex border-b border-slate-200 bg-slate-50/70 px-4 sm:px-6 gap-2 sm:gap-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab("workflow")}
            className={`py-3.5 sm:py-4 px-2 sm:px-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === "workflow"
                ? "border-indigo-600 text-indigo-700 bg-white"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Workflow & Scheduling</span>
            {isMyAction && (
              <span className="w-2 h-2 rounded-full bg-amber-500" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("profile")}
            className={`py-3.5 sm:py-4 px-2 sm:px-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === "profile"
                ? "border-indigo-600 text-indigo-700 bg-white"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profile & Skills</span>
          </button>

          <button
            onClick={() => setActiveTab("cv")}
            className={`py-3.5 sm:py-4 px-2 sm:px-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === "cv"
                ? "border-indigo-600 text-indigo-700 bg-white"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Resume / CV Viewer</span>
            {candidate.uploadedCv && (
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                Attached
              </span>
            )}
          </button>

          {!isTeamX && (
            <button
              onClick={() => setActiveTab("debrief")}
              className={`py-3.5 sm:py-4 px-2 sm:px-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
                activeTab === "debrief"
                  ? "border-indigo-600 text-indigo-700 bg-white"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              <ThumbsUp className="w-4 h-4" />
              <span>Interview Debrief & Offers</span>
            </button>
          )}
        </div>

        {/* Tab Body */}
        <div className="p-6 sm:p-8 space-y-8">
          {/* TAB 1: WORKFLOW & SCHEDULING */}
          {activeTab === "workflow" && (
            <div className="space-y-8">
              {/* STAGE ACTION BOX */}
              <div className="p-5 sm:p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
                      <Clock className="w-5 h-5" />
                    </span>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                        Step {currentStepNumber} Action: {currentStageDef?.label}
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-600">
                        {currentStageDef?.description}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full">
                    {candidate.stage.replace(/_/g, " ").toUpperCase()}
                  </span>
                </div>

                {/* Stage-specific Interactive Controls */}
                {candidate.stage === "cv_screening" && (
                  isTeamX ? (
                    <div className="pt-2 bg-gradient-to-br from-indigo-50/60 via-white to-blue-50/50 p-5 rounded-2xl border-2 border-indigo-200 shadow-sm space-y-4">
                      {isOtherRecruiter && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5">
                          <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                          <div className="text-xs text-amber-900 leading-relaxed">
                            <span className="font-bold">Candidate of {recruiter?.name || "Bhavya"}:</span> You are signed in as <strong>{currentUser.name}</strong>. Only <strong>{recruiter?.name || "Bhavya"}</strong> is permitted to screen, upload revised CVs, and submit {candidate.name}'s CV to PM.
                          </div>
                        </div>
                      )}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-100 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md">
                              Recruiter Workflow
                            </span>
                            {isOtherRecruiter ? (
                              <span className="text-xs text-slate-700 font-bold bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Lock className="w-3 h-3 text-slate-500" />
                                Assigned to {recruiter?.name || "Bhavya"}
                              </span>
                            ) : (
                              <span className="text-xs text-amber-700 font-bold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                Action Required From You
                              </span>
                            )}
                          </div>
                          <h5 className="font-extrabold text-slate-900 text-sm sm:text-base mt-1">
                            Screen CV, Upload Revised CV & Submit to PM
                          </h5>
                          <p className="text-xs text-slate-600 mt-0.5">
                            Status automatically updates to <strong>Step 2: Submitted to PM</strong> upon submission.
                          </p>
                        </div>
                      </div>

                      {/* 3-Step Task Center */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                        {/* Task 1: Screen CV */}
                        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                                1
                              </div>
                              <h6 className="font-bold text-slate-900 text-xs">Screen Candidate CV</h6>
                            </div>
                            <p className="text-[11px] text-slate-600 mt-1">
                              Verify {candidate.experienceYears}y exp, skills ({candidate.keySkills.slice(0, 3).join(", ")}) & role suitability for {client?.name || "Client"}.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setActiveTab("cv")}
                            className="w-full py-1.5 px-2.5 bg-slate-100 hover:bg-indigo-50 text-indigo-700 hover:text-indigo-800 font-semibold rounded-lg text-xs flex items-center justify-center gap-1 transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>View CV Document →</span>
                          </button>
                        </div>

                        {/* Task 2: Upload Revised CV */}
                        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                                2
                              </div>
                              <h6 className="font-bold text-slate-900 text-xs">Upload Revised CV</h6>
                            </div>
                            <p className="text-[11px] text-slate-600 mt-1 truncate">
                              {candidate.uploadedCv ? (
                                <span className="text-emerald-700 font-medium flex items-center gap-1">
                                  <FileCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  <span className="truncate">{candidate.uploadedCv.fileName}</span>
                                </span>
                              ) : (
                                "Attach revised CV formatted for client"
                              )}
                            </p>
                          </div>
                          <div>
                            <input
                              type="file"
                              id="pe-revised-cv-upload"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  handleUploadNewCv(e.target.files[0]);
                                }
                              }}
                              accept=".pdf,.doc,.docx,.txt"
                              className="hidden"
                            />
                            {isOtherRecruiter ? (
                              <div className="w-full py-1.5 px-2.5 bg-slate-100 text-slate-500 font-medium rounded-lg text-xs flex items-center justify-center gap-1.5">
                                <Lock className="w-3.5 h-3.5 text-slate-400" />
                                <span>Managed by {recruiter?.name || "Bhavya"}</span>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => document.getElementById("pe-revised-cv-upload")?.click()}
                                className="w-full py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors"
                              >
                                <Upload className="w-3.5 h-3.5 text-slate-500" />
                                <span>{candidate.uploadedCv ? "Replace Revised CV" : "Upload Revised CV"}</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Task 3: Submit to PM */}
                        <div className="p-3.5 bg-white rounded-xl border border-indigo-200 shadow-2xs space-y-2 flex flex-col justify-between bg-indigo-50/20">
                          <div>
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                                3
                              </div>
                              <h6 className="font-bold text-slate-900 text-xs">Submit to PM</h6>
                            </div>
                            <p className="text-[11px] text-slate-600 mt-1">
                              Handoff to PM <strong>{pm?.name || "Team"}</strong>. Pipeline status will auto-update to Step 2.
                            </p>
                          </div>
                          {isOtherRecruiter ? (
                            <div className="w-full py-2 px-3 bg-slate-100 border border-slate-200 text-slate-600 rounded-lg text-xs flex items-center justify-center gap-1.5 font-bold">
                              <Lock className="w-3.5 h-3.5 text-slate-400" />
                              <span>Only {recruiter?.name || "Bhavya"} can submit</span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={handleCvReview}
                              className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                            >
                              <span>Submit to PM →</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
                      <div>
                        <h5 className="font-bold text-slate-900 text-sm">Step 1: Screen CV & Qualify</h5>
                        <p className="text-xs sm:text-sm text-slate-600">
                          Review candidate competencies, format revised CV summary, and approve for PM presentation.
                        </p>
                      </div>
                      {isOtherRecruiter ? (
                        <div className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5">
                          <Lock className="w-4 h-4 text-slate-400" />
                          <span>Only {recruiter?.name || "Bhavya"} can submit</span>
                        </div>
                      ) : (
                        <button
                          onClick={handleCvReview}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors shrink-0"
                        >
                          Screened & Submit to PM →
                        </button>
                      )}
                    </div>
                  )
                )}

                {candidate.stage === "submitted_to_pm" && (
                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
                    <div>
                      <h5 className="font-bold text-slate-900 text-sm">Step 2: Submit to PM (Team Review)</h5>
                      <p className="text-xs sm:text-sm text-slate-600">
                        {isTeamX
                          ? `Profile & revised CV handed off to PM ${pm?.name || "Team"}. Status automatically updated to Step 2.`
                          : `PM ${pm?.name || "Team"} reviews recruiter's summary, aligns role expectations, and sends to client.`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap shrink-0">
                      {/* Return to Step 1 button for owner or PM */}
                      {!isOtherRecruiter && (
                        <button
                          type="button"
                          onClick={handleResetToStep1Screening}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                          title="Reset back to Step 1 (CV Screening) for Bhavya"
                        >
                          <span>↺ Return to Step 1 Screening</span>
                        </button>
                      )}

                      {isTeamX ? (
                        <div className="px-3.5 py-2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Submitted to PM {pm?.name || "Team"} (Complete)</span>
                        </div>
                      ) : (
                        <button
                          onClick={handleForwardToClient}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors shrink-0"
                        >
                          Forward Profile to {client?.name || "Client"} →
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {candidate.stage === "forwarded_to_client" && (
                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
                    <div>
                      <h5 className="font-bold text-slate-900 text-sm">Step 3: Forwarded to Client</h5>
                      <p className="text-xs sm:text-sm text-slate-600">
                        Candidate profile is with {client?.name}. Once they request interview times, coordinate slots to advance to Step 4.
                      </p>
                    </div>
                    {currentUser.role === "recruiter" ? (
                      <div className="px-3.5 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-2">
                        <Lock className="w-4 h-4 text-slate-400" />
                        <span>Managed by PM. Client feedback pending.</span>
                      </div>
                    ) : (
                      <button
                        onClick={handleStartSlotCoordination}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors shrink-0"
                      >
                        Client Shortlisted: Coordinate Dates →
                      </button>
                    )}
                  </div>
                )}

                {candidate.stage === "date_negotiation" && (
                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
                    <div>
                      <h5 className="font-bold text-slate-900 text-sm">Step 4: Propose Dates & Coordinate Slots</h5>
                      <p className="text-xs sm:text-sm text-slate-600">
                        Review candidate availability and client counter-proposals below. Lock a slot to advance to Step 5.
                      </p>
                    </div>
                    <div className="px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs font-semibold shrink-0">
                      Lock availability slot below ↓
                    </div>
                  </div>
                )}

                {candidate.stage === "interview_scheduled" && (
                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
                    <div>
                      <h5 className="font-bold text-slate-900 text-sm">Step 5: Interview Scheduled</h5>
                      <p className="text-xs sm:text-sm text-slate-600">
                        Interview is confirmed for {candidate.scheduledInterview?.confirmedDate}. After the interview is conducted, proceed to Step 6.
                      </p>
                    </div>
                    <button
                      onClick={handleMarkInterviewDone}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors shrink-0"
                    >
                      Conclude Interview & Move to Step 6 (Debrief) →
                    </button>
                  </div>
                )}

                {candidate.stage === "post_interview_debrief" && (
                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
                    <div>
                      <h5 className="font-bold text-slate-900 text-sm">Step 6: Interview Debrief & Feedback</h5>
                      <p className="text-xs sm:text-sm text-slate-600">
                        Recruiter debriefs candidate and PM debriefs hiring manager. Proceed to Step 7 (Offer & Negotiation) once aligned.
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab("debrief")}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors shrink-0 flex items-center gap-1.5"
                    >
                      <ThumbsUp className="w-4 h-4" />
                      <span>Open Debrief Tab →</span>
                    </button>
                  </div>
                )}

                {candidate.stage === "offer_stage" && (
                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
                    <div>
                      <h5 className="font-bold text-slate-900 text-sm">Step 7: Offer & Negotiation</h5>
                      <p className="text-xs sm:text-sm text-slate-600">
                        Negotiating terms and compensation with {client?.name}. Once terms are accepted, mark candidate as Placed & Hired.
                      </p>
                    </div>
                    {!isTeamX && (
                      <button
                        onClick={handleMarkPlaced}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs sm:text-sm shadow-md transition-colors flex items-center gap-2 shrink-0"
                      >
                        <Award className="w-4 h-4" />
                        <span>Mark Placed & Hired 🏆</span>
                      </button>
                    )}
                  </div>
                )}

                {candidate.stage === "placed" && (
                  <div className="pt-2 flex items-center justify-between gap-3 bg-emerald-50/90 p-4 rounded-xl border border-emerald-300 text-emerald-950">
                    <div className="flex items-center gap-2.5">
                      <Award className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div>
                        <h5 className="font-extrabold text-sm sm:text-base">Step 8: Placed & Hired 🏆</h5>
                        <p className="text-xs sm:text-sm text-emerald-800">
                          Candidate successfully placed with {client?.name}! The entire recruitment lifecycle is complete.
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-emerald-600 text-white rounded-full text-xs font-bold shrink-0">
                      Completed
                    </span>
                  </div>
                )}
              </div>

              {/* DATE NEGOTIATION & INTERVIEW AVAILABILITY (Only shown while in date negotiation or active scheduled interview - HIDDEN ONCE INTERVIEW IS DONE) */}
              {!isInterviewDone && (
                !isTeamX ? (
                  currentStepNumber < 4 ? (
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                      <div className="flex items-center gap-2.5">
                        <span className="p-2 rounded-xl bg-slate-200 text-slate-600">
                          <Lock className="w-5 h-5" />
                        </span>
                        <div>
                          <h4 className="font-bold text-slate-900 text-base">
                            Step 4: Interview Availability & Slot Negotiation (Locked)
                          </h4>
                          <p className="text-xs sm:text-sm text-slate-600">
                            {currentStepNumber === 1 && "Candidate is currently in Step 1 (CV Screening). Must be screened and submitted to PM first."}
                            {currentStepNumber === 2 && `Candidate is currently in Step 2 (Submitted to PM). Must be forwarded to ${client?.name || "Client"} first.`}
                            {currentStepNumber === 3 && `Candidate profile is with ${client?.name || "Client"}. Awaiting client shortlisting feedback before coordinating interview slots.`}
                          </p>
                        </div>
                      </div>
                      <div className="p-3.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-600">
                        <strong className="text-slate-800">Sequential Pipeline Flow Enforced:</strong> Candidates cannot have an interview scheduled or debrief recorded before their CV has been submitted to and shortlisted by the client. Advance candidate through Step {currentStepNumber} above to unlock date coordination.
                      </div>
                    </div>
                  ) : (
                  <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="p-2 rounded-xl bg-amber-100 text-amber-700">
                        <Calendar className="w-5 h-5" />
                      </span>
                      <div>
                        <h4 className="font-bold text-slate-900 text-base">
                          Interview Availability & Slot Negotiation
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-600">
                          Recruiter passes candidate availability; PM coordinates client counter-proposals.
                        </p>
                      </div>
                    </div>

                    {isInterviewCurrentlyScheduled && (
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full text-xs font-bold flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5" />
                        <span>Interview Confirmed & Locked</span>
                      </span>
                    )}
                  </div>

                  {/* Cancellation Notice Banner if recently cancelled */}
                  {candidate.cancellationReason && candidate.stage === "date_negotiation" && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-xs sm:text-sm text-amber-900">
                          Interview Postponed / Rescheduling Required
                        </div>
                        <div className="text-xs text-amber-800 mt-0.5">
                          Previous booking was cancelled: "{candidate.cancellationReason}". You can now propose new availability slots below.
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Proposed Slots List */}
                  <div className="space-y-3">
                    <h5 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Proposed Availability Slots ({candidate.proposedDates.length}):
                    </h5>

                    {candidate.proposedDates.length === 0 ? (
                      <div className="text-center py-8 bg-slate-50 border border-dashed border-slate-300 rounded-xl">
                        <Calendar className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                        <p className="text-sm font-semibold text-slate-700">No availability slots proposed yet</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Add candidate availability below to initiate interview coordination.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-2.5">
                        {candidate.proposedDates.map((slot) => {
                          const isSlotAccepted = slot.status === "accepted";
                          const isSlotDeclined = slot.status === "declined";
                          const isEditingThisSlot = editingSlotId === slot.id;

                          return (
                            <div
                              key={slot.id}
                              className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                                isSlotAccepted
                                  ? "bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-100"
                                  : isSlotDeclined
                                  ? "bg-slate-50 border-slate-200 opacity-60 line-through"
                                  : "bg-white border-slate-200 hover:border-slate-300 shadow-2xs"
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div
                                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                    isSlotAccepted
                                      ? "bg-emerald-600 text-white"
                                      : slot.proposedBy === "candidate"
                                      ? "bg-indigo-100 text-indigo-700"
                                      : "bg-amber-100 text-amber-700"
                                  }`}
                                >
                                  {isSlotAccepted ? (
                                    <CheckCircle2 className="w-4 h-4" />
                                  ) : (
                                    <Clock className="w-4 h-4" />
                                  )}
                                </div>

                                <div className="min-w-0 flex-1">
                                  {isEditingThisSlot ? (
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="text"
                                        value={editingSlotText}
                                        onChange={(e) => setEditingSlotText(e.target.value)}
                                        className="flex-1 bg-white border border-indigo-400 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                      />
                                      <button
                                        onClick={() => handleSaveEditSlot(slot.id)}
                                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold"
                                      >
                                        Save
                                      </button>
                                      <button
                                        onClick={() => setEditingSlotId(null)}
                                        className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  ) : (
                                    <>
                                      <div className="font-bold text-sm sm:text-base text-slate-900">
                                        {slot.dateStr}
                                      </div>
                                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                                        <span>
                                          Proposed by:{" "}
                                          <strong className="text-slate-700">
                                            {slot.proposedBy === "candidate" ? "Candidate via Recruiter" : "Client via PM"}
                                          </strong>
                                        </span>
                                        <span className="text-slate-300">•</span>
                                        <span
                                          className={`font-semibold ${
                                            isSlotAccepted
                                              ? "text-emerald-700"
                                              : isSlotDeclined
                                              ? "text-slate-400"
                                              : "text-amber-700"
                                          }`}
                                        >
                                          {isSlotAccepted ? "Confirmed & Scheduled" : isSlotDeclined ? "Declined" : "Pending Confirmation"}
                                        </span>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* Slot actions */}
                              {!isSlotDeclined && !isEditingThisSlot && candidate.stage === "date_negotiation" && !isInterviewCurrentlyScheduled && (
                                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                                  <button
                                    onClick={() => handleStartEditSlot(slot.id, slot.dateStr)}
                                    className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
                                    title="Edit availability slot"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteSlot(slot.id)}
                                    className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg border border-slate-200 transition-colors"
                                    title="Delete availability slot"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                  {!isTeamX && (
                                    <button
                                      onClick={() => {
                                        setSelectedSlotForLock(slot.dateStr);
                                        setScheduledMode("In-Person / Office");
                                        setScheduledLocationOrContact(client?.contactPhone ? `Client Office (or Phone: ${client.contactPhone})` : "Client Office");
                                        setScheduledInterviewer(client?.contactPerson || "Hiring Manager");
                                        setShowLockInterviewModal(true);
                                      }}
                                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      <span>Lock This Date</span>
                                    </button>
                                  )}
                                </div>
                              )}
                              {currentStepNumber > 4 && !isSlotDeclined && (
                                <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                                  <Lock className="w-3 h-3 text-slate-400" />
                                  <span>Locked (Step 4 Completed)</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* PROPOSITION BOXES OR CURRENT CONFIRMED INTERVIEW DISPLAY */}
                  {isInterviewCurrentlyScheduled ? (
                    <div className="p-4 sm:p-5 bg-emerald-50/80 border border-emerald-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start sm:items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-emerald-600 text-white shrink-0">
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                          <h5 className="font-extrabold text-sm sm:text-base text-emerald-950">
                            Interview Confirmed: {candidate.scheduledInterview?.confirmedDate || "Scheduled Date"}
                          </h5>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-emerald-800 mt-1">
                            <span className="font-bold bg-emerald-200/70 text-emerald-900 px-2 py-0.5 rounded">
                              {candidate.scheduledInterview?.interviewType || "In-Person / Office"}
                            </span>
                            <span>•</span>
                            <span>
                              Location/Contact: <strong>{candidate.scheduledInterview?.locationOrContact || "Client Office"}</strong>
                            </span>
                            <span>•</span>
                            <span>
                              Interviewer: <strong>{candidate.scheduledInterview?.interviewerNames || "Hiring Manager"}</strong>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0">
                        {!isTeamX && (
                          <button
                            onClick={() => {
                              setCancelType("cancel");
                              setShowCancelModal(true);
                            }}
                            className="px-3.5 py-2 bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                          >
                            <AlertCircle className="w-4 h-4 text-rose-600" />
                            <span>Cancel / Postpone</span>
                          </button>
                        )}
                        {!isTeamX && (
                          <button
                            onClick={handleMarkInterviewDone}
                            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs flex items-center gap-1.5 transition-colors"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Conclude Interview & Move to Debrief</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ) : currentStepNumber > 4 ? (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-slate-400" />
                        <span>Step 4 (Date Negotiation) has been concluded. Availability proposals are locked and cannot be modified.</span>
                      </div>
                      <span className="px-2 py-0.5 bg-slate-200 font-bold rounded text-[11px] text-slate-600">Completed & Locked</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      {/* Recruiter Side */}
                      <div className="p-4 sm:p-5 bg-indigo-50/60 rounded-2xl border border-indigo-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-indigo-950 text-sm flex items-center gap-2">
                            <User className="w-4 h-4 text-indigo-600" />
                            <span>Candidate Availability (Recruiter Side)</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="e.g. Wednesday Oct 15 at 2:00 PM EST"
                            value={newSlotText}
                            onChange={(e) => setNewSlotText(e.target.value)}
                            className="flex-1 bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <button
                            onClick={handleAddCandidateDates}
                            disabled={!newSlotText.trim()}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs sm:text-sm transition-colors shrink-0 shadow-xs"
                          >
                            Pass to PM
                          </button>
                        </div>
                        <p className="text-xs text-slate-500">
                          Enter candidate times to trigger PM notification and send to client.
                        </p>
                      </div>

                      {/* PM Side */}
                      <div className="p-4 sm:p-5 bg-amber-50/60 rounded-2xl border border-amber-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-amber-950 text-sm flex items-center gap-2">
                            <Building className="w-4 h-4 text-amber-600" />
                            <span>Client Counter-Proposal (PM Side)</span>
                          </span>
                          {isTeamX && (
                            <span className="text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded flex items-center gap-1">
                              <Lock className="w-3 h-3" /> PM Managed
                            </span>
                          )}
                        </div>
                        {isTeamX ? (
                          <p className="text-xs text-slate-500 py-2">
                            Client counter-proposals are coordinated and updated exclusively by the Project Manager.
                          </p>
                        ) : (
                          <>
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                placeholder="e.g. Thursday Oct 16 at 3:00 PM EST"
                                value={clientCounterText}
                                onChange={(e) => setClientCounterText(e.target.value)}
                                className="flex-1 bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                              />
                              <button
                                onClick={handleClientCounterDates}
                                disabled={!clientCounterText.trim()}
                                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs sm:text-sm transition-colors shrink-0 shadow-xs"
                              >
                                Pass to Recruiter
                              </button>
                            </div>
                            <p className="text-xs text-slate-500">
                              If client suggests alternative slots, enter them to notify Recruiter {recruiter?.name}.
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                )
                ) : isInterviewCurrentlyScheduled ? (
                  <div className="p-5 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-emerald-600 text-white rounded-xl shrink-0">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                          Interview Confirmed
                        </h4>
                        <p className="text-xs text-slate-600 mt-0.5">
                          Scheduled for <strong>{candidate.scheduledInterview?.confirmedDate}</strong> with {client?.name || "Client"}.
                          Mode: <strong>{candidate.scheduledInterview?.interviewType || "In-Person / Office"}</strong> ({candidate.scheduledInterview?.locationOrContact || "Designated Location"}).
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null
              )}

              {/* KEY MILESTONES & AUDIT LOG (Stores CV Submission, Interview Rounds, Placements) */}
              <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-5">
                <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
                      <History className="w-5 h-5" />
                    </span>
                    <div>
                      <h4 className="font-bold text-slate-900 text-base">
                        Key Recruitment Milestones & Historical Record
                      </h4>
                      <p className="text-xs text-slate-500">
                        Permanent audit timestamps for CV submission to client, all interview rounds conducted, and placement details.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setRoundModalName(`Round ${(candidate.interviewRounds?.length || 0) + 1} - Evaluation`);
                        setRoundModalDate("");
                        setRoundModalInterviewer(client?.contactPerson || "Hiring Team");
                        setRoundModalLocation(client?.name ? `${client.name} Office` : "Client Office");
                        setRoundModalMode("In-Person / Office");
                        setRoundModalStatus("completed");
                        setRoundModalNotes("");
                        setShowAddRoundModal(true);
                      }}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Log Interview Round</span>
                    </button>

                    {(candidate.stage === "offer_stage" || candidate.stage === "placed" || candidate.placementDetails) && (
                      <button
                        onClick={() => setShowPlacementModal(true)}
                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                      >
                        <Award className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{candidate.stage === "placed" ? "Edit Placement Details" : "Record Placement"}</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Milestone 1: CV Submission Details */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                        <FileCheck className="w-4 h-4 text-indigo-600" />
                        <span>CV Submissions</span>
                      </span>
                      {candidate.cvSubmittedToClientAt ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                          <Check className="w-3 h-3" /> With Client
                        </span>
                      ) : candidate.cvSubmittedToPmAt ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          With PM
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-200 text-slate-600">
                          In Screening
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div>
                        <span className="text-slate-500">Submitted to PM:</span>
                        <div className="font-semibold text-slate-800">
                          {candidate.cvSubmittedToPmAt
                            ? new Date(candidate.cvSubmittedToPmAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : currentStepNumber >= 2
                            ? "Completed during Step 2"
                            : "Pending screening completion"}
                        </div>
                      </div>

                      <div className="pt-1 border-t border-slate-200">
                        <span className="text-slate-500">Submitted to Client:</span>
                        <div className="font-semibold text-slate-800">
                          {candidate.cvSubmittedToClientAt
                            ? new Date(candidate.cvSubmittedToClientAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : currentStepNumber >= 3
                            ? "Presented to Client"
                            : "Pending PM client presentation"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Milestone 2: Interview Status & Timing */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                        <CalendarCheck className="w-4 h-4 text-emerald-600" />
                        <span>Interview Status</span>
                      </span>
                      {candidate.interviewHappenedAt || (candidate.interviewRounds && candidate.interviewRounds.some(r => r.status === "completed")) ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Concluded
                        </span>
                      ) : candidate.stage === "interview_scheduled" ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                          Scheduled
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-200 text-slate-600">
                          Not Occurred
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div>
                        <span className="text-slate-500">Interview Happened At:</span>
                        <div className="font-semibold text-slate-800">
                          {candidate.interviewHappenedAt
                            ? new Date(candidate.interviewHappenedAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : candidate.scheduledInterview?.confirmedDate
                            ? `Scheduled: ${candidate.scheduledInterview.confirmedDate}`
                            : "No interview conducted yet"}
                        </div>
                      </div>

                      <div className="pt-1 border-t border-slate-200">
                        <span className="text-slate-500">Total Rounds Recorded:</span>
                        <div className="font-semibold text-slate-800 flex items-center justify-between">
                          <span>{(candidate.interviewRounds?.length || (candidate.scheduledInterview ? 1 : 0))} round(s)</span>
                          {candidate.interviewHappenedAt && (
                            <span className="text-emerald-700 font-bold">✓ Interview Done</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Milestone 3: Placement Concluded */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-amber-600" />
                        <span>Placement Milestone</span>
                      </span>
                      {candidate.stage === "placed" || candidate.placedAt ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Placed 🏆
                        </span>
                      ) : candidate.stage === "offer_stage" ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                          Offer Stage
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-200 text-slate-600">
                          In Pipeline
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div>
                        <span className="text-slate-500">Placement Date:</span>
                        <div className="font-semibold text-slate-800">
                          {candidate.placementDetails?.placedDate || (candidate.placedAt ? new Date(candidate.placedAt).toLocaleDateString() : "Not placed yet")}
                        </div>
                      </div>

                      <div className="pt-1 border-t border-slate-200">
                        <span className="text-slate-500">Joining Date / CTC:</span>
                        <div className="font-semibold text-slate-800 truncate">
                          {candidate.placementDetails?.joiningDate
                            ? `${candidate.placementDetails.joiningDate} · ${candidate.placementDetails.offeredCtc || "Package confirmed"}`
                            : candidate.stage === "placed"
                            ? "Confirmed"
                            : "Pending offer acceptance"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ALL INTERVIEW ROUNDS RECORDED TABLE */}
                <div className="space-y-2.5 pt-2">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <span>Interview Rounds History & Verification</span>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-semibold">
                        {(candidate.interviewRounds?.length || (candidate.scheduledInterview ? 1 : 0))} Logged
                      </span>
                    </h5>
                  </div>

                  {(!candidate.interviewRounds || candidate.interviewRounds.length === 0) && !candidate.scheduledInterview ? (
                    <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-500 border border-dashed border-slate-200">
                      No interview rounds have been logged yet for this candidate. Use "+ Log Interview Round" above to record rounds as they happen.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {(candidate.interviewRounds && candidate.interviewRounds.length > 0
                        ? candidate.interviewRounds
                        : candidate.scheduledInterview
                        ? [
                            {
                              id: "legacy-round-1",
                              roundNumber: 1,
                              roundName: "Round 1 - Client Interview",
                              interviewDate: candidate.scheduledInterview.confirmedDate,
                              interviewMode: candidate.scheduledInterview.interviewType || "In-Person / Office",
                              locationOrContact: candidate.scheduledInterview.locationOrContact || "Client Office",
                              interviewerNames: candidate.scheduledInterview.interviewerNames,
                              status: isInterviewDone ? ("completed" as const) : ("scheduled" as const),
                              interviewHappenedAt: candidate.interviewHappenedAt,
                              createdAt: candidate.scheduledInterview.scheduledAt,
                            },
                          ]
                        : []
                      ).map((round, idx) => (
                        <div
                          key={round.id || idx}
                          className="p-3.5 bg-slate-50/70 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-start sm:items-center gap-3">
                            <span
                              className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                                round.status === "completed"
                                  ? "bg-emerald-600 text-white"
                                  : "bg-indigo-600 text-white"
                              }`}
                            >
                              R{round.roundNumber}
                            </span>
                            <div>
                              <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <span>{round.roundName}</span>
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    round.status === "completed"
                                      ? "bg-emerald-100 text-emerald-800"
                                      : "bg-blue-100 text-blue-800"
                                  }`}
                                >
                                  {round.status === "completed" ? "Interview Happened ✓" : "Scheduled"}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-600 mt-1">
                                <span className="font-medium text-slate-900">
                                  📅 {round.interviewDate}
                                </span>
                                <span>•</span>
                                <span>
                                  Mode: <strong className="text-slate-800">{round.interviewMode}</strong>
                                </span>
                                <span>•</span>
                                <span>
                                  Interviewer: <strong className="text-slate-800">{round.interviewerNames}</strong>
                                </span>
                                <span>•</span>
                                <span>
                                  Location/Phone: <strong className="text-slate-800">{round.locationOrContact}</strong>
                                </span>
                                {round.completedAt && (
                                  <>
                                    <span>•</span>
                                    <span className="text-emerald-700">
                                      Concluded: {new Date(round.completedAt).toLocaleDateString()}
                                    </span>
                                  </>
                                )}
                              </div>
                              {round.notes && (
                                <p className="text-[11px] text-slate-500 mt-1 italic">
                                  Notes: "{round.notes}"
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* PLACEMENT DETAILS SUMMARY (If candidate is placed) */}
                {candidate.placementDetails && (
                  <div className="p-4 bg-emerald-50/70 border border-emerald-300 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-950 text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-emerald-600" />
                        <span>Official Placement Record</span>
                      </span>
                      <span className="px-2 py-0.5 bg-emerald-200 text-emerald-900 font-bold rounded text-[11px]">
                        Placed & Accepted 🏆
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-white p-3 rounded-lg border border-emerald-200">
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase font-bold">Placed Date</span>
                        <div className="font-bold text-slate-900 mt-0.5">{candidate.placementDetails.placedDate}</div>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase font-bold">Joining Date</span>
                        <div className="font-bold text-slate-900 mt-0.5">{candidate.placementDetails.joiningDate}</div>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase font-bold">Offered Package (CTC)</span>
                        <div className="font-bold text-emerald-700 mt-0.5">{candidate.placementDetails.offeredCtc}</div>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase font-bold">Logged By</span>
                        <div className="font-semibold text-slate-800 mt-0.5">{candidate.placementDetails.recordedBy || "PM"}</div>
                      </div>
                    </div>
                    {candidate.placementDetails.notes && (
                      <p className="text-xs text-emerald-900 bg-white/60 p-2 rounded border border-emerald-200">
                        <strong>Placement Remarks:</strong> {candidate.placementDetails.notes}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* CANDIDATE HANDOFF & COMMUNICATION TIMELINE */}
              <div className="space-y-3">
                {/* Important Chat Highlights (Stored details after candidate placed or rejected) */}
                {((candidate.stage === "placed" || candidate.stage === "rejected") ||
                  (candidate.importantChatHighlights && candidate.importantChatHighlights.length > 0)) && (
                  <div className="p-4 rounded-xl border bg-amber-50/70 border-amber-200 text-amber-950 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded-md bg-amber-200 text-amber-900">
                          <Star className="w-4 h-4 fill-current" />
                        </div>
                        <span className="font-bold text-xs uppercase tracking-wider text-amber-900">
                          Important Chat Highlights & Stored Outcomes
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                        Transient chat pruned · Key details stored
                      </span>
                    </div>

                    <p className="text-xs text-amber-900/90 leading-relaxed">
                      As required by policy, routine chatter is ignored now that candidate is {candidate.stage.toUpperCase()}. The following critical details and negotiation notes are permanently retained:
                    </p>

                    {candidate.importantChatHighlights && candidate.importantChatHighlights.length > 0 ? (
                      <ul className="list-disc list-inside space-y-1 text-xs text-amber-950 font-medium">
                        {candidate.importantChatHighlights.map((hl, idx) => (
                          <li key={idx}>{hl}</li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-xs text-amber-800 italic">
                        Process concluded. Candidate placement/closure confirmed by {candidate.actionOwner === "none" ? "Agency PM" : candidate.actionOwner}.
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-indigo-600" />
                    <span>Communication Timeline & Handoff Audit Trail</span>
                  </h4>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500">
                      {candidate.thread.length} messages logged
                    </span>

                    {onOpenDirectChat && (
                      <button
                        type="button"
                        onClick={() => {
                          const targetMemberId =
                            currentUser.role === "pm" || currentUser.role === "admin"
                              ? candidate.assignedRecruiterId
                              : candidate.assignedPmId;
                          onOpenDirectChat(targetMemberId, candidate.id);
                        }}
                        className="px-2.5 py-1 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg flex items-center gap-1 transition-colors"
                      >
                        <Zap className="w-3 h-3 text-indigo-600" />
                        <span>Direct Chat with {currentUser.role === "recruiter" ? "PM" : "Recruiter"}</span>
                      </button>
                    )}
                  </div>
                </div>

                <CandidateHandoffThread
                  candidate={candidate}
                  currentUser={currentUser}
                  recruiter={recruiter}
                  pm={pm}
                  onSendMessage={handleSendMessage}
                />
              </div>
            </div>
          )}

          {/* TAB 2: PROFILE & SKILLS */}
          {activeTab === "profile" && (
            <div className="space-y-6">
              {/* Profile Summary Card */}
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  <span>Executive Professional Summary</span>
                </h4>
                <p className="text-slate-800 text-sm sm:text-base leading-relaxed bg-white p-5 rounded-xl border border-slate-200">
                  {candidate.revisedCvSummary}
                </p>
              </div>

              {/* Competencies Badges */}
              <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <h4 className="font-bold text-slate-900 text-base">
                  Verified Skills & Competencies ({candidate.keySkills.length})
                </h4>
                <div className="flex flex-wrap gap-2 pt-1">
                  {candidate.keySkills.map((skill, i) => (
                    <span
                      key={i}
                      className="px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Key Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-xs text-slate-400 font-bold uppercase">Experience</span>
                  <div className="font-extrabold text-slate-900 text-lg mt-1">
                    {candidate.experienceYears} Years
                  </div>
                  <span className="text-xs text-slate-500">Verified track record</span>
                </div>

                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-xs text-slate-400 font-bold uppercase">Current Employer</span>
                  <div className="font-extrabold text-slate-900 text-lg mt-1 truncate">
                    {candidate.currentCompany || "Confidential"}
                  </div>
                  <span className="text-xs text-slate-500">Active employment</span>
                </div>

                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-xs text-slate-400 font-bold uppercase">Target Client</span>
                  <div className="font-extrabold text-emerald-700 text-lg mt-1 truncate">
                    {client?.name}
                  </div>
                  <span className="text-xs text-slate-500">{client?.industry}</span>
                </div>

                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-xs text-slate-400 font-bold uppercase">Phone Contact</span>
                  <div className="font-extrabold text-slate-900 text-lg mt-1">
                    {candidate.phone}
                  </div>
                  <span className="text-xs text-slate-500">Primary phone line</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: RESUME / CV VIEWER (Large, Legible, Paper-Style) */}
          {activeTab === "cv" && (
            <div className="space-y-6">
              {/* Document Header & Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-600 text-white">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                      {candidate.uploadedCv?.fileName || `${candidate.name} - Resume.pdf`}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {candidate.uploadedCv ? `${candidate.uploadedCv.fileSize} • Uploaded ${candidate.uploadedCv.uploadedAt}` : "Standard Format CV Attached"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {currentStepNumber <= 1 ? (
                    <>
                      <input
                        type="file"
                        ref={cvFileInputRef}
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleUploadNewCv(e.target.files[0]);
                          }
                        }}
                        accept=".pdf,.doc,.docx,.txt"
                        className="hidden"
                      />
                      <button
                        onClick={() => cvFileInputRef.current?.click()}
                        className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5"
                      >
                        <Upload className="w-4 h-4 text-slate-500" />
                        <span>Replace / Upload CV</span>
                      </button>
                    </>
                  ) : (
                    <div className="px-3 py-1.5 bg-slate-100 border border-slate-200 text-slate-500 rounded-xl text-xs font-medium flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                      <span>CV Document Locked (Step 1 Completed)</span>
                    </div>
                  )}

                  <button
                    onClick={handleDownloadCv}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download CV</span>
                  </button>
                </div>
              </div>

              {/* READABLE PAPER CV DOCUMENT */}
              <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 shadow-sm max-w-4xl mx-auto space-y-8">
                {/* CV Header */}
                <div className="border-b border-slate-200 pb-6 text-center sm:text-left flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                      {candidate.name}
                    </h2>
                    <p className="text-base font-semibold text-indigo-700 mt-1">
                      {candidate.targetRole}
                    </p>
                  </div>
                  <div className="text-xs sm:text-sm text-slate-600 space-y-1 sm:text-right">
                    <div>Phone: <strong className="text-slate-800">{candidate.phone}</strong></div>
                    <div>Location: <strong className="text-slate-800">New York, NY (Open to Remote)</strong></div>
                    <div>Experience: <strong className="text-slate-800">{candidate.experienceYears} Years Professional</strong></div>
                  </div>
                </div>

                {/* Professional Summary */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Executive Profile
                  </h3>
                  <p className="text-slate-800 text-base leading-relaxed">
                    {candidate.revisedCvSummary}
                  </p>
                </div>

                {/* Skills Section */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Core Technical Competencies
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {candidate.keySkills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-slate-100 text-slate-800 font-semibold text-xs sm:text-sm rounded-lg border border-slate-200"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Work Experience */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Professional Experience
                  </h3>

                  <div className="space-y-4 border-l-2 border-slate-200 pl-4">
                    <div className="space-y-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <span className="font-bold text-slate-900 text-base">
                          Senior {candidate.targetRole}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">2021 — Present</span>
                      </div>
                      <div className="text-xs sm:text-sm text-indigo-700 font-semibold">
                        {candidate.currentCompany || "Confidential Enterprise Client"}
                      </div>
                      <p className="text-slate-700 text-sm leading-relaxed pt-1">
                        Spearheaded end-to-end development and production architecture. Collaborated with cross-functional product stakeholders to deliver scalable solutions on modern cloud infrastructure.
                      </p>
                    </div>

                    <div className="space-y-1 pt-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <span className="font-bold text-slate-900 text-base">
                          {candidate.targetRole}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">2018 — 2021</span>
                      </div>
                      <div className="text-xs sm:text-sm text-slate-600 font-semibold">
                        High-Growth Technology Solutions Inc.
                      </div>
                      <p className="text-slate-700 text-sm leading-relaxed pt-1">
                        Designed, tested, and optimized resilient systems with 99.9% uptime. Mentored junior engineers and participated in agile sprints and code reviews.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Education */}
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Education & Certifications
                  </h3>
                  <div className="text-sm text-slate-800">
                    <div className="font-bold">Bachelor of Science in Computer Science / Engineering</div>
                    <div className="text-slate-500 text-xs">Accredited State University • Graduated with Honors</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: INTERVIEW DEBRIEF & OFFERS */}
          {activeTab === "debrief" && (
            <div className="space-y-6">
              {currentStepNumber < 6 ? (
                <div className="p-8 bg-white border border-slate-200 rounded-2xl text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-base">
                    Step 6: Interview Debrief & Offers (Locked)
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
                    Sequential pipeline flow enforced. A debrief cannot be recorded before the candidate profile is submitted to the client and the interview is officially conducted. Currently at Step {currentStepNumber} ({currentStageDef?.label}).
                  </p>
                  <button
                    onClick={() => setActiveTab("workflow")}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold"
                  >
                    Return to Workflow Tab
                  </button>
                </div>
              ) : (
              <div className="p-6 bg-purple-50/50 rounded-2xl border border-purple-200 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-600 text-white">
                    <ThumbsUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-purple-950 text-base sm:text-lg">
                      Step 6: Post-Interview Debrief & Alignment
                    </h4>
                    <p className="text-xs sm:text-sm text-purple-800">
                      Recruiter logs candidate impressions; Project Manager logs client hiring manager assessment.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Candidate feedback */}
                  <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm">
                        Candidate Debrief (Recruiter {recruiter?.name})
                      </span>
                      {isTeamX || currentStepNumber > 6 ? (
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                            candidate.debrief.candidateFeedback?.sentiment === "positive"
                              ? "bg-emerald-100 text-emerald-800"
                              : candidate.debrief.candidateFeedback?.sentiment === "negative"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {candidate.debrief.candidateFeedback?.sentiment
                            ? candidate.debrief.candidateFeedback.sentiment.toUpperCase()
                            : "PENDING"}
                        </span>
                      ) : (
                        <select
                          value={candidateSentiment}
                          onChange={(e) => setCandidateSentiment(e.target.value as any)}
                          className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 font-semibold"
                        >
                          <option value="positive">Very Positive</option>
                          <option value="neutral">Neutral</option>
                          <option value="negative">Negative</option>
                        </select>
                      )}
                    </div>
                    {isTeamX ? (
                      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 min-h-[90px] whitespace-pre-wrap">
                        {candidate.debrief.candidateFeedback?.overallImpression ||
                          "No candidate debrief notes recorded yet. (Read-only view for Team X)"}
                      </div>
                    ) : currentStepNumber > 6 ? (
                      <div className="space-y-2">
                        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 min-h-[90px] whitespace-pre-wrap">
                          {candidate.debrief.candidateFeedback?.overallImpression || "No candidate debrief notes recorded."}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">
                          <Lock className="w-3.5 h-3.5 text-slate-400" />
                          <span>Debrief notes locked (Step 6 Completed)</span>
                        </div>
                      </div>
                    ) : (
                      <>
                        <textarea
                          rows={4}
                          value={candidateDebriefText}
                          onChange={(e) => setCandidateDebriefText(e.target.value)}
                          placeholder="How did the candidate feel? Did they enjoy the technical questions? Any reservations on salary?"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                          onClick={handleSaveCandidateDebrief}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs sm:text-sm transition-colors shadow-xs"
                        >
                          Save Candidate Debrief Notes
                        </button>
                      </>
                    )}
                  </div>

                  {/* Client feedback (PM) */}
                  <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm">
                        Client Feedback (PM {pm?.name})
                      </span>
                      {isTeamX || currentStepNumber > 6 ? (
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                            candidate.debrief.clientFeedback?.verdict === "proceed"
                              ? "bg-emerald-100 text-emerald-800"
                              : candidate.debrief.clientFeedback?.verdict === "reject"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {candidate.debrief.clientFeedback?.verdict
                            ? candidate.debrief.clientFeedback.verdict.toUpperCase()
                            : "PENDING"}
                        </span>
                      ) : (
                        <select
                          value={clientVerdict}
                          onChange={(e) => setClientVerdict(e.target.value as any)}
                          className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 font-semibold"
                        >
                          <option value="proceed">Proceed to Offer / Next</option>
                          <option value="hold">On Hold</option>
                          <option value="reject">Pass / Reject</option>
                        </select>
                      )}
                    </div>
                    {isTeamX ? (
                      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 min-h-[90px] whitespace-pre-wrap">
                        {candidate.debrief.clientFeedback?.notes ||
                          "No client feedback notes recorded yet. (Managed by Project Management)"}
                      </div>
                    ) : currentStepNumber > 6 ? (
                      <div className="space-y-2">
                        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 min-h-[90px] whitespace-pre-wrap">
                          {candidate.debrief.clientFeedback?.notes || "No client feedback notes recorded."}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">
                          <Lock className="w-3.5 h-3.5 text-slate-400" />
                          <span>Client feedback locked (Step 6 Completed)</span>
                        </div>
                      </div>
                    ) : (
                      <>
                        <textarea
                          rows={4}
                          value={clientDebriefText}
                          onChange={(e) => setClientDebriefText(e.target.value)}
                          placeholder="Hiring manager's technical evaluation, cultural assessment, or concerns..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <button
                          onClick={handleSaveClientDebrief}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs sm:text-sm transition-colors shadow-xs"
                        >
                          Save Client Feedback Notes
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Final Decision Action Controls */}
                {!isTeamX ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-3 pt-4 border-t border-purple-200">
                    {candidate.stage !== "placed" && candidate.stage !== "rejected" && (
                      <button
                        onClick={handleMarkRejected}
                        className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold text-xs sm:text-sm transition-colors"
                      >
                        Close / Reject Candidate
                      </button>
                    )}

                    {candidate.stage === "post_interview_debrief" && (
                      <button
                        onClick={handleMarkOffer}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs sm:text-sm shadow-xs transition-colors"
                      >
                        Move to Step 7: Offer Negotiation →
                      </button>
                    )}

                    {candidate.stage === "offer_stage" && (
                      <button
                        onClick={handleMarkPlaced}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs sm:text-sm shadow-md transition-colors flex items-center gap-2"
                      >
                        <Award className="w-4 h-4" />
                        <span>Mark Placed & Hired 🏆</span>
                      </button>
                    )}

                    {candidate.stage === "placed" && (
                      <div className="px-4 py-2 bg-emerald-100 text-emerald-800 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2">
                        <Award className="w-4 h-4 text-emerald-600" />
                        <span>Candidate Successfully Placed & Hired!</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-white/90 border border-purple-200 rounded-xl flex items-center justify-between gap-3 text-xs sm:text-sm text-purple-950 font-medium">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-purple-600 shrink-0" />
                      <span>
                        Final actions (Close/Reject, Offer Negotiation, and Placed/Hired) and Debrief modifications are restricted to Project Managers & Admins.
                      </span>
                    </div>
                    <span className="px-2.5 py-1 bg-purple-100 text-purple-800 rounded-lg text-xs font-bold shrink-0">
                      Team X View Only
                    </span>
                  </div>
                )}
              </div>
              )
              }
            </div>
          )}
        </div>
      </div>

      {/* CANCEL OR POSTPONE MODAL (When triggered) */}
      {showCancelModal && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-200 bg-rose-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-rose-100 text-rose-700 rounded-xl">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Cancel or Postpone Interview</h3>
                  <p className="text-[11px] text-slate-500">Provide a reason and reopen date negotiation</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason("");
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="text-slate-500 font-medium">Candidate: <strong className="text-slate-800">{candidate.name}</strong></div>
                <div className="text-slate-500 font-medium">Client: <strong className="text-slate-800">{client?.name}</strong></div>
                <div className="text-slate-500 font-medium">Confirmed Slot: <strong className="text-emerald-700">{candidate.scheduledInterview?.confirmedDate || "Scheduled Date"}</strong></div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Action Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCancelType("postpone")}
                    className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition-all ${
                      cancelType === "postpone"
                        ? "border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-100"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className="font-bold">Postpone / Reschedule</div>
                    <div className="text-[10px] text-slate-500 font-normal mt-0.5">Move to another date</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCancelType("cancel")}
                    className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition-all ${
                      cancelType === "cancel"
                        ? "border-rose-500 bg-rose-50 text-rose-900 ring-2 ring-rose-100"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className="font-bold">Cancel Interview</div>
                    <div className="text-[10px] text-slate-500 font-normal mt-0.5">Call off current booking</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reason for {cancelType === "postpone" ? "Postponement" : "Cancellation"} <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder={
                    cancelType === "postpone"
                      ? "e.g. Hiring manager is traveling unexpectedly / Candidate caught flu, requested next Tuesday..."
                      : "e.g. Position put on temporary freeze / Candidate accepted another offer / Scope changed..."
                  }
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  This reason will be logged in the candidate communication thread and unlock Step 4 for proposing new dates.
                </p>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason("");
                }}
                className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={handleConfirmCancelOrPostpone}
                disabled={!cancelReason.trim()}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-colors text-white ${
                  cancelType === "postpone"
                    ? "bg-amber-600 hover:bg-amber-700 disabled:opacity-50"
                    : "bg-rose-600 hover:bg-rose-700 disabled:opacity-50"
                }`}
              >
                Confirm & Reopen Negotiation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOCK / CONFIRM INTERVIEW MODAL (No Video Call option) */}
      {showLockInterviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  Confirm & Schedule Interview
                </h3>
              </div>
              <button
                onClick={() => setShowLockInterviewModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="text-[11px] font-bold uppercase text-emerald-800 tracking-wider">
                  Selected Availability Slot:
                </span>
                <div className="font-extrabold text-sm sm:text-base text-emerald-950 mt-0.5">
                  {selectedSlotForLock}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Interview Mode (Video Call is currently removed)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setScheduledMode("In-Person / Office")}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      scheduledMode === "In-Person / Office"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-100"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-emerald-600" />
                      <span>In-Person / Office</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">Physical meeting at venue</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setScheduledMode("Phone Call")}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      scheduledMode === "Phone Call"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-100"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center gap-1.5">
                      <Phone className="w-4 h-4 text-emerald-600" />
                      <span>Phone Call</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">Direct voice interview</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {scheduledMode === "In-Person / Office" ? "Office Venue / Address" : "Candidate / Client Phone Number"}
                </label>
                <input
                  type="text"
                  value={scheduledLocationOrContact}
                  onChange={(e) => setScheduledLocationOrContact(e.target.value)}
                  placeholder={scheduledMode === "In-Person / Office" ? "e.g. 100 Main St, 4th Floor, Tech Hub" : "e.g. +1 (555) 234-5678"}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Interviewer(s) Name / Title
                </label>
                <input
                  type="text"
                  value={scheduledInterviewer}
                  onChange={(e) => setScheduledInterviewer(e.target.value)}
                  placeholder="e.g. Alex Henderson (VP of Eng), Sarah Chen (Lead Architect)"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowLockInterviewModal(false)}
                className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleConfirmInterview(selectedSlotForLock)}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Confirm & Lock Interview</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOG EXTRA INTERVIEW ROUND MODAL */}
      {showAddRoundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  Record Interview Round Details
                </h3>
              </div>
              <button
                onClick={() => setShowAddRoundModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveExtraRound}>
              <div className="p-5 space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Round Title / Description <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={roundModalName}
                    onChange={(e) => setRoundModalName(e.target.value)}
                    placeholder="e.g. Round 2 - Client Technical Architecture"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Date & Time <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={roundModalDate}
                      onChange={(e) => setRoundModalDate(e.target.value)}
                      placeholder="e.g. Oct 18, 2026, 2:30 PM"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Round Status
                    </label>
                    <select
                      value={roundModalStatus}
                      onChange={(e) => setRoundModalStatus(e.target.value as any)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="completed">Completed (Interview Happened ✓)</option>
                      <option value="scheduled">Scheduled (Upcoming)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Interview Mode
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRoundModalMode("In-Person / Office")}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        roundModalMode === "In-Person / Office"
                          ? "border-indigo-500 bg-indigo-50 text-indigo-950 ring-2 ring-indigo-100"
                          : "border-slate-200 hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <div className="font-bold text-xs flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                        <span>In-Person / Office</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRoundModalMode("Phone Call")}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        roundModalMode === "Phone Call"
                          ? "border-indigo-500 bg-indigo-50 text-indigo-950 ring-2 ring-indigo-100"
                          : "border-slate-200 hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <div className="font-bold text-xs flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Phone Call</span>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Interviewer(s)
                    </label>
                    <input
                      type="text"
                      value={roundModalInterviewer}
                      onChange={(e) => setRoundModalInterviewer(e.target.value)}
                      placeholder="e.g. Lead Engineer & VP"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Location / Contact
                    </label>
                    <input
                      type="text"
                      value={roundModalLocation}
                      onChange={(e) => setRoundModalLocation(e.target.value)}
                      placeholder="e.g. HQ 3rd floor / +1 555-0192"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Feedback / Remarks (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={roundModalNotes}
                    onChange={(e) => setRoundModalNotes(e.target.value)}
                    placeholder="Candidate excelled in system design questions..."
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddRoundModal(false)}
                  className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Round Record</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PLACEMENT DETAILS RECORD MODAL */}
      {showPlacementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 bg-emerald-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  Record Placement & Official Handoff
                </h3>
              </div>
              <button
                onClick={() => setShowPlacementModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePlacement}>
              <div className="p-5 space-y-3.5">
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-900">
                  Record official placement data for <strong>{candidate.name}</strong> at <strong>{client?.name || "Client"}</strong>.
                  This completes the recruitment milestone tracking.
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Placement Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={placementDate}
                      onChange={(e) => setPlacementDate(e.target.value)}
                      placeholder="e.g. Oct 24, 2026"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Agreed Joining Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={placementJoiningDate}
                      onChange={(e) => setPlacementJoiningDate(e.target.value)}
                      placeholder="e.g. Nov 15, 2026"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Offered Package (CTC) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={placementOfferedCtc}
                      onChange={(e) => setPlacementOfferedCtc(e.target.value)}
                      placeholder="e.g. $145,000 / year"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Placement Fee / Billing Rate
                    </label>
                    <input
                      type="text"
                      value={placementBillingFee}
                      onChange={(e) => setPlacementBillingFee(e.target.value)}
                      placeholder="e.g. 20% ($29,000) or $95/hr"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Placement Notes & Special Terms
                  </label>
                  <textarea
                    rows={2}
                    value={placementNotes}
                    onChange={(e) => setPlacementNotes(e.target.value)}
                    placeholder="e.g. Standard 90-day guarantee period, signed offer letter in candidate files..."
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPlacementModal(false)}
                  className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Save Official Placement 🏆</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT CANDIDATE MODAL */}
      {showEditModal && (
        <EditCandidateModal
          isOpen={showEditModal}
          candidate={candidate}
          allMembers={allMembers}
          allClients={allClients}
          currentUser={currentUser}
          onClose={() => setShowEditModal(false)}
          onUpdateCandidate={onUpdateCandidate}
        />
      )}
    </div>
  );
};
