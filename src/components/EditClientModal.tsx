import React, { useState } from "react";
import { ClientCompany, TeamMember } from "../types";
import { X, Building2, UserCheck, Mail, Phone, Briefcase, FileText, Check, Users } from "lucide-react";

interface EditClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: ClientCompany;
  pms: TeamMember[];
  recruiters: TeamMember[];
  currentUser: TeamMember;
  onUpdateClient: (updated: ClientCompany) => void;
  onDeleteClient?: (clientId: string) => void;
}

export const EditClientModal: React.FC<EditClientModalProps> = ({
  isOpen,
  onClose,
  client,
  pms,
  recruiters,
  currentUser,
  onUpdateClient,
  onDeleteClient,
}) => {
  if (!isOpen) return null;

  const isRecruiter = currentUser.role === "recruiter";

  const [name, setName] = useState(client.name);
  const [industry, setIndustry] = useState(client.industry);
  const [contactPerson, setContactPerson] = useState(client.contactPerson);
  const [contactEmail, setContactEmail] = useState(client.contactEmail);
  const [contactPhone, setContactPhone] = useState(client.contactPhone || "");
  const [assignedPmId, setAssignedPmId] = useState(client.assignedPmId);
  const [assignedRecruiterIds, setAssignedRecruiterIds] = useState<string[]>(
    client.assignedRecruiterIds || []
  );
  const [rolesStr, setRolesStr] = useState(client.activeRoles.join(", "));
  const [notes, setNotes] = useState(client.notes || "");

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const toggleRecruiter = (recId: string) => {
    setAssignedRecruiterIds((prev) =>
      prev.includes(recId) ? prev.filter((id) => id !== recId) : [...prev, recId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !contactPerson.trim()) return;

    const rolesArray = rolesStr
      .split(",")
      .map((r) => r.trim())
      .filter((r) => r.length > 0);

    const updated: ClientCompany = {
      ...client,
      name: name.trim(),
      industry: industry.trim(),
      contactPerson: contactPerson.trim(),
      contactEmail: contactEmail.trim(),
      contactPhone: contactPhone.trim(),
      assignedPmId,
      assignedRecruiterIds:
        assignedRecruiterIds.length > 0
          ? assignedRecruiterIds
          : recruiters.map((r) => r.id),
      activeRoles: rolesArray.length > 0 ? rolesArray : client.activeRoles,
      notes: notes.trim(),
    };

    onUpdateClient(updated);
    onClose();
  };

  const handleDelete = () => {
    if (onDeleteClient) {
      onDeleteClient(client.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full overflow-hidden border border-slate-200 my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Update Client Details</h3>
            <p className="text-xs text-slate-500">Edit company account, contacts, and assignments</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {/* Company Name & Industry */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Company Name *</label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Industry / Sector *</label>
              <input
                type="text"
                required
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g. Fintech, SaaS, Healthcare"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Contact Person & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Key Contact Person *</label>
              <div className="relative">
                <UserCheck className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Contact Email *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Contact Phone & Assigned PM */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Contact Phone</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+91 / +1 phone number"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Assigned Client PM *</label>
              <select
                disabled={isRecruiter}
                value={assignedPmId}
                onChange={(e) => setAssignedPmId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60"
              >
                {pms.map((pm) => (
                  <option key={pm.id} value={pm.id}>
                    {pm.name} ({pm.role.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Assigned Team X Recruiters */}
          {!isRecruiter && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                <span>Assigned Team X Recruiters</span>
              </label>
              <p className="text-[11px] text-slate-500 mb-2">
                Select which Team X recruiters have access to supply candidates for this client:
              </p>
              <div className="flex flex-wrap gap-2">
                {recruiters.map((rec) => {
                  const isChecked = assignedRecruiterIds.includes(rec.id);
                  return (
                    <button
                      type="button"
                      key={rec.id}
                      onClick={() => toggleRecruiter(rec.id)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                        isChecked
                          ? "bg-indigo-50 border-indigo-300 text-indigo-800 shadow-2xs"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isChecked ? "bg-indigo-600" : "bg-slate-300"
                        }`}
                      />
                      <span>{rec.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active Roles */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Active Vacancies / Open Roles (comma-separated)
            </label>
            <div className="relative">
              <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={rolesStr}
                onChange={(e) => setRolesStr(e.target.value)}
                placeholder="e.g. Senior Backend Engineer, Lead DevOps, Product Designer"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Internal Account Notes */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Internal Notes</label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Client interview preferences, feedback turnaround times, budget notes..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              />
            </div>
          </div>

          {/* Delete Confirmation Box */}
          {showDeleteConfirm && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-2">
              <p className="font-bold text-rose-900 text-xs">
                Are you sure you want to delete client "{client.name}"?
              </p>
              <p className="text-[11px] text-rose-700">
                This will remove the client account from the directory. Active candidates targeting this client will remain in the pipeline but can be reassigned.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                >
                  Yes, Permanently Delete
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <div>
              {!isRecruiter && onDeleteClient && !showDeleteConfirm && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-3 py-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg font-semibold transition-colors"
                >
                  Delete Client
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold shadow-xs transition-colors inline-flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Save Client</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
