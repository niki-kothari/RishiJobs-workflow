import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Candidate,
  TeamMember,
  ClientCompany,
  CandidateStage,
  InAppNotification,
  DirectChatMessage,
} from "./types";
import { TEAM_MEMBERS } from "./data/mockData";
import {
  getStoredCandidates,
  saveCandidates,
  getStoredMembers,
  saveMembers,
  getStoredClients,
  saveClients,
  getStoredCurrentUserId,
  saveCurrentUserId,
  getStoredDirectChats,
  saveStoredDirectChats,
  resetToDefaults,
} from "./utils/storage";
import {
  subscribeCandidates,
  saveCandidateToFirestore,
  deleteCandidateFromFirestore,
  subscribeClients,
  saveClientToFirestore,
  deleteClientFromFirestore,
  subscribeMembers,
  saveMemberToFirestore,
  bootstrapMembersIfEmpty,
  subscribeDirectChats,
  saveDirectChatMessageToFirestore,
  markDirectChatMessageReadInFirestore,
  pruneCandidateChatOnTerminalState,
} from "./utils/firestoreService";
import { Header } from "./components/Header";
import { Sidebar, NavTab } from "./components/Sidebar";
import { PipelineBoard } from "./components/PipelineBoard";
import { CandidatesView } from "./components/views/CandidatesView";
import { ClientsView } from "./components/views/ClientsView";
import { InterviewsView } from "./components/views/InterviewsView";
import { AnalyticsView } from "./components/views/AnalyticsView";
import { TeamView } from "./components/views/TeamView";
import { LoginPage } from "./components/LoginPage";
import { CandidateDetailPage } from "./components/CandidateDetailPage";
import { NewCandidateModal } from "./components/NewCandidateModal";
import { AddClientModal } from "./components/AddClientModal";
import { AddUserModal } from "./components/AddUserModal";
import { WorkflowExplainerModal } from "./components/WorkflowExplainerModal";
import { StorageArchitectureModal } from "./components/StorageArchitectureModal";
import { UrgentRedAlertModal } from "./components/UrgentRedAlertModal";
import { NotificationToast } from "./components/NotificationToast";
import { NotificationSettingsModal } from "./components/NotificationSettingsModal";
import { DirectChatModal } from "./components/DirectChatModal";
import {
  playNotificationChime,
  playUrgentRedAlertSound,
} from "./utils/audioAlert";
import {
  sendSystemDesktopNotification,
  requestSystemNotificationPermission,
  startTabTitleFlashing,
  getNotificationSettings,
  sendBackgroundWhatsappAlert,
} from "./utils/systemNotification";
import { canTransitionToStage } from "./utils/pipelineSequence";
import {
  Database,
  ArrowRight,
  Repeat,
  Layers,
  FileSpreadsheet,
} from "lucide-react";

