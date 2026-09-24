import React, { useState } from "react";
import { ClientCompany, TeamMember } from "../types";
import { Building2, X, Plus, Trash2, Mail, Phone, UserCheck, Briefcase } from "lucide-react";

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  pms: TeamMember[];
  recruiters?: TeamMember[];
  onAddClient: (newClient: ClientCompany) => void;
}

export const AddClientModal: React.FC<AddClientModalProps> = ({
  isOpen,
  onClose,
  pms,
  recruiters = [],
  onAddClient,
}) => {
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("Technology & Cloud");
  const [assignedPmId, setAssignedPmId] = useState(pms[0]?.id || "pm-1");
  const [selectedRecruiterIds, setSelectedRecruiterIds] = useState<string[]>([]);
  const [contactPerson, setContactPerson] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [rolesText, setRolesText] = useState("");
  const [notes, setNotes] = useState("");

  if (!isOpen) return null;

  const toggleRecruiter = (recId: string) => {
    setSelectedRecruiterIds((prev) =>
      prev.includes(recId) ? prev.filter((id) => id !== recId) : [...prev, recId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const activeRoles = rolesText
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean);

    const newClient: ClientCompany = {
      id: `client-${Date.now()}`,
      name: name.trim(),
      industry: industry.trim() || "Technology",
      assignedPmId,
      assignedRecruiterIds: selectedRecruiterIds,
      contactPerson: contactPerson.trim() || "Hiring Manager",
      contactEmail:
        contactEmail.trim() ||
        `talent@${name.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`,
      contactPhone: contactPhone.trim(),
      activeRoles:
        activeRoles.length > 0 ? activeRoles : ["Software Engineer", "Technical Lead"],
      notes: notes.trim(),
    };

    onAddClient(newClient);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[92vh] overflow-hidden shadow-2xl flex flex-col border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-600 text-white">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Add New Client Company</h3>
              <p className="text-xs text-slate-500">
                Register a client account and assign a dedicated Project Manager
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Client Company Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Apex Cloud Solutions"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Industry / Domain
              </label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g. FinTech, SaaS, Healthcare"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Assigned Project Manager (PM) *
              </label>
              <select
                value={assignedPmId}
                onChange={(e) => setAssignedPmId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {pms.map((pm) => (
                  <option key={pm.id} value={pm.id}>
                    {pm.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Assigned Team X Recruiters */}
          {recruiters.length > 0 && (
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Assign Team X Recruiters (optional)
              </label>
              <p className="text-[11px] text-slate-500 mb-2">
                Selected Team X members will have direct access to this client in their workspace.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {recruiters.map((rec) => {
                  const isSelected = selectedRecruiterIds.includes(rec.id);
                  return (
                    <button
                      key={rec.id}
                      type="button"
                      onClick={() => toggleRecruiter(rec.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                        isSelected
                          ? "bg-indigo-50 border-indigo-300 text-indigo-700 font-semibold"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isSelected ? "bg-indigo-600" : "bg-slate-300"
                        }`}
                      />
                      <span>{rec.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <h4 className="font-semibold text-slate-800 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>Client Contact Person / Hiring Manager</span>
            </h4>

            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Contact Person Name & Title
              </label>
              <input
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="e.g. Vikram Singhania (VP Engineering)"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="vikram@apexcloud.com"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Contact Phone
                </label>
                <input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+91 98222 33445"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Active Vacancies / Open Roles (comma separated)
            </label>
            <input
              type="text"
              value={rolesText}
              onChange={(e) => setRolesText(e.target.value)}
              placeholder="e.g. Lead React Architect, Staff Backend Engineer, Engineering Manager"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Recruiters can select from these roles when mapping candidates to this client.
            </p>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Hiring Notes & Requirements
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Preference for candidates with distributed systems experience. Fast turnaround on interview feedbacks."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Save Client Account</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
