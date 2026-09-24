import React, { useState, useEffect } from "react";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Smartphone,
  ExternalLink,
  Save,
  Volume2,
  X,
  VolumeX,
  ShieldCheck,
  Send,
  MessageSquare,
  Sparkles,
  Info,
  Laptop,
} from "lucide-react";
import {
  getNotificationSettings,
  saveNotificationSettings,
  getSystemNotificationPermission,
  requestSystemNotificationPermission,
  sendSystemDesktopNotification,
  startTabTitleFlashing,
  stopTabTitleFlashing,
  openWhatsappAlert,
  sendBackgroundWhatsappAlert,
  NotificationSettings,
} from "../utils/systemNotification";
import { playNotificationChime, playUrgentRedAlertSound, isSoundEnabled, setSoundEnabled } from "../utils/audioAlert";
import { Candidate, TeamMember, ClientCompany } from "../types";

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: TeamMember;
  allMembers?: TeamMember[];
  allClients?: ClientCompany[];
  overdueCandidates?: Candidate[];
  sampleCandidate?: Candidate;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  sampleCandidate,
}) => {
  const [settings, setSettings] = useState<NotificationSettings>(getNotificationSettings());
  const [permission, setPermission] = useState<"granted" | "denied" | "default" | "unsupported">("default");
  const [soundOn, setSoundOn] = useState(isSoundEnabled());
  const [testSent, setTestSent] = useState(false);
  const [whatsappTestStatus, setWhatsappTestStatus] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSettings(getNotificationSettings());
      setPermission(getSystemNotificationPermission());
      setSoundOn(isSoundEnabled());
      setTestSent(false);
      setWhatsappTestStatus(null);
      setSavedSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    const perm = await requestSystemNotificationPermission();
    setPermission(perm);
    if (perm === "granted") {
      sendSystemDesktopNotification({
        title: "✅ System Notifications Active!",
        body: "Rishi Jobs will now alert your Windows/Mac desktop for any pending or overdue candidate actions.",
        urgent: true,
      });
    }
  };

  const handleTestSystemNotification = () => {
    setTestSent(true);
    playUrgentRedAlertSound();
    startTabTitleFlashing("Test Unanswered Work");

    const notif = sendSystemDesktopNotification({
      title: "⚠️ URGENT: Unanswered Candidate Action",
      body: "Sample: Rahul Sharma (Senior React Developer) has been pending for 12 minutes without reply!",
      urgent: true,
      onClick: () => {
        stopTabTitleFlashing();
        alert("System notification clicked! This brings you directly to the unanswered candidate.");
      },
    });

    if (!notif && permission !== "granted") {
      handleRequestPermission();
    }

    setTimeout(() => setTestSent(false), 4000);
  };

  const handleTestWhatsapp = async () => {
    setWhatsappTestStatus("Sending test WhatsApp alert...");
    const dummyCandidate: Candidate = sampleCandidate || {
      id: "demo-test",
      name: "Rahul Sharma",
      email: "rahul.sharma@example.com",
      phone: "+91 98765 43210",
      targetRole: "Senior React Engineer",
      targetClientId: "client-1",
      assignedRecruiterId: currentUser?.id || "member-1",
      assignedPmId: currentUser?.id || "member-1",
      stage: "date_negotiation",
      actionOwner: currentUser?.role === "pm" ? "pm" : "recruiter",
      actionDescription: "Confirm client interview slot with candidate (Overdue)",
      experienceYears: 6,
      keySkills: ["React", "TypeScript", "Node.js"],
      revisedCvSummary: "Strong lead full stack developer.",
      proposedDates: [],
      negotiationRound: 1,
      debrief: {},
      thread: [],
      createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    };

    if (settings.whatsappWebhookType === "direct_link") {
      openWhatsappAlert(
        {
          candidate: dummyCandidate,
          clientName: "Acme Corp Tech",
          assignedMember: currentUser,
          actionOwnerText: currentUser?.name || "Recruiter / PM",
          overdueMinutes: 15,
        },
        settings.defaultWhatsappNumber
      );
      setWhatsappTestStatus("Opened WhatsApp draft in a new tab!");
    } else {
      const res = await sendBackgroundWhatsappAlert({
        candidate: dummyCandidate,
        clientName: "Acme Corp Tech",
        assignedMember: currentUser,
        actionOwnerText: currentUser?.name || "Recruiter / PM",
        overdueMinutes: 15,
      });
      setWhatsappTestStatus(res.message);
    }

    setTimeout(() => setWhatsappTestStatus(null), 6000);
  };

  const handleSave = () => {
    saveNotificationSettings(settings);
    setSoundEnabled(soundOn);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1000);
  };

  return (
    <div
      id="notification-settings-backdrop"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs p-3 sm:p-6 flex items-start sm:items-center justify-center animate-in fade-in duration-200"
    >
      <div
        id="notification-settings-modal"
        className="my-auto bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col animate-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/10 text-white ring-1 ring-white/20">
              <Bell className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                <span>System & WhatsApp Notifications</span>
                <span className="text-[10px] uppercase font-bold tracking-wider bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Away & Desk Alerting
                </span>
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Ensure you never miss pending or unanswered candidate work even when away from the app
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-sm text-slate-700">
          {/* SECTION 1: OS / SYSTEM DESKTOP NOTIFICATIONS */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                  <Laptop className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    OS Desktop System Notifications
                  </h3>
                  <p className="text-xs text-slate-500">
                    Pops real Windows / Mac notifications outside the browser when you are working in other apps
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="shrink-0">
                {permission === "granted" ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>OS Active</span>
                  </span>
                ) : permission === "denied" ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Blocked</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                    <Info className="w-3.5 h-3.5 text-amber-600" />
                    <span>Permission Needed</span>
                  </span>
                )}
              </div>
            </div>

            {/* Permission Prompt or Help */}
            {permission !== "granted" && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <span>
                    {permission === "denied"
                      ? "Notifications are blocked in your browser settings. Click the lock icon in the browser address bar to allow Notifications."
                      : "Allow system notifications so your computer alerts you immediately when work is unanswered."}
                  </span>
                </div>
                {permission !== "denied" && (
                  <button
                    onClick={handleRequestPermission}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs shrink-0 shadow-xs transition-colors"
                  >
                    Enable Now
                  </button>
                )}
              </div>
            )}

            {/* Options */}
            <div className="space-y-2.5 pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.systemNotificationsEnabled}
                  onChange={(e) =>
                    setSettings({ ...settings, systemNotificationsEnabled: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
                <span className="text-xs font-semibold text-slate-800">
                  Enable OS Desktop Notifications for new submissions and overdue items
                </span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.requireInteraction}
                  onChange={(e) =>
                    setSettings({ ...settings, requireInteraction: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-800">
                    Keep notification on screen until clicked (No auto-dismiss)
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Ensures the notification stays visible in your OS tray if you stepped away from your desk
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.flashTabTitle}
                  onChange={(e) =>
                    setSettings({ ...settings, flashTabTitle: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-800">
                    Flash browser tab title (⚠️ ACTION NEEDED) when tab is inactive
                  </span>
                </div>
              </label>
            </div>

            {/* Test Button */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-200">
              <span className="text-xs text-slate-500">Test how the alert looks on your computer:</span>
              <button
                type="button"
                onClick={handleTestSystemNotification}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-indigo-700 border border-indigo-200 rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Laptop className="w-3.5 h-3.5" />
                <span>{testSent ? "Alert Sent to Desktop!" : "Test OS Notification"}</span>
              </button>
            </div>
          </div>

          {/* SECTION 2: WHATSAPP NOTIFICATIONS LINK */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/30 p-4 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-200">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                      WhatsApp Notifications & Mobile Alerting
                    </h3>
                    <span className="bg-emerald-100 text-emerald-800 font-extrabold text-[10px] px-2 py-0.5 rounded-full border border-emerald-200">
                      Mobile & Web
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Link with WhatsApp so pending work reaches you or your team directly on mobile
                  </p>
                </div>
              </div>
            </div>

            {/* Phone Number Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Your Primary WhatsApp Number (with country code):
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={settings.defaultWhatsappNumber}
                  onChange={(e) =>
                    setSettings({ ...settings, defaultWhatsappNumber: e.target.value })
                  }
                  placeholder="+91 98765 43210 or +1 415 555 2671"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                When you click "Send WhatsApp Alert" on any overdue action, this recipient (or the assigned recruiter/PM's phone) is prefilled.
              </p>
            </div>

            {/* WhatsApp Integration Mode */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                WhatsApp Delivery Method:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <label
                  className={`p-3 rounded-xl border cursor-pointer flex flex-col justify-between transition-all ${
                    settings.whatsappWebhookType === "direct_link"
                      ? "bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-500/20"
                      : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="whatsappType"
                      checked={settings.whatsappWebhookType === "direct_link"}
                      onChange={() =>
                        setSettings({ ...settings, whatsappWebhookType: "direct_link" })
                      }
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="font-bold text-slate-900">Direct 1-Click WhatsApp</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 pl-5">
                    Instantly opens WhatsApp Web or App with pre-filled candidate details, stage, overdue time & action link. No API keys needed!
                  </p>
                </label>

                <label
                  className={`p-3 rounded-xl border cursor-pointer flex flex-col justify-between transition-all ${
                    settings.whatsappWebhookType === "callmebot"
                      ? "bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-500/20"
                      : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="whatsappType"
                      checked={settings.whatsappWebhookType === "callmebot"}
                      onChange={() =>
                        setSettings({ ...settings, whatsappWebhookType: "callmebot" })
                      }
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="font-bold text-slate-900">Automated Background (CallMeBot)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 pl-5">
                    Free automated WhatsApp API that delivers messages directly to your WhatsApp in the background without needing to click send.
                  </p>
                </label>
              </div>
            </div>

            {/* CallMeBot Configuration Fields if selected */}
            {settings.whatsappWebhookType === "callmebot" && (
              <div className="p-3 bg-white border border-emerald-200 rounded-xl space-y-2.5 text-xs">
                <div className="flex items-center gap-2 text-emerald-800 font-bold">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>CallMeBot Free Setup (Takes 30 seconds):</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <li>
                    Save <strong>+34 644 10 55 84</strong> in your WhatsApp contacts as "CallMeBot".
                  </li>
                  <li>
                    Send this message: <code>I allow callmebot to send me messages</code>
                  </li>
                  <li>CallMeBot will reply instantly with your free API Key. Paste it below:</li>
                </ol>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700">Phone (with country code):</label>
                    <input
                      type="text"
                      value={settings.callmebotPhone}
                      onChange={(e) => setSettings({ ...settings, callmebotPhone: e.target.value })}
                      placeholder="e.g. +919876543210"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700">CallMeBot API Key:</label>
                    <input
                      type="text"
                      value={settings.callmebotApiKey}
                      onChange={(e) => setSettings({ ...settings, callmebotApiKey: e.target.value })}
                      placeholder="e.g. 123456"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Auto WhatsApp on Red Alert */}
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoTriggerWhatsappOnRedAlert}
                onChange={(e) =>
                  setSettings({ ...settings, autoTriggerWhatsappOnRedAlert: e.target.checked })
                }
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
              />
              <div>
                <span className="text-xs font-semibold text-slate-800">
                  Auto-prepare WhatsApp draft when a 10-Minute Red Alert fires
                </span>
                <p className="text-[11px] text-slate-500">
                  Immediately readies the WhatsApp dispatch so you or the team lead can broadcast the pending work
                </p>
              </div>
            </label>

            {/* Test WhatsApp Button */}
            <div className="pt-2 flex items-center justify-between border-t border-emerald-200">
              <span className="text-xs text-slate-600">Test sending an alert to your WhatsApp:</span>
              <button
                type="button"
                onClick={handleTestWhatsapp}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Test WhatsApp Alert</span>
              </button>
            </div>

            {whatsappTestStatus && (
              <div className="p-2 rounded-lg bg-emerald-100 text-emerald-900 text-xs font-medium animate-in fade-in">
                {whatsappTestStatus}
              </div>
            )}
          </div>

          {/* SECTION 3: AUDIO & ALARM CONTROLS */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                {soundOn ? <Volume2 className="w-5 h-5 text-indigo-600" /> : <VolumeX className="w-5 h-5 text-slate-400" />}
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-xs sm:text-sm">Audio Chimes & Urgent Red Alert Buzzer</h4>
                <p className="text-[11px] text-slate-500">
                  Synthesized web audio alert sounds for candidate submissions and 10-minute red alerts
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => playNotificationChime()}
                className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Chime
              </button>
              <button
                type="button"
                onClick={() => playUrgentRedAlertSound()}
                className="px-2.5 py-1 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors"
              >
                Buzzer
              </button>
              <button
                type="button"
                onClick={() => {
                  const next = !soundOn;
                  setSoundOn(next);
                  setSoundEnabled(next);
                }}
                className={`px-3 py-1 text-xs font-bold rounded-lg border transition-colors ${
                  soundOn
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-slate-200 text-slate-600 border-slate-300"
                }`}
              >
                {soundOn ? "ON" : "MUTED"}
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Settings saved automatically to your browser</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              {savedSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Preferences</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
