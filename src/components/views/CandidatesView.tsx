import React, { useState, useMemo, useEffect } from "react";
import { Candidate, TeamMember, ClientCompany, CandidateStage } from "../../types";
import { EditCandidateModal } from "../EditCandidateModal";
import {
  Search,
  Filter,
  Plus,
  FileText,
  Download,
  Calendar,
  Building,
  User,
  CheckCircle2,
  AlertCircle,
  Clock,
  Briefcase,
  Paperclip,
  Pencil,
  Trash2,
  Lock,
} from "lucide-react";

interface CandidatesViewProps {
  candidates: Candidate[];
  allMembers: TeamMember[];
  allClients: ClientCompany[];
  currentUser: TeamMember;
  onSelectCandidate: (candidate: Candidate) => void;
  onOpenNewCandidate: () => void;
  onUpdateCandidate?: (updated: Candidate) => void;
  onDeleteCandidate?: (candidateId: string) => void;
}

export const CandidatesView: React.FC<CandidatesViewProps> = ({
  candidates,
  allMembers,
  allClients,
  currentUser,
  onSelectCandidate,
  onOpenNewCandidate,
  onUpdateCandidate,
  onDeleteCandidate,
}) => {
  const isRecruiter = currentUser.role === "recruiter";
  const isTeamX = isRecruiter || currentUser.team?.toLowerCase().includes("team x");

  const [searchTerm, setSearchTerm] = useState("");
  const [scope, setScope] = useState<"all" | "my">(isTeamX ? "my" : "all");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [recruiterFilter, setRecruiterFilter] = useState<string>("all");
  const [cvOnlyFilter, setCvOnlyFilter] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [deletingCandidate, setDeletingCandidate] = useState<Candidate | null>(null);

  // When active user switches, default to "my" for all Team X members
  useEffect(() => {
    if (isTeamX) {
      setScope("my");
    } else {
      setScope("all");
    }
    setRecruiterFilter("all");
  }, [currentUser.id, isTeamX]);

  const recruiters = allMembers.filter((m) => m.role === "recruiter");

  // Candidates belonging directly to currentUser (assigned or added by them)
  const myCandidatesCount = useMemo(() => {
    return candidates.filter(
      (c: Candidate) =>
        c.assignedRecruiterId === currentUser.id ||
        c.addedByRecruiterId === currentUser.id
    ).length;
  }, [candidates, currentUser.id]);

  const visibleCandidates = useMemo<Candidate[]>(() => {
    if (scope === "my") {
      return candidates.filter(
        (c: Candidate) =>
          c.assignedRecruiterId === currentUser.id ||
          c.addedByRecruiterId === currentUser.id
      );
    }
    return candidates;
  }, [candidates, scope, currentUser.id]);

  const filteredCandidates = visibleCandidates.filter((c: Candidate) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.targetRole.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.keySkills.some((s: string) => s.toLowerCase().includes(searchTerm.toLowerCase())) ||
      c.currentCompany?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStage = stageFilter === "all" || c.stage === stageFilter;
    const matchesClient = clientFilter === "all" || c.targetClientId === clientFilter;
    const matchesRecruiter =
      recruiterFilter === "all" || c.assignedRecruiterId === recruiterFilter;
    const matchesCv = !cvOnlyFilter || Boolean(c.uploadedCv);

    return matchesSearch && matchesStage && matchesClient && matchesRecruiter && matchesCv;
  });

  const getStageBadge = (stage: CandidateStage) => {
    switch (stage) {
      case "cv_screening":
        return { label: "CV Screening", bg: "bg-blue-50 text-blue-700 border-blue-200" };
      case "submitted_to_pm":
        return { label: "Submitted to PM", bg: "bg-amber-50 text-amber-700 border-amber-200" };
      case "forwarded_to_client":
        return { label: "Sent to Client", bg: "bg-indigo-50 text-indigo-700 border-indigo-200" };
      case "date_negotiation":
        return { label: "Date Loop", bg: "bg-purple-50 text-purple-700 border-purple-200" };
      case "interview_scheduled":
        return { label: "Interview Locked", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" };
      case "post_interview_debrief":
        return { label: "Post-Debrief", bg: "bg-cyan-50 text-cyan-700 border-cyan-200" };
      case "offer_stage":
        return { label: "Offer Stage", bg: "bg-teal-50 text-teal-700 border-teal-200" };
      case "placed":
        return { label: "Placed & Hired", bg: "bg-green-50 text-green-700 border-green-200" };
      case "rejected":
        return { label: "Closed / Rejected", bg: "bg-slate-100 text-slate-600 border-slate-200" };
      default:
        return { label: stage, bg: "bg-slate-100 text-slate-700 border-slate-200" };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            {scope === "my"
              ? isTeamX
                ? `My Candidates (${filteredCandidates.length})`
                : `My Assigned Candidates (${filteredCandidates.length})`
              : isTeamX
              ? `All Team X Candidates (${filteredCandidates.length})`
              : `Candidates Directory (${filteredCandidates.length})`}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {scope === "my"
              ? `Candidates owned and managed specifically by ${currentUser.name}`
              : isTeamX
              ? "All candidates across Team X recruiters with complete process history"
              : "All candidates across the organization"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Scope Tabs */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 text-xs font-semibold">
            {isTeamX ? (
              <>
                <button
                  type="button"
                  onClick={() => setScope("my")}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    scope === "my"
                      ? "bg-white text-slate-900 shadow-2xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <span>My Candidates ({myCandidatesCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setScope("all")}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    scope === "all"
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
                  onClick={() => setScope("all")}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    scope === "all"
                      ? "bg-white text-slate-900 shadow-2xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <span>All Candidates ({candidates.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setScope("my")}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    scope === "my"
                      ? "bg-white text-slate-900 shadow-2xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <span>My Assigned ({myCandidatesCount})</span>
                </button>
              </>
            )}
          </div>

          <button
            onClick={onOpenNewCandidate}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Candidate</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search candidate name, role, skills (e.g. React, AWS), company..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Recruiter filter */}
            {(!isTeamX || scope === "all") ? (
              <select
                value={recruiterFilter}
                onChange={(e) => setRecruiterFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Team X Recruiters</option>
                {recruiters.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} (Team X)
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50/70 border border-indigo-200 rounded-xl text-indigo-900 text-xs font-semibold select-none">
                <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                <span>My Candidates ({currentUser.name})</span>
              </div>
            )}

            {/* Client filter */}
            {allClients.length > 0 && (
              <select
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Clients</option>
                {allClients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}

            {/* CV only toggle */}
            <button
              onClick={() => setCvOnlyFilter(!cvOnlyFilter)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
                cvOnlyFilter
                  ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <Paperclip className="w-3.5 h-3.5" />
              <span>With CV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Candidate List / Cards */}
      {filteredCandidates.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">No Candidates Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              {candidates.length === 0
                ? "Your candidate database is currently empty. Click below to add your first candidate along with their CV."
                : "No candidates match the selected filters or search query."}
            </p>
          </div>
          <button
            onClick={onOpenNewCandidate}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Candidate</span>
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Candidate</th>
                  <th className="py-3.5 px-4 font-bold">Target Client & Role</th>
                  <th className="py-3.5 px-4 font-bold">Assigned Pair</th>
                  <th className="py-3.5 px-4 font-bold">Current Stage</th>
                  <th className="py-3.5 px-4 font-bold">Attached CV</th>
                  <th className="py-3.5 px-4 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCandidates.map((cand: Candidate) => {
                  const client = allClients.find((c) => c.id === cand.targetClientId);
                  const recruiter = allMembers.find((m) => m.id === cand.assignedRecruiterId);
                  const pm = allMembers.find((m) => m.id === cand.assignedPmId);
                  const badge = getStageBadge(cand.stage);

                  return (
                    <tr
                      key={cand.id}
                      onClick={() => onSelectCandidate(cand)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                    >
                      {/* Name & phone */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {cand.name}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {cand.phone} • {cand.experienceYears}y exp
                        </div>
                      </td>

                      {/* Client & Role */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          <span>{client?.name || "Client Account"}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{cand.targetRole}</div>
                      </td>

                      {/* Recruiter & PM */}
                      <td className="py-3 px-4">
                        <div className="text-slate-700">
                          Recruiter: <strong className="font-semibold">{recruiter?.name || "Bhavya"}</strong>
                        </div>
                        <div className="text-slate-500 text-[11px]">
                          PM: <strong className="font-semibold text-slate-700">{pm?.name || "Shweta"}</strong>
                        </div>
                      </td>

                      {/* Stage Badge - Auto-Managed by workflow for all roles */}
                      <td className="py-3 px-4">
                        <div className="inline-flex items-center gap-1.5">
                          <span
                            className={`text-[11px] font-bold rounded-lg px-2.5 py-1 border ${badge.bg} flex items-center gap-1.5 select-none opacity-95`}
                            title="Pipeline stage is auto-managed as workflow steps proceed in proper sequential order."
                          >
                            <Lock className="w-3 h-3 text-slate-400" />
                            <span>{badge.label}</span>
                          </span>
                        </div>
                        {cand.actionOwner !== "none" && (
                          <div className="text-[10px] text-amber-700 font-medium mt-1">
                            ⚡ Action: {cand.actionOwner === "recruiter" ? "Recruiter" : "PM"}
                          </div>
                        )}
                      </td>

                      {/* CV Status */}
                      <td className="py-3 px-4">
                        {cand.uploadedCv ? (
                          <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-[11px]">
                            <FileText className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="truncate max-w-[120px]" title={cand.uploadedCv.fileName}>
                              {cand.uploadedCv.fileName}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">No file attached</span>
                        )}
                      </td>

                      {/* Actions: Edit, Delete, Open */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setEditingCandidate(cand)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit candidate profile & details"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          {onDeleteCandidate && (
                            <button
                              onClick={() => setDeletingCandidate(cand)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Delete candidate"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => onSelectCandidate(cand)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 font-semibold rounded-lg text-xs transition-colors"
                          >
                            Open
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Candidate Modal */}
      {editingCandidate && (
        <EditCandidateModal
          isOpen={!!editingCandidate}
          candidate={editingCandidate}
          allClients={allClients}
          allMembers={allMembers}
          currentUser={currentUser}
          onClose={() => setEditingCandidate(null)}
          onUpdateCandidate={(updated: Candidate) => {
            if (onUpdateCandidate) {
              onUpdateCandidate(updated);
            }
            setEditingCandidate(null);
          }}
          onDeleteCandidate={(candidateId: string) => {
            setEditingCandidate(null);
            if (onDeleteCandidate) {
              onDeleteCandidate(candidateId);
            }
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deletingCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-100 text-rose-600 rounded-xl">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Candidate</h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              Are you sure you want to permanently delete <strong>{deletingCandidate.name}</strong>?
              All candidate data, internal discussions, and attached files will be removed.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingCandidate(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteCandidate) {
                    onDeleteCandidate(deletingCandidate.id);
                  }
                  setDeletingCandidate(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
              >
                Delete Candidate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
