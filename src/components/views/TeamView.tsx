import React from "react";
import { TeamMember, Candidate, ClientCompany } from "../../types";
import {
  Users,
  Briefcase,
  ShieldCheck,
  UserPlus,
  Mail,
  Phone,
  CheckCircle2,
  Lock,
} from "lucide-react";

interface TeamViewProps {
  members: TeamMember[];
  candidates: Candidate[];
  clients: ClientCompany[];
  currentUser: TeamMember;
  onOpenAddUser: () => void;
}

export const TeamView: React.FC<TeamViewProps> = ({
  members,
  candidates,
  clients,
  currentUser,
  onOpenAddUser,
}) => {
  const recruiters = members.filter((m) => m.role === "recruiter");
  const pms = members.filter((m) => m.role === "pm");
  const admins = members.filter((m) => m.role === "admin");
  const isRecruiter = currentUser.role === "recruiter";

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Team Roster & Access Control ({members.length})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Role-isolated permissions: Team X Recruiters, Client PMs, and Agency Leadership
          </p>
        </div>
        {!isRecruiter && (
          <button
            onClick={onOpenAddUser}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New Team Member</span>
          </button>
        )}
      </div>

      {/* SECTION 1: Team X Recruiters */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              Team X Recruiters ({recruiters.length})
            </h3>
            <p className="text-[11px] text-slate-500">
              Only see candidates assigned to their private pipeline. Zero noise from other recruiters.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {recruiters.map((m) => {
            const activeCands = candidates.filter((c) => c.assignedRecruiterId === m.id);
            const isMe = currentUser.id === m.id;

            return (
              <div
                key={m.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isMe
                    ? "bg-indigo-50/60 border-indigo-300 ring-2 ring-indigo-200"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-start gap-3">
                  <img
                    src={m.avatar}
                    alt={m.name}
                    className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-300 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-slate-900 text-sm truncate">{m.name}</h4>
                      {isMe && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-600 text-white">
                          You
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-indigo-600 font-medium">{m.team}</div>
                    <div className="text-xs text-slate-500 mt-2 space-y-1">
                      <div className="flex items-center gap-1.5 truncate">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{m.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{m.phone}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">
                    {activeCands.length} active candidates
                  </span>
                  <span className="text-[10px] font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                    Recruiter
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: Project Managers */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
            <Briefcase className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              Project Managers (PMs) ({pms.length})
            </h3>
            <p className="text-[11px] text-slate-500">
              Own client accounts, conduct interview negotiation loops, and forward candidates.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {pms.map((m) => {
            const myClients = clients.filter((c) => c.assignedPmId === m.id);
            const myCands = candidates.filter((c) => c.assignedPmId === m.id);
            const isMe = currentUser.id === m.id;

            return (
              <div
                key={m.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isMe
                    ? "bg-emerald-50/60 border-emerald-300 ring-2 ring-emerald-200"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-start gap-3">
                  <img
                    src={m.avatar}
                    alt={m.name}
                    className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-300 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-slate-900 text-sm truncate">{m.name}</h4>
                      {isMe && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-600 text-white">
                          You
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-emerald-600 font-medium">
                      Project Management
                    </div>
                    <div className="text-xs text-slate-500 mt-2 space-y-1">
                      <div className="flex items-center gap-1.5 truncate">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{m.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{m.phone}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">
                    {myClients.length} clients • {myCands.length} candidates
                  </span>
                  <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Project Manager
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: Agency Leadership */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-purple-100 text-purple-700">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              Agency Leadership ({admins.length})
            </h3>
            <p className="text-[11px] text-slate-500">
              Unrestricted oversight: all candidates, 300+ clients, bottlenecks, and placements.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {admins.map((m) => {
            const isMe = currentUser.id === m.id;

            return (
              <div
                key={m.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isMe
                    ? "bg-purple-50/60 border-purple-300 ring-2 ring-purple-200"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-start gap-3">
                  <img
                    src={m.avatar}
                    alt={m.name}
                    className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-300 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-slate-900 text-sm truncate">{m.name}</h4>
                      {isMe && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-purple-600 text-white">
                          You
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-purple-600 font-medium">
                      Founder & Managing Director
                    </div>
                    <div className="text-xs text-slate-500 mt-2 space-y-1">
                      <div className="flex items-center gap-1.5 truncate">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{m.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{m.phone}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">
                    Global Agency View • All Channels
                  </span>
                  <span className="text-[10px] font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                    Leadership
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
