import React from "react";
import { Candidate, TeamMember, ClientCompany, CandidateStage } from "../types";
import {
  SEQUENTIAL_STAGES,
  getStepNumber,
  getStageDefinition,
} from "../utils/pipelineSequence";
import {
  Building,
  ArrowRight,
  Clock,
  CheckCircle2,
  Calendar,
  Lock,
  ExternalLink,
  User,
  Zap,
  MessageSquare,
} from "lucide-react";

interface CandidateCardProps {
  candidate: Candidate;
  currentUser: TeamMember;
  allMembers: TeamMember[];
  allClients: ClientCompany[];
  isSelected?: boolean;
  onSelectCandidate?: (candidate: Candidate) => void;
  onOpenProfile: (candidate: Candidate) => void;
  onUpdateStage?: (candidate: Candidate, newStage: CandidateStage) => void;
  onDirectMessageRecruiter?: (recruiterId: string, candidateId: string) => void;
}

export const CandidateCard: React.FC<CandidateCardProps> = ({
  candidate,
  currentUser,
  allMembers,
  allClients,
  isSelected = false,
  onSelectCandidate,
  onOpenProfile,
  onUpdateStage,
  onDirectMessageRecruiter,
}) => {
  const client = allClients.find((c) => c.id === candidate.targetClientId);
  const pm = allMembers.find((m) => m.id === candidate.assignedPmId);
  const recruiter = allMembers.find((m) => m.id === candidate.assignedRecruiterId);

  const isRecruiter = currentUser.role === "recruiter";
  const isCandidateRecruiter =
    isRecruiter &&
    (candidate.assignedRecruiterId === currentUser.id ||
      candidate.addedByRecruiterId === currentUser.id);
  const isPM = currentUser.role === "pm" || currentUser.role === "admin";

  const isMyTurn =
    (isCandidateRecruiter && candidate.actionOwner === "recruiter") ||
    (currentUser.role === "pm" && candidate.actionOwner === "pm");

  const currentStepNumber = getStepNumber(candidate.stage);
  const stageDef = getStageDefinition(candidate.stage);

  // Badge styling per stage
  const getStageBadge = () => {
    switch (candidate.stage) {
      case "cv_screening":
        return { label: "Step 1: Screening", bg: "bg-blue-50 text-blue-700 border-blue-200" };
      case "submitted_to_pm":
        return { label: "Step 2: Submit to PM", bg: "bg-indigo-50 text-indigo-700 border-indigo-200" };
      case "forwarded_to_client":
        return { label: "Step 3: To Client", bg: "bg-purple-50 text-purple-700 border-purple-200" };
      case "date_negotiation":
        return { label: "Step 4: Propose Dates", bg: "bg-amber-50 text-amber-800 border-amber-300" };
      case "interview_scheduled":
        return { label: "Step 5: Scheduled", bg: "bg-emerald-50 text-emerald-800 border-emerald-300" };
      case "post_interview_debrief":
        return { label: "Step 6: Debrief", bg: "bg-fuchsia-50 text-fuchsia-800 border-fuchsia-300" };
      case "offer_stage":
        return { label: "Step 7: Offer", bg: "bg-teal-50 text-teal-800 border-teal-300" };
      case "placed":
        return { label: "Step 8: Placed 🏆", bg: "bg-emerald-100 text-emerald-900 border-emerald-400 font-bold" };
      case "rejected":
        return { label: "Closed", bg: "bg-slate-100 text-slate-600 border-slate-300" };
      default:
        return { label: candidate.stage, bg: "bg-slate-50 text-slate-700 border-slate-200" };
    }
  };

  const badge = getStageBadge();

  // Role-specific quick workflow actions:
  // ONLY the assigned recruiter who added/owns this candidate can submit to PM!
  // Other Team X members (e.g. Dheer viewing Bhavya's candidate) CANNOT submit to PM!
  const canRecruiterSubmit = isCandidateRecruiter && candidate.stage === "cv_screening";
  const canPMForward = isPM && candidate.stage === "submitted_to_pm";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => {
        if (onSelectCandidate) {
          onSelectCandidate(candidate);
        } else {
          onOpenProfile(candidate);
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (onSelectCandidate) {
            onSelectCandidate(candidate);
          } else {
            onOpenProfile(candidate);
          }
        }
      }}
      className={`bg-white rounded-xl border p-4 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group relative select-none ${
        isSelected
          ? "border-indigo-600 ring-2 ring-indigo-500/80 bg-indigo-50/15 shadow-sm"
          : isMyTurn
          ? "border-amber-400 ring-2 ring-amber-100/80 bg-amber-50/10"
          : "border-slate-200 hover:border-indigo-300"
      }`}
      title="Click to track candidate status in the process flow chart above"
    >
      <div>
        {/* Top Bar: Client & Stage Badge */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold truncate">
            <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{client?.name || "Client"}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border shrink-0 ${badge.bg}`}>
              {badge.label}
            </span>
          </div>
        </div>

        {/* Candidate Name & Role */}
        <div className="mb-2">
          <h3 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
            {candidate.name}
          </h3>
          <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
            {candidate.targetRole}
          </p>
        </div>

        {/* Process Step Progression Bar Indicator */}
        <div className="mb-3 bg-slate-50 border border-slate-100 rounded-lg p-2">
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="font-bold text-indigo-700">
              Step {currentStepNumber} of 8 Reached
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              {stageDef?.shortLabel || candidate.stage}
            </span>
          </div>
          {/* Visual step dots */}
          <div className="flex items-center gap-1">
            {SEQUENTIAL_STAGES.map((s) => {
              const isCompleted = s.stepNumber < currentStepNumber;
              const isCurrent = s.stepNumber === currentStepNumber;
              return (
                <div
                  key={s.stepNumber}
                  className={`h-1.5 flex-1 rounded-full transition-all ${
                    isCompleted
                      ? "bg-emerald-500"
                      : isCurrent
                      ? "bg-indigo-600 ring-1 ring-indigo-300"
                      : "bg-slate-200"
                  }`}
                  title={`Step ${s.stepNumber}: ${s.label}`}
                />
              );
            })}
          </div>
        </div>

        {/* Status Indicator Details */}
        {candidate.stage === "interview_scheduled" && candidate.scheduledInterview ? (
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 bg-emerald-50/70 border border-emerald-200 rounded-lg px-2.5 py-1.5 mb-3 font-medium">
            <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">{candidate.scheduledInterview.confirmedDate}</span>
          </div>
        ) : isMyTurn ? (
          <div className="flex items-center gap-1.5 text-[11px] text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 mb-3 font-semibold">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping shrink-0" />
            <span className="truncate">{candidate.actionDescription || "Action needed from you"}</span>
          </div>
        ) : (currentUser.role === "pm" || currentUser.role === "admin") && candidate.actionOwner === "recruiter" ? (
          <div className="flex items-center justify-between gap-1.5 text-[11px] text-amber-900 bg-amber-50/80 border border-amber-200 rounded-lg px-2.5 py-1.5 mb-3">
            <div className="flex items-center gap-1.5 truncate">
              <Clock className="w-3 h-3 text-amber-600 shrink-0" />
              <span className="truncate font-medium">
                Waiting on {recruiter?.name?.split(" ")[0] || "Team X"}
              </span>
            </div>
            {onDirectMessageRecruiter && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDirectMessageRecruiter(candidate.assignedRecruiterId, candidate.id);
                }}
                className="px-2 py-0.5 rounded bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-[10px] flex items-center gap-1 border border-rose-300 transition-colors shrink-0 shadow-2xs"
                title={`Directly message ${recruiter?.name || "recruiter"} to move process forward`}
              >
                <Zap className="w-2.5 h-2.5" />
                <span>Nudge</span>
              </button>
            )}
          </div>
        ) : (
          <div className="text-[11px] text-slate-500 mb-3 truncate flex items-center justify-between gap-1">
            <div className="truncate flex items-center gap-1">
              <span className="text-slate-400">Recruiter:</span> {recruiter?.name?.split(" ")[0]}
              <span className="text-slate-300">·</span>
              <span className="text-slate-400">PM:</span> {pm?.name?.split(" ")[0]}
            </div>
            {(currentUser.role === "pm" || currentUser.role === "admin") && onDirectMessageRecruiter && candidate.stage !== "placed" && candidate.stage !== "rejected" && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDirectMessageRecruiter(candidate.assignedRecruiterId, candidate.id);
                }}
                className="text-[10px] font-semibold text-slate-500 hover:text-indigo-600 flex items-center gap-0.5"
                title={`Chat with ${recruiter?.name || "recruiter"}`}
              >
                <MessageSquare className="w-3 h-3" />
                <span>Chat</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer: Quick Actions + Explicit "Open Profile" Link in the Box */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
        {canRecruiterSubmit && onUpdateStage ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onUpdateStage(candidate, "submitted_to_pm");
            }}
            className="py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <span>Submit to PM</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : canPMForward && onUpdateStage ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onUpdateStage(candidate, "forwarded_to_client");
            }}
            className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <span>Forward to Client</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : isRecruiter && !isCandidateRecruiter && candidate.stage === "cv_screening" ? (
          <span
            className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5"
            title={`Candidate of ${recruiter?.name || "Bhavya"}. Only ${recruiter?.name || "Bhavya"} can submit CV to PM.`}
          >
            <Lock className="w-3 h-3 text-slate-400" />
            <span>{recruiter?.name || "Bhavya"}'s Candidate</span>
          </span>
        ) : (
          <span className="text-[11px] text-slate-500 font-medium">
            Step {currentStepNumber}/8
          </span>
        )}

        {/* EXPLICIT OPEN PROFILE LINK: Opens full profile ONLY when clicked */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenProfile(candidate);
          }}
          className="py-1.5 px-3 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs shrink-0"
          title="Open candidate full profile details"
        >
          <span>Open Profile</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
