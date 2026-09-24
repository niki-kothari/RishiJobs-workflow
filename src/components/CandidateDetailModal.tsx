import React, { useState, useRef } from "react";
import { Candidate, TeamMember, ClientCompany, CandidateStage, DateOption, UploadedCvFile } from "../types";
import { CandidateHandoffThread } from "./CandidateHandoffThread";
import { EditCandidateModal } from "./EditCandidateModal";
import {
  SEQUENTIAL_STAGES,
  getStepNumber,
  getNextSequentialStage,
  canTransitionToStage,
} from "../utils/pipelineSequence";
import {
  X,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Mail,
  User,
  Building,
  Phone,
  ArrowRight,
  Repeat,
  Building2,
  MapPin,
  FileText,
  ThumbsUp,
  Award,
  ChevronRight,
  Plus,
  Download,
  Upload,
  FileCheck,
  Paperclip,
  Pencil,
  Trash2,
  MessageSquare,
  Lock,
  Sparkles,
} from "lucide-react";

interface CandidateDetailModalProps {
  candidate: Candidate;
  currentUser: TeamMember;
  allMembers: TeamMember[];
  allClients: ClientCompany[];
  onClose: () => void;
  onUpdateCandidate: (updated: Candidate) => void;
  onDeleteCandidate?: (candidateId: string) => void;
}