export default function App() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [clients, setClients] = useState<ClientCompany[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [firestoreStatus, setFirestoreStatus] = useState<"connected" | "connecting" | "offline">("connecting");

  // Active view tab in sidebar
  const [currentTab, setCurrentTab] = useState<NavTab>("pipeline");

  // Notifications & 10-Minute Recurring Red Alert state
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [activeToast, setActiveToast] = useState<InAppNotification | null>(null);
  const [showRedAlertModal, setShowRedAlertModal] = useState(false);
  const [lastRedAlertShownAt, setLastRedAlertShownAt] = useState<number>(0);

  // Active candidate page view state
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [returnTab, setReturnTab] = useState<NavTab>("pipeline");
  const [showNewCandidateModal, setShowNewCandidateModal] = useState(false);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showExplainerModal, setShowExplainerModal] = useState(false);
  const [showStorageModal, setShowStorageModal] = useState(false);
  const [showNotificationSettingsModal, setShowNotificationSettingsModal] = useState(false);

  // Direct In-App Chat & Pipeline Nudges between PMs/Owner and Team X Members
  const [directChatMessages, setDirectChatMessages] = useState<DirectChatMessage[]>(() => getStoredDirectChats());
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [chatTargetMemberId, setChatTargetMemberId] = useState<string | undefined>(undefined);
  const [chatCandidateId, setChatCandidateId] = useState<string | undefined>(undefined);

  // Always scroll to top on navigation to any page or candidate view
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [currentTab, selectedCandidate?.id]);

  // Initialize data from local cache and attach real-time Firestore listeners
  useEffect(() => {
    // Fast initial load from local storage
    const loadedCandidates = getStoredCandidates();
    const loadedMembers = getStoredMembers();
    const loadedClients = getStoredClients();
    const loadedUserId = getStoredCurrentUserId();

    // Repair and verify candidate ownership:
    // If Aarav Mehta exists, ensure he is assigned to Bhavya and was not improperly advanced by another recruiter
    const bhavyaMember =
      loadedMembers.find((m) => m.name.toLowerCase().includes("bhavya")) ||
      TEAM_MEMBERS.find((m) => m.name.toLowerCase().includes("bhavya"));
    const bhavyaId = bhavyaMember?.id || "rec-1";
    const shwetaMember =
      loadedMembers.find((m) => m.name.toLowerCase().includes("shweta")) ||
      TEAM_MEMBERS.find((m) => m.name.toLowerCase().includes("shweta"));
    const shwetaId = shwetaMember?.id || "pm-1";

    const repairedCandidates = loadedCandidates.map((c) => {
      if (c.name.toLowerCase().includes("aarav")) {
        const wasSubmittedByOther =
          c.stage === "submitted_to_pm" &&
          (c.assignedRecruiterId !== bhavyaId ||
            c.thread?.some((t) => t.senderName?.toLowerCase().includes("dheer") || t.senderId === "rec-2"));

        return {
          ...c,
          assignedRecruiterId: bhavyaId,
          addedByRecruiterId: bhavyaId,
          assignedPmId: c.assignedPmId || shwetaId,
          // If in submitted_to_pm because Dheer submitted him, restore to Step 1 (cv_screening) for Bhavya
          stage: wasSubmittedByOther || c.stage === "submitted_to_pm" ? "cv_screening" : c.stage,
          actionOwner: wasSubmittedByOther || c.stage === "submitted_to_pm" ? "recruiter" : c.actionOwner,
          actionDescription:
            wasSubmittedByOther || c.stage === "submitted_to_pm"
              ? "Review revised CV highlights & submit candidate to PM (Bhavya's Candidate)"
              : c.actionDescription,
          cvSubmittedToPmAt: wasSubmittedByOther || c.stage === "submitted_to_pm" ? undefined : c.cvSubmittedToPmAt,
        };
      }
      return c;
    });

    setCandidates(repairedCandidates);
    saveCandidates(repairedCandidates);
    setMembers(loadedMembers);
    setClients(loadedClients);
    setCurrentUserId(loadedUserId);
    setIsInitializing(false);

    // Bootstrap initial team members in Firestore if empty
    bootstrapMembersIfEmpty().catch((err) => {
      console.warn("Bootstrap members error:", err);
    });

    // Real-time Firestore subscriptions
    const unsubCandidates = subscribeCandidates(
      (remoteCandidates) => {
        setCandidates((prevCandidates) => {
          const map = new Map<string, Candidate>();
          // Put remote candidates as authoritative with Aarav Mehta repair check
          remoteCandidates.forEach((c) => {
            if (c.name.toLowerCase().includes("aarav")) {
              const repaired: Candidate = {
                ...c,
                assignedRecruiterId: bhavyaId,
                addedByRecruiterId: bhavyaId,
                assignedPmId: c.assignedPmId || shwetaId,
                stage: c.stage === "submitted_to_pm" ? "cv_screening" : c.stage,
                actionOwner: c.stage === "submitted_to_pm" ? "recruiter" : c.actionOwner,
                actionDescription:
                  c.stage === "submitted_to_pm"
                    ? "Review revised CV highlights & submit candidate to PM (Bhavya's Candidate)"
                    : c.actionDescription,
                cvSubmittedToPmAt: c.stage === "submitted_to_pm" ? undefined : c.cvSubmittedToPmAt,
              };
              map.set(repaired.id, repaired);
              saveCandidateToFirestore(repaired).catch(() => {});
            } else {
              map.set(c.id, c);
            }
          });
          // Preserve any local candidates not yet received from Firestore
          prevCandidates.forEach((local) => {
            if (!map.has(local.id)) {
              map.set(local.id, local);
              // Re-attempt Firestore write in background if missing
              saveCandidateToFirestore(local).catch((e) =>
                console.warn("Background auto-sync candidate to Firestore:", e)
              );
            }
          });
          const merged = Array.from(map.values());
          merged.sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
          saveCandidates(merged);
          return merged;
        });
        setFirestoreStatus("connected");
      },
      () => setFirestoreStatus("offline")
    );

    const unsubClients = subscribeClients(
      (remoteClients) => {
        setClients(remoteClients);
        saveClients(remoteClients);
        setFirestoreStatus("connected");
      },
      () => setFirestoreStatus("offline")
    );

    const unsubMembers = subscribeMembers(
      (remoteMembers) => {
        if (remoteMembers.length > 0) {
          setMembers(remoteMembers);
          saveMembers(remoteMembers);
        }
        setFirestoreStatus("connected");
      },
      () => setFirestoreStatus("offline")
    );

    const unsubChats = subscribeDirectChats(
      (remoteChats) => {
        setDirectChatMessages(remoteChats);
        saveStoredDirectChats(remoteChats);
      },
      () => console.warn("Direct chats running in offline mode")
    );

    return () => {
      unsubCandidates();
      unsubClients();
      unsubMembers();
      unsubChats();
    };
  }, []);

  // Update candidate and persist to Firestore + local with notification & chime
  const handleUpdateCandidate = (updatedCandidateInput: Candidate) => {
    const oldCandidate = candidates.find((c) => c.id === updatedCandidateInput.id);
    const nowIso = new Date().toISOString();

    const updated: Candidate = {
      ...updatedCandidateInput,
      lastActionTimestamp: nowIso,
      updatedAt: nowIso,
    };

    const updatedList = candidates.map((c) => (c.id === updated.id ? updated : c));
    setCandidates(updatedList);
    saveCandidates(updatedList);
    setSelectedCandidate(updated);
    saveCandidateToFirestore(updated).catch((err) => {
      console.warn("Failed to persist candidate to Firestore:", err);
    });

    // Detect action event type
    let notifType: "submission" | "update" | "interview" | "process_advanced" = "update";
    let title = "Candidate Updated";
    let message = `${updated.name}'s profile was updated. Action: ${updated.actionDescription}`;

    if (oldCandidate) {
      if (
        updated.scheduledInterview &&
        (!oldCandidate.scheduledInterview ||
          oldCandidate.scheduledInterview.confirmedDate !== updated.scheduledInterview.confirmedDate)
      ) {
        notifType = "interview";
        title = "Interview Confirmed & Scheduled";
        message = `Interview confirmed for ${updated.name} on ${updated.scheduledInterview.confirmedDate}.`;
      } else if (updated.stage !== oldCandidate.stage) {
        if (updated.stage === "submitted_to_pm") {
          notifType = "submission";
          title = "Candidate Submitted to PM";
          message = `${updated.name} submitted to PM for client presentation & review.`;
        } else if (updated.stage === "forwarded_to_client") {
          notifType = "submission";
          title = "Profile Forwarded to Client";
          message = `${updated.name}'s CV & available dates sent to client hiring manager.`;
        } else {
          notifType = "process_advanced";
          title = `Hiring Advanced: ${updated.stage.replace(/_/g, " ")}`;
          message = `${updated.name}: ${updated.actionDescription}`;
        }
      } else if (updated.actionOwner !== oldCandidate.actionOwner && updated.actionOwner !== "none") {
        notifType = "submission";
        title = `Action Required from ${updated.actionOwner.toUpperCase()}`;
        message = `${updated.name}: ${updated.actionDescription}`;
      } else if (updated.proposedDates.length > (oldCandidate.proposedDates?.length || 0)) {
        notifType = "submission";
        title = "New Interview Slot Proposed";
        message = `Interview loop update for ${updated.name}. Recruiter/PM action needed.`;
      }
    }

    const clientObj = clients.find((c) => c.id === updated.targetClientId);
    const newNotif: InAppNotification = {
      id: "notif-" + Date.now(),
      candidateId: updated.id,
      candidateName: updated.name,
      targetRole: updated.targetRole,
      targetClientName: clientObj?.name || "Client",
      actionRequiredFrom: updated.actionOwner,
      actionDescription: updated.actionDescription,
      stage: updated.stage,
      timestamp: nowIso,
      isRead: false,
      priority: "normal",
      type: notifType,
      title,
      message,
    };

    setNotifications((prev) => [newNotif, ...prev.slice(0, 49)]);
    setActiveToast(newNotif);
    playNotificationChime();
    sendSystemDesktopNotification({ title, body: message });

    // If candidate reached terminal stage (placed or rejected), prune transient chat and store important details
    if (
      (updated.stage === "placed" || updated.stage === "rejected") &&
      (!oldCandidate || oldCandidate.stage !== updated.stage || !updated.importantChatHighlights || updated.importantChatHighlights.length === 0)
    ) {
      pruneCandidateChatOnTerminalState(
        updated.id,
        updated.stage,
        directChatMessages,
        updated.name
      )
        .then((highlights) => {
          if (highlights && highlights.length > 0) {
            setCandidates((prevList) => {
              const nextList = prevList.map((c) =>
                c.id === updated.id ? { ...c, importantChatHighlights: highlights } : c
              );
              saveCandidates(nextList);
              return nextList;
            });
            const candWithHighlights = { ...updated, importantChatHighlights: highlights };
            saveCandidateToFirestore(candWithHighlights).catch(() => {});
          }
        })
        .catch((err) => {
          console.warn("Prune candidate chat notice:", err);
        });
    }
  };

  // Add new candidate and persist to Firestore + local with notification & chime
  const handleAddCandidate = (newCandInput: Candidate) => {
    const nowIso = new Date().toISOString();
    const newCand: Candidate = {
      ...newCandInput,
      lastActionTimestamp: nowIso,
      createdAt: newCandInput.createdAt || nowIso,
      updatedAt: nowIso,
    };
    const updatedList = [newCand, ...candidates];
    setCandidates(updatedList);
    saveCandidates(updatedList);
    setSelectedCandidate(newCand); // open detail modal immediately
    saveCandidateToFirestore(newCand)
      .then(() => {
        console.log("Candidate saved to Firestore cloud successfully:", newCand.id);
      })
      .catch((err) => {
        console.error("Failed to save candidate to Firestore:", err);
        const errNotif: InAppNotification = {
          id: "notif-err-" + Date.now(),
          candidateId: newCand.id,
          candidateName: newCand.name,
          targetRole: newCand.targetRole,
          targetClientName: "Sync Status",
          actionRequiredFrom: "none",
          actionDescription: "Cloud sync notice",
          stage: newCand.stage,
          timestamp: nowIso,
          isRead: false,
          priority: "normal",
          type: "update",
          title: "Firebase Sync Notice",
          message: `Saved locally. Cloud sync: ${err instanceof Error ? err.message : "check network/rules"}.`,
        };
        setActiveToast(errNotif);
      });

    const clientObj = clients.find((c) => c.id === newCand.targetClientId);
    const newNotif: InAppNotification = {
      id: "notif-" + Date.now(),
      candidateId: newCand.id,
      candidateName: newCand.name,
      targetRole: newCand.targetRole,
      targetClientName: clientObj?.name || "Client",
      actionRequiredFrom: newCand.actionOwner,
      actionDescription: newCand.actionDescription,
      stage: newCand.stage,
      timestamp: nowIso,
      isRead: false,
      priority: "normal",
      type: "submission",
      title: "New Candidate Onboarded",
      message: `${newCand.name} submitted for ${newCand.targetRole}. Initial action: ${newCand.actionDescription}`,
    };

    setNotifications((prev) => [newNotif, ...prev.slice(0, 49)]);
    setActiveToast(newNotif);
    playNotificationChime();
    sendSystemDesktopNotification({
      title: "New Candidate Added",
      body: `${newCand.name} added for ${newCand.targetRole}`,
    });
  };

  // Delete candidate and remove from Firestore + local
  const handleDeleteCandidate = (candId: string) => {
    const updatedList = candidates.filter((c) => c.id !== candId);
    setCandidates(updatedList);
    saveCandidates(updatedList);
    if (selectedCandidate?.id === candId) {
      setSelectedCandidate(null);
    }
    deleteCandidateFromFirestore(candId).catch((err) => {
      console.warn("Failed to delete candidate from Firestore:", err);
    });
  };

  // Add new client company and persist to Firestore + local (PMs and Admins only)
  const handleAddClient = (newClient: ClientCompany) => {
    if (currentUser?.role === "recruiter") {
      alert("Only Project Managers (and Admins) can create clients.");
      return;
    }
    const updatedList = [newClient, ...clients];
    setClients(updatedList);
    saveClients(updatedList);
    saveClientToFirestore(newClient).catch((err) => {
      console.warn("Failed to save client to Firestore:", err);
    });
  };

  // Update client company details and persist to Firestore + local
  const handleUpdateClient = (updated: ClientCompany) => {
    if (currentUser?.role === "recruiter") {
      alert("Team X members can only screen and submit CVs. Only PMs can edit client details.");
      return;
    }
    const updatedList = clients.map((c) => (c.id === updated.id ? updated : c));
    setClients(updatedList);
    saveClients(updatedList);
    saveClientToFirestore(updated).catch((err) => {
      console.warn("Failed to persist updated client to Firestore:", err);
    });
  };

  // Quick stage update handler
  const handleUpdateStage = (candidate: Candidate, newStage: CandidateStage) => {
    const recruiterObj = members.find((m) => m.id === candidate.assignedRecruiterId);
    const transitionCheck = canTransitionToStage(
      candidate.stage,
      newStage,
      currentUser?.role,
      currentUser?.id,
      candidate.assignedRecruiterId,
      recruiterObj?.name
    );
    if (!transitionCheck.allowed) {
      alert(transitionCheck.reason);
      return;
    }

    // Explicit Recruiter Guard: If recruiter, only candidate owner can submit to PM
    if (
      currentUser?.role === "recruiter" &&
      candidate.assignedRecruiterId !== currentUser.id &&
      candidate.addedByRecruiterId !== currentUser.id
    ) {
      alert(
        `Permission Denied: Only ${recruiterObj?.name || "Bhavya"} (the assigned recruiter who added this candidate) can submit ${candidate.name}'s CV to PM. Other Team X members cannot submit candidates belonging to other recruiters.`
      );
      return;
    }

    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const stageNames: Record<CandidateStage, string> = {
      cv_screening: "CV Screening",
      submitted_to_pm: "Submitted to PM",
      forwarded_to_client: "Forwarded to Client",
      date_negotiation: "Date Negotiation (Loop)",
      interview_scheduled: "Interview Scheduled",
      post_interview_debrief: "Post-Interview Debrief",
      offer_stage: "Offer Stage",
      placed: "Placed & Hired",
      rejected: "Closed / Rejected",
    };

    let nextActionOwner: "recruiter" | "pm" | "none" = candidate.actionOwner;
    let nextActionDesc = candidate.actionDescription;
    const nowIso = new Date().toISOString();
    let updatedCvSubmittedToPmAt = candidate.cvSubmittedToPmAt;
    let updatedCvSubmittedToClientAt = candidate.cvSubmittedToClientAt;
    let updatedInterviewHappenedAt = candidate.interviewHappenedAt;
    let updatedPlacedAt = candidate.placedAt;
    let updatedPlacementDetails = candidate.placementDetails;
    let updatedInterviewRounds = candidate.interviewRounds ? [...candidate.interviewRounds] : [];

    if (newStage === "submitted_to_pm") {
      nextActionOwner = "pm";
      nextActionDesc = "Review candidate & forward to client";
      if (!updatedCvSubmittedToPmAt) updatedCvSubmittedToPmAt = nowIso;
    } else if (newStage === "forwarded_to_client") {
      nextActionOwner = "pm";
      nextActionDesc = "Awaiting feedback from client";
      if (!updatedCvSubmittedToClientAt) updatedCvSubmittedToClientAt = nowIso;
    } else if (newStage === "date_negotiation") {
      nextActionOwner = "recruiter";
      nextActionDesc = "Coordinate availability slots with candidate";
    } else if (newStage === "interview_scheduled") {
      nextActionOwner = "none";
      nextActionDesc = "Interview locked";
    } else if (newStage === "post_interview_debrief") {
      nextActionOwner = "recruiter";
      nextActionDesc = "Collect candidate debrief and client feedback";
      if (!updatedInterviewHappenedAt) updatedInterviewHappenedAt = nowIso;
      // Mark latest scheduled round as completed
      if (updatedInterviewRounds.length > 0) {
        const lastIdx = updatedInterviewRounds.length - 1;
        if (updatedInterviewRounds[lastIdx].status === "scheduled") {
          updatedInterviewRounds[lastIdx] = {
            ...updatedInterviewRounds[lastIdx],
            status: "completed",
            interviewHappenedAt: nowIso,
            completedAt: nowIso,
          };
        }
      }
    } else if (newStage === "placed") {
      nextActionOwner = "none";
      nextActionDesc = "Candidate placed 🏆";
      if (!updatedPlacedAt) updatedPlacedAt = nowIso;
      if (!updatedPlacementDetails) {
        updatedPlacementDetails = {
          placedDate: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          joiningDate: "To be confirmed",
          offeredCtc: candidate.expectedSalary || "Agreed Package",
          notes: "Placed successfully with client",
          recordedBy: currentUser?.name || "PM",
        };
      }
    }

    const updated: Candidate = {
      ...candidate,
      stage: newStage,
      actionOwner: nextActionOwner,
      actionDescription: nextActionDesc,
      cvSubmittedToPmAt: updatedCvSubmittedToPmAt,
      cvSubmittedToClientAt: updatedCvSubmittedToClientAt,
      interviewHappenedAt: updatedInterviewHappenedAt,
      placedAt: updatedPlacedAt,
      placementDetails: updatedPlacementDetails,
      interviewRounds: updatedInterviewRounds,
      thread: [
        ...candidate.thread,
        {
          id: "m-" + Date.now(),
          senderId: currentUser ? currentUser.id : "system",
          senderName: currentUser ? currentUser.name : "System",
          senderRole: currentUser ? currentUser.role : "recruiter",
          timestamp: now,
          text: `Status updated to "${stageNames[newStage]}" by ${currentUser?.name || "User"}.`,
          isSystemEvent: true,
        },
      ],
      updatedAt: new Date().toISOString(),
    };
    handleUpdateCandidate(updated);
  };

  // Delete client company
  const handleDeleteClient = (clientId: string) => {
    if (currentUser?.role === "recruiter") {
      alert("Team X members cannot delete clients. Only PMs can delete client companies.");
      return;
    }
    const updatedList = clients.filter((c) => c.id !== clientId);
    setClients(updatedList);
    saveClients(updatedList);
    deleteClientFromFirestore(clientId).catch((err) => {
      console.warn("Failed to delete client from Firestore:", err);
    });
  };

  // Add new user / team member and persist to Firestore + local
  const handleAddUser = (newUser: TeamMember) => {
    const updated = [...members, newUser];
    setMembers(updated);
    saveMembers(updated);
    saveMemberToFirestore(newUser).catch((err) => {
      console.warn("Failed to save member to Firestore:", err);
    });
  };

  // Bulk import candidates
  const handleImportData = (imported: Candidate[]) => {
    const merged = [
      ...imported,
      ...candidates.filter((c) => !imported.some((imp) => imp.id === c.id)),
    ];
    setCandidates(merged);
    saveCandidates(merged);
    for (const c of imported) {
      saveCandidateToFirestore(c).catch(() => {});
    }
  };

  // Login success
  const handleLoginSuccess = (user: TeamMember) => {
    setCurrentUserId(user.id);
    saveCurrentUserId(user.id);
  };

  // Logout
  const handleLogout = () => {
    setCurrentUserId(null);
    saveCurrentUserId(null);
  };

  // Reset demo data
  const handleResetData = () => {
    const reset = resetToDefaults();
    setCandidates(reset);
    setSelectedCandidate(null);
  };

  const currentUser = useMemo(() => {
    if (!currentUserId) return null;
    return members.find((m) => m.id === currentUserId) || members[0] || null;
  }, [members, currentUserId]);

  // Compute pending actions count for current user
  const pendingActionCount = useMemo(() => {
    if (!currentUser) return 0;
    const isTeamX = currentUser.role === "recruiter" || currentUser.team?.toLowerCase().includes("team x");
    return candidates.filter((c) => {
      if (isTeamX) {
        const isOwner = c.assignedRecruiterId === currentUser.id || c.addedByRecruiterId === currentUser.id;
        return isOwner && c.actionOwner === "recruiter";
      }
      if (currentUser.role === "pm") {
        return c.assignedPmId === currentUser.id && c.actionOwner === "pm";
      }
      return c.actionOwner !== "none";
    }).length;
  }, [candidates, currentUser]);

  // 10-Minute Overdue Red Alert Calculation (Actions pending >= 10 mins)
  const TEN_MINUTES_MS = 10 * 60 * 1000;

  // Request browser native notification permissions on login
  useEffect(() => {
    if (currentUser) {
      requestSystemNotificationPermission();
    }
  }, [currentUser]);

  // Compute overdue candidates requiring action from logged-in user (or admin)
  const overdueCandidates = useMemo(() => {
    if (!currentUser) return [];
    const now = Date.now();
    const isTeamX = currentUser.role === "recruiter" || currentUser.team?.toLowerCase().includes("team x");

    return candidates
      .filter((c) => {
        if (!c.actionOwner || c.actionOwner === "none") return false;
        if (c.stage === "placed" || c.stage === "rejected") return false;

        if (isTeamX) {
          const isOwner = c.assignedRecruiterId === currentUser.id || c.addedByRecruiterId === currentUser.id;
          return isOwner && c.actionOwner === "recruiter";
        }
        if (currentUser.role === "pm") {
          return c.assignedPmId === currentUser.id && c.actionOwner === "pm";
        }
        return true; // Agency leadership
      })
      .map((candidate) => {
        const actionTime = new Date(
          candidate.lastActionTimestamp || candidate.updatedAt || candidate.createdAt
        ).getTime();
        const elapsedMs = Math.max(0, now - actionTime);
        const overdueMinutes = Math.floor(elapsedMs / (60 * 1000));
        const isOverdue = elapsedMs >= TEN_MINUTES_MS;

        const recruiter = members.find((m) => m.id === candidate.assignedRecruiterId);
        const pm = members.find((m) => m.id === candidate.assignedPmId);
        const actionOwnerText =
          candidate.actionOwner === "recruiter"
            ? `${recruiter?.name || "Recruiter"} (Team X Recruiter)`
            : candidate.actionOwner === "pm"
            ? `${pm?.name || "PM"} (Client PM)`
            : "Team Member";

        return {
          candidate,
          overdueMinutes,
          isOverdue,
          actionOwnerText,
        };
      })
      .filter((item) => item.isOverdue);
  }, [candidates, currentUser, members]);

  // Recurring 10-Minute Red Alert Trigger Engine (Runs in background even if away)
  useEffect(() => {
    if (!currentUser || overdueCandidates.length === 0) {
      return;
    }

    const checkOverdueAlert = () => {
      const now = Date.now();
      // If 10 minutes have elapsed since the last alert popup, or if never shown yet
      if (now - lastRedAlertShownAt >= TEN_MINUTES_MS) {
        setShowRedAlertModal(true);
        setLastRedAlertShownAt(now);
        playUrgentRedAlertSound();

        const firstItem = overdueCandidates[0];
        const settings = getNotificationSettings();

        // 1. Send OS-level persistent desktop notification
        sendSystemDesktopNotification({
          title: `🚨 RED ALERT: ${overdueCandidates.length} Pending Actions Overdue!`,
          body: `${firstItem.candidate.name} (${firstItem.candidate.actionDescription}) overdue for >10 mins without response!`,
          tag: "urgent-red-alert-loop",
          requireInteraction: true,
          urgency: "critical",
          onClick: () => {
            window.focus();
            setShowRedAlertModal(true);
          },
        });

        // 2. Start tab title flashing to grab attention when browser window is minimized or behind other apps
        startTabTitleFlashing(`🚨 (${overdueCandidates.length}) RED ALERT - ACTION NEEDED!`, 10);

        // 3. Automated WhatsApp alert if enabled in settings
        if (settings.autoTriggerWhatsappOnRedAlert) {
          const client = clients.find((c) => c.id === firstItem.candidate.targetClientId);
          const assignedMember = members.find(
            (m) => m.id === (firstItem.candidate.actionOwner === "recruiter" ? firstItem.candidate.assignedRecruiterId : firstItem.candidate.assignedPmId)
          );
          sendBackgroundWhatsappAlert({
            candidate: firstItem.candidate,
            clientName: client?.name || "Client",
            assignedMember,
            actionOwnerText: firstItem.actionOwnerText,
            overdueMinutes: firstItem.overdueMinutes,
          });
        }
      }
    };

    checkOverdueAlert();
    const timer = setInterval(checkOverdueAlert, 10000); // Check every 10 seconds
    return () => clearInterval(timer);
  }, [overdueCandidates, lastRedAlertShownAt, currentUser, clients, members]);

  // Handle Snooze (re-pops in 10 minutes if unresolved)
  const handleSnoozeRedAlert = () => {
    setShowRedAlertModal(false);
    setLastRedAlertShownAt(Date.now());
  };

  // Open candidate details page from any view or alert
  const handleOpenCandidate = (candidate: Candidate, sourceTab?: NavTab) => {
    if (sourceTab) {
      setReturnTab(sourceTab);
    } else {
      setReturnTab(currentTab);
    }
    setSelectedCandidate(candidate);
  };

  // Open candidate from red alert or notification toast
  const handleOpenCandidateFromAlert = (candidate: Candidate) => {
    handleOpenCandidate(candidate, currentTab);
    setShowRedAlertModal(false);
  };

  // Manual Trigger for testing Red Alert popup & sound immediately
  const handleTriggerTestRedAlert = () => {
    playUrgentRedAlertSound();
    setShowRedAlertModal(true);
    setLastRedAlertShownAt(Date.now());

    sendSystemDesktopNotification({
      title: "🚨 SYSTEM TEST: Red Alert & OS Notification",
      body: "Overdue actions buzzer test: OS desktop notifications and tab alerts are working properly!",
      tag: "test-red-alert-btn",
      requireInteraction: true,
      onClick: () => {
        window.focus();
        setShowRedAlertModal(true);
      },
    });

    startTabTitleFlashing("🚨 TEST RED ALERT ACTIVE", 5);
  };

  // Overdue candidates to display in modal (with demo fallback if testing with zero overdue)
  const activeOverdueList = useMemo(() => {
    if (overdueCandidates.length > 0) {
      return overdueCandidates;
    }
    if (showRedAlertModal && candidates.length > 0) {
      const c = candidates[0];
      return [
        {
          candidate: c,
          overdueMinutes: 11,
          actionOwnerText: currentUser?.name || "Team Member",
        },
      ];
    }
    return [];
  }, [overdueCandidates, showRedAlertModal, candidates, currentUser]);

  // Scoped candidate count for current user (Team X members see their own)
  const visibleCandidateCount = useMemo(() => {
    if (!currentUser) return 0;
    const isTeamX = currentUser.role === "recruiter" || currentUser.team?.toLowerCase().includes("team x");
    if (isTeamX) {
      return candidates.filter(
        (c) => c.assignedRecruiterId === currentUser.id || c.addedByRecruiterId === currentUser.id
      ).length;
    }
    return candidates.length;
  }, [candidates, currentUser]);

  // Scoped client count for current user (all clients visible to all members)
  const visibleClientCount = useMemo(() => {
    return clients.length;
  }, [clients]);

  // Scoped interview count
  const visibleInterviewCount = useMemo(() => {
    if (!currentUser) return 0;
    const isTeamX = currentUser.role === "recruiter" || currentUser.team?.toLowerCase().includes("team x");
    return candidates.filter((c) => {
      if (
        isTeamX &&
        c.assignedRecruiterId !== currentUser.id &&
        c.addedByRecruiterId !== currentUser.id
      ) {
        return false;
      }
      return (
        c.stage === "interview_scheduled" ||
        c.stage === "post_interview_debrief" ||
        c.stage === "offer_stage" ||
        c.stage === "placed"
      );
    }).length;
  }, [candidates, currentUser]);

  // Unread direct messages for current user
  const unreadDirectMessageCount = useMemo(() => {
    if (!currentUser) return 0;
    return directChatMessages.filter((m) => m.recipientId === currentUser.id && !m.read).length;
  }, [directChatMessages, currentUser]);

  // Check if any unread direct message is an urgent nudge
  const hasUrgentNudge = useMemo(() => {
    if (!currentUser) return false;
    return directChatMessages.some(
      (m) => m.recipientId === currentUser.id && !m.read && m.isUrgentNudge
    );
  }, [directChatMessages, currentUser]);

  // Open direct chat modal with optional preselection
  const handleOpenDirectChat = (targetMemberId?: string, candidateId?: string) => {
    if (targetMemberId) {
      setChatTargetMemberId(targetMemberId);
    }
    if (candidateId) {
      setChatCandidateId(candidateId);
    }
    setIsChatModalOpen(true);
  };

  // Send direct message handler
  const handleSendDirectMessage = (
    recipientId: string,
    text: string,
    candidateId?: string,
    isUrgentNudge?: boolean,
    isImportantDetail?: boolean
  ) => {
    if (!currentUser) return;
    const targetMember = members.find((m) => m.id === recipientId);
    const cand = candidates.find((c) => c.id === candidateId);
    const nowIso = new Date().toISOString();

    const newMsg: DirectChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      candidateId,
      candidateName: cand?.name,
      candidateStage: cand?.stage,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      recipientId,
      recipientName: targetMember?.name || "Team Member",
      recipientRole: targetMember?.role || "recruiter",
      text,
      isUrgentNudge: !!isUrgentNudge,
      isImportantDetail: !!isImportantDetail,
      createdAt: nowIso,
      read: false,
    };

    const updatedList = [...directChatMessages, newMsg];
    setDirectChatMessages(updatedList);
    saveStoredDirectChats(updatedList);
    saveDirectChatMessageToFirestore(newMsg).catch((err) => {
      console.warn("Failed to persist message to Firestore:", err);
    });

    if (isUrgentNudge) {
      playUrgentRedAlertSound();
      sendSystemDesktopNotification({
        title: `⚡ Urgent Pipeline Nudge Sent`,
        body: `Nudged ${targetMember?.name || "Team Member"} regarding ${cand?.name || "pipeline progression"}`,
      });
    } else {
      playNotificationChime();
    }
  };

  // Mark direct messages as read
  const handleMarkChatAsRead = (messageIds: string[]) => {
    const idSet = new Set(messageIds);
    setDirectChatMessages((prev) =>
      prev.map((m) => (idSet.has(m.id) ? { ...m, read: true } : m))
    );
    messageIds.forEach((id) => {
      markDirectChatMessageReadInFirestore(id).catch(() => {});
    });
  };

  // Render Login Page if not logged in
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-xs">
        Loading Rishi Jobs...
      </div>
    );
  }

  if (!currentUser) {
    return (
      <>
        <LoginPage
          members={members}
          onLogin={(userId) => {
            setCurrentUserId(userId);
            saveCurrentUserId(userId);
          }}
          onAddNewUser={handleAddUser}
        />
        {showAddUserModal && (
          <AddUserModal
            isOpen={showAddUserModal}
            onClose={() => setShowAddUserModal(false)}
            onAddUser={handleAddUser}
          />
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col antialiased selection:bg-indigo-100 selection:text-indigo-900">
      {/* Top Header */}
      <Header
        currentUser={currentUser}
        allMembers={members}
        firestoreStatus={firestoreStatus}
        onOpenNewCandidate={() => setShowNewCandidateModal(true)}
        onOpenAddClient={() => {
          if (currentUser.role !== "recruiter") {
            setShowAddClientModal(true);
          }
        }}
        onOpenAddUser={() => setShowAddUserModal(true)}
        onOpenExplainer={() => setShowExplainerModal(true)}
        onOpenStorageArchitecture={() => setShowStorageModal(true)}
        onOpenNotificationSettings={() => setShowNotificationSettingsModal(true)}
        onResetData={handleResetData}
        onLogout={handleLogout}
        pendingActionCount={pendingActionCount}
        overdueCount={overdueCandidates.length}
        notifications={notifications}
        onOpenCandidateFromNotification={(candId) => {
          const cand = candidates.find((c) => c.id === candId);
          if (cand) handleOpenCandidate(cand, currentTab);
        }}
        onTriggerTestRedAlert={handleTriggerTestRedAlert}
        onOpenDirectChat={() => handleOpenDirectChat()}
        unreadChatCount={unreadDirectMessageCount}
        hasUrgentNudge={hasUrgentNudge}
      />

      {/* Main Container with Sidebar + Content */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto">
        {/* Left Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => {
            if (tab === "storage") {
              setShowStorageModal(true);
            } else {
              setSelectedCandidate(null);
              setCurrentTab(tab);
            }
          }}
          candidateCount={visibleCandidateCount}
          clientCount={visibleClientCount}
          interviewCount={visibleInterviewCount}
          memberCount={members.length}
          currentUser={currentUser}
          onOpenNewCandidate={() => setShowNewCandidateModal(true)}
          onOpenAddClient={() => {
            if (currentUser.role !== "recruiter") {
              setShowAddClientModal(true);
            }
          }}
          onOpenAddUser={() => setShowAddUserModal(true)}
          onLogout={handleLogout}
        />

        {/* View Port Content */}
        <main className="flex-1 p-4 sm:p-6 space-y-6 overflow-x-hidden min-w-0">
          {selectedCandidate ? (
            <CandidateDetailPage
              candidate={candidates.find((c) => c.id === selectedCandidate.id) || selectedCandidate}
              currentUser={currentUser}
              allMembers={members}
              allClients={clients}
              returnTabName={
                returnTab === "pipeline"
                  ? "Pipeline"
                  : returnTab === "candidates"
                  ? "Candidates"
                  : returnTab === "interviews"
                  ? "Interviews"
                  : returnTab === "clients"
                  ? "Clients"
                  : returnTab === "analytics"
                  ? "Analytics"
                  : "Dashboard"
              }
              onBack={() => setSelectedCandidate(null)}
              onUpdateCandidate={(updated) => {
                handleUpdateCandidate(updated);
                setSelectedCandidate(updated);
              }}
              onDeleteCandidate={(candidateId) => {
                handleDeleteCandidate(candidateId);
                setSelectedCandidate(null);
              }}
              onOpenDirectChat={handleOpenDirectChat}
            />
          ) : (
            <>
              {/* Active View: Pipeline Board */}
              {currentTab === "pipeline" && (
                <PipelineBoard
                  candidates={candidates}
                  currentUser={currentUser}
                  allMembers={members}
                  allClients={clients}
                  onSelectCandidate={(cand) => handleOpenCandidate(cand, "pipeline")}
                  onUpdateStage={handleUpdateStage}
                  onOpenNewCandidate={() => setShowNewCandidateModal(true)}
                  onDirectMessageRecruiter={(recruiterId, candidateId) =>
                    handleOpenDirectChat(recruiterId, candidateId)
                  }
                />
              )}

              {/* Active View: Candidates Directory & CVs */}
              {currentTab === "candidates" && (
                <CandidatesView
                  candidates={candidates}
                  allMembers={members}
                  allClients={clients}
                  currentUser={currentUser}
                  onSelectCandidate={(cand) => handleOpenCandidate(cand, "candidates")}
                  onOpenNewCandidate={() => setShowNewCandidateModal(true)}
                  onUpdateCandidate={handleUpdateCandidate}
                  onDeleteCandidate={handleDeleteCandidate}
                />
              )}

              {/* Active View: Client Accounts */}
              {currentTab === "clients" && (
                <ClientsView
                  clients={clients}
                  members={members}
                  candidates={candidates}
                  currentUser={currentUser}
                  onOpenAddClient={() => {
                    if (currentUser.role !== "recruiter") {
                      setShowAddClientModal(true);
                    }
                  }}
                  onFilterClientInPipeline={(clientId) => {
                    setSelectedCandidate(null);
                    setCurrentTab("pipeline");
                  }}
                  onUpdateClient={handleUpdateClient}
                  onDeleteClient={handleDeleteClient}
                />
              )}

              {/* Active View: Interviews Calendar */}
              {currentTab === "interviews" && (
                <InterviewsView
                  candidates={candidates}
                  members={members}
                  clients={clients}
                  currentUser={currentUser}
                  onSelectCandidate={(cand) => handleOpenCandidate(cand, "interviews")}
                />
              )}

              {/* Active View: Analytics & Reports */}
              {currentTab === "analytics" && (
                <AnalyticsView
                  candidates={candidates}
                  clients={clients}
                  members={members}
                  currentUser={currentUser}
                  onOpenCandidate={(cand) => handleOpenCandidate(cand, "analytics")}
                />
              )}

              {/* Active View: Team & Permissions */}
              {currentTab === "team" && (
                <TeamView
                  members={members}
                  candidates={candidates}
                  clients={clients}
                  currentUser={currentUser}
                  onOpenAddUser={() => setShowAddUserModal(true)}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* New Candidate Modal */}
      {showNewCandidateModal && (
        <NewCandidateModal
          isOpen={showNewCandidateModal}
          onClose={() => setShowNewCandidateModal(false)}
          currentUser={currentUser}
          allMembers={members}
          allClients={clients}
          onAddCandidate={handleAddCandidate}
          onOpenAddClient={() => setShowAddClientModal(true)}
        />
      )}

      {/* Add Client Modal */}
      {showAddClientModal && (
        <AddClientModal
          isOpen={showAddClientModal}
          onClose={() => setShowAddClientModal(false)}
          pms={members.filter((m) => m.role === "pm")}
          recruiters={members.filter((m) => m.role === "recruiter")}
          onAddClient={handleAddClient}
        />
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <AddUserModal
          isOpen={showAddUserModal}
          onClose={() => setShowAddUserModal(false)}
          onAddUser={handleAddUser}
        />
      )}

      {/* Workflow Explainer Guide Modal */}
      {showExplainerModal && (
        <WorkflowExplainerModal
          isOpen={showExplainerModal}
          onClose={() => setShowExplainerModal(false)}
        />
      )}

      {/* Storage & Login Architecture Modal */}
      {showStorageModal && (
        <StorageArchitectureModal
          isOpen={showStorageModal}
          onClose={() => setShowStorageModal(false)}
          candidates={candidates}
          clients={clients}
          members={members}
          onImportData={handleImportData}
        />
      )}

      {/* Urgent 10-Minute Red Alert Modal */}
      {showRedAlertModal && (
        <UrgentRedAlertModal
          isOpen={showRedAlertModal}
          onSnooze={handleSnoozeRedAlert}
          overdueCandidates={activeOverdueList}
          clients={clients}
          allMembers={members}
          onOpenCandidate={handleOpenCandidateFromAlert}
          onOpenSettings={() => setShowNotificationSettingsModal(true)}
          onDirectChat={handleOpenDirectChat}
        />
      )}

      {/* Direct In-App Chat & Pipeline Nudges Modal */}
      {isChatModalOpen && currentUser && (
        <DirectChatModal
          isOpen={isChatModalOpen}
          onClose={() => {
            setIsChatModalOpen(false);
            setChatTargetMemberId(undefined);
            setChatCandidateId(undefined);
          }}
          currentUser={currentUser}
          allMembers={members}
          allCandidates={candidates}
          directMessages={directChatMessages}
          onSendMessage={handleSendDirectMessage}
          onMarkAsRead={handleMarkChatAsRead}
          initialTargetMemberId={chatTargetMemberId}
          initialCandidateId={chatCandidateId}
          onSelectCandidate={(cand: Candidate) => {
            setIsChatModalOpen(false);
            handleOpenCandidate(cand, currentTab);
          }}
        />
      )}

      {/* OS System Desktop & WhatsApp Notification Settings Modal */}
      {showNotificationSettingsModal && (
        <NotificationSettingsModal
          isOpen={showNotificationSettingsModal}
          onClose={() => setShowNotificationSettingsModal(false)}
          allMembers={members}
          allClients={clients}
          overdueCandidates={overdueCandidates.map((o) => o.candidate)}
        />
      )}

      {/* Floating Notification Toast */}
      {activeToast && (
        <NotificationToast
          notification={activeToast}
          onDismiss={() => setActiveToast(null)}
          candidates={candidates}
          onOpenCandidate={(candId: string) => {
            const cand = candidates.find((c) => c.id === candId);
            if (cand) handleOpenCandidate(cand, currentTab);
            setActiveToast(null);
          }}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Rishi Jobs</span>
          <div className="flex items-center gap-4">
            {currentUser.role !== "recruiter" && (
              <>
                <button
                  onClick={() => setShowStorageModal(true)}
                  className="text-indigo-600 hover:underline font-medium"
                >
                  Firestore & Cloud Storage
                </button>
                <span>•</span>
                <button
                  onClick={handleResetData}
                  className="text-slate-500 hover:text-slate-800"
                >
                  Reset Data
                </button>
              </>
            )}
            {currentUser.role === "recruiter" && (
              <span className="text-slate-400">Team X Candidate Pipeline</span>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
