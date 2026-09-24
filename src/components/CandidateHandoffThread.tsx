import React, { useState, useRef, useEffect } from "react";
import { ThreadMessage, TeamMember, Candidate } from "../types";
import { Send, Lock, Clock, CheckCircle2, UserCheck, MessageSquare } from "lucide-react";

interface CandidateHandoffThreadProps {
  candidate: Candidate;
  currentUser: TeamMember;
  recruiter: TeamMember | undefined;
  pm: TeamMember | undefined;
  onSendMessage: (text: string, actionRequiredFrom?: "recruiter" | "pm" | "none") => void;
}

export const CandidateHandoffThread: React.FC<CandidateHandoffThreadProps> = ({
  candidate,
  currentUser,
  recruiter,
  pm,
  onSendMessage,
}) => {
  const [inputText, setInputText] = useState("");
  const [actionTag, setActionTag] = useState<"recruiter" | "pm" | "none">("none");
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only scroll within the local chat messages container, never the window
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [candidate.thread]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim(), actionTag);
    setInputText("");
    setActionTag("none");
  };

  const quickTemplates = [
    {
      label: "Candidate confirmed slot",
      text: "Candidate confirmed they can make the proposed slot. Ready to finalize!",
      target: "pm" as const,
    },
    {
      label: "Client requested counter-dates",
      text: "Client hiring manager cannot do the initial times. They sent counter-slots for next week.",
      target: "recruiter" as const,
    },
    {
      label: "Debrief collected",
      text: "Completed post-interview debrief call. Summary added to candidate notes.",
      target: "none" as const,
    },
  ];

  return (
    <div className="flex flex-col h-[520px] bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
      {/* Thread Header */}
      <div className="px-4 py-3 bg-white border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-indigo-50 text-indigo-700">
            <Lock className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <span>Candidate Discussion</span>
              <span className="text-[10px] font-normal px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                Candidate #{candidate.id.replace("cand-", "")}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Only {recruiter?.name || "Recruiter"} & {pm?.name || "PM"} are subscribed.
            </p>
          </div>
        </div>

        {/* Participant avatars */}
        <div className="flex items-center -space-x-1.5">
          {recruiter && (
            <img
              src={recruiter.avatar}
              alt={recruiter.name}
              title={`Recruiter: ${recruiter.name}`}
              className="w-6 h-6 rounded-full object-cover ring-2 ring-white"
            />
          )}
          {pm && (
            <img
              src={pm.avatar}
              alt={pm.name}
              title={`PM: ${pm.name}`}
              className="w-6 h-6 rounded-full object-cover ring-2 ring-white"
            />
          )}
        </div>
      </div>

      {/* Messages list */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {candidate.thread.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            No internal messages yet. Start by posting an update or screening note!
          </div>
        ) : (
          candidate.thread.map((msg) => {
            const isMe = msg.senderId === currentUser.id;
            const isSystem = msg.isSystemEvent;

            if (isSystem) {
              return (
                <div key={msg.id} className="flex justify-center my-2">
                  <div className="bg-slate-200/70 text-slate-700 text-[11px] px-3 py-1 rounded-full flex items-center gap-1.5 border border-slate-300/50">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>{msg.text}</span>
                    <span className="text-[9px] text-slate-500 ml-1">({msg.timestamp})</span>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
              >
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  <span className="text-[11px] font-semibold text-slate-700">
                    {msg.senderName}
                  </span>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded font-medium ${
                      msg.senderRole === "recruiter"
                        ? "bg-indigo-100 text-indigo-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {msg.senderRole === "recruiter" ? "Recruiter" : "PM"}
                  </span>
                  <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
                </div>

                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-2xs ${
                    isMe
                      ? "bg-indigo-600 text-white rounded-br-xs"
                      : "bg-white text-slate-800 border border-slate-200 rounded-bl-xs"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>

                {msg.actionRequiredFrom && msg.actionRequiredFrom !== "none" && (
                  <div className="mt-1 flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                    <span>⚡ Action required from:</span>
                    <span className="font-bold uppercase">
                      {msg.actionRequiredFrom === "recruiter" ? "Recruiter" : "Project Manager"}
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Quick response chips */}
      <div className="px-3 py-1.5 bg-slate-100 border-t border-slate-200 flex items-center gap-1.5 overflow-x-auto text-[11px]">
        <span className="text-slate-500 font-medium whitespace-nowrap text-[10px]">
          Quick insert:
        </span>
        {quickTemplates.map((tmpl, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setInputText(tmpl.text);
              setActionTag(tmpl.target);
            }}
            className="px-2 py-1 rounded bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 whitespace-nowrap transition-colors"
          >
            {tmpl.label}
          </button>
        ))}
      </div>

      {/* Message Input Form */}
      <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-slate-200">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] text-slate-500">Require action from:</span>
          <select
            value={actionTag}
            onChange={(e) => setActionTag(e.target.value as any)}
            className="text-[11px] bg-slate-50 border border-slate-200 rounded px-2 py-0.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="none">No immediate action needed</option>
            <option value="recruiter">Recruiter ({recruiter?.name || "Team X"})</option>
            <option value="pm">Project Manager ({pm?.name || "PM"})</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Message ${currentUser.role === "recruiter" ? pm?.name || "PM" : recruiter?.name || "Recruiter"} directly...`}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg transition-colors shadow-xs"
            title="Send to candidate thread"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
