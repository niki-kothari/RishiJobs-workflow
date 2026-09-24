import React, { useState, useMemo, useEffect } from "react";
import { Candidate, TeamMember, ClientCompany, CandidateStage } from "../types";
import {
  SEQUENTIAL_STAGES,
  getStepNumber,
  getStageDefinition,
} from "../utils/pipelineSequence";
import { CandidateCard } from "./CandidateCard";
import {
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Repeat,
  CalendarCheck,
  Award,
  AlertTriangle,
  LayoutGrid,
  List,
  UserCheck,
  ArrowRight,
  ShieldCheck,
  Lock,
  ExternalLink,
  Check,
  X,
} from "lucide-react";

interface PipelineBoardProps {
  candidates: Candidate[];
  currentUser: TeamMember;
  allMembers: TeamMember[];
  allClients: ClientCompany[];
  onSelectCandidate: (candidate: Candidate) => void;
  onUpdateStage?: (candidate: Candidate, newStage: CandidateStage) => void;
  onOpenNewCandidate: () => void;
  onDirectMessageRecruiter?: (recruiterId: string, candidateId: string) => void;
}

export const PipelineBoard: React.FC<PipelineBoardProps> = ({
  candidates,
  currentUser,
  allMembers,
  allClients,
  onSelectCandidate,
  onUpdateStage,
  onOpenNewCandidate,
  onDirectMessageRecruiter,
}) => {
  const isRecruiter = currentUser.role === "recruiter";
  const isTeamX = isRecruiter || currentUser.team?.toLowerCase().includes("team x");
  const recruiters = useMemo(() => allMembers.filter((m) => m.role === "recruiter"), [allMembers]);

  const [scopeFilter, setScopeFilter] = useState<"my_candidates" | "needs_action" | "all_agency">(
    isTeamX ? "my_candidates" : "all_agency"
  );
  const [selectedRecruiterFilter, setSelectedRecruiterFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"kanban" | "grid">("grid");
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);

  // When active user switches, default to "my_candidates" for all Team X members
  useEffect(() => {
    if (isTeamX) {
      setScopeFilter("my_candidates");
    } else {
      setScopeFilter("all_agency");
    }
    setSelectedRecruiterFilter("all");
  }, [currentUser.id, isTeamX]);

  // Active selected candidate to display in the process flow chart above
  const activeCandidate = useMemo(
    () => candidates.find((c) => c.id === selectedCandidateId) || null,
    [candidates, selectedCandidateId]
  );
  const activeCandidateStep = activeCandidate ? getStepNumber(activeCandidate.stage) : null;
  const activeCandidateClient = activeCandidate
    ? allClients.find((cl) => cl.id === activeCandidate.targetClientId)
    : null;

  // Candidates belonging directly to the current user (assigned or added by them)
  const myCandidates = useMemo(() => {
    if (isTeamX) {
      return candidates.filter(
        (c) => c.assignedRecruiterId === currentUser.id || c.addedByRecruiterId === currentUser.id
      );
    }
    if (currentUser.role === "pm") {
      return candidates.filter((c) => c.assignedPmId === currentUser.id);
    }
    return candidates;
  }, [candidates, currentUser, isTeamX]);

  // Candidates that explicitly need action from THIS logged-in user
  const actionRequiredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      if (isTeamX) {
        // Strictly only candidates owned by this Team X member
        const isCandidateOwner =
          c.assignedRecruiterId === currentUser.id || c.addedByRecruiterId === currentUser.id;
        return isCandidateOwner && c.actionOwner === "recruiter";
      }
      if (currentUser.role === "pm") {
        return c.assignedPmId === currentUser.id && c.actionOwner === "pm";
      }
      return c.actionOwner !== "none";
    });
  }, [candidates, currentUser, isTeamX]);

  // Apply scope
  const scopedList = useMemo(() => {
    if (scopeFilter === "needs_action") {
      return actionRequiredCandidates;
    }
    if (scopeFilter === "my_candidates") {
      return myCandidates;
    }
    return candidates;
  }, [scopeFilter, actionRequiredCandidates, myCandidates, candidates]);

  // Apply search, recruiter, and client filters (Process stages are auto-managed and selection is disabled)
  const filteredCandidates = useMemo(() => {
    return scopedList.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.targetRole.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.keySkills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesClient = selectedClientId === "all" || c.targetClientId === selectedClientId;
      const matchesRecruiter =
        selectedRecruiterFilter === "all" ||
        c.assignedRecruiterId === selectedRecruiterFilter;

      return matchesSearch && matchesClient && matchesRecruiter;
    });
  }, [scopedList, searchQuery, selectedClientId, selectedRecruiterFilter]);

  // Pipeline metrics
  const stats = useMemo(() => {
    const baseList = isTeamX && scopeFilter === "my_candidates" ? myCandidates : candidates;
    const inLoop = baseList.filter((c) => c.stage === "date_negotiation").length;
    const scheduled = baseList.filter(
      (c) =>
        c.stage === "interview_scheduled" ||
        (c.interviewRounds && c.interviewRounds.some((r) => r.status === "scheduled"))
    ).length;
    const interviewHappened = baseList.filter(
      (c) =>
        Boolean(c.interviewHappenedAt) ||
        (c.interviewRounds && c.interviewRounds.some((r) => r.status === "completed")) ||
        c.stage === "post_interview_debrief" ||
        c.stage === "offer_stage" ||
        c.stage === "placed"
    ).length;
    const placed = baseList.filter((c) => c.stage === "placed").length;

    // Pending actions count is strictly the actions required from THIS user
    const pendingActions = actionRequiredCandidates.length;

    return { total: baseList.length, inLoop, scheduled, interviewHappened, placed, pendingActions };
  }, [candidates, myCandidates, actionRequiredCandidates, isTeamX, scopeFilter]);

  // Kanban column groupings aligned with sequential steps
  const kanbanColumns: { id: string; label: string; stages: CandidateStage[]; color: string }[] = [
    {
      id: "step1",
      label: "Step 1: Screening",
      stages: ["cv_screening"],
      color: "border-blue-300 bg-blue-50/30",
    },
    {
      id: "step2",
      label: "Step 2: Submit to PM",
      stages: ["submitted_to_pm"],
      color: "border-indigo-300 bg-indigo-50/30",
    },
    {
      id: "step3_4",
      label: "Step 3-4: Client & Dates",
      stages: ["forwarded_to_client", "date_negotiation"],
      color: "border-amber-300 bg-amber-50/30",
    },
    {
      id: "step5",
      label: "Step 5: Interview Locked",
      stages: ["interview_scheduled"],
      color: "border-emerald-300 bg-emerald-50/30",
    },
    {
      id: "step6_7",
      label: "Step 6-7: Debrief & Offer",
      stages: ["post_interview_debrief", "offer_stage"],
      color: "border-purple-300 bg-purple-50/30",
    },
    {
      id: "step8_closed",
      label: "Step 8: Placed / Closed",
      stages: ["placed", "rejected"],
      color: "border-slate-300 bg-slate-50/30",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Metric 1: Needs Action */}
        <div
          onClick={() => setScopeFilter("needs_action")}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            scopeFilter === "needs_action"
              ? "bg-amber-100/70 border-amber-300 ring-2 ring-amber-200"
              : "bg-white border-slate-200 hover:border-amber-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-900">Needs Your Action</span>
            <span className="p-1 rounded-md bg-amber-500 text-white">
              <Clock className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-950">{stats.pendingActions}</span>
            <span className="text-[11px] text-amber-800">awaiting your response</span>
          </div>
        </div>

        {/* Metric 2: In Negotiation Loop */}
        <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">In Date Loop</span>
            <span className="p-1 rounded-md bg-indigo-50 text-indigo-600">
              <Repeat className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{stats.inLoop}</span>
            <span className="text-[11px] text-slate-500">negotiating times</span>
          </div>
        </div>

        {/* Metric 3: Interviews Scheduled */}
        <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">Interviews Locked</span>
            <span className="p-1 rounded-md bg-emerald-50 text-emerald-600">
              <CalendarCheck className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-900">{stats.scheduled}</span>
            <span className="text-[11px] text-emerald-700">calendar invites active</span>
          </div>
        </div>

        {/* Metric 4: Placed */}
        <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">Placed & Hired</span>
            <span className="p-1 rounded-md bg-purple-50 text-purple-600">
              <Award className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-purple-950">{stats.placed}</span>
            <span className="text-[11px] text-purple-700">successful hires 🏆</span>
          </div>
        </div>
      </div>

      {/* Control Bar: Scope tabs + Search + Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Scope Tabs */}
          <div className="flex items-center p-1 rounded-lg bg-slate-100 text-xs font-semibold">
            {isTeamX ? (
              <>
                <button
                  type="button"
                  onClick={() => setScopeFilter("my_candidates")}
                  className={`px-3 py-1.5 rounded-md transition-all ${
                    scopeFilter === "my_candidates"
                      ? "bg-white text-slate-900 shadow-2xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <span>My Candidates ({myCandidates.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setScopeFilter("all_agency")}
                  className={`px-3 py-1.5 rounded-md transition-all ${
                    scopeFilter === "all_agency"
                      ? "bg-white text-slate-900 shadow-2xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <span>All Team X Candidates ({candidates.length})</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setScopeFilter("all_agency")}
                  className={`px-3 py-1.5 rounded-md transition-all ${
                    scopeFilter === "all_agency"
                      ? "bg-white text-slate-900 shadow-2xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <span>All Candidates ({candidates.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setScopeFilter("my_candidates")}
                  className={`px-3 py-1.5 rounded-md transition-all ${
                    scopeFilter === "my_candidates"
                      ? "bg-white text-slate-900 shadow-2xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <span>My Managed ({myCandidates.length})</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => setScopeFilter("needs_action")}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                scopeFilter === "needs_action"
                  ? "bg-amber-500 text-white shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>Action Needed</span>
              {actionRequiredCandidates.length > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    scopeFilter === "needs_action"
                      ? "bg-amber-700 text-white"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {actionRequiredCandidates.length}
                </span>
              )}
            </button>
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <div className="flex items-center p-0.5 rounded-lg border border-slate-200 bg-slate-50">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-md ${
                  viewMode === "grid" ? "bg-white text-indigo-600 shadow-2xs" : "text-slate-400 hover:text-slate-700"
                }`}
                title="Grid Cards View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("kanban")}
                className={`p-1.5 rounded-md ${
                  viewMode === "kanban" ? "bg-white text-indigo-600 shadow-2xs" : "text-slate-400 hover:text-slate-700"
                }`}
                title="Stage Kanban Columns"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Search & Filter dropdowns */}
        <div className={`grid grid-cols-1 ${isTeamX && scopeFilter === "my_candidates" ? "sm:grid-cols-3" : "sm:grid-cols-4"} gap-2.5 pt-1`}>
          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search candidate, role, skill..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Team X Recruiter Filter */}
          {(!isTeamX || scopeFilter === "all_agency") ? (
            <div className="flex items-center gap-1.5">
              <select
                value={selectedRecruiterFilter}
                onChange={(e) => setSelectedRecruiterFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">All Team X Recruiters</option>
                {recruiters.map((rec) => (
                  <option key={rec.id} value={rec.id}>
                    {rec.name} (Team X)
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50/70 border border-indigo-200 rounded-lg text-indigo-900 text-xs font-semibold select-none truncate">
              <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
              <span className="truncate">Showing: My Candidates ({currentUser.name})</span>
            </div>
          )}

          {/* Client Filter */}
          <div className="flex items-center gap-1.5">
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">All Clients</option>
              {allClients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          {/* Stage Selection Disabled Indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 text-xs select-none">
            <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">Stage Selection: <strong>Auto-Flow</strong></span>
          </div>
        </div>
      </div>

      {/* Sequential Process Pipeline Bar (Updates with the status of whichever candidate is clicked/selected) */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs transition-all">
        {activeCandidate ? (
          /* Active Selected Candidate Status Header in Process Flow */
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                {activeCandidate.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-slate-900 text-sm">{activeCandidate.name}</h3>
                  <span className="text-xs text-slate-500 font-medium">({activeCandidate.targetRole})</span>
                  {activeCandidateClient && (
                    <span className="text-xs text-slate-400">· {activeCandidateClient.name}</span>
                  )}
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-600 text-white shadow-2xs">
                    Step {activeCandidateStep} of 8: {getStageDefinition(activeCandidate.stage)?.shortLabel || activeCandidate.stage}
                  </span>
                </div>
                <p className="text-xs text-indigo-900 font-medium mt-0.5">
                  {activeCandidate.actionDescription || getStageDefinition(activeCandidate.stage)?.actionRequired || "Candidate in progress"}
                  {activeCandidate.actionOwner !== "none" && (
                    <span className="ml-1 text-slate-500 font-normal">
                      · Pending: {activeCandidate.actionOwner === "recruiter" ? "Team X Recruiter" : "Client PM"}
                    </span>
                  )}
                </p>

                {/* Milestone audit badges */}
                <div className="flex items-center gap-2 flex-wrap mt-2 pt-2 border-t border-slate-100 text-[11px]">
                  <span className="text-slate-400 font-medium">Milestones:</span>
                  <span className={`px-2 py-0.5 rounded-md border text-[10px] font-semibold ${
                    activeCandidate.cvSubmittedToPmAt
                      ? "bg-indigo-50 border-indigo-200 text-indigo-800"
                      : (activeCandidateStep || 0) > 1
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : "bg-slate-50 border-slate-200 text-slate-400"
                  }`}>
                    CV to PM: {activeCandidate.cvSubmittedToPmAt ? new Date(activeCandidate.cvSubmittedToPmAt).toLocaleDateString() : (activeCandidateStep || 0) > 1 ? "Done ✓" : "Pending"}
                  </span>

                  <span className={`px-2 py-0.5 rounded-md border text-[10px] font-semibold ${
                    activeCandidate.cvSubmittedToClientAt
                      ? "bg-purple-50 border-purple-200 text-purple-800"
                      : (activeCandidateStep || 0) > 2
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : "bg-slate-50 border-slate-200 text-slate-400"
                  }`}>
                    CV to Client: {activeCandidate.cvSubmittedToClientAt ? new Date(activeCandidate.cvSubmittedToClientAt).toLocaleDateString() : (activeCandidateStep || 0) > 2 ? "Submitted ✓" : "Pending"}
                  </span>

                  <span className={`px-2 py-0.5 rounded-md border text-[10px] font-semibold ${
                    activeCandidate.interviewHappenedAt || (activeCandidate.interviewRounds && activeCandidate.interviewRounds.some(r => r.status === "completed"))
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : activeCandidate.scheduledInterview
                      ? "bg-amber-50 border-amber-200 text-amber-800"
                      : "bg-slate-50 border-slate-200 text-slate-400"
                  }`}>
                    Interview: {
                      activeCandidate.interviewHappenedAt
                        ? "Happened ✓ " + new Date(activeCandidate.interviewHappenedAt).toLocaleDateString()
                        : (activeCandidate.interviewRounds && activeCandidate.interviewRounds.length > 0)
                        ? `${activeCandidate.interviewRounds.length} round(s)`
                        : activeCandidate.scheduledInterview
                        ? `Locked: ${activeCandidate.scheduledInterview.confirmedDate}`
                        : "Not Conducted"
                    }
                  </span>

                  {activeCandidate.stage === "placed" && (
                    <span className="px-2 py-0.5 rounded-md border border-emerald-300 bg-emerald-100 text-emerald-900 font-bold text-[10px]">
                      Placed 🏆 {activeCandidate.placedAt ? new Date(activeCandidate.placedAt).toLocaleDateString() : "Hired"}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => onSelectCandidate(activeCandidate)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
                title="Open full candidate profile"
              >
                <span>Open Full Profile</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setSelectedCandidateId(null)}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                title="Deselect to show overall pipeline counts"
              >
                <X className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            </div>
          </div>
        ) : (
          /* Default Pipeline Header (When no candidate is selected) */
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800">Sequential Process Stages</span>
              <span className="text-[11px] text-slate-500">
                (Click any candidate below to trace their progress across Steps 1 → 8 in this flowchart)
              </span>
            </div>
            <span className="text-[10px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded font-semibold flex items-center gap-1">
              <Lock className="w-3 h-3 text-indigo-500" />
              <span>Auto Workflow</span>
            </span>
          </div>
        )}

        {/* 8 Sequential Steps Flowchart */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {SEQUENTIAL_STAGES.map((s, idx) => {
            if (activeCandidate && activeCandidateStep) {
              // Active Candidate Step Mode
              const isCompleted = s.stepNumber < activeCandidateStep;
              const isCurrent = s.stepNumber === activeCandidateStep;

              return (
                <React.Fragment key={s.stage}>
                  <div
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-left shrink-0 transition-all ${
                      isCurrent
                        ? "bg-indigo-600 border-indigo-700 text-white font-bold shadow-sm ring-2 ring-indigo-300 scale-[1.02]"
                        : isCompleted
                        ? "bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold"
                        : "bg-slate-50/80 border-dashed border-slate-200 text-slate-400 font-normal"
                    }`}
                    title={`Step ${s.stepNumber}: ${s.label} - ${
                      isCompleted ? "Completed" : isCurrent ? "Current step reached" : "Upcoming"
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                        isCurrent
                          ? "bg-white text-indigo-700 shadow-2xs"
                          : isCompleted
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      {isCompleted ? <Check className="w-3 h-3 stroke-[3]" /> : s.stepNumber}
                    </span>
                    <span className="whitespace-nowrap">{s.shortLabel}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isCurrent
                          ? "bg-indigo-800 text-white"
                          : isCompleted
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {isCompleted ? "✓ Done" : isCurrent ? "Active" : "Upcoming"}
                    </span>
                  </div>
                  {idx < SEQUENTIAL_STAGES.length - 1 && (
                    <ArrowRight
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isCompleted ? "text-emerald-400" : "text-slate-300"
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            }

            // Global Overview Mode (When no candidate is selected)
            const count = (isTeamX && scopeFilter === "my_candidates" ? myCandidates : candidates).filter((c) => c.stage === s.stage).length;
            return (
              <React.Fragment key={s.stage}>
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-left shrink-0 select-none ${
                    count > 0
                      ? "bg-indigo-50/80 border-indigo-200 text-indigo-950 font-semibold"
                      : "bg-slate-50 border-slate-200 text-slate-600"
                  }`}
                  title={`Step ${s.stepNumber}: ${s.label} (${count} candidates)`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                      count > 0
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {s.stepNumber}
                  </span>
                  <span className="whitespace-nowrap">{s.shortLabel}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      count > 0
                        ? "bg-indigo-200 text-indigo-800"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {count}
                  </span>
                </div>
                {idx < SEQUENTIAL_STAGES.length - 1 && (
                  <ArrowRight className="w-3 h-3 text-slate-300 shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Candidates Render Area */}
      {filteredCandidates.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">No Candidates Found in This Filter</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              {scopeFilter === "needs_action"
                ? "You have 0 pending urgent tasks! You are completely caught up on your candidate loops."
                : "No candidates match the current search or client filter."}
            </p>
          </div>
          <button
            onClick={onOpenNewCandidate}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            Add New Candidate
          </button>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCandidates.map((cand) => (
            <CandidateCard
              key={cand.id}
              candidate={cand}
              currentUser={currentUser}
              allMembers={allMembers}
              allClients={allClients}
              isSelected={selectedCandidateId === cand.id}
              onSelectCandidate={(c) =>
                setSelectedCandidateId((prev) => (prev === c.id ? null : c.id))
              }
              onOpenProfile={onSelectCandidate}
              onUpdateStage={onUpdateStage}
              onDirectMessageRecruiter={onDirectMessageRecruiter}
            />
          ))}
        </div>
      ) : (
        /* KANBAN COLUMNS VIEW */
        <div className="flex gap-3.5 overflow-x-auto pb-4 pt-1">
          {kanbanColumns.map((col) => {
            const colCandidates = filteredCandidates.filter((c) => col.stages.includes(c.stage));

            return (
              <div
                key={col.id}
                className="bg-slate-100/70 border border-slate-200 rounded-xl p-3 flex flex-col min-w-[260px] max-w-[300px] flex-1 shrink-0"
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-700">{col.label}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700">
                    {colCandidates.length}
                  </span>
                </div>

                <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[700px]">
                  {colCandidates.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-[11px] border border-dashed border-slate-200 rounded-lg">
                      Empty
                    </div>
                  ) : (
                    colCandidates.map((cand) => (
                      <CandidateCard
                        key={cand.id}
                        candidate={cand}
                        currentUser={currentUser}
                        allMembers={allMembers}
                        allClients={allClients}
                        isSelected={selectedCandidateId === cand.id}
                        onSelectCandidate={(c) =>
                          setSelectedCandidateId((prev) => (prev === c.id ? null : c.id))
                        }
                        onOpenProfile={onSelectCandidate}
                        onUpdateStage={onUpdateStage}
                        onDirectMessageRecruiter={onDirectMessageRecruiter}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
