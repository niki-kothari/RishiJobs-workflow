import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  TeamMember,
  Candidate,
  DirectChatMessage,
  CandidateStage,
} from "../types";
import {
  X,
  Send,
  MessageSquare,
  AlertTriangle,
  Star,
  CheckCircle2,
  Clock,
  User,
  Search,
  Sparkles,
  ChevronRight,
  Shield,
  Zap,
  Archive,
  Info,
} from "lucide-react";

interface DirectChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: TeamMember;
  allMembers: TeamMember[];
  allCandidates: Candidate[];
  directMessages: DirectChatMessage[];
  onSendMessage: (
    recipientId: string,
    text: string,
    candidateId?: string,
    isUrgentNudge?: boolean,
    isImportantDetail?: boolean
  ) => void;
  onMarkAsRead?: (messageIds: string[]) => void;
  initialTargetMemberId?: string;
  initialCandidateId?: string;
  onSelectCandidate?: (candidate: Candidate) => void;
}

export const DirectChatModal: React.FC<DirectChatModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  allMembers,
  allCandidates,
  directMessages,
  onSendMessage,
  onMarkAsRead,
  initialTargetMemberId,
  initialCandidateId,
  onSelectCandidate,
}) => {
  const isPMOrOwner =
    currentUser.role === "pm" ||
    currentUser.role === "admin" ||
    currentUser.team?.toLowerCase().includes("management") ||
    currentUser.team?.toLowerCase().includes("leadership");

  // Filterable conversations list: Team X members vs PM/Leadership
  const otherMembers = useMemo(() => {
    return allMembers.filter((m) => m.id !== currentUser.id);
  }, [allMembers, currentUser.id]);

  // Selected chat partner
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>(
    initialTargetMemberId || otherMembers[0]?.id || ""
  );

  // Selected candidate filter for context
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>(
    initialCandidateId || "all"
  );

  const [inputText, setInputText] = useState("");
  const [isUrgentNudge, setIsUrgentNudge] = useState(false);
  const [isImportantDetail, setIsImportantDetail] = useState(false);
  const [searchMember, setSearchMember] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync initial props when modal opens
  useEffect(() => {
    if (initialTargetMemberId) {
      setSelectedPartnerId(initialTargetMemberId);
    } else if (!selectedPartnerId && otherMembers.length > 0) {
      setSelectedPartnerId(otherMembers[0].id);
    }
    if (initialCandidateId) {
      setSelectedCandidateId(initialCandidateId);
    }
  }, [initialTargetMemberId, initialCandidateId, isOpen, otherMembers]);

  // Current selected partner object
  const partner = useMemo(() => {
    return allMembers.find((m) => m.id === selectedPartnerId);
  }, [allMembers, selectedPartnerId]);

  // Current active candidate context
  const activeCandidate = useMemo(() => {
    if (selectedCandidateId === "all") return null;
    return allCandidates.find((c) => c.id === selectedCandidateId) || null;
  }, [allCandidates, selectedCandidateId]);

  // Relevant candidates associated with this partner
  const partnerCandidates = useMemo(() => {
    if (!partner) return allCandidates;
    const isPartnerTeamX =
      partner.role === "recruiter" ||
      partner.team?.toLowerCase().includes("team x");

    if (isPartnerTeamX) {
      return allCandidates.filter(
        (c) =>
          c.assignedRecruiterId === partner.id ||
          c.addedByRecruiterId === partner.id
      );
    }
    if (partner.role === "pm") {
      return allCandidates.filter((c) => c.assignedPmId === partner.id);
    }
    return allCandidates;
  }, [partner, allCandidates]);

  // Filter messages between currentUser and selectedPartner
  const conversationMessages = useMemo(() => {
    return directMessages.filter((m) => {
      const isBetween =
        (m.senderId === currentUser.id && m.recipientId === selectedPartnerId) ||
        (m.senderId === selectedPartnerId && m.recipientId === currentUser.id);

      if (!isBetween) return false;

      if (selectedCandidateId !== "all") {
        return m.candidateId === selectedCandidateId;
      }
      return true;
    });
  }, [directMessages, currentUser.id, selectedPartnerId, selectedCandidateId]);

  // Auto mark incoming unread messages as read
  useEffect(() => {
    if (!isOpen || !onMarkAsRead) return;
    const unreadIds = conversationMessages
      .filter((m) => m.recipientId === currentUser.id && !m.read)
      .map((m) => m.id);

    if (unreadIds.length > 0) {
      onMarkAsRead(unreadIds);
    }
  }, [conversationMessages, currentUser.id, isOpen, onMarkAsRead]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversationMessages.length]);

  if (!isOpen) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedPartnerId) return;

    onSendMessage(
      selectedPartnerId,
      inputText.trim(),
      selectedCandidateId === "all" ? undefined : selectedCandidateId,
      isUrgentNudge,
      isImportantDetail
    );

    setInputText("");
    setIsUrgentNudge(false);
    setIsImportantDetail(false);
  };

  // Quick Nudge Templates for PMs / Owner to spur Team X members
  const quickNudges = [
    {
      title: "Move Forward Immediately",
      text: activeCandidate
        ? `Urgent: Candidate ${activeCandidate.name} has pending actions in ${activeCandidate.stage}. Please look into this matter immediately and move the process forward!`
        : `Urgent: You have pending pipeline actions. Please look into your candidate tasks immediately and move the process forward!`,
      urgent: true,
      important: false,
    },
    {
      title: "Submit CV to PM",
      text: activeCandidate
        ? `Please complete your screening notes for ${activeCandidate.name} and submit the CV to PM now.`
        : "Please review and submit pending candidate CVs to PM immediately.",
      urgent: true,
      important: false,
    },
    {
      title: "Coordinate Interview Dates",
      text: activeCandidate
        ? `Client is waiting on availability for ${activeCandidate.name}. Please contact the candidate ASAP and propose slots.`
        : "Client is waiting for interview availability. Please check with your candidate immediately.",
      urgent: true,
      important: false,
    },
    {
      title: "Post-Interview Debrief",
      text: activeCandidate
        ? `Interview is complete for ${activeCandidate.name}. Please collect the candidate debrief so we can pass feedback to the client.`
        : "Please complete candidate debrief so we can proceed with offer or feedback.",
      urgent: false,
      important: true,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white w-full max-w-5xl h-[88vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold">Team Direct Chat & Pipeline Nudges</h2>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  {isPMOrOwner ? "PM / Leadership Portal" : "Team X Member Channel"}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Direct messaging for pending actions, urgent pipeline nudges, and key placement terms.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Left Sidebar (Team Members) + Right Chat Window */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Column: Team Members list */}
          <div className="w-72 sm:w-80 border-r border-slate-200 bg-slate-50/50 flex flex-col shrink-0">
            {/* Search filter */}
            <div className="p-3 border-b border-slate-200 bg-white">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Find team member..."
                  value={searchMember}
                  onChange={(e) => setSearchMember(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-100 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Members List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {isPMOrOwner ? "Team X Members (Recruiters)" : "Project Managers & Leadership"}
              </div>

              {otherMembers
                .filter((m) =>
                  m.name.toLowerCase().includes(searchMember.toLowerCase()) ||
                  m.team.toLowerCase().includes(searchMember.toLowerCase())
                )
                .map((m) => {
                  const isSelected = m.id === selectedPartnerId;
                  const isRecruiter = m.role === "recruiter" || m.team?.toLowerCase().includes("team x");

                  // Count unread messages from this member to currentUser
                  const unreadCount = directMessages.filter(
                    (msg) => msg.senderId === m.id && msg.recipientId === currentUser.id && !msg.read
                  ).length;

                  // Find how many pending actions this member has
                  const pendingActions = isRecruiter
                    ? allCandidates.filter(
                        (c) =>
                          (c.assignedRecruiterId === m.id || c.addedByRecruiterId === m.id) &&
                          c.actionOwner === "recruiter"
                      ).length
                    : 0;

                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedPartnerId(m.id)}
                      className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between gap-2.5 ${
                        isSelected
                          ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20"
                          : "hover:bg-slate-100 text-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative shrink-0">
                          <img
                            src={m.avatar}
                            alt={m.name}
                            className="w-9 h-9 rounded-full object-cover border border-white/20"
                          />
                          {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-white animate-bounce">
                              {unreadCount}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold truncate">{m.name}</span>
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded font-medium ${
                                isSelected
                                  ? "bg-indigo-500 text-indigo-100"
                                  : "bg-slate-200 text-slate-600"
                              }`}
                            >
                              {m.role.toUpperCase()}
                            </span>
                          </div>
                          <div
                            className={`text-[11px] truncate ${
                              isSelected ? "text-indigo-200" : "text-slate-500"
                            }`}
                          >
                            {m.team}
                          </div>
                        </div>
                      </div>

                      {pendingActions > 0 && (
                        <span
                          title={`${pendingActions} actions currently pending`}
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 flex items-center gap-1 ${
                            isSelected
                              ? "bg-amber-400 text-amber-950 font-black"
                              : "bg-amber-100 text-amber-800 border border-amber-300"
                          }`}
                        >
                          <Clock className="w-2.5 h-2.5" />
                          {pendingActions} pending
                        </span>
                      )}
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Right Column: Chat Window */}
          <div className="flex-1 flex flex-col bg-slate-50/30 overflow-hidden">
            {/* Conversation Sub-header */}
            <div className="px-5 py-3 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <img
                  src={partner?.avatar}
                  alt={partner?.name}
                  className="w-9 h-9 rounded-full object-cover border border-slate-200"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{partner?.name}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {partner?.role.toUpperCase()} · {partner?.team}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                    <span>{partner?.email}</span>
                  </div>
                </div>
              </div>

              {/* Candidate Context Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Candidate Focus:</span>
                <select
                  value={selectedCandidateId}
                  onChange={(e) => setSelectedCandidateId(e.target.value)}
                  className="text-xs bg-slate-100 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none max-w-[220px] truncate"
                >
                  <option value="all">All Candidates / General Discussion</option>
                  {partnerCandidates.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.stage.replace("_", " ")})
                    </option>
                  ))}
                </select>

                {activeCandidate && onSelectCandidate && (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectCandidate(activeCandidate);
                      onClose();
                    }}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg border border-indigo-200 transition-colors flex items-center gap-1"
                  >
                    <span>View Profile</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Candidate Outcome & Pruning Notice (Requirement: ignore rest after candidate placed/rejected) */}
            {activeCandidate && (activeCandidate.stage === "placed" || activeCandidate.stage === "rejected") && (
              <div className="px-5 py-3 bg-emerald-50 border-b border-emerald-200 text-emerald-950 flex items-start justify-between gap-3 text-xs">
                <div className="flex items-start gap-2">
                  <Archive className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">
                      Process Concluded ({activeCandidate.stage.toUpperCase()}) — Transient Chat Pruned
                    </span>
                    <p className="text-[11px] text-emerald-800 mt-0.5">
                      Per policy, routine back-and-forth chatter has been pruned and ignored. Only critical details (CTC, offer letters, client feedback, and key milestones) are permanently saved.
                    </p>
                  </div>
                </div>

                {activeCandidate.importantChatHighlights && activeCandidate.importantChatHighlights.length > 0 && (
                  <span className="text-[10px] font-bold px-2 py-1 rounded bg-emerald-200 text-emerald-900 shrink-0">
                    {activeCandidate.importantChatHighlights.length} Important Details Saved
                  </span>
                )}
              </div>
            )}

            {/* Important Highlights Drawer if candidate is completed */}
            {activeCandidate && activeCandidate.importantChatHighlights && activeCandidate.importantChatHighlights.length > 0 && (
              <div className="px-5 py-2.5 bg-amber-50/70 border-b border-amber-200 text-amber-950 text-xs">
                <div className="font-bold flex items-center gap-1.5 text-amber-900 mb-1">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-600" />
                  <span>Permanent Key Details for {activeCandidate.name}:</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-900">
                  {activeCandidate.importantChatHighlights.map((hl, idx) => (
                    <li key={idx}>{hl}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Messages Thread Container */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {conversationMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-700">No messages yet with {partner?.name}</h4>
                  <p className="text-xs text-slate-500 max-w-sm mt-1">
                    {isPMOrOwner
                      ? "Directly send an urgent nudge or ask them to move their candidates forward in the pipeline."
                      : "Reply directly to project managers and leadership here."}
                  </p>
                </div>
              ) : (
                conversationMessages.map((msg) => {
                  const isMine = msg.senderId === currentUser.id;
                  const isCandidatePlacedOrRejected =
                    activeCandidate &&
                    (activeCandidate.stage === "placed" || activeCandidate.stage === "rejected");

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 text-[11px] text-slate-400">
                        <span className="font-semibold text-slate-700">{msg.senderName}</span>
                        <span>·</span>
                        <span>
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      <div
                        className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-xs shadow-2xs relative ${
                          isMine
                            ? msg.isUrgentNudge
                              ? "bg-rose-600 text-white rounded-br-xs"
                              : msg.isImportantDetail
                              ? "bg-indigo-700 text-white rounded-br-xs"
                              : "bg-indigo-600 text-white rounded-br-xs"
                            : msg.isUrgentNudge
                            ? "bg-rose-50 border-2 border-rose-300 text-rose-950 rounded-bl-xs"
                            : msg.isImportantDetail
                            ? "bg-amber-50 border border-amber-300 text-amber-950 rounded-bl-xs"
                            : "bg-white border border-slate-200 text-slate-800 rounded-bl-xs"
                        }`}
                      >
                        {/* Badges */}
                        <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                          {msg.isUrgentNudge && (
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full ${
                                isMine
                                  ? "bg-rose-900/60 text-rose-100"
                                  : "bg-rose-500 text-white"
                              }`}
                            >
                              <Zap className="w-3 h-3 fill-current" />
                              URGENT PIPELINE NUDGE
                            </span>
                          )}

                          {msg.isImportantDetail && (
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                isMine
                                  ? "bg-amber-400 text-amber-950"
                                  : "bg-amber-500 text-white"
                              }`}
                            >
                              <Star className="w-3 h-3 fill-current" />
                              IMPORTANT DETAIL (STORED)
                            </span>
                          )}

                          {msg.candidateName && selectedCandidateId === "all" && (
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                isMine
                                  ? "bg-white/20 text-white"
                                  : "bg-slate-100 text-slate-700 border border-slate-200"
                              }`}
                            >
                              re: {msg.candidateName}
                            </span>
                          )}
                        </div>

                        {/* Message text */}
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Nudges Bar (For PMs and Owner to quickly spur recruiters) */}
            {isPMOrOwner && (
              <div className="p-2.5 bg-slate-100/80 border-t border-slate-200">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 mb-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Quick Action Nudges for {partner?.name}:</span>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {quickNudges.map((nudge, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setInputText(nudge.text);
                        setIsUrgentNudge(nudge.urgent);
                        setIsImportantDetail(nudge.important);
                      }}
                      className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-white hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 hover:border-indigo-300 text-slate-700 shrink-0 transition-colors shadow-2xs"
                    >
                      {nudge.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Form */}
            <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200">
              {/* Option toggles */}
              <div className="flex items-center justify-between gap-3 mb-2 text-xs">
                <div className="flex items-center gap-4">
                  {/* Urgent Nudge Toggle */}
                  <label className="flex items-center gap-1.5 cursor-pointer select-none text-slate-700 hover:text-rose-600 transition-colors">
                    <input
                      type="checkbox"
                      checked={isUrgentNudge}
                      onChange={(e) => setIsUrgentNudge(e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-rose-600 focus:ring-rose-500 border-slate-300"
                    />
                    <span className="font-semibold flex items-center gap-1">
                      <Zap className="w-3 h-3 text-rose-500" />
                      Urgent Nudge (Alerts immediately)
                    </span>
                  </label>

                  {/* Important Detail Toggle */}
                  <label className="flex items-center gap-1.5 cursor-pointer select-none text-slate-700 hover:text-indigo-600 transition-colors">
                    <input
                      type="checkbox"
                      checked={isImportantDetail}
                      onChange={(e) => setIsImportantDetail(e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-amber-500 focus:ring-amber-500 border-slate-300"
                    />
                    <span className="font-semibold flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-500" />
                      Store as Important Detail (Kept after placed/rejected)
                    </span>
                  </label>
                </div>

                <div className="text-[11px] text-slate-400">
                  Press <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border text-slate-600">Enter</kbd> to send
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={
                    isPMOrOwner
                      ? `Message ${partner?.name || "recruiter"} to move candidates forward...`
                      : `Reply to ${partner?.name || "PM / Leadership"}...`
                  }
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 px-4 py-2.5 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-800 placeholder:text-slate-400"
                />

                <button
                  type="submit"
                  disabled={!inputText.trim() || !selectedPartnerId}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-md shadow-indigo-600/20 shrink-0"
                >
                  <span>Send</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
