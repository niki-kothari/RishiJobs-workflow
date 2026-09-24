import React from "react";
import { TeamMember } from "../types";
import {
  Layers,
  Users,
  Building2,
  Calendar,
  ShieldCheck,
  Database,
  PlusCircle,
  HelpCircle,
  LogOut,
  ChevronRight,
  UserPlus,
  BarChart3,
} from "lucide-react";

export type NavTab =
  | "pipeline"
  | "candidates"
  | "clients"
  | "interviews"
  | "analytics"
  | "team"
  | "storage";

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  candidateCount: number;
  clientCount: number;
  interviewCount: number;
  memberCount: number;
  currentUser: TeamMember;
  onOpenNewCandidate: () => void;
  onOpenAddClient: () => void;
  onOpenAddUser: () => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  candidateCount,
  clientCount,
  interviewCount,
  memberCount,
  currentUser,
  onOpenNewCandidate,
  onOpenAddClient,
  onOpenAddUser,
  onLogout,
}) => {
  const isRecruiter = currentUser.role === "recruiter";

  const allNavItems = [
    {
      id: "pipeline" as NavTab,
      label: "Pipeline",
      icon: Layers,
      count: candidateCount,
    },
    {
      id: "candidates" as NavTab,
      label: "Candidates",
      icon: Users,
      count: candidateCount,
    },
    {
      id: "clients" as NavTab,
      label: "Clients",
      icon: Building2,
      count: clientCount,
    },
    {
      id: "interviews" as NavTab,
      label: "Interviews",
      icon: Calendar,
      count: interviewCount,
    },
    {
      id: "analytics" as NavTab,
      label: "Analytics & Reports",
      icon: BarChart3,
      count: undefined,
      hideForRecruiter: true,
    },
    {
      id: "team" as NavTab,
      label: "Team",
      icon: ShieldCheck,
      count: memberCount,
      hideForRecruiter: true,
    },
    {
      id: "storage" as NavTab,
      label: "Cloud Storage",
      icon: Database,
      count: undefined,
      hideForRecruiter: true,
    },
  ];

  const navItems = isRecruiter ? allNavItems.filter((i) => !i.hideForRecruiter) : allNavItems;

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 min-h-[calc(100vh-4rem)]">
      {/* Quick Action Bar */}
      <div className="p-4 border-b border-slate-800 space-y-2">
        <button
          onClick={onOpenNewCandidate}
          className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Candidate</span>
        </button>

        {/* Add Client Company - Only for PMs and Admins (Recruiters cannot add clients) */}
        {currentUser.role !== "recruiter" && (
          <button
            onClick={onOpenAddClient}
            className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 border border-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Add Client Company</span>
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          Workspace
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left ${
                isActive
                  ? "bg-indigo-600/20 text-white border border-indigo-500/30 font-semibold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? "text-indigo-400" : "text-slate-400"
                  }`}
                />
                <span className="truncate font-medium">{item.label}</span>
              </div>
              {item.count !== undefined && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                    isActive
                      ? "bg-indigo-500 text-white"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User profile & Logout Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-800/60 border border-slate-800 mb-2">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-700 shrink-0"
          />
          <div className="flex-1 truncate">
            <div className="text-xs font-semibold text-white truncate">
              {currentUser.name}
            </div>
            <div className="text-[10px] text-slate-400 truncate capitalize">
              {currentUser.role === "recruiter"
                ? "Team X Recruiter"
                : currentUser.role === "pm"
                ? "Project Manager"
                : "Leadership"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs">
          {currentUser.role !== "recruiter" && (
            <button
              onClick={onOpenAddUser}
              className="flex-1 py-1.5 px-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg text-[11px] flex items-center justify-center gap-1 transition-colors"
              title="Add a new recruiter or PM"
            >
              <UserPlus className="w-3 h-3" />
              <span>+ User</span>
            </button>
          )}
          <button
            onClick={onLogout}
            className="flex-1 py-1.5 px-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 rounded-lg text-[11px] flex items-center justify-center gap-1 transition-colors"
            title="Log out to login screen"
          >
            <LogOut className="w-3 h-3" />
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
