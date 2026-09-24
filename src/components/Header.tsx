import React, { useState, useEffect } from "react";
import { TeamMember, RoleType, InAppNotification } from "../types";
import {
  Users,
  Briefcase,
  ShieldCheck,
  HelpCircle,
  Plus,
  Bell,
  RefreshCw,
  CheckCircle2,
  ChevronDown,
  Database,
  LogOut,
  UserPlus,
  Building2,
  Volume2,
  VolumeX,
  AlertTriangle,
  Clock,
  ArrowRight,
  ShieldAlert,
  Calendar,
  X,
  Settings,
  MessageSquare,
  Laptop,
} from "lucide-react";
import { isSoundEnabled, setSoundEnabled, playNotificationChime, playUrgentRedAlertSound } from "../utils/audioAlert";
import {
  getSystemNotificationPermission,
  openWhatsappAlert,
  getNotificationSettings,
} from "../utils/systemNotification";

interface HeaderProps {
  currentUser: TeamMember;
  allMembers: TeamMember[];
  firestoreStatus?: "connected" | "connecting" | "offline";
  onOpenNewCandidate: () => void;
  onOpenAddClient: () => void;
  onOpenAddUser: () => void;
  onOpenExplainer: () => void;
  onOpenStorageArchitecture: () => void;
  onOpenNotificationSettings?: () => void;
  onResetData: () => void;
  onLogout: () => void;
  pendingActionCount: number;
  overdueCount?: number;
  notifications?: InAppNotification[];
  onOpenCandidateFromNotification?: (candidateId: string) => void;
  onTriggerTestRedAlert?: () => void;
  onOpenDirectChat?: () => void;
  unreadChatCount?: number;
  hasUrgentNudge?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  allMembers,
  firestoreStatus = "connected",
  onOpenNewCandidate,
  onOpenAddClient,
  onOpenAddUser,
  onOpenExplainer,
  onOpenStorageArchitecture,
  onOpenNotificationSettings,
  onResetData,
  onLogout,
  pendingActionCount,
  overdueCount = 0,
  notifications = [],
  onOpenCandidateFromNotification,
  onTriggerTestRedAlert,
  onOpenDirectChat,
  unreadChatCount = 0,
  hasUrgentNudge = false,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [soundActive, setSoundActive] = useState(isSoundEnabled());
  const [sysPermission, setSysPermission] = useState<string>("default");

  useEffect(() => {
    setSysPermission(getSystemNotificationPermission());
  }, [notificationsOpen]);

