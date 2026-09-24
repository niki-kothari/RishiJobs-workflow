import React, { useState } from "react";
import { Candidate, TeamMember, ClientCompany } from "../../types";
import {
  Calendar,
  Clock,
  Building,
  User,
  CheckCircle2,
  ExternalLink,
  MessageSquare,
  MapPin,
  Phone,
} from "lucide-react";

interface InterviewsViewProps {
  candidates: Candidate[];
  members: TeamMember[];
  clients: ClientCompany[];
  currentUser?: TeamMember;
  onSelectCandidate: (candidate: Candidate) => void;
}

export const InterviewsView: React.FC<InterviewsViewProps> = ({
  candidates,
  members,
  clients,
  currentUser,
  onSelectCandidate,
}) => {
  const isRecruiter = currentUser?.role === "recruiter";
  const isTeamX = isRecruiter || currentUser?.team?.toLowerCase().includes("team x");

  const visibleCandidates = candidates.filter((c) => {
    if (isTeamX && currentUser) {
      return (
        c.assignedRecruiterId === currentUser.id ||
        c.addedByRecruiterId === currentUser.id
      );
    }
    return true;
  });

  const scheduledCandidates = visibleCandidates.filter(
    (c) =>
      c.stage === "interview_scheduled" ||
      c.stage === "post_interview_debrief" ||
      c.stage === "offer_stage" ||
      c.stage === "placed"
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">
          Interview Calendar & Debriefs ({scheduledCandidates.length})
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          All confirmed client interview rounds, schedules, location/contact details, and debrief feedback
        </p>
      </div>

      {scheduledCandidates.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-sm">No Scheduled Interviews Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            When candidates accept a client date in the negotiation loop, they lock into this calendar with meeting details and pre-interview checklists.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {scheduledCandidates.map((cand) => {
            const client = clients.find((c) => c.id === cand.targetClientId);
            const recruiter = members.find((m) => m.id === cand.assignedRecruiterId);
            const pm = members.find((m) => m.id === cand.assignedPmId);
            const interview = cand.scheduledInterview;

            const isDebriefDone = Boolean(
              cand.debrief?.candidateFeedback || cand.debrief?.clientFeedback
            );

            return (
              <div
                key={cand.id}
                onClick={() => onSelectCandidate(cand)}
                className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs hover:shadow-md transition-all cursor-pointer space-y-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{cand.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{cand.targetRole}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Locked</span>
                  </span>
                </div>

                {/* Confirmed date badge */}
                <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-200 flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
                  <div className="truncate">
                    <div className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider">
                      Confirmed Interview Slot
                    </div>
                    <div className="text-xs font-bold text-indigo-950 truncate">
                      {interview?.confirmedDate || "Scheduled Date"}
                    </div>
                  </div>
                </div>

                {/* Meeting & Client info */}
                <div className="text-xs space-y-1.5 text-slate-600">
                  <div className="flex items-center gap-2">
                    <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Client: <strong className="text-slate-800">{client?.name || "Client"}</strong></span>
                  </div>

                  <div className="flex items-center gap-2 text-indigo-700">
                    {interview?.interviewType === "Phone Call" ? (
                      <Phone className="w-3.5 h-3.5 shrink-0" />
                    ) : (
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                    )}
                    <span>
                      Mode: <strong>{interview?.interviewType || "In-Person / Office"}</strong>
                      {interview?.locationOrContact ? ` (${interview.locationOrContact})` : ""}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-500">
                    <span>Recruiter: <strong className="text-slate-700">{recruiter?.name}</strong></span>
                    <span>•</span>
                    <span>PM: <strong className="text-slate-700">{pm?.name}</strong></span>
                  </div>
                </div>

                {/* Debrief Status */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-[11px]">
                    {isDebriefDone ? (
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Debrief Logged
                      </span>
                    ) : (
                      <span className="text-amber-700 font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Awaiting Post-Interview Debrief
                      </span>
                    )}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectCandidate(cand);
                    }}
                    className="font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    Open Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
