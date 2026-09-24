import React, { useState } from "react";
import { Candidate, ClientCompany, TeamMember } from "../types";
import {
  Database,
  Lock,
  Server,
  Cloud,
  Download,
  Upload,
  CheckCircle2,
  FileText,
  Users,
  Building,
  Shield,
  Layers,
  ArrowRight,
  X,
  Sparkles,
} from "lucide-react";

interface StorageArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidates: Candidate[];
  clients: ClientCompany[];
  members: TeamMember[];
  onImportData?: (importedCandidates: Candidate[]) => void;
}

export const StorageArchitectureModal: React.FC<StorageArchitectureModalProps> = ({
  isOpen,
  onClose,
  candidates,
  clients,
  members,
  onImportData,
}) => {
  const [activeTab, setActiveTab] = useState<"storage" | "login" | "backup">("storage");
  const [importStatus, setImportStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExportJSON = () => {
    const backupData = {
      agency: "Rishi Jobs",
      exportDate: new Date().toISOString(),
      stats: {
        totalCandidates: candidates.length,
        totalClients: clients.length,
        totalTeamMembers: members.length,
      },
      teamMembers: members,
      clients,
      candidates,
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `rishi_jobs_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.candidates && Array.isArray(json.candidates)) {
          if (onImportData) {
            onImportData(json.candidates);
            setImportStatus(`Successfully imported ${json.candidates.length} candidates into Rishi Jobs!`);
          }
        } else if (Array.isArray(json)) {
          if (onImportData) {
            onImportData(json);
            setImportStatus(`Successfully imported ${json.length} candidates into Rishi Jobs!`);
          }
        } else {
          setImportStatus("Invalid file structure. Expected JSON with a 'candidates' list.");
        }
      } catch (err) {
        setImportStatus("Failed to parse JSON file. Please ensure valid JSON formatting.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Rishi Jobs • Data Storage & Authentication Architecture
              </h3>
              <p className="text-xs text-slate-500">
                How 500+ candidates, 300+ clients, and team logins are handled securely
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

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-white px-6 pt-2 gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("storage")}
            className={`pb-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === "storage"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Where Data is Stored (500+ Candidates / 300+ Clients)</span>
          </button>

          <button
            onClick={() => setActiveTab("login")}
            className={`pb-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === "login"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>How Team Members Log In</span>
          </button>

          <button
            onClick={() => setActiveTab("backup")}
            className={`pb-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === "backup"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Backup & Bulk Import</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs text-slate-700 leading-relaxed">
          {activeTab === "storage" && (
            <div className="space-y-4">
              {/* High-level summary */}
              <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-4">
                <h4 className="font-bold text-indigo-950 text-sm mb-1 flex items-center gap-1.5">
                  <Cloud className="w-4 h-4 text-indigo-600" />
                  Your 2-Tier Data Storage Architecture
                </h4>
                <p className="text-indigo-900 text-xs leading-relaxed">
                  For an agency managing <strong>500+ active candidates</strong> and <strong>300+ client accounts</strong>, data cannot live in scattered WhatsApp chats. It is organized into structured, indexed cloud collections:
                </p>
              </div>

              {/* The 4 Core Collections */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Collection 1: Candidates */}
                <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-indigo-600" />
                      1. Candidates Collection
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                      500+ Records
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Stores candidate profile, original/revised CV highlights, assigned Team X Recruiter (Bhavya, Dheer, etc.), target client, and full status stage from screening to placement.
                  </p>
                  <div className="mt-2 text-[10px] font-mono text-slate-500 bg-white p-1.5 rounded border border-slate-200">
                    /candidates/{`{candidate_id}`}
                  </div>
                </div>

                {/* Collection 2: Clients */}
                <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-emerald-600" />
                      2. Clients Collection
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      300+ Companies
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Stores company name, hiring managers (VP Eng, HR Lead), active job vacancies, and the assigned Project Manager (Shweta, Devanshi, or Vanshika).
                  </p>
                  <div className="mt-2 text-[10px] font-mono text-slate-500 bg-white p-1.5 rounded border border-slate-200">
                    /clients/{`{client_id}`}
                  </div>
                </div>

                {/* Collection 3: Negotiation Loops & Timestamps */}
                <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-amber-600" />
                      3. Date Negotiation Logs
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                      Round 1 → 5 Audit
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Every date offered by candidate or counter-offered by client is logged with a timestamp, proposed by, and status (accepted/declined) so no date is forgotten.
                  </p>
                  <div className="mt-2 text-[10px] font-mono text-slate-500 bg-white p-1.5 rounded border border-slate-200">
                    /candidates/{`{id}`}/dates/{`{date_id}`}
                  </div>
                </div>

                {/* Collection 4: Isolated Handoff Threads */}
                <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-purple-600" />
                      4. Isolated Handoff Threads
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                      Private 1-to-1
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Instead of a 20-person WhatsApp group, messages belong to that specific candidate. Only the assigned recruiter and assigned PM receive notifications.
                  </p>
                  <div className="mt-2 text-[10px] font-mono text-slate-500 bg-white p-1.5 rounded border border-slate-200">
                    /candidates/{`{id}`}/thread/{`{msg_id}`}
                  </div>
                </div>
              </div>

              {/* Status Tracking from Start to End */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white">
                <h5 className="font-bold text-slate-900 mb-2">End-to-End Status Lifecycle Tracking</h5>
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-700">
                  <span className="px-2.5 py-1 bg-blue-50 text-blue-800 font-semibold rounded-md border border-blue-200">
                    1. CV Screening
                  </span>
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                  <span className="px-2.5 py-1 bg-indigo-50 text-indigo-800 font-semibold rounded-md border border-indigo-200">
                    2. Submitted to PM
                  </span>
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                  <span className="px-2.5 py-1 bg-purple-50 text-purple-800 font-semibold rounded-md border border-purple-200">
                    3. Sent to Client
                  </span>
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                  <span className="px-2.5 py-1 bg-amber-50 text-amber-800 font-semibold rounded-md border border-amber-200">
                    4. Date Negotiation Loop
                  </span>
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 font-semibold rounded-md border border-emerald-200">
                    5. Interview Locked
                  </span>
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                  <span className="px-2.5 py-1 bg-fuchsia-50 text-fuchsia-800 font-semibold rounded-md border border-fuchsia-200">
                    6. Post-Debrief
                  </span>
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-950 font-bold rounded-md border border-emerald-400">
                    7. Placed / Hired 🏆
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === "login" && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <h4 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-emerald-600" />
                  How Team Members Log In to Rishi Jobs
                </h4>
                <p className="text-xs text-slate-600">
                  Team members do not share a single password. Each recruiter and PM has their own individual account, with automated role-based view isolation:
                </p>
              </div>

              {/* Login Flow Steps */}
              <div className="space-y-3">
                <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900">Sign in via Email or Google Workspace</h5>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Recruiters (Bhavya, Dheer, Virendra, Kimi, Dhrendra) and PMs (Shweta, Devanshi, Vanshika) sign in using their official work email (e.g. <code>bhavya@rishijobs.com</code>) with password or Google SSO.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900">Role-Based Filter Enforced Automatically</h5>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      The database automatically isolates what each person sees:
                    </p>
                    <ul className="list-disc pl-4 mt-1 text-[11px] text-slate-600 space-y-0.5">
                      <li>
                        <strong>When Bhavya logs in:</strong> Her dashboard only queries candidates where <code>assignedRecruiterId == Bhavya.id</code>. She never sees candidates belonging to Dheer or Virendra unless explicitly shared.
                      </li>
                      <li>
                        <strong>When Shweta logs in:</strong> Her dashboard only displays candidates submitted to her assigned clients (e.g. Apex Cloud, Quantum Robotics).
                      </li>
                      <li>
                        <strong>When Rishi Surana logs in:</strong> As Agency Leadership / Admin, he has a master control view across all 500+ candidates, all 300+ clients, team performance metrics, and pending bottlenecks.
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900">Zero WhatsApp Noise</h5>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      When Shweta receives counter-dates from a client for Priya Sharma, she updates the system. <strong>Only Bhavya receives the notification</strong> on her dashboard. Dheer, Virendra, Kimi, and Dhrendra are never interrupted.
                    </p>
                  </div>
                </div>
              </div>

              {/* Demo Switcher Note */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-center justify-between">
                <span>
                  💡 <em>In this live preview, you can use the top-right profile switcher anytime to test Bhavya, Dheer, Shweta, or Rishi Surana without typing passwords.</em>
                </span>
              </div>
            </div>
          )}

          {activeTab === "backup" && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <h4 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-indigo-600" />
                  Import & Export Your 500+ Candidate Data
                </h4>
                <p className="text-xs text-slate-600">
                  You can export your current candidate pipeline at any time as JSON or import your existing firm's candidate list.
                </p>
              </div>

              {/* Export Box */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white flex items-center justify-between">
                <div>
                  <h5 className="font-bold text-slate-900">Download Full Database Backup</h5>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Includes all candidates, negotiation histories, client company links, and handoff threads.
                  </p>
                </div>
                <button
                  onClick={handleExportJSON}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Backup (.JSON)</span>
                </button>
              </div>

              {/* Import Box */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
                <div>
                  <h5 className="font-bold text-slate-900">Import Candidate List</h5>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Upload your existing candidate records to populate Rishi Jobs instantly.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <label className="cursor-pointer px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg border border-slate-300 flex items-center gap-1.5 transition-colors">
                    <Upload className="w-4 h-4" />
                    <span>Choose JSON Backup File</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  {importStatus && (
                    <span className="text-xs font-medium text-indigo-600">
                      {importStatus}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            Agency: <strong>Rishi Jobs</strong> • Managing 500+ candidates & 300+ clients
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg transition-colors text-xs"
          >
            Close Architecture Guide
          </button>
        </div>
      </div>
    </div>
  );
};
