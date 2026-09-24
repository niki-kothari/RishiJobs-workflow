import React, { useState, useEffect } from "react";
import { ClientCompany, TeamMember, Candidate } from "../../types";
import { EditClientModal } from "../EditClientModal";
import {
  Building2,
  Search,
  Plus,
  Briefcase,
  UserCheck,
  Mail,
  Phone,
  Tag,
  ArrowRight,
  ExternalLink,
  Pencil,
  Trash2,
  Eye,
  X,
  Users,
  User,
  CheckCircle2,
  Lock,
} from "lucide-react";

interface ClientsViewProps {
  clients: ClientCompany[];
  members: TeamMember[];
  candidates: Candidate[];
  currentUser: TeamMember;
  onOpenAddClient: () => void;
  onFilterClientInPipeline?: (clientId: string) => void;
  onUpdateClient?: (updated: ClientCompany) => void;
  onDeleteClient?: (clientId: string) => void;
}

export const ClientsView: React.FC<ClientsViewProps> = ({
  clients,
  members,
  candidates,
  currentUser,
  onOpenAddClient,
  onFilterClientInPipeline,
  onUpdateClient,
  onDeleteClient,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [pmFilter, setPmFilter] = useState<string>("all");
  const [recruiterFilter, setRecruiterFilter] = useState<string>("all");
  const [editingClient, setEditingClient] = useState<ClientCompany | null>(null);
  const [deletingClient, setDeletingClient] = useState<ClientCompany | null>(null);
  const [viewingDetailsClient, setViewingDetailsClient] = useState<ClientCompany | null>(null);

  // Always start at top of page when navigating to Clients view
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);

  const isRecruiter = currentUser.role === "recruiter";
  const isPM = currentUser.role === "pm" || currentUser.role === "admin";
  const pms = members.filter((m) => m.role === "pm");
  const recruiters = members.filter((m) => m.role === "recruiter");

  // All clients are visible to all members
  const visibleClients = clients;

  const filteredClients = visibleClients.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.activeRoles.some((r) => r.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesPm = pmFilter === "all" || c.assignedPmId === pmFilter;
    const matchesRecruiter =
      recruiterFilter === "all" ||
      c.assignedRecruiterIds?.includes(recruiterFilter);

    return matchesSearch && matchesPm && matchesRecruiter;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Client Accounts ({filteredClients.length})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Client directory (Visible to all members; managed by Project Managers)
          </p>
        </div>
        {isPM && (
          <button
            onClick={onOpenAddClient}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Client Company</span>
          </button>
        )}
      </div>

      {/* Search & PM filter */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by client company, industry (e.g. SaaS, FinTech), contact person, roles..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <select
          value={pmFilter}
          onChange={(e) => setPmFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="all">All Project Managers</option>
          {pms.map((pm) => (
            <option key={pm.id} value={pm.id}>
              PM: {pm.name}
            </option>
          ))}
        </select>

        {!isRecruiter && (
          <select
            value={recruiterFilter}
            onChange={(e) => setRecruiterFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Team X Recruiters</option>
            {recruiters.map((rec) => (
              <option key={rec.id} value={rec.id}>
                Team X: {rec.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Clients Grid */}
      {filteredClients.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">No Client Companies</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              {clients.length === 0
                ? "Your client accounts directory is currently empty. Click below to register your first client company."
                : "No clients match the current search filters."}
            </p>
          </div>
          {!isRecruiter ? (
            <button
              onClick={onOpenAddClient}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Client Company</span>
            </button>
          ) : (
            <p className="text-xs text-slate-400 font-medium">
              Only Project Managers and Admins can add new clients.
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => {
            const assignedPm = members.find((m) => m.id === client.assignedPmId);
            const clientCandidates = candidates.filter((c) => c.targetClientId === client.id);

            return (
              <div
                key={client.id}
                className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3.5">
                  {/* Client Name & Type/Industry */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-900 text-base truncate">{client.name}</h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Type:</span>
                        <span className="inline-block px-2 py-0.5 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {client.industry}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {isPM && (
                        <>
                          <button
                            type="button"
                            onClick={() => setEditingClient(client)}
                            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit client details (PM only)"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          {onDeleteClient && (
                            <button
                              type="button"
                              onClick={() => setDeletingClient(client)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Delete client (PM only)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Important Details Summary */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                        Assigned PM
                      </span>
                      <div className="flex items-center gap-1.5 mt-1">
                        <img
                          src={
                            assignedPm?.avatar ||
                            "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&auto=format&fit=crop&q=80"
                          }
                          alt={assignedPm?.name || "PM"}
                          className="w-5 h-5 rounded-full object-cover ring-1 ring-emerald-300 shrink-0"
                        />
                        <span className="text-xs font-semibold text-slate-800 truncate">
                          {assignedPm?.name || "Unassigned"}
                        </span>
                      </div>
                    </div>

                    <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                        Pipeline Activity
                      </span>
                      <div className="text-xs font-bold text-slate-800 mt-1 flex items-center gap-1">
                        <span className="text-indigo-700">{clientCandidates.length} Candidates</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-emerald-700">{client.activeRoles.length} Roles</span>
                      </div>
                    </div>
                  </div>

                  {/* Open All Details Action */}
                  <button
                    type="button"
                    onClick={() => setViewingDetailsClient(client)}
                    className="w-full py-2 px-3 bg-indigo-50/70 hover:bg-indigo-100/70 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Open All Details</span>
                  </button>
                </div>

                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px]">
                    Channel: {assignedPm?.name || "PM"} ↔ Team X
                  </span>
                  {onFilterClientInPipeline && (
                    <button
                      onClick={() => onFilterClientInPipeline(client.id)}
                      className="font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 text-xs"
                    >
                      <span>View Pipeline</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Client Modal */}
      {editingClient && (
        <EditClientModal
          isOpen={!!editingClient}
          client={editingClient}
          pms={members.filter((m) => m.role === "pm")}
          recruiters={members.filter((m) => m.role === "recruiter")}
          currentUser={currentUser}
          onClose={() => setEditingClient(null)}
          onUpdateClient={(updated: ClientCompany) => {
            if (onUpdateClient) {
              onUpdateClient(updated);
            }
            setEditingClient(null);
          }}
          onDeleteClient={(clientId: string) => {
            setEditingClient(null);
            if (onDeleteClient) {
              onDeleteClient(clientId);
            }
          }}
        />
      )}

      {/* Comprehensive Client Details Modal ("Open All Details") */}
      {viewingDetailsClient && (() => {
        const client = viewingDetailsClient;
        const assignedPm = members.find((m) => m.id === client.assignedPmId);
        const assignedRecruiters = members.filter(
          (m) => m.role === "recruiter" && (!client.assignedRecruiterIds || client.assignedRecruiterIds.includes(m.id))
        );
        const clientCandidates = candidates.filter((c) => c.targetClientId === client.id);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* Header */}
              <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-indigo-50/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-xs">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg sm:text-xl font-bold text-slate-900">{client.name}</h2>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
                        {client.industry}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Full Client Account Profile & Operational Details
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setViewingDetailsClient(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="p-6 overflow-y-auto space-y-6">
                {/* 1. Contact Information */}
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                    Contact & Key Stakeholder
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                        <UserCheck className="w-4 h-4 text-slate-400" />
                        <span className="font-semibold">Contact Person</span>
                      </div>
                      <div className="text-sm font-bold text-slate-900 truncate">
                        {client.contactPerson || "Not specified"}
                      </div>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                        <Mail className="w-4 h-4 text-slate-400" />
                        <span className="font-semibold">Email Address</span>
                      </div>
                      <div className="text-xs font-semibold text-slate-800 truncate">
                        {client.contactEmail || "Not specified"}
                      </div>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <span className="font-semibold">Phone</span>
                      </div>
                      <div className="text-xs font-semibold text-slate-800 truncate">
                        {client.contactPhone || "Not specified"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Team Assignments */}
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                    Assigned Account Team
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Assigned PM */}
                    <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-100 flex items-center gap-3">
                      <img
                        src={
                          assignedPm?.avatar ||
                          "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&auto=format&fit=crop&q=80"
                        }
                        alt={assignedPm?.name || "PM"}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-300"
                      />
                      <div className="min-w-0">
                        <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider block">
                          Assigned Client PM
                        </span>
                        <div className="text-sm font-bold text-slate-900 truncate">
                          {assignedPm?.name || "Unassigned"}
                        </div>
                        <div className="text-xs text-slate-500 truncate">
                          {assignedPm?.email || "pm@staffing.com"}
                        </div>
                      </div>
                    </div>

                    {/* Assigned Recruiters */}
                    <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-100">
                      <span className="text-[10px] uppercase font-bold text-indigo-700 tracking-wider block mb-2">
                        Assigned Recruiters (Team X)
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {assignedRecruiters.length === 0 ? (
                          <span className="text-xs text-slate-500 italic">All Team X recruiters</span>
                        ) : (
                          assignedRecruiters.map((rec) => (
                            <span
                              key={rec.id}
                              className="px-2.5 py-1 bg-white border border-indigo-200 rounded-lg text-xs font-semibold text-indigo-900 flex items-center gap-1.5"
                            >
                              <User className="w-3 h-3 text-indigo-500" />
                              <span>{rec.name}</span>
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Active Roles / Vacancies */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Active Job Vacancies ({client.activeRoles.length})
                    </h4>
                  </div>
                  {client.activeRoles.length === 0 ? (
                    <p className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-xl">
                      No active vacancies recorded for this client.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {client.activeRoles.map((role, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1.5 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5"
                        >
                          <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{role}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* 4. Notes & Requirements */}
                {client.notes && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Client Brief & Requirements
                    </h4>
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {client.notes}
                    </div>
                  </div>
                )}

                {/* 5. Associated Candidates in Pipeline */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Candidates in Pipeline ({clientCandidates.length})
                    </h4>
                  </div>
                  {clientCandidates.length === 0 ? (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500">
                      No candidates currently assigned to {client.name}.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {clientCandidates.map((c) => (
                        <div
                          key={c.id}
                          className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-xs"
                        >
                          <div>
                            <div className="font-bold text-slate-900">{c.name}</div>
                            <div className="text-slate-500 text-[11px] mt-0.5">
                              {c.targetRole} • {c.experienceYears} yrs exp
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 bg-indigo-50 text-indigo-800 border border-indigo-200 rounded-lg text-[11px] font-bold">
                              {c.stage.replace(/_/g, " ").toUpperCase()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setViewingDetailsClient(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-white transition-colors"
                >
                  Close
                </button>

                <div className="flex items-center gap-2">
                  {isPM && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingClient(client);
                        setViewingDetailsClient(null);
                      }}
                      className="px-4 py-2 border border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Edit Client</span>
                    </button>
                  )}
                  {onFilterClientInPipeline && (
                    <button
                      type="button"
                      onClick={() => {
                        onFilterClientInPipeline(client.id);
                        setViewingDetailsClient(null);
                      }}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <span>View in Pipeline</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Delete Client Confirmation Modal */}
      {deletingClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-100 text-rose-600 rounded-xl">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Client</h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              Are you sure you want to permanently delete <strong>{deletingClient.name}</strong>?
              Associated candidate mappings may also be affected.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingClient(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteClient) {
                    onDeleteClient(deletingClient.id);
                  }
                  setDeletingClient(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
              >
                Delete Client
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
