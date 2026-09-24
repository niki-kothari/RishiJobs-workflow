import React from "react";
import {
  X,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  MessageSquare,
  Users,
  Briefcase,
  Repeat,
  Shield,
  Clock,
  Layers,
} from "lucide-react";

interface WorkflowExplainerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WorkflowExplainerModal: React.FC<WorkflowExplainerModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
                <Layers className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-bold text-slate-900">
                How Rishi Jobs Isolates Candidate Handoffs & Replaces Messy Groups
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              A structured operational blueprint for isolating Recruiter ↔ PM workflows with dedicated internal communication.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {/* Comparison Cards: Before vs After */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* The Unorganized Group Problem */}
            <div className="p-5 rounded-xl bg-rose-50/70 border border-rose-200 text-rose-950 space-y-3">
              <div className="flex items-center gap-2 font-bold text-rose-800">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>The Unorganized Group Trap (The Problem)</span>
              </div>
              <ul className="space-y-2 text-xs text-rose-900/90">
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">•</span>
                  <span>
                    <strong>Group notification overload:</strong> Multiple recruiters and PMs in one shared group. Team members get pinged constantly for candidates they don't manage.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">•</span>
                  <span>
                    <strong>Lost counter-dates:</strong> When a client rejects Monday and proposes Thursday, the update gets buried under dozens of unrelated messages.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">•</span>
                  <span>
                    <strong>Unclear ownership:</strong> Nobody knows whose turn it is ("Did the recruiter call the candidate back? Is the PM still waiting on the client?").
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">•</span>
                  <span>
                    <strong>Disconnected feedback:</strong> Post-interview candidate debrief and client debrief are scattered in audio notes or separate threads.
                  </span>
                </li>
              </ul>
            </div>

            {/* The Rishi Jobs Solution */}
            <div className="p-5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-950 space-y-3">
              <div className="flex items-center gap-2 font-bold text-emerald-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>The Rishi Jobs Solution (This System)</span>
              </div>
              <ul className="space-y-2 text-xs text-emerald-900/90">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>
                    <strong>1 Candidate = 1 Isolated Internal Channel:</strong> Only the assigned Team X Recruiter and the assigned PM see that candidate. Zero noise for others!
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>
                    <strong>Explicit Action Ownership:</strong> Clear status badge: "⚡ Action: Recruiter Call Candidate" vs "🕒 Action: PM Forward to Client".
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>
                    <strong>Dedicated Negotiation Loop Tracker:</strong> Counter-proposals are tracked cleanly across Round 1, Round 2, Round 3 until confirmed.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>
                    <strong>Internal Communication & Real-time Audit Trail:</strong> Keep all discussions, candidate/client updates, and stage progressions neatly inside the app.
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Step-by-Step Loop Diagram */}
          <div className="border border-slate-200 rounded-xl p-5 bg-white">
            <h3 className="font-bold text-slate-900 text-sm mb-4 flex items-center gap-2">
              <Repeat className="w-4 h-4 text-indigo-600" />
              <span>How the Complete End-to-End Loop Works Inside the System</span>
            </h3>

            <div className="space-y-4">
              {/* Step 1 */}
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  1
                </div>
                <div className="flex-1 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="font-semibold text-xs text-slate-800 flex items-center justify-between">
                    <span>Recruiter (Team X) Screens & Collects Availability</span>
                    <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-mono">
                      Owned by: Recruiter
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Recruiter reviews CV, calls candidate, inputs highlights and candidate's available interview slots, then updates status to <em>"Submit to PM"</em>.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  2
                </div>
                <div className="flex-1 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="font-semibold text-xs text-slate-800 flex items-center justify-between">
                    <span>Direct Handoff to Assigned PM</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-mono">
                      Owned by: PM
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    The candidate appears directly in the PM's view. The PM forwards the profile to the hiring manager with the candidate's availability.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  3
                </div>
                <div className="flex-1 bg-amber-50/70 p-3 rounded-lg border border-amber-200">
                  <div className="font-semibold text-xs text-amber-900 flex items-center justify-between">
                    <span>The Interview Date Negotiation Loop</span>
                    <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-mono">
                      Dynamic State
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 mt-1">
                    • <strong>If Client is available:</strong> PM clicks <em>"Confirm Date"</em> → locks into Scheduled Interview.<br />
                    • <strong>If Client proposes alternate dates:</strong> PM enters client's slots → System flags: <em>"Action Required: Recruiter Call Candidate"</em>.<br />
                    • Recruiter calls candidate to confirm. Once candidate confirms or counters, Recruiter updates the status in the app → System alerts PM!
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  4
                </div>
                <div className="flex-1 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="font-semibold text-xs text-slate-800 flex items-center justify-between">
                    <span>Post-Interview Debrief & Alignment</span>
                    <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-mono">
                      Joint Action
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Recruiter calls candidate to log candidate impressions. PM calls client to log hiring manager feedback. Both notes sit side-by-side in the candidate file to align on next steps and offer terms.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Key Multi-Tenant Principles */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 mb-1">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>One Recruiter → Many Candidates</span>
              </div>
              <p className="text-slate-600">
                A recruiter handles multiple candidates across different clients simultaneously without mixing up statuses.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 mb-1">
                <Briefcase className="w-4 h-4 text-emerald-600" />
                <span>One PM → Multiple Clients</span>
              </div>
              <p className="text-slate-600">
                A PM oversees multiple enterprise clients and receives candidate handoffs from Team X recruiters without clutter.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 mb-1">
                <Shield className="w-4 h-4 text-purple-600" />
                <span>Strict User Session Isolation</span>
              </div>
              <p className="text-slate-600">
                Team X members only see their own candidates and clients. Users must log out to switch to another account. PMs and Directors see full cross-team visibility.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Internal operations dashboard for Rishi Jobs.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
