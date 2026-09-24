import React, { useState } from "react";
import { Candidate, TeamMember, ClientCompany, CandidateStage } from "../types";
import { SEQUENTIAL_STAGES, canTransitionToStage, getStepNumber } from "../utils/pipelineSequence";
import { X, User, Briefcase, Mail, Phone, Building, DollarSign, Clock, FileText, Check, Lock } from "lucide-react";

interface EditCandidateModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate;
  allMembers: TeamMember[];
  allClients: ClientCompany[];
  currentUser: TeamMember;
  onUpdateCandidate: (updated: Candidate) => void;
  onDeleteCandidate?: (candidateId: string) => void;
}

export const EditCandidateModal: React.FC<EditCandidateModalProps> = ({
  isOpen,
  onClose,
  candidate,
  allMembers,
  allClients,
  currentUser,
  onUpdateCandidate,
  onDeleteCandidate,
}) => {
  if (!isOpen) return null;

  const isRecruiter = currentUser.role === "recruiter";
  const isTeamX = currentUser.role === "recruiter" || Boolean(currentUser.team?.toLowerCase().includes("team x"));
  const currentStepNumber = getStepNumber(candidate.stage);
  const recruiters = allMembers.filter((m) => m.role === "recruiter");
  const pms = allMembers.filter((m) => m.role === "pm");
  const candidateRecruiter = allMembers.find((m) => m.id === candidate.assignedRecruiterId);
  const isCandidateOwner = !isRecruiter || candidate.assignedRecruiterId === currentUser.id;

  const [name, setName] = useState(candidate.name);
  const [targetRole, setTargetRole] = useState(candidate.targetRole);
  const [email, setEmail] = useState(candidate.email || "");
  const [phone, setPhone] = useState(candidate.phone);
  const [currentCompany, setCurrentCompany] = useState(candidate.currentCompany || "");
  const [experienceYears, setExperienceYears] = useState(candidate.experienceYears.toString());
  const [expectedSalary, setExpectedSalary] = useState(candidate.expectedSalary || "");
  const [noticePeriod, setNoticePeriod] = useState(candidate.noticePeriod || "30 days");
  const [location, setLocation] = useState(candidate.location || "Remote");
  const [skillsStr, setSkillsStr] = useState(candidate.keySkills.join(", "));
  const [screeningNotes, setScreeningNotes] = useState(candidate.screeningNotes || "");
  const [targetClientId, setTargetClientId] = useState(candidate.targetClientId);
  const [assignedRecruiterId, setAssignedRecruiterId] = useState(candidate.assignedRecruiterId);
  const [assignedPmId, setAssignedPmId] = useState(candidate.assignedPmId);
  const [stage, setStage] = useState<CandidateStage>(candidate.stage);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !targetRole.trim()) return;

    if (isRecruiter && !isCandidateOwner) {
      alert(`Permission Denied: This candidate is owned by ${candidateRecruiter?.name || "Bhavya"}. Only ${candidateRecruiter?.name || "Bhavya"} or a Project Manager can modify their profile.`);
      return;
    }

    const skillsArray = skillsStr
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const updated: Candidate = {
      ...candidate,
      name: name.trim(),
      targetRole: targetRole.trim(),
      email: email.trim(),
      phone: phone.trim(),
      currentCompany: currentCompany.trim(),
      experienceYears: parseFloat(experienceYears) || 0,
      expectedSalary: expectedSalary.trim(),
      noticePeriod: noticePeriod.trim(),
      location: location.trim(),
      keySkills: skillsArray.length > 0 ? skillsArray : candidate.keySkills,
      screeningNotes: screeningNotes.trim(),
      targetClientId,
      // Retain the true assigned recruiter unless explicitly changed by PM or Admin
      assignedRecruiterId:
        currentUser.role === "admin" || currentUser.role === "pm"
          ? assignedRecruiterId
          : candidate.assignedRecruiterId,
      assignedPmId,
      stage,
      updatedAt: new Date().toISOString(),
    };

    onUpdateCandidate(updated);
    onClose();
  };

  const handleDelete = () => {
    if (onDeleteCandidate) {
      onDeleteCandidate(candidate.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full overflow-hidden border border-slate-200 my-auto">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-base font-bold text-slate-900">Update Candidate Details</h3>
            <p className="text-xs text-slate-500">Edit candidate profile, assignments, and status</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Candidate Full Name *</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Target Role / Designation *</label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Contact Phone *</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Experience & Current Company */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Current Company</label>
              <input
                type="text"
                value={currentCompany}
                onChange={(e) => setCurrentCompany(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Experience (Years)</label>
              <input
                type="number"
                step="any"
                min="0"
                max="50"
                value={experienceYears}
                onChange={(e) => setExperienceYears(e.target.value)}
                placeholder="e.g. 3.5"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Expected Salary</label>
              <input
                type="text"
                value={expectedSalary}
                onChange={(e) => setExpectedSalary(e.target.value)}
                placeholder="e.g. ₹24 LPA / $120k"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Notice Period & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Notice Period</label>
              <input
                type="text"
                value={noticePeriod}
                onChange={(e) => setNoticePeriod(e.target.value)}
                placeholder="e.g. Immediate, 15 days, 30 days"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Location / Preference</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Bangalore, Mumbai, Remote"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Key Skills */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Key Skills (comma-separated)</label>
            <input
              type="text"
              value={skillsStr}
              onChange={(e) => setSkillsStr(e.target.value)}
              placeholder="e.g. React, Node.js, TypeScript, AWS"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Target Client & Pipeline Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Target Client Company * {currentStepNumber > 1 && <span className="text-[11px] font-normal text-slate-500">(Locked)</span>}
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <select
                  disabled={currentStepNumber > 1}
                  value={targetClientId}
                  onChange={(e) => setTargetClientId(e.target.value)}
                  className={`w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    currentStepNumber > 1 ? "cursor-not-allowed opacity-75 bg-slate-100" : ""
                  }`}
                  title={currentStepNumber > 1 ? "Target client company was locked during Step 1 screening and cannot be modified" : ""}
                >
                  {allClients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name} ({client.industry})
                    </option>
                  ))}
                </select>
              </div>
              {currentStepNumber > 1 && (
                <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-slate-400" />
                  Target client finalized during Step 1 screening and locked.
                </p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Current Pipeline Stage (Auto-Managed)
              </label>
              <div className="space-y-1">
                <div className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 text-xs font-semibold flex items-center justify-between opacity-95 cursor-not-allowed select-none">
                  <div className="flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-slate-500" />
                    <span>{SEQUENTIAL_STAGES.find((s) => s.stage === candidate.stage)?.label || candidate.stage}</span>
                  </div>
                  <span className="text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded font-medium">
                    Auto-Managed
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Pipeline status is strictly auto-managed as the workflow steps proceed in proper sequential order.
                </p>
              </div>
            </div>
          </div>

          {/* Assignment pair */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Assigned Recruiter (Team X)</label>
              {isRecruiter ? (
                <div className={`px-3 py-2 border rounded-lg font-semibold text-xs flex items-center justify-between gap-2 ${
                  isCandidateOwner
                    ? "bg-indigo-50/70 border-indigo-200 text-indigo-900"
                    : "bg-amber-50 border-amber-200 text-amber-900"
                }`}>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${isCandidateOwner ? "bg-indigo-600" : "bg-amber-600"}`} />
                    <span>{candidateRecruiter?.name || "Bhavya"} (Assigned Recruiter)</span>
                  </div>
                  {!isCandidateOwner && (
                    <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-bold">
                      Read-Only for Other Recruiters
                    </span>
                  )}
                </div>
              ) : (
                <select
                  value={assignedRecruiterId}
                  onChange={(e) => setAssignedRecruiterId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {recruiters.map((rec) => (
                    <option key={rec.id} value={rec.id}>
                      {rec.name} ({rec.team})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Assigned Client PM</label>
              <select
                value={assignedPmId}
                onChange={(e) => setAssignedPmId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {pms.map((pm) => (
                  <option key={pm.id} value={pm.id}>
                    {pm.name} ({pm.role.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Screening Notes */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Internal Screening Notes</label>
            <textarea
              rows={3}
              value={screeningNotes}
              onChange={(e) => setScreeningNotes(e.target.value)}
              placeholder="Candidate background, salary expectations, interview notes..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* Delete Confirmation Box */}
          {showDeleteConfirm && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-2">
              <p className="font-bold text-rose-900 text-xs">
                Are you sure you want to delete candidate "{candidate.name}"?
              </p>
              <p className="text-[11px] text-rose-700">
                This will permanently delete this candidate record, interview logs, and internal discussion thread.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                >
                  Yes, Permanently Delete
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <div>
              {onDeleteCandidate && !showDeleteConfirm && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-3 py-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg font-semibold transition-colors"
                >
                  Delete Candidate
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold shadow-xs transition-colors inline-flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