  const handleToggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !soundActive;
    setSoundActive(next);
    setSoundEnabled(next);
    if (next) {
      playNotificationChime();
    }
  };

  const handleTestChime = (e: React.MouseEvent) => {
    e.stopPropagation();
    playNotificationChime();
  };

  const handleTestRedAlert = (e: React.MouseEvent) => {
    e.stopPropagation();
    playUrgentRedAlertSound();
    if (onTriggerTestRedAlert) {
      onTriggerTestRedAlert();
    }
  };

  const recruiters = allMembers.filter((m) => m.role === "recruiter");
  const pms = allMembers.filter((m) => m.role === "pm");
  const admins = allMembers.filter((m) => m.role === "admin");


  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & App Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-200">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 text-lg tracking-tight">
                  Rishi Jobs
                </span>
                {/* Cloud Firestore Status Badge - Hidden for PE/Team X recruiters */}
                {currentUser.role !== "recruiter" && (
                  <button
                    onClick={onOpenStorageArchitecture}
                    className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
                    title="Cloud Firestore is actively persisting your candidates and clients"
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        firestoreStatus === "connected"
                          ? "bg-emerald-500 animate-pulse"
                          : firestoreStatus === "connecting"
                          ? "bg-amber-400"
                          : "bg-rose-400"
                      }`}
                    />
                    <span>Firestore Cloud</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons & Current User */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Add Client Button - Only for PMs and Admins (Recruiters cannot add clients) */}
            {currentUser.role !== "recruiter" && (
              <button
                onClick={onOpenAddClient}
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors"
                title="Add a client company to the database"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Add Client</span>
              </button>
            )}

            {/* Add Candidate Button */}
            <button
              onClick={onOpenNewCandidate}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Candidate</span>
            </button>

            {/* Interactive Notification Center */}
            <div className="relative">
              <button
                id="header-notification-btn"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className={`p-2 rounded-xl border transition-all flex items-center justify-center relative ${
                  overdueCount > 0
                    ? "bg-rose-50 border-rose-300 text-rose-700 shadow-xs ring-2 ring-rose-400/30"
                    : pendingActionCount > 0
                    ? "bg-amber-50 border-amber-200 text-amber-700"
                    : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                }`}
                title={`Notifications: ${overdueCount} Red Alert (10+ mins overdue), ${pendingActionCount} pending actions`}
              >
                <Bell className={`w-4 h-4 ${overdueCount > 0 ? "animate-bounce" : ""}`} />
                {overdueCount > 0 ? (
                  <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 bg-rose-600 text-white rounded-full text-[10px] font-black tracking-tight flex items-center justify-center animate-pulse border border-white">
                    {overdueCount} ⚠️
                  </span>
                ) : pendingActionCount > 0 ? (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {pendingActionCount}
                  </span>
                ) : null}
              </button>

              {/* Notification Popover Dropdown */}
              {notificationsOpen && (
                <div
                  id="notifications-dropdown-menu"
                  className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 py-3 z-50 animate-in fade-in zoom-in-95 duration-150"
                >
                  {/* Dropdown Header */}
                  <div className="px-4 pb-3 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <Bell className="w-4 h-4 text-indigo-600" />
                        <span>Action Notifications</span>
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Real-time alerts for submissions, updates & loops
                      </p>
                    </div>

                    {/* Sound Settings & Test Button */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={handleToggleSound}
                        className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors ${
                          soundActive
                            ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                            : "bg-slate-100 border-slate-200 text-slate-500"
                        }`}
                        title={soundActive ? "Mute notification sounds" : "Unmute notification sounds"}
                      >
                        {soundActive ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                        <span className="text-[10px]">{soundActive ? "ON" : "OFF"}</span>
                      </button>

                      <button
                        onClick={() => setNotificationsOpen(false)}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Overdue Warning Callout */}
                  {overdueCount > 0 && (
                    <div className="mx-3 my-2.5 p-2.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2">
                      <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-rose-900 flex items-center justify-between">
                          <span>{overdueCount} Red Alert {overdueCount === 1 ? "Item" : "Items"}</span>
                          <span className="text-[10px] bg-rose-200 text-rose-900 px-1.5 py-0.2 rounded font-black">
                            10m+ Overdue
                          </span>
                        </div>
                        <p className="text-[11px] text-rose-700 mt-0.5">
                          Actions stalled over 10 minutes alert with sound and OS desktop notifications until resolved.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Audio Test & System Settings Bar */}
                  <div className="px-4 py-2 bg-slate-50 border-y border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={handleTestChime}
                        className="px-2 py-1 text-[11px] font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-md transition-colors"
                        title="Play chime sound"
                      >
                        Chime
                      </button>
                      <button
                        onClick={handleTestRedAlert}
                        className="px-2 py-1 text-[11px] font-bold text-rose-700 bg-rose-100 hover:bg-rose-200 rounded-md transition-colors flex items-center gap-1"
                        title="Play urgent alarm & trigger alert preview"
                      >
                        <AlertTriangle className="w-3 h-3" />
                        <span>Red Alert</span>
                      </button>
                    </div>

                    {onOpenNotificationSettings && (
                      <button
                        onClick={() => {
                          setNotificationsOpen(false);
                          onOpenNotificationSettings();
                        }}
                        className="px-2 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors flex items-center gap-1"
                        title="Configure OS System & WhatsApp Alerts"
                      >
                        <Laptop className="w-3 h-3" />
                        <span>Desktop & WhatsApp</span>
                      </button>
                    )}
                  </div>

                  {/* Notification List */}
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center px-4">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                        <p className="text-xs font-semibold text-slate-700">All caught up!</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          When submissions, handoffs, or interview updates occur, alerts appear here.
                        </p>
                      </div>
                    ) : (
                      notifications.slice(0, 10).map((n) => (
                        <div
                          key={n.id}
                          className={`p-3 hover:bg-slate-50 transition-colors flex items-start gap-2.5 ${
                            n.priority === "urgent_red_alert" ? "bg-rose-50/40" : ""
                          }`}
                        >
                          <div
                            className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                              n.priority === "urgent_red_alert"
                                ? "bg-rose-100 text-rose-700"
                                : "bg-indigo-100 text-indigo-700"
                            }`}
                          >
                            {n.type === "interview" ? (
                              <Calendar className="w-3.5 h-3.5" />
                            ) : n.priority === "urgent_red_alert" ? (
                              <ShieldAlert className="w-3.5 h-3.5" />
                            ) : (
                              <ArrowRight className="w-3.5 h-3.5" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-bold text-slate-900 truncate">
                                {n.candidateName}
                              </span>
                              <span className="text-[10px] text-slate-400 shrink-0">
                                {new Date(n.timestamp).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">
                              {n.message}
                            </p>
                            <div className="mt-1 flex items-center justify-between gap-2">
                              <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded truncate">
                                {n.actionDescription || n.type.replace(/_/g, " ")}
                              </span>
                              
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const candidateMock: any = {
                                      id: n.candidateId,
                                      name: n.candidateName,
                                      targetRole: n.targetRole || "Role",
                                      targetClientId: "",
                                      actionDescription: n.actionDescription || n.message,
                                      actionOwner: n.actionRequiredFrom,
                                    };
                                    openWhatsappAlert({
                                      candidate: candidateMock,
                                      clientName: n.targetClientName,
                                      actionOwnerText: n.actionRequiredFrom === "recruiter" ? "Recruiter" : "PM",
                                      overdueMinutes: n.overdueMinutes,
                                    });
                                  }}
                                  className="px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded flex items-center gap-0.5 transition-colors"
                                  title="Send WhatsApp Alert"
                                >
                                  <MessageSquare className="w-3 h-3 text-emerald-600" />
                                  <span>WA</span>
                                </button>

                                {onOpenCandidateFromNotification && (
                                  <button
                                    onClick={() => {
                                      onOpenCandidateFromNotification(n.candidateId);
                                      setNotificationsOpen(false);
                                    }}
                                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5"
                                  >
                                    <span>Open</span>
                                    <ArrowRight className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Footer Info */}
                  <div className="px-4 py-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                    <span>Recurring 10m Red Alert SLA active</span>
                    {onOpenNotificationSettings && (
                      <button
                        onClick={() => {
                          setNotificationsOpen(false);
                          onOpenNotificationSettings();
                        }}
                        className="text-indigo-600 hover:text-indigo-800 font-bold"
                      >
                        Notification Settings →
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Team Direct Chat & Urgent Pipeline Nudges */}
            {onOpenDirectChat && (
              <button
                type="button"
                onClick={onOpenDirectChat}
                className={`relative p-2 rounded-xl border transition-all flex items-center gap-1.5 ${
                  hasUrgentNudge
                    ? "bg-rose-50 border-rose-300 text-rose-700 animate-pulse shadow-xs"
                    : unreadChatCount > 0
                    ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-xs"
                    : "border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-slate-50"
                }`}
                title="Team Direct Chat & Pipeline Nudges"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="hidden md:inline text-xs font-semibold">
                  {currentUser.role === "pm" || currentUser.role === "admin" ? "Nudge / Chat" : "Team Chat"}
                </span>
                {unreadChatCount > 0 && (
                  <span
                    className={`px-1.5 py-0.2 text-[10px] font-black rounded-full leading-tight ${
                      hasUrgentNudge ? "bg-rose-600 text-white animate-bounce" : "bg-indigo-600 text-white"
                    }`}
                  >
                    {unreadChatCount}
                  </span>
                )}
              </button>
            )}

            {/* Direct Logout Button */}
            <button
              onClick={onLogout}
              className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-xl transition-colors flex items-center gap-1.5"
              title="Log out to login screen"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Log Out</span>
            </button>

            {/* Current User Profile Popover (No switching between users) */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 p-1.5 pl-2 pr-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
                title="Account Details"
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-300"
                />
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-semibold text-slate-900 leading-tight">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-slate-500 capitalize leading-none mt-0.5">
                    {currentUser.role === "recruiter"
                      ? "Team X"
                      : currentUser.role === "pm"
                      ? "PM"
                      : "Admin"}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {dropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in slide-in-from-top-1 duration-150 space-y-3">
                    {/* User Info */}
                    <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                      <img
                        src={currentUser.avatar}
                        alt={currentUser.name}
                        className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-300 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {currentUser.name}
                        </div>
                        <div className="text-[11px] text-indigo-600 font-medium truncate">
                          {currentUser.role === "recruiter"
                            ? "Team X Recruiter"
                            : currentUser.role === "pm"
                            ? "Project Manager (PM)"
                            : "Agency Leadership"}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {currentUser.email}
                        </div>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-500 bg-slate-50 rounded-lg p-2 border border-slate-100">
                      To switch to another team account, please log out.
                    </div>

                    {/* Actions */}
                    <div className="space-y-1.5 pt-1">
                      {currentUser.role !== "recruiter" && (
                        <button
                          onClick={() => {
                            setDropdownOpen(false);
                            onOpenAddUser();
                          }}
                          className="w-full text-left text-xs text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50/60 font-medium flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Add New Team Member</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          onLogout();
                        }}
                        className="w-full text-left text-xs text-rose-700 bg-rose-50 hover:bg-rose-100 font-semibold flex items-center justify-center gap-2 px-3 py-2 rounded-xl transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Notification Bar (Only shown when action is needed) */}
      {pendingActionCount > 0 && (
        <div className="text-xs py-1.5 px-4 text-center border-t bg-amber-50 border-amber-200 text-amber-900 transition-colors">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <span className="font-semibold text-[11px] text-amber-800">
              {pendingActionCount} {pendingActionCount === 1 ? "candidate action" : "candidate actions"} awaiting response from you
            </span>
          </div>
        </div>
      )}
    </header>
  );
};
