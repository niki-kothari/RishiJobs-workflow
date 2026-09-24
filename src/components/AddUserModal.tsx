import React, { useState } from "react";
import { TeamMember, RoleType } from "../types";
import { UserPlus, X, Users, Briefcase, ShieldCheck } from "lucide-react";

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddUser: (newUser: TeamMember) => void;
}

export const AddUserModal: React.FC<AddUserModalProps> = ({
  isOpen,
  onClose,
  onAddUser,
}) => {
  const [name, setName] = useState("");
  const [role, setRole] = useState<RoleType>("recruiter");
  const [team, setTeam] = useState("Team X");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const userEmail =
      email.trim() ||
      `${name.toLowerCase().replace(/\s+/g, ".")}@rishijobs.com`;

    const newUser: TeamMember = {
      id: `${role.slice(0, 3)}-${Date.now()}`,
      name: name.trim(),
      role,
      team:
        role === "recruiter"
          ? team || "Team X"
          : role === "pm"
          ? "Project Management"
          : "Leadership",
      avatar:
        role === "recruiter"
          ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
          : role === "pm"
          ? "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80"
          : "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
      email: userEmail,
      phone: phone.trim() || "+91 98000 00000",
    };

    onAddUser(newUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-600 text-white">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Add Team Member / User</h3>
              <p className="text-xs text-slate-500">Configure role and channel access</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Anand Roy"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Role *
              </label>
              <select
                value={role}
                onChange={(e) => {
                  const r = e.target.value as RoleType;
                  setRole(r);
                  if (r === "recruiter") setTeam("Team X");
                  else if (r === "pm") setTeam("Project Management");
                  else setTeam("Leadership");
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="recruiter">Team X Recruiter</option>
                <option value="pm">Project Manager (PM)</option>
                <option value="admin">Agency Leadership</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Department / Team
              </label>
              <input
                type="text"
                value={team}
                onChange={(e) => setTeam(e.target.value)}
                placeholder="Team X"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Work Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="anand@rishijobs.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98333 44556"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl text-[11px] text-indigo-900 leading-relaxed">
            {role === "recruiter"
              ? "Recruiters will only view candidates assigned to their pipeline, keeping WhatsApp clutter zero."
              : role === "pm"
              ? "Project Managers manage client relationships and conduct interview scheduling loops."
              : "Leadership members have oversight of all candidates, active client metrics, and placements."}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md shadow-indigo-600/20"
            >
              Add Member
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