export const CandidateDetailModal: React.FC<CandidateDetailModalProps> = ({
  candidate,
  currentUser,
  allMembers,
  allClients,
  onClose,
  onUpdateCandidate,
  onDeleteCandidate,
}) => {
  const [activeTab, setActiveTab] = useState<"loop" | "thread" | "cv">("loop");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Local state for actions
  const [newSlotText, setNewSlotText] = useState("");
  const [clientCounterText, setClientCounterText] = useState("");
  const [scheduledLocationOrContact, setScheduledLocationOrContact] = useState(candidate.scheduledInterview?.locationOrContact || "");
  const [scheduledInterviewer, setScheduledInterviewer] = useState(candidate.scheduledInterview?.interviewerNames || "Hiring Manager");
  const [candidateDebriefText, setCandidateDebriefText] = useState(candidate.debrief.candidateFeedback?.overallImpression || "");
  const [candidateSentiment, setCandidateSentiment] = useState<"positive" | "neutral" | "negative">(candidate.debrief.candidateFeedback?.sentiment || "positive");
  const [clientDebriefText, setClientDebriefText] = useState(candidate.debrief.clientFeedback?.notes || "");
  const [clientVerdict, setClientVerdict] = useState<"proceed" | "hold" | "reject">(candidate.debrief.clientFeedback?.verdict || "proceed");
  const cvFileInputRef = useRef<HTMLInputElement>(null);

  // Availability slot inline editing
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [editingSlotText, setEditingSlotText] = useState("");

  // Interview Cancellation / Postponement modal
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelType, setCancelType] = useState<"postpone" | "cancel">("postpone");
  const [cancelReason, setCancelReason] = useState("");

  const handleUploadNewCv = (file: File) => {
    if (!file) return;
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

  const recruiter = allMembers.find((m) => m.id === candidate.assignedRecruiterId);
  const pm = allMembers.find((m) => m.id === candidate.assignedPmId);
  const client = allClients.find((c) => c.id === candidate.targetClientId);

  const isMyAction =
    (currentUser.role === "recruiter" && candidate.actionOwner === "recruiter") ||
    (currentUser.role === "pm" && candidate.actionOwner === "pm");

  const isInterviewConfirmed = Boolean(candidate.scheduledInterview) || candidate.stage === "interview_scheduled";

  // Stages helper
  const stages: { key: CandidateStage; label: string }[] = [
    { key: "cv_screening", label: "CV Screen" },
    { key: "submitted_to_pm", label: "Submit to PM" },
    { key: "forwarded_to_client", label: "Send to Client" },
    { key: "date_negotiation", label: "Date Loop" },
    { key: "interview_scheduled", label: "Interview" },
    { key: "post_interview_debrief", label: "Debrief" },
    { key: "offer_stage", label: "Offer" },
    { key: "placed", label: "Placed" },
    { key: "rejected", label: "Closed" },
  ];

  const currentStageIndex = stages.findIndex((s) => s.key === candidate.stage);

  const currentStepNumber = getStepNumber(candidate.stage);
  const nextStage = getNextSequentialStage(candidate.stage);
  const currentStageDef = SEQUENTIAL_STAGES.find((s) => s.stage === candidate.stage);
  const nextStageDef = nextStage
    ? SEQUENTIAL_STAGES.find((s) => s.stage === nextStage)
    : null;

  // Manual status/stage update handler (always available)
  const handleManualStageChange = (newStage: CandidateStage) => {
    if (newStage === candidate.stage) return;

    // Strict sequential enforcement: users cannot skip in-between steps
    const transitionCheck = canTransitionToStage(candidate.stage, newStage, currentUser.role);
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
        nextActionDesc = "Offer negotiation & closure";
        break;
      case "placed":
        nextActionOwner = "none";
        nextActionDesc = "Candidate placed successfully 🏆";
        break;
      case "rejected":
        nextActionOwner = "none";
        nextActionDesc = "Process closed / candidate rejected";
        break;
    }

    const stageNames: Record<CandidateStage, string> = {
      cv_screening: "CV Screening",
      submitted_to_pm: "Submitted to PM",
      forwarded_to_client: "Forwarded to Client",
      date_negotiation: "Date Negotiation (Loop)",
      interview_scheduled: "Interview Scheduled",
      post_interview_debrief: "Post-Interview Debrief",
      offer_stage: "Offer Stage",
      placed: "Placed & Hired",
      rejected: "Closed / Rejected",
    };

    const updated: Candidate = {
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
          text: `Status updated to "${stageNames[newStage]}" by ${currentUser.name}.`,
          isSystemEvent: true,
          actionRequiredFrom: nextActionOwner,
        },
      ],
      updatedAt: new Date().toISOString(),
    };

    onUpdateCandidate(updated);
  };

  // Send message in thread
  const handleSendMessage = (text: string, actionRequiredFrom: "recruiter" | "pm" | "none" = "none") => {
    const newMessage = {
      id: "m-" + Date.now(),
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      text,
      actionRequiredFrom,
    };

    let updatedActionOwner = candidate.actionOwner;
    let updatedActionDesc = candidate.actionDescription;

    if (actionRequiredFrom !== "none") {
      updatedActionOwner = actionRequiredFrom;
      updatedActionDesc = `Direct action requested: ${text.substring(0, 60)}...`;
    }

    onUpdateCandidate({
      ...candidate,
      actionOwner: updatedActionOwner,
      actionDescription: updatedActionDesc,
      thread: [...candidate.thread, newMessage],
      updatedAt: new Date().toISOString(),
    });
  };

  // Recruiter submits to PM
  const handleSubmitToPM = () => {
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    onUpdateCandidate({
      ...candidate,
      stage: "submitted_to_pm",
      actionOwner: "pm",
      actionDescription: `Review candidate profile & pitch to ${client?.name || "Client"}`,
      thread: [
        ...candidate.thread,
        {
          id: "m-" + Date.now(),
          senderId: currentUser.id,
          senderName: currentUser.name,
          senderRole: currentUser.role,
          timestamp: now,
          text: `Submitted candidate to PM (${pm?.name}). Availability dates and revised CV ready for client presentation.`,
          isSystemEvent: true,
          actionRequiredFrom: "pm",
        },
      ],
      updatedAt: new Date().toISOString(),
    });
  };

  // PM forwards to Client
  const handleForwardToClient = () => {
    if (currentUser.role === "recruiter") {
      alert("Team X members (recruiters) can only screen CVs and submit to PMs. Only PMs can forward profiles to clients.");
      return;
    }
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    onUpdateCandidate({
      ...candidate,
      stage: "date_negotiation",
      actionOwner: "pm",
      actionDescription: `Awaiting response from ${client?.name || "Client"} hiring manager on proposed dates`,
      thread: [
        ...candidate.thread,
        {
          id: "m-" + Date.now(),
          senderId: currentUser.id,
          senderName: currentUser.name,
          senderRole: currentUser.role,
          timestamp: now,
          text: `Forwarded profile & availability to ${client?.contactPerson} at ${client?.name}. Waiting for their response.`,
          isSystemEvent: true,
        },
      ],
      updatedAt: new Date().toISOString(),
    });
  };

  // PM inputs Client Counter-Dates (starts loop)
  const handleClientCounterDates = () => {
    if (!clientCounterText.trim()) return;
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const newOption: DateOption = {
      id: "d-" + Date.now(),
      dateStr: clientCounterText.trim(),
      proposedBy: "client",
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    onUpdateCandidate({
      ...candidate,
      stage: "date_negotiation",
      actionOwner: "recruiter",
      actionDescription: `Client proposed alternative slot: "${clientCounterText}". Recruiter call candidate to confirm.`,
      negotiationRound: candidate.negotiationRound + 1,
      proposedDates: [...candidate.proposedDates, newOption],
      thread: [
        ...candidate.thread,
        {
          id: "m-" + Date.now(),
          senderId: currentUser.id,
          senderName: currentUser.name,
          senderRole: currentUser.role,
          timestamp: now,
          text: `Client cannot do initial times. They countered with: "${clientCounterText}". @${recruiter?.name} please call ${candidate.name} to confirm.`,
          actionRequiredFrom: "recruiter",
        },
      ],
      updatedAt: new Date().toISOString(),
    });
    setClientCounterText("");
  };

  // Recruiter inputs new Candidate Dates
  const handleAddCandidateDates = () => {
    if (!newSlotText.trim()) return;
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const newOption: DateOption = {
      id: "d-" + Date.now(),
      dateStr: newSlotText.trim(),
      proposedBy: "candidate",
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    onUpdateCandidate({
      ...candidate,
      stage: "date_negotiation",
      actionOwner: "pm",
      actionDescription: `Candidate offered slots: "${newSlotText}". PM submit to client.`,
      proposedDates: [...candidate.proposedDates, newOption],
      thread: [
        ...candidate.thread,
        {
          id: "m-" + Date.now(),
          senderId: currentUser.id,
          senderName: currentUser.name,
          senderRole: currentUser.role,
          timestamp: now,
          text: `Spoke with ${candidate.name}. They offered this slot: "${newSlotText}". @${pm?.name} please check with ${client?.name}.`,
          actionRequiredFrom: "pm",
        },
      ],
      updatedAt: new Date().toISOString(),
    });
    setNewSlotText("");
  };

  // Availability slot editing
  const handleStartEditSlot = (slot: DateOption) => {
    setEditingSlotId(slot.id);
    setEditingSlotText(slot.dateStr);
  };

  const handleSaveEditSlot = (slotId: string) => {
    if (!editingSlotText.trim()) return;
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const targetSlot = candidate.proposedDates.find((s) => s.id === slotId);
    const updatedDates = candidate.proposedDates.map((s) =>
      s.id === slotId ? { ...s, dateStr: editingSlotText.trim() } : s
    );

    onUpdateCandidate({
      ...candidate,
      proposedDates: updatedDates,
      thread: [
        ...candidate.thread,
        {
          id: "m-" + Date.now(),
          senderId: currentUser.id,
          senderName: currentUser.name,
          senderRole: currentUser.role,
          timestamp: now,
          text: `Availability slot updated: "${targetSlot?.dateStr}" → "${editingSlotText.trim()}" by ${currentUser.name}.`,
          isSystemEvent: true,
        },
      ],
      updatedAt: new Date().toISOString(),
    });
    setEditingSlotId(null);
    setEditingSlotText("");
  };

  const handleDeleteSlot = (slotId: string) => {
    const slotToDelete = candidate.proposedDates.find((s) => s.id === slotId);
    const updatedDates = candidate.proposedDates.filter((s) => s.id !== slotId);
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    onUpdateCandidate({
      ...candidate,
      proposedDates: updatedDates,
      thread: [
        ...candidate.thread,
        {
          id: "m-" + Date.now(),
          senderId: currentUser.id,
          senderName: currentUser.name,
          senderRole: currentUser.role,
          timestamp: now,
          text: `Availability slot removed: "${slotToDelete?.dateStr}" by ${currentUser.name}.`,
          isSystemEvent: true,
        },
      ],
      updatedAt: new Date().toISOString(),
    });
  };

  // Confirm and schedule interview (PMs only)
  const handleConfirmInterview = (confirmedSlot: string) => {
    if (currentUser.role === "recruiter") {
      alert("Only Project Managers (or Admins) can finalize and lock interview dates with the client.");
      return;
    }

    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const updatedDates = candidate.proposedDates.map((d) => ({
      ...d,
      status: d.dateStr === confirmedSlot ? ("accepted" as const) : ("declined" as const),
    }));

    onUpdateCandidate({
      ...candidate,
      stage: "interview_scheduled",
      actionOwner: "none",
      actionDescription: `Interview confirmed: ${confirmedSlot} with ${client?.name}`,
      proposedDates: updatedDates,
      scheduledInterview: {
        confirmedDate: confirmedSlot,
        interviewType: "In-Person / Office",
        locationOrContact: client?.contactPhone || "Client Office / Designated Location",
        interviewerNames: scheduledInterviewer || client?.contactPerson || "Hiring Team",
        scheduledAt: new Date().toISOString(),
      },
      thread: [
        ...candidate.thread,
        {
          id: "m-" + Date.now(),
          senderId: currentUser.id,
          senderName: currentUser.name,
          senderRole: currentUser.role,
          timestamp: now,
          text: `INTERVIEW CONFIRMED! Slot: ${confirmedSlot}. Interviewers: ${scheduledInterviewer || "Hiring Team"}. Mode: In-Person / Office. Invitations dispatched. Additional date proposals locked.`,
          isSystemEvent: true,
        },
      ],
      updatedAt: new Date().toISOString(),
    });
  };

  // Cancel or Postpone Interview with mandatory reason
  const handleConfirmCancelOrPostpone = () => {
    if (!cancelReason.trim()) {
      alert("Please provide a reason for canceling or postponing the interview.");
      return;
    }

    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const isPostpone = cancelType === "postpone";
    const actionLabel = isPostpone ? "Postponed / Rescheduled" : "Cancelled";
    const prevDate = candidate.scheduledInterview?.confirmedDate || "the confirmed slot";

    // Mark previous dates as declined
    const updatedDates = candidate.proposedDates.map((d) =>
      d.status === "accepted" ? { ...d, status: "declined" as const } : d
    );

    onUpdateCandidate({
      ...candidate,
      stage: "date_negotiation", // Reset to Step 4 so new availability can be proposed
      scheduledInterview: undefined, // Clear confirmed interview
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

  // Mark Interview Complete -> Move to Debrief
  const handleMarkInterviewDone = () => {
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    onUpdateCandidate({
      ...candidate,
      stage: "post_interview_debrief",
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
      updatedAt: new Date().toISOString(),
    });
  };

  // Save Recruiter Debrief
  const handleSaveCandidateDebrief = () => {
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
          text: `Recruiter debrief logged: "${candidateDebriefText}". Sentiment: ${candidateSentiment}.`,
        },
      ],
      updatedAt: new Date().toISOString(),
    });
  };

  // Save PM Client Debrief
  const handleSaveClientDebrief = () => {
    onUpdateCandidate({
      ...candidate,
      debrief: {
        ...candidate.debrief,
        clientFeedback: {
          technicalRating: 9,
          cultureFitRating: 9,
          verdict: clientVerdict,
          notes: clientDebriefText,
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
          text: `Client debrief logged: "${clientDebriefText}". Verdict: ${clientVerdict.toUpperCase()}.`,
        },
      ],
      updatedAt: new Date().toISOString(),
    });
  };

  // Final Close / Placed
  const handleMarkPlaced = () => {
    onUpdateCandidate({
      ...candidate,
      stage: "placed",
      actionOwner: "none",
      actionDescription: `Candidate Placed at ${client?.name}! Offer accepted.`,
      thread: [
        ...candidate.thread,
        {
          id: "m-" + Date.now(),
          senderId: currentUser.id,
          senderName: currentUser.name,
          senderRole: currentUser.role,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          text: `🏆 PLACEMENT: ${candidate.name} has accepted the offer at ${client?.name}!`,
          isSystemEvent: true,
        },
      ],
      updatedAt: new Date().toISOString(),
    });
  };

  // Mark Rejected
  const handleMarkRejected = () => {
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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs p-3 sm:p-6 flex items-start sm:items-center justify-center">
      <div className="my-auto bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] sm:max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header - Fixed & Protected from shrinking/overlapping */}
        <div className="px-5 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 bg-slate-50/90 shrink-0">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            {/* Candidate Identity */}
            <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm ring-2 ring-indigo-200 shrink-0">
                {candidate.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                    {candidate.name}
                  </h2>
                  <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full whitespace-nowrap">
                    {candidate.targetRole}
                  </span>
                  <span className="text-xs text-slate-600 font-medium flex items-center gap-1 bg-white border border-slate-200 px-2 py-0.5 rounded-full whitespace-nowrap">
                    <Building className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate max-w-[180px]">{client?.name || "Client"}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                  <span>
                    Recruiter: <strong className="text-slate-700">{recruiter?.name || "Unassigned"}</strong>
                  </span>
                  <span className="hidden sm:inline text-slate-300">•</span>
                  <span>
                    PM: <strong className="text-slate-700">{pm?.name || "Unassigned"}</strong>
                  </span>
                  <span className="hidden sm:inline text-slate-300">•</span>
                  <span>Phone: <strong className="text-slate-700">{candidate.phone}</strong></span>
                  <span className="hidden sm:inline text-slate-300">•</span>
                  <span>Exp: <strong className="text-indigo-700 font-bold">{candidate.experienceYears} Years</strong></span>
                </div>
              </div>
            </div>

            {/* Quick Actions & Stage Selector */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0 justify-end pt-1 lg:pt-0">
              {/* Status Dropdown */}
              <div className="flex items-center gap-1.5 bg-white rounded-xl px-2.5 py-1.5 border border-slate-300 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status:</span>
                <select
                  value={candidate.stage}
                  onChange={(e) => handleManualStageChange(e.target.value as CandidateStage)}
                  className="bg-transparent text-xs font-bold text-indigo-950 focus:outline-none cursor-pointer pr-1"
                  title="Update candidate pipeline status (sequential progression enforced)"
                >
                  {SEQUENTIAL_STAGES.map((s) => {
                    const check = canTransitionToStage(candidate.stage, s.stage, currentUser.role);
                    const isCurrent = candidate.stage === s.stage;
                    return (
                      <option
                        key={s.stage}
                        value={s.stage}
                        disabled={!check.allowed && !isCurrent}
                      >
                        {s.label} {!check.allowed && !isCurrent ? "(Locked)" : ""}
                      </option>
                    );
                  })}
                  <option value="rejected">9. Closed / Rejected</option>
                </select>
              </div>

              {/* Edit Candidate Details */}
              <button
                onClick={() => setShowEditModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 shadow-2xs transition-colors whitespace-nowrap"
                title="Edit candidate profile & details"
              >
                <Pencil className="w-3.5 h-3.5 text-slate-500" />
                <span>Edit</span>
              </button>

              {/* Delete Candidate */}
              {onDeleteCandidate && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl border border-transparent hover:border-rose-200 transition-colors"
                  title="Delete Candidate"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              {/* Close Button */}
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors ml-1"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Banner inside modal */}
        {showDeleteConfirm && (
          <div className="mx-6 mt-3 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between gap-4 shrink-0">
            <div>
              <p className="font-bold text-xs text-rose-900">
                Are you sure you want to permanently delete candidate "{candidate.name}"?
              </p>
              <p className="text-[11px] text-rose-700">
                This will delete the candidate record, attached CV, and all internal handoff history.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  if (onDeleteCandidate) {
                    onDeleteCandidate(candidate.id);
                  }
                }}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Sequential Step Progress Tracker (Skipping steps is prohibited) */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 overflow-x-auto shrink-0">
          <div className="flex items-center justify-between min-w-[760px] gap-2">
            {SEQUENTIAL_STAGES.map((stageItem, index) => {
              const isPast = stageItem.stepNumber < currentStepNumber;
              const isCurrent = candidate.stage === stageItem.stage;
              const isNext = stageItem.stepNumber === currentStepNumber + 1;
              const isSequentialLocked = stageItem.stepNumber > currentStepNumber + 1;
              const isRecruiterRestricted = currentUser.role === "recruiter" && stageItem.stepNumber > 2;
              const isLocked = isSequentialLocked || isRecruiterRestricted;

              return (
                <React.Fragment key={stageItem.stage}>
                  <button
                    onClick={() => {
                      if (isRecruiterRestricted) {
                        alert(
                          `Team X members (recruiters) can only screen CVs (Step 1) and submit to PM (Step 2). Steps 3 through 8 are managed by Project Managers.`
                        );
                        return;
                      }
                      if (isSequentialLocked) {
                        alert(
                          `Cannot skip steps! You must complete Step ${currentStepNumber} (${currentStageDef?.label}) before moving to Step ${stageItem.stepNumber} (${stageItem.label}).`
                        );
                        return;
                      }
                      handleManualStageChange(stageItem.stage);
                    }}
                    className={`flex items-center gap-1.5 shrink-0 transition-all text-left ${
                      isLocked ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:opacity-90"
                    }`}
                    title={
                      isRecruiterRestricted
                        ? `PM Only: Team X recruiters can only screen and submit to PM`
                        : isSequentialLocked
                        ? `Locked: Must complete Step ${currentStepNumber} first`
                        : `Step ${stageItem.stepNumber}: ${stageItem.label}`
                    }
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
                        isCurrent
                          ? "bg-indigo-600 text-white ring-4 ring-indigo-100 shadow-2xs"
                          : isPast
                          ? "bg-emerald-600 text-white"
                          : isNext && !isRecruiterRestricted
                          ? "bg-white text-indigo-700 border-2 border-indigo-500 shadow-2xs"
                          : "bg-slate-200 text-slate-400 border border-slate-300"
                      }`}
                    >
                      {isPast ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : isLocked ? (
                        <Lock className="w-3 h-3 text-slate-400" />
                      ) : (
                        stageItem.stepNumber
                      )}
                    </div>
                    <span
                      className={`text-xs font-semibold whitespace-nowrap ${
                        isCurrent
                          ? "text-indigo-950 font-bold"
                          : isPast
                          ? "text-slate-700"
                          : isNext && !isRecruiterRestricted
                          ? "text-indigo-700 font-bold"
                          : "text-slate-400"
                      }`}
                    >
                      {stageItem.shortLabel}
                    </span>
                  </button>
                  {index < SEQUENTIAL_STAGES.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 min-w-[16px] transition-colors ${
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
          <div className="px-6 py-2 bg-indigo-50/70 border-b border-indigo-100 flex items-center justify-between gap-3 shrink-0 flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
              <span className="text-slate-600">Current Process:</span>
              <span className="font-bold text-slate-900">Step {currentStepNumber}: {currentStageDef?.label}</span>
              <span className="text-slate-400">→</span>
              <span className="text-slate-500">Next Step:</span>
              <span className="font-bold text-indigo-700">Step {currentStepNumber + 1}: {nextStageDef?.label}</span>
            </div>

            {currentUser.role === "recruiter" && currentStepNumber >= 2 ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-500 rounded-lg text-xs font-medium">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Submitted to PM. PM manages client presentation & scheduling</span>
              </div>
            ) : (
              <button
                onClick={() => handleManualStageChange(nextStage)}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 shrink-0"
                title={`Advance sequentially to Step ${currentStepNumber + 1}`}
              >
                <span>Complete Step {currentStepNumber} & Advance to Step {currentStepNumber + 1}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Action Callout Banner */}
        <div
          className={`px-6 py-2.5 flex items-center justify-between text-xs border-b shrink-0 gap-2 flex-wrap sm:flex-nowrap ${
            isMyAction
              ? "bg-amber-50 border-amber-200 text-amber-900"
              : "bg-slate-50 border-slate-200 text-slate-700"
          }`}
        >
          <div className="flex items-center gap-2">
            <span
              className={`p-1 rounded-full ${
                isMyAction ? "bg-amber-200 text-amber-800 animate-pulse" : "bg-slate-200 text-slate-600"
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
            </span>
            <div>
              <span className="font-bold">
                {isMyAction ? "YOUR DIRECT ACTION NEEDED: " : "WAITING ON: "}
              </span>
              <span>{candidate.actionDescription}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                candidate.actionOwner === "recruiter"
                  ? "bg-indigo-100 text-indigo-700"
                  : candidate.actionOwner === "pm"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-200 text-slate-600"
              }`}
            >
              Turn: {candidate.actionOwner}
            </span>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-slate-200 bg-white px-6 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab("loop")}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === "loop"
                ? "border-indigo-600 text-indigo-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <Repeat className="w-3.5 h-3.5" />
            <span>Scheduling & Actions</span>
          </button>

          <button
            onClick={() => setActiveTab("thread")}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === "thread"
                ? "border-indigo-600 text-indigo-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Internal Discussion</span>
            {candidate.thread.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-700">
                {candidate.thread.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("cv")}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === "cv"
                ? "border-indigo-600 text-indigo-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>CV & Profile</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto flex-1 min-h-0 text-xs">
          {/* TAB 1: WORKFLOW & NEGOTIATION LOOP */}
          {activeTab === "loop" && (
            <div className="space-y-6">
              {/* STAGE 1 & 2 ACTIONS: CV Screen & Submit to PM */}
              {candidate.stage === "cv_screening" && (
                <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-indigo-900 text-sm">
                        Step 1: Recruiter Screening & Initial Availability
                      </h4>
                      <p className="text-indigo-800 text-xs mt-0.5">
                        Recruiter has screened {candidate.name}. Ready to pass directly to {pm?.name || "the PM"}?
                      </p>
                    </div>
                    <button
                      onClick={handleSubmitToPM}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
                    >
                      <span>Submit to PM ({pm?.name})</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* STAGE 2 ACTION: Forward to Client */}
              {candidate.stage === "submitted_to_pm" && (
                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-emerald-900 text-sm">
                        Step 2: PM Forward to Client ({client?.name})
                      </h4>
                      <p className="text-emerald-800 text-xs mt-0.5">
                        PM Marcus/Elena: Forward candidate profile and available slots to {client?.contactPerson}.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {currentUser.role === "recruiter" ? (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-emerald-200 text-emerald-800 rounded-lg text-xs font-medium">
                          <Lock className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Submitted to PM. Waiting for PM ({pm?.name || "Client PM"}) to present to {client?.name}.</span>
                        </div>
                      ) : (
                        <button
                          onClick={handleForwardToClient}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
                        >
                          <span>Mark Sent to Client</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* THE DATE NEGOTIATION LOOP SECTION */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                      <Repeat className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">
                        Interview Availability & Negotiation Loop
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Tracks proposed slots between Candidate (via Recruiter) and Client (via PM)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      Loop Round {candidate.negotiationRound}
                    </span>
                  </div>
                </div>

                {/* Rescheduling notice if interview was cancelled or postponed */}
                {candidate.cancellationReason && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2.5">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <div>
                      <span className="font-bold">Interview Rescheduling Notice:</span>
                      <p className="text-amber-800 text-[11px] mt-0.5">
                        Previous interview was postponed/cancelled: "{candidate.cancellationReason}". You can now edit availability slots and propose new dates below.
                      </p>
                    </div>
                  </div>
                )}

                {/* Slots History List */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      Proposed Time Slots:
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {isInterviewConfirmed ? "Slots locked (interview confirmed)" : "Click edit icon to modify any slot"}
                    </span>
                  </div>

                  {candidate.proposedDates.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                      No availability dates recorded yet. Add candidate's slots below.
                    </div>
                  ) : (
                    candidate.proposedDates.map((slot) => {
                      const isCandidate = slot.proposedBy === "candidate";
                      const isEditing = editingSlotId === slot.id;

                      if (isEditing) {
                        return (
                          <div
                            key={slot.id}
                            className="p-3 rounded-lg border border-indigo-300 bg-indigo-50/50 flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
                          >
                            <input
                              type="text"
                              value={editingSlotText}
                              onChange={(e) => setEditingSlotText(e.target.value)}
                              className="flex-1 bg-white border border-indigo-300 rounded px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                            <div className="flex items-center gap-1.5 self-end sm:self-auto">
                              <button
                                type="button"
                                onClick={() => handleSaveEditSlot(slot.id)}
                                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold shadow-2xs"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingSlotId(null);
                                  setEditingSlotText("");
                                }}
                                className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-xs font-medium"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={slot.id}
                          className={`p-3 rounded-lg border flex items-center justify-between transition-colors ${
                            slot.status === "accepted"
                              ? "bg-emerald-50/70 border-emerald-300"
                              : slot.status === "declined"
                              ? "bg-rose-50/50 border-rose-200 opacity-60"
                              : "bg-slate-50 border-slate-200"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Calendar
                              className={`w-4 h-4 ${
                                slot.status === "accepted"
                                  ? "text-emerald-600"
                                  : isCandidate
                                  ? "text-indigo-600"
                                  : "text-amber-600"
                              }`}
                            />
                            <div>
                              <div className="font-semibold text-slate-800 text-xs">
                                {slot.dateStr}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                Proposed by{" "}
                                <strong>{isCandidate ? candidate.name + " (Candidate)" : client?.name + " (Client)"}</strong>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Slot Edit/Delete buttons (allowed before interview is finalized) */}
                            {!isInterviewConfirmed && (
                              <div className="flex items-center gap-1 mr-1">
                                <button
                                  type="button"
                                  onClick={() => handleStartEditSlot(slot)}
                                  className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-200/60 rounded transition-colors"
                                  title="Edit availability slot"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSlot(slot.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                  title="Delete availability slot"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}

                            {slot.status === "accepted" && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                Confirmed & Locked
                              </span>
                            )}
                            {slot.status === "declined" && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-100 text-rose-700">
                                Declined / Rescheduled
                              </span>
                            )}
                            {slot.status === "pending" && !isInterviewConfirmed && (
                              <>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-800">
                                  Pending
                                </span>
                                {currentUser.role === "recruiter" ? (
                                  <span className="text-[10px] text-slate-400 italic font-medium px-1">
                                    PM locks date
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => handleConfirmInterview(slot.dateStr)}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold text-[11px] shadow-2xs transition-colors"
                                  >
                                    Lock This Date
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* The Two Loop Action Boxes OR Confirmed Lock Notice */}
                {isInterviewConfirmed ? (
                  <div className="pt-3 border-t border-slate-100">
                    <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800 shrink-0">
                          <Lock className="w-4 h-4" />
                        </div>
                        <div>
                          <h5 className="font-bold text-xs text-emerald-950">
                            Interview Confirmed & Final: {candidate.scheduledInterview?.confirmedDate || "Locked Slot"}
                          </h5>
                          <p className="text-[11px] text-emerald-800">
                            Once interview is confirmed and final on a particular date, other proposed dates cannot be added from any side. In case of cancellation or postponement, click Cancel/Postpone to provide a reason and reschedule.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setCancelType("cancel");
                          setShowCancelModal(true);
                        }}
                        className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 shadow-2xs self-start sm:self-auto"
                      >
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                        <span>Cancel / Postpone</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                    {/* Recruiter side: Add candidate dates */}
                    <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-indigo-900 text-xs flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-indigo-600" />
                          Candidate Side (Recruiter)
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          placeholder="e.g. Wednesday Oct 15 at 2:00 PM EST"
                          value={newSlotText}
                          onChange={(e) => setNewSlotText(e.target.value)}
                          className="flex-1 bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <button
                          onClick={handleAddCandidateDates}
                          disabled={!newSlotText.trim()}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded font-semibold text-xs transition-colors shrink-0"
                        >
                          Pass to PM
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-500">
                        Enter candidate availability slots here to hand off to {pm?.name || "the PM"}.
                      </p>
                    </div>

                    {/* PM side: Client counter-dates */}
                    <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-900 text-xs flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-amber-600" />
                          Client Side (Project Manager)
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          placeholder="e.g. Thursday Oct 16 at 3:00 PM EST"
                          value={clientCounterText}
                          onChange={(e) => setClientCounterText(e.target.value)}
                          className="flex-1 bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                        <button
                          onClick={handleClientCounterDates}
                          disabled={!clientCounterText.trim()}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded font-semibold text-xs transition-colors shrink-0"
                        >
                          Pass to Recruiter
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-500">
                        If client rejects and offers alternate slots, enter them here to trigger {recruiter?.name}'s action queue.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* SCHEDULED INTERVIEW CARD (Only shown when interview is currently active / scheduled - hidden once interview is done) */}
              {candidate.stage === "interview_scheduled" && candidate.scheduledInterview && (
                <div className="border border-emerald-200 bg-emerald-50/40 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-emerald-600 text-white">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-emerald-950 text-sm">
                          Confirmed Interview Details
                        </h4>
                        <p className="text-emerald-800 text-[11px]">
                          Locked schedule & location coordinates
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setCancelType("cancel");
                          setShowCancelModal(true);
                        }}
                        className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-lg font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-2xs"
                      >
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                        <span>Cancel / Postpone</span>
                      </button>
                      <button
                        onClick={handleMarkInterviewDone}
                        className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold text-xs shadow-xs transition-colors"
                      >
                        Interview Done → Start Debrief
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-3 rounded-lg border border-emerald-200">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase">Agreed Slot</span>
                      <div className="font-bold text-slate-900 text-xs mt-0.5">
                        {candidate.scheduledInterview.confirmedDate}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase">Interviewers</span>
                      <div className="font-semibold text-slate-900 text-xs mt-0.5">
                        {candidate.scheduledInterview.interviewerNames}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase">Mode & Venue</span>
                      <div className="text-slate-800 font-medium text-xs mt-0.5">
                        {candidate.scheduledInterview.interviewType || "In-Person / Office"}
                        {candidate.scheduledInterview.locationOrContact ? ` · ${candidate.scheduledInterview.locationOrContact}` : ""}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* POST-INTERVIEW DEBRIEF SECTION (If in debrief, placed, or rejected) */}
              {(candidate.stage === "post_interview_debrief" ||
                candidate.stage === "placed" ||
                candidate.stage === "rejected") && (
                <div className="border border-purple-200 bg-purple-50/30 rounded-xl p-4 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-purple-100">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-purple-600 text-white">
                        <ThumbsUp className="w-4 h-4" />
                      </span>
                      <div>
                        <h4 className="font-bold text-purple-950 text-sm">
                          Post-Interview Debrief & Alignment
                        </h4>
                        <p className="text-[11px] text-purple-800">
                          Recruiter logs candidate sentiment; PM logs client hiring manager assessment
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Candidate feedback (Recruiter) */}
                    <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 text-xs">
                          Candidate Debrief (Logged by Recruiter {recruiter?.name})
                        </span>
                        <select
                          value={candidateSentiment}
                          onChange={(e) => setCandidateSentiment(e.target.value as any)}
                          className="text-[11px] bg-slate-50 border rounded px-1.5 py-0.5"
                        >
                          <option value="positive">Very Positive</option>
                          <option value="neutral">Neutral</option>
                          <option value="negative">Negative</option>
                        </select>
                      </div>
                      <textarea
                        rows={3}
                        value={candidateDebriefText}
                        onChange={(e) => setCandidateDebriefText(e.target.value)}
                        placeholder="How did the candidate feel? Did they enjoy the technical questions? Any reservations on salary?"
                        className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <button
                        onClick={handleSaveCandidateDebrief}
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-medium text-xs transition-colors"
                      >
                        Save Candidate Notes
                      </button>
                    </div>

                    {/* Client feedback (PM) */}
                    <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 text-xs">
                          Client Feedback (Logged by PM {pm?.name})
                        </span>
                        <select
                          value={clientVerdict}
                          onChange={(e) => setClientVerdict(e.target.value as any)}
                          className="text-[11px] bg-slate-50 border rounded px-1.5 py-0.5"
                        >
                          <option value="proceed">Proceed to Offer / Next</option>
                          <option value="hold">On Hold</option>
                          <option value="reject">Pass / Reject</option>
                        </select>
                      </div>
                      <textarea
                        rows={3}
                        value={clientDebriefText}
                        onChange={(e) => setClientDebriefText(e.target.value)}
                        placeholder="Hiring manager's technical evaluation, cultural assessment, or concerns..."
                        className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                      <button
                        onClick={handleSaveClientDebrief}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium text-xs transition-colors"
                      >
                        Save Client Notes
                      </button>
                    </div>
                  </div>

                  {/* Final decisions */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-purple-100">
                    <button
                      onClick={handleMarkRejected}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-semibold text-xs transition-colors"
                    >
                      Close / Reject Candidate
                    </button>
                    <button
                      onClick={handleMarkPlaced}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>Mark Placed & Hired 🏆</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PRIVATE HANDOFF THREAD */}
          {activeTab === "thread" && (
            <CandidateHandoffThread
              candidate={candidate}
              currentUser={currentUser}
              recruiter={recruiter}
              pm={pm}
              onSendMessage={handleSendMessage}
            />
          )}

          {/* TAB 3: REVISED CV & SCREENING */}
          {activeTab === "cv" && (
            <div className="space-y-4">
              {/* CV File Attachment Box */}
              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-3">
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

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-indigo-600" />
                    <h4 className="font-bold text-slate-900 text-sm">
                      Candidate Original CV / Document
                    </h4>
                  </div>
                  <button
                    onClick={() => cvFileInputRef.current?.click()}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 hover:underline"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{candidate.uploadedCv ? "Replace CV" : "Upload CV"}</span>
                  </button>
                </div>

                {candidate.uploadedCv ? (
                  <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-emerald-600 text-white">
                        <FileCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                          <span>{candidate.uploadedCv.fileName}</span>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {candidate.uploadedCv.fileSize} • Uploaded {candidate.uploadedCv.uploadedAt}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleDownloadCv}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download CV</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => cvFileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-indigo-400 bg-slate-50/50 p-4 rounded-xl text-center cursor-pointer transition-colors"
                  >
                    <Upload className="w-5 h-5 text-indigo-500 mx-auto mb-1" />
                    <p className="text-xs font-semibold text-slate-700">No CV attached yet</p>
                    <p className="text-[11px] text-slate-500">Click to attach candidate's resume (PDF, Word, or TXT)</p>
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm">
                    Recruiter Revised CV Summary & Screening Notes
                  </h4>
                </div>

                <p className="text-slate-700 leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
                  {candidate.revisedCvSummary}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Experience</span>
                    <div className="font-bold text-slate-800 text-xs mt-0.5">
                      {candidate.experienceYears} Years
                    </div>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Current Company</span>
                    <div className="font-bold text-slate-800 text-xs mt-0.5 truncate">
                      {candidate.currentCompany || "Confidential"}
                    </div>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Target Role</span>
                    <div className="font-bold text-indigo-700 text-xs mt-0.5 truncate">
                      {candidate.targetRole}
                    </div>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Target Client</span>
                    <div className="font-bold text-emerald-700 text-xs mt-0.5 truncate">
                      {client?.name}
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <span className="text-[11px] font-bold text-slate-600 block mb-1.5">
                    Verified Competencies:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {candidate.keySkills.map((skill, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <div className="text-slate-500 text-[11px] truncate">
            Candidate ID: <span className="font-mono text-slate-700">{candidate.id}</span> • Assigned Recruiter:{" "}
            <strong>{recruiter?.name}</strong> • Assigned PM: <strong>{pm?.name}</strong>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowEditModal(true)}
              className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5"
            >
              <Pencil className="w-3.5 h-3.5 text-slate-500" />
              <span>Edit Details</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Cancel or Postpone Interview Modal */}
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

      {/* Edit Candidate Modal */}
      {showEditModal && (
        <EditCandidateModal
          isOpen={showEditModal}
          candidate={candidate}
          allClients={allClients}
          allMembers={allMembers}
          currentUser={currentUser}
          onClose={() => setShowEditModal(false)}
          onUpdateCandidate={(updated: Candidate) => {
            onUpdateCandidate(updated);
            setShowEditModal(false);
          }}
          onDeleteCandidate={(candidateId: string) => {
            setShowEditModal(false);
            if (onDeleteCandidate) {
              onDeleteCandidate(candidateId);
            }
          }}
        />
      )}
    </div>
  );
};
