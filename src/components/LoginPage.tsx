import React, { useState } from "react";
import { TeamMember, RoleType } from "../types";
import {
  Users,
  Briefcase,
  ShieldCheck,
  UserPlus,
  LogIn,
  CheckCircle2,
  Lock,
  Mail,
  Phone,
  Sparkles,
  Layers,
  ArrowRight,
} from "lucide-react";

interface LoginPageProps {
  members: TeamMember[];
  onLogin: (userId: string) => void;
  onAddNewUser: (newUser: TeamMember) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  members,
  onLogin,
  onAddNewUser,
}) => {
  const [selectedUserId, setSelectedUserId] = useState<string>(members[0]?.id || "");
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [loginMethod, setLoginMethod] = useState<"quick" | "credentials">("quick");

  // Credentials login state
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // New user form state
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newRole, setNewRole] = useState<RoleType>("recruiter");
  const [newTeam, setNewTeam] = useState("Team X");

  const recruiters = members.filter((m) => m.role === "recruiter");
  const pms = members.filter((m) => m.role === "pm");
  const admins = members.filter((m) => m.role === "admin");

  const handleQuickLogin = (id: string) => {
    onLogin(id);
  };

  const handleCredentialsLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    const found = members.find(
      (m) => m.email.toLowerCase() === emailInput.trim().toLowerCase()
    );
    if (found) {
      onLogin(found.id);
    } else {
      setErrorMessage(
        `No account found with email "${emailInput}". Please select your profile from the quick login tab or add a new user.`
      );
    }
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const userEmail =
      newEmail.trim() ||
      `${newName.toLowerCase().replace(/\s+/g, ".")}@rishijobs.com`;

    const newUser: TeamMember = {
      id: `${newRole.slice(0, 3)}-${Date.now()}`,
      name: newName.trim(),
      role: newRole,
      team:
        newRole === "recruiter"
          ? newTeam || "Team X"
          : newRole === "pm"
          ? "Project Management"
          : "Leadership",
      avatar:
        newRole === "recruiter"
          ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
          : newRole === "pm"
          ? "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&auto=format&fit=crop&q=80"
          : "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
      email: userEmail,
      phone: newPhone.trim() || "+91 98000 00000",
    };

    onAddNewUser(newUser);
    setIsAddingUser(false);
    onLogin(newUser.id);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="max-w-xl w-full bg-slate-800/90 border border-slate-700/80 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 mb-1">
            <Layers className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Rishi Jobs
          </h1>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Candidate & Interview Coordination
          </p>
        </div>

        {/* Mode Switcher: Quick Select vs Password vs Add User */}
        {!isAddingUser ? (
          <>
            <div className="flex border-b border-slate-700 text-xs font-semibold">
              <button
                onClick={() => setLoginMethod("quick")}
                className={`flex-1 py-2.5 text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
                  loginMethod === "quick"
                    ? "border-indigo-500 text-indigo-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Select Team Account</span>
              </button>

              <button
                onClick={() => setLoginMethod("credentials")}
                className={`flex-1 py-2.5 text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
                  loginMethod === "credentials"
                    ? "border-indigo-500 text-indigo-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Email Sign In</span>
              </button>
            </div>

            {/* Quick Profile Selection */}
            {loginMethod === "quick" && (
              <div className="space-y-4">
                <p className="text-xs text-slate-300 font-medium">
                  Click your profile to log in to your role-isolated workspace:
                </p>

                {/* Team X Recruiters */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                    <Users className="w-3 h-3" /> Team X Recruiters
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {recruiters.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => handleQuickLogin(m.id)}
                        className="p-2.5 rounded-xl bg-slate-700/50 hover:bg-indigo-600/30 border border-slate-600 hover:border-indigo-500 text-left transition-all group flex items-center gap-2.5"
                      >
                        <img
                          src={m.avatar}
                          alt={m.name}
                          className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-slate-500 group-hover:ring-indigo-400"
                        />
                        <div className="truncate">
                          <div className="text-xs font-semibold text-white group-hover:text-indigo-200 truncate">
                            {m.name}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Project Managers */}
                <div className="space-y-1.5 pt-2 border-t border-slate-700/70">
                  <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                    <Briefcase className="w-3 h-3" /> Project Managers (PMs)
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {pms.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => handleQuickLogin(m.id)}
                        className="p-2.5 rounded-xl bg-slate-700/50 hover:bg-emerald-600/30 border border-slate-600 hover:border-emerald-500 text-left transition-all group flex items-center gap-2.5"
                      >
                        <img
                          src={m.avatar}
                          alt={m.name}
                          className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-slate-500 group-hover:ring-emerald-400"
                        />
                        <div className="truncate">
                          <div className="text-xs font-semibold text-white group-hover:text-emerald-200 truncate">
                            {m.name}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Leadership */}
                <div className="space-y-1.5 pt-2 border-t border-slate-700/70">
                  <div className="text-[11px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Agency Leadership
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {admins.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => handleQuickLogin(m.id)}
                        className="p-2.5 rounded-xl bg-slate-700/50 hover:bg-purple-600/30 border border-slate-600 hover:border-purple-500 text-left transition-all group flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          <img
                            src={m.avatar}
                            alt={m.name}
                            className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-500 group-hover:ring-purple-400"
                          />
                          <div>
                            <div className="text-xs font-semibold text-white group-hover:text-purple-200">
                              {m.name}
                            </div>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-purple-400 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Credentials Sign In */}
            {loginMethod === "credentials" && (
              <form onSubmit={handleCredentialsLogin} className="space-y-4">
                {errorMessage && (
                  <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-xs text-rose-300">
                    {errorMessage}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Work Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="e.g. bhavya@rishijobs.com"
                      className="w-full bg-slate-900/80 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Tip: Enter any team member email (e.g. bhavya@rishijobs.com, shweta@rishijobs.com, rishi@rishijobs.com)
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-900/80 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-600/30"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </button>
              </form>
            )}

            {/* Footer action to Add New User */}
            <div className="pt-3 border-t border-slate-700/80 flex items-center justify-between text-xs">
              <span className="text-slate-400">Need to onboard a new team member?</span>
              <button
                onClick={() => setIsAddingUser(true)}
                className="font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add New User</span>
              </button>
            </div>
          </>
        ) : (
          /* Add New User Form */
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white">Create New Team Account</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingUser(false)}
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Priya Sharma"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Role *
                </label>
                <select
                  value={newRole}
                  onChange={(e) => {
                    const r = e.target.value as RoleType;
                    setNewRole(r);
                    if (r === "recruiter") setNewTeam("Team X");
                    else if (r === "pm") setNewTeam("Project Management");
                    else setNewTeam("Leadership");
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="recruiter">Team X Recruiter</option>
                  <option value="pm">Project Manager (PM)</option>
                  <option value="admin">Agency Leadership / Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Team / Department
                </label>
                <input
                  type="text"
                  value={newTeam}
                  onChange={(e) => setNewTeam(e.target.value)}
                  placeholder="e.g. Team X (Engineering)"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="priya@rishijobs.com"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Phone / WhatsApp
                </label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="+91 98111 22334"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-700/60 text-[11px] text-slate-400">
              New user will be granted role-isolated workspace access and can be assigned to candidates and client accounts immediately.
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddingUser(false)}
                className="flex-1 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-700/50 hover:bg-slate-700 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors shadow-lg shadow-indigo-600/30"
              >
                Create Account & Sign In
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Trust & Architecture Note */}
      <div className="mt-6 text-center text-xs text-slate-500 max-w-md">
        🔒 Role-Based Access Control • 1-to-1 Candidate Isolated Pipelines • No Cross-Team WhatsApp Clutter
      </div>
    </div>
  );
};
