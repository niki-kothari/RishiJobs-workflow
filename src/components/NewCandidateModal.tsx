import React, { useState, useRef } from "react";
import { Candidate, TeamMember, ClientCompany, DateOption, UploadedCvFile } from "../types";
import {
  X,
  Sparkles,
  Plus,
  Trash2,
  User,
  Building,
  Calendar,
  FileText,
  Upload,
  FileCheck,
  Paperclip,
  CheckCircle2,
  Lock,
} from "lucide-react";

interface NewCandidateModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: TeamMember;
  allMembers: TeamMember[];
  allClients: ClientCompany[];
  onAddCandidate: (newCandidate: Candidate) => void;
  onOpenAddClient?: () => void;
}

export const NewCandidateModal: React.FC<NewCandidateModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  allMembers,
  allClients,
  onAddCandidate,
  onOpenAddClient,
}) => {
  const recruiters = allMembers.filter((m) => m.role === "recruiter");
  const pms = allMembers.filter((m) => m.role === "pm");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [targetClientId, setTargetClientId] = useState(allClients[0]?.id || "");
  const [customClientName, setCustomClientName] = useState("");
  const [targetRole, setTargetRole] = useState(
    allClients[0]?.activeRoles?.[0] || "Senior Software Engineer"
  );
  const [assignedRecruiterId, setAssignedRecruiterId] = useState(
    currentUser.role === "recruiter" ? currentUser.id : recruiters[0]?.id || "rec-1"
  );
  const [experienceYears, setExperienceYears] = useState("5");
  const [currentCompany, setCurrentCompany] = useState("");
  const [skillsText, setSkillsText] = useState("React, Node.js, TypeScript, PostgreSQL");
  const [screeningNotes, setScreeningNotes] = useState("");
  const [slots, setSlots] = useState<string[]>([
    "Monday at 10:00 AM IST",
    "Tuesday at 3:00 PM IST",
  ]);
  const [newSlotInput, setNewSlotInput] = useState("");
  const [aiPolishing, setAiPolishing] = useState(false);

  // CV Upload State
  const [uploadedCv, setUploadedCv] = useState<UploadedCvFile | undefined>(undefined);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const selectedClient = allClients.find((c) => c.id === targetClientId);

  const handleFileUpload = (file: File) => {
    if (!file) return;

    const formatSize = (bytes: number) => {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setUploadedCv({
        fileName: file.name,
        fileSize: formatSize(file.size),
        fileType: file.type || "application/pdf",
        uploadedAt: new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        fileDataUrl: dataUrl,
      });

      // Auto-populate candidate name if name is empty and filename looks like "First_Last_CV.pdf"
      if (!name.trim()) {
        const cleanName = file.name
          .replace(/[-_]/g, " ")
          .replace(/\.(pdf|docx|doc|txt)/i, "")
          .replace(/\b(cv|resume|profile)\b/gi, "")
          .trim();
        if (cleanName) {
          setName(cleanName);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleAddSlot = () => {
    if (!newSlotInput.trim()) return;
    setSlots([...slots, newSlotInput.trim()]);
    setNewSlotInput("");
  };

  const handleRemoveSlot = (index: number) => {
    setSlots(slots.filter((_, i) => i !== index));
  };

  const handleAIPolish = async () => {
    if (!screeningNotes.trim()) {
      alert("Please enter initial screening notes or candidate background first.");
      return;
    }
    setAiPolishing(true);
    try {
      const skillsArray = skillsText.split(",").map((s) => s.trim());
      const res = await fetch("/api/ai/pitch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateName: name || "Candidate",
          role: targetRole,
          experienceYears,
          currentCompany,
          keySkills: skillsArray,
          screeningNotes,
        }),
      });
      const data = await res.json();
      if (data.summary) {
        setScreeningNotes(
          `${data.summary}\n\nKey Highlights:\n${
            data.keyHighlights?.map((h: string) => `- ${h}`).join("\n") || ""
          }`
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAiPolishing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Determine target client
    const clientId = targetClientId || (allClients[0]?.id ?? "client-custom");
    const chosenPmId =
      selectedClient?.assignedPmId || pms[0]?.id || "pm-1";

    const proposedDates: DateOption[] = slots.map((s, idx) => ({
      id: `d-${Date.now()}-${idx}`,
      dateStr: s,
      proposedBy: "candidate",
      status: "pending",
      createdAt: new Date().toISOString(),
    }));

    const newCandidate: Candidate = {
      id: "cand-" + Date.now(),
      name: name.trim(),
      email:
        email.trim() ||
        `${name.toLowerCase().replace(/\s+/g, ".")}@example.com`,
      phone: phone.trim() || "+91 98000 11223",
      targetRole: targetRole.trim() || "Software Engineer",
      targetClientId: clientId,
      assignedRecruiterId: currentUser.role === "recruiter" ? currentUser.id : assignedRecruiterId,
      addedByRecruiterId: currentUser.role === "recruiter" ? currentUser.id : assignedRecruiterId,
      assignedPmId: chosenPmId,
      stage: "cv_screening",
      actionOwner: "recruiter",
      actionDescription: "Review revised CV highlights & submit to PM",
      experienceYears: parseFloat(experienceYears) || 0,
      keySkills: skillsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      currentCompany: currentCompany.trim(),
      revisedCvSummary:
        screeningNotes.trim() ||
        `${name} has ${experienceYears} years experience in ${targetRole}. Screened and CV uploaded by recruiter.`,
      uploadedCv,
      proposedDates,
      negotiationRound: 1,
      debrief: {},
      thread: [
        {
          id: "m-" + Date.now(),
          senderId: currentUser.id,
          senderName: currentUser.name,
          senderRole: currentUser.role,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          text: `Candidate onboarded. ${
            uploadedCv ? `Attached CV: ${uploadedCv.fileName}. ` : ""
          }${slots.length} available interview slots recorded. Ready for PM review.`,
          isSystemEvent: true,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onAddCandidate(newCandidate);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs p-3 sm:p-6 flex items-start sm:items-center justify-center">
      <div className="my-auto bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-hidden shadow-2xl flex flex-col border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-600 text-white">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Add New Candidate & Attach CV
              </h3>
              <p className="text-xs text-slate-500">
                Setup 1-to-1 isolated channel between Team X Recruiter and Client PM
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          className="p-6 overflow-y-auto flex-1 space-y-4 text-xs"
        >
          {/* Current Pipeline Status - Visible but Disabled (Auto-managed) */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-slate-700 font-bold text-xs">
                Current Pipeline Status *
              </label>
              <span className="text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                <Lock className="w-3 h-3 text-indigo-500" />
                <span>Auto-Managed (Disabled)</span>
              </span>
            </div>
            <div className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-bold text-xs flex items-center justify-between cursor-not-allowed select-none">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span>Step 1: CV Screening</span>
              </div>
              <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                Action Owner: Team X (PE)
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Status cannot be changed manually. After adding candidate, your next task is screening the CV, uploading the revised CV, and submitting to the PM. The status will automatically update to Step 2 (Submitted to PM).
            </p>
          </div>

          {/* CV Upload Box */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Candidate CV / Resume (Upload & Attach) *
            </label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
              accept=".pdf,.doc,.docx,.txt"
              className="hidden"
            />

            {!uploadedCv ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                  dragOver
                    ? "border-indigo-500 bg-indigo-50/60"
                    : "border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50"
                }`}
              >
                <Upload className="w-6 h-6 text-indigo-500 mx-auto mb-1.5" />
                <p className="text-xs font-semibold text-slate-800">
                  Click to browse or drag & drop candidate CV
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Supports PDF, DOCX, DOC, or TXT (up to 25MB)
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-600 text-white">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 text-xs flex items-center gap-1.5">
                      <span>{uploadedCv.fileName}</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {uploadedCv.fileSize} • Uploaded just now
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium hover:underline"
                  >
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadedCv(undefined)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded-md"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Candidate basic info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Candidate Full Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Marcus Thorne"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Candidate Phone / WhatsApp *
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98200 12345"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="marcus@example.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Current Company
              </label>
              <input
                type="text"
                value={currentCompany}
                onChange={(e) => setCurrentCompany(e.target.value)}
                placeholder="e.g. Morgan Stanley"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Client & Assigned Pair */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800">
                Target Client & Team Mapping
              </span>
              {onOpenAddClient && (
                <button
                  type="button"
                  onClick={onOpenAddClient}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New Client</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Target Client Company
                </label>
                {allClients.length > 0 ? (
                  <select
                    value={targetClientId}
                    onChange={(e) => {
                      setTargetClientId(e.target.value);
                      const c = allClients.find((cli) => cli.id === e.target.value);
                      if (c && c.activeRoles.length > 0) {
                        setTargetRole(c.activeRoles[0]);
                      }
                    }}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {allClients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="space-y-1">
                    <input
                      type="text"
                      value={customClientName}
                      onChange={(e) => setCustomClientName(e.target.value)}
                      placeholder="Enter Client Company Name"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <p className="text-[10px] text-slate-500">
                      Or click "Add New Client" to save full client profile.
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Target Role / Position
                </label>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. Lead React Architect"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Assigned Recruiter (Team X)
                </label>
                <select
                  value={assignedRecruiterId}
                  onChange={(e) => setAssignedRecruiterId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                >
                  {recruiters.map((rec) => (
                    <option key={rec.id} value={rec.id}>
                      {rec.name} {rec.id === currentUser.id ? "(You)" : `(${rec.team})`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Assigned Project Manager (PM)
                </label>
                <div className="px-3 py-2 bg-slate-100 rounded-lg text-slate-700 font-medium">
                  {selectedClient
                    ? allMembers.find((m) => m.id === selectedClient.assignedPmId)?.name ||
                      "Shweta"
                    : pms[0]?.name || "Shweta (PM)"}
                </div>
              </div>
            </div>
          </div>

          {/* Experience & Skills */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Years of Exp
              </label>
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

            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-semibold mb-1">
                Core Skills (comma separated)
              </label>
              <input
                type="text"
                value={skillsText}
                onChange={(e) => setSkillsText(e.target.value)}
                placeholder="e.g. React, Node.js, TypeScript, AWS"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Initial Candidate Availability Slots - Available for all roles when adding a candidate */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Candidate Availability Slots (to propose to client)
            </label>
            <div className="space-y-2 mb-2">
              {slots.map((slot, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <span className="text-slate-800 font-medium">{slot}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSlot(index)}
                    className="text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newSlotInput}
                onChange={(e) => setNewSlotInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddSlot();
                  }
                }}
                placeholder="e.g. Thursday at 11:00 AM IST"
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={handleAddSlot}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Slot</span>
              </button>
            </div>
          </div>

          {/* Screening Notes & AI pitch generation */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-slate-700 font-semibold">
                Recruiter Screening Summary / Pitch Highlights
              </label>
              <button
                type="button"
                onClick={handleAIPolish}
                disabled={aiPolishing}
                className="text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1 hover:underline disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{aiPolishing ? "Polishing..." : "AI Generate Pitch"}</span>
              </button>
            </div>
            <textarea
              rows={3}
              value={screeningNotes}
              onChange={(e) => setScreeningNotes(e.target.value)}
              placeholder="Candidate background, key achievements, notice period, and communication assessment..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* Form Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Save Candidate & Channel</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
