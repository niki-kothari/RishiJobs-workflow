import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  Clock,
  ArrowRight,
  BellOff,
  Volume2,
  VolumeX,
  ShieldAlert,
  X,
  MessageSquare,
  Settings,
  Laptop,
  Zap,
} from "lucide-react";
import { Candidate, ClientCompany, TeamMember } from "../types";
import { isSoundEnabled, setSoundEnabled, playUrgentRedAlertSound } from "../utils/audioAlert";
import {
  openWhatsappAlert,
  cleanWhatsappNumber,
  getSystemNotificationPermission,
  getNotificationSettings,
} from "../utils/systemNotification";

interface UrgentRedAlertModalProps {
  overdueCandidates: {
    candidate: Candidate;
    overdueMinutes: number;
    actionOwnerText: string;
  }[];
  clients: ClientCompany[];
  allMembers?: TeamMember[];
  onOpenCandidate: (candidate: Candidate) => void;
  onSnooze: () => void;
  onOpenSettings?: () => void;
  isOpen: boolean;
  onDirectChat?: (targetMemberId: string, candidateId: string) => void;
}

export const UrgentRedAlertModal: React.FC<UrgentRedAlertModalProps> = ({
  overdueCandidates,
  clients,
  allMembers = [],
  onOpenCandidate,
  onSnooze,
  onOpenSettings,
  isOpen,
  onDirectChat,
}) => {
  const [soundOn, setSoundOn] = useState(isSoundEnabled());
  const [permission, setPermission] = useState<string>("default");

  useEffect(() => {
    setSoundOn(isSoundEnabled());
    setPermission(getSystemNotificationPermission());
  }, [isOpen]);

  if (!isOpen || overdueCandidates.length === 0) return null;

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    if (next) {
      playUrgentRedAlertSound();
    }
  };

  const getClientName = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    return client ? client.name : "Target Client";
  };

  const handleWhatsappSingle = (candidate: Candidate, overdueMinutes: number, actionOwnerText: string) => {
    const assignedMember = allMembers.find(
      (m) => m.id === (candidate.actionOwner === "recruiter" ? candidate.assignedRecruiterId : candidate.assignedPmId)
    );
    const clientName = getClientName(candidate.targetClientId);
    openWhatsappAlert({
      candidate,
      clientName,
      assignedMember,
      actionOwnerText,
      overdueMinutes,
    });
  };

  const handleWhatsappBroadcastAll = () => {
    const settings = getNotificationSettings();
    const appUrl = typeof window !== "undefined" ? window.location.href : "https://rishi-jobs.web.app";
    
    let msg = `🚨 *RISHI JOBS - URGENT OVERDUE ACTION SUMMARY* 🚨\n━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `⚠️ *${overdueCandidates.length} actions* are currently pending with no response for 10+ minutes:\n\n`;

    overdueCandidates.forEach(({ candidate, overdueMinutes, actionOwnerText }, i) => {
      const client = getClientName(candidate.targetClientId);
      msg += `*${i + 1}. ${candidate.name}* (${candidate.targetRole} @ ${client})\n`;
      msg += `   • Action: ${candidate.actionDescription}\n`;
      msg += `   • Assigned: ${actionOwnerText} (Overdue: ${overdueMinutes} mins)\n\n`;
    });

    msg += `━━━━━━━━━━━━━━━━━━━━\n🔗 *Open App to Resolve:* ${appUrl}\n_Please take action immediately to unblock hiring._`;

    const cleanPhone = cleanWhatsappNumber(settings.defaultWhatsappNumber);
    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      id="urgent-red-alert-backdrop"
      className="fixed inset-0 z-50 overflow-y-auto bg-rose-950/70 backdrop-blur-sm p-3 sm:p-6 flex items-start sm:items-center justify-center animate-in fade-in duration-200"
    >
      <div
        id="urgent-red-alert-card"
        className="my-auto bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border-2 border-rose-500 flex flex-col ring-8 ring-rose-500/20 animate-in zoom-in-95 duration-200"
      >
        {/* Urgent Header Banner */}
        <div className="bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/15 backdrop-blur-xs text-white ring-2 ring-white/30 animate-pulse">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-white/20 text-white font-extrabold uppercase text-[10px] tracking-wider px-2 py-0.5 rounded-full">
                  10-Minute Recurring Alert
                </span>
                <span className="text-xs text-rose-100 font-medium">Immediate Attention Required</span>
              </div>
              <h2 className="text-lg font-black tracking-tight text-white mt-0.5">
                {overdueCandidates.length} Pending {overdueCandidates.length === 1 ? "Action" : "Actions"} Overdue (10+ Mins)
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Configure OS System & WhatsApp Notifications"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={toggleSound}
              className={`p-2 rounded-xl border transition-colors ${
                soundOn
                  ? "bg-white/20 border-white/40 text-white hover:bg-white/30"
                  : "bg-white/10 border-white/20 text-rose-200 hover:bg-white/20"
              }`}
              title={soundOn ? "Sound Alerts are ON (click to mute)" : "Sound Alerts are MUTED (click to enable)"}
            >
              {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={onSnooze}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="Close (will re-alert in 10 minutes if unresolved)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notice description & WhatsApp Broadcast Bar */}
        <div className="bg-rose-50 border-b border-rose-100 px-6 py-2.5 text-xs text-rose-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <p className="leading-tight">
              Actions stalled over <strong>10 minutes</strong>. OS Desktop & WhatsApp alerts enabled.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {permission !== "granted" && onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-lg hover:bg-indigo-100 transition-colors"
              >
                <Laptop className="w-3 h-3" />
                <span>Enable OS Desktop Alert</span>
              </button>
            )}
            <button
              onClick={handleWhatsappBroadcastAll}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-lg transition-colors shadow-xs"
              title="Share summary of all overdue actions via WhatsApp"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
              <span>WhatsApp All</span>
            </button>
          </div>
        </div>

        {/* Overdue Items List */}
        <div className="p-6 max-h-[50vh] overflow-y-auto space-y-3.5 divide-y divide-slate-100">
          {overdueCandidates.map(({ candidate, overdueMinutes, actionOwnerText }, idx) => (
            <div
              key={candidate.id}
              className={`pt-3.5 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border ${
                idx === 0 ? "bg-rose-50/50 border-rose-200" : "bg-slate-50 border-slate-200"
              }`}
            >
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-slate-900 text-sm">{candidate.name}</span>
                  <span className="text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                    {candidate.targetRole}
                  </span>
                  <span className="text-[11px] font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                    {getClientName(candidate.targetClientId)}
                  </span>
                </div>

                <div className="text-xs font-semibold text-rose-700 flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                  <span>Action Needed: {candidate.actionDescription}</span>
                </div>

                <div className="text-[11px] text-slate-500 flex items-center gap-3">
                  <span>Assigned to: <strong className="text-slate-700">{actionOwnerText}</strong></span>
                  <span className="flex items-center gap-1 text-rose-600 font-semibold">
                    <Clock className="w-3 h-3" /> Overdue: {overdueMinutes} mins
                  </span>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                {/* 1-Click In-App Direct Nudge */}
                {onDirectChat && (
                  <button
                    type="button"
                    onClick={() => {
                      const targetMemberId =
                        candidate.actionOwner === "recruiter"
                          ? candidate.assignedRecruiterId
                          : candidate.assignedPmId;
                      onDirectChat(targetMemberId, candidate.id);
                    }}
                    className="inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-bold text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-300 rounded-xl transition-colors shadow-xs"
                    title="Directly message and nudge team member in the app"
                  >
                    <Zap className="w-3.5 h-3.5 text-indigo-600" />
                    <span>In-App Nudge</span>
                  </button>
                )}

                {/* 1-Click WhatsApp Alert Button */}
                <button
                  type="button"
                  onClick={() => handleWhatsappSingle(candidate, overdueMinutes, actionOwnerText)}
                  className="inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl transition-colors shadow-xs"
                  title="Send immediate WhatsApp alert to assigned person"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                  <span>WhatsApp</span>
                </button>

                <button
                  onClick={() => onOpenCandidate(candidate)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl shadow-sm transition-all"
                >
                  <span>Take Action</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>If dismissed, this alert will pop again in <strong>10 minutes</strong> with desktop & sound buzzer</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
              >
                <Settings className="w-3.5 h-3.5 text-slate-500" />
                <span>Notification Settings</span>
              </button>
            )}
            <button
              onClick={onSnooze}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors shadow-xs"
            >
              <BellOff className="w-3.5 h-3.5 text-slate-500" />
              <span>Snooze (10 mins)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

