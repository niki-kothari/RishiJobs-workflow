import { Candidate, TeamMember, ClientCompany } from "../types";
import { INITIAL_CANDIDATES, TEAM_MEMBERS, CLIENT_COMPANIES } from "../data/mockData";

const STORAGE_KEYS = {
  CANDIDATES: "rishi_jobs_candidates_v3",
  MEMBERS: "rishi_jobs_members_v3",
  CLIENTS: "rishi_jobs_clients_v3",
  CURRENT_USER_ID: "rishi_jobs_current_user_id_v3",
  IS_LOGGED_IN: "rishi_jobs_is_logged_in_v3",
};

export function getStoredCandidates(): Candidate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CANDIDATES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.CANDIDATES, JSON.stringify(INITIAL_CANDIDATES));
      return INITIAL_CANDIDATES;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to parse stored candidates", e);
    return INITIAL_CANDIDATES;
  }
}

export function saveCandidates(candidates: Candidate[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CANDIDATES, JSON.stringify(candidates));
  } catch (e) {
    console.error("Failed to save candidates", e);
  }
}

export function getStoredMembers(): TeamMember[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MEMBERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(TEAM_MEMBERS));
      return TEAM_MEMBERS;
    }
    const parsed: TeamMember[] = JSON.parse(raw);
    // Merge any missing default members
    const existingIds = new Set(parsed.map((m) => m.id));
    const merged = [...parsed];
    for (const def of TEAM_MEMBERS) {
      if (!existingIds.has(def.id)) {
        merged.push(def);
      }
    }
    return merged;
  } catch (e) {
    return TEAM_MEMBERS;
  }
}

export function saveMembers(members: TeamMember[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
  } catch (e) {
    console.error("Failed to save members", e);
  }
}

export function getStoredClients(): ClientCompany[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CLIENTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(CLIENT_COMPANIES));
      return CLIENT_COMPANIES;
    }
    return JSON.parse(raw);
  } catch (e) {
    return CLIENT_COMPANIES;
  }
}

export function saveClients(clients: ClientCompany[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
  } catch (e) {
    console.error("Failed to save clients", e);
  }
}

export function getStoredCurrentUserId(): string | null {
  try {
    const isLoggedIn = localStorage.getItem(STORAGE_KEYS.IS_LOGGED_IN);
    if (isLoggedIn === "false") return null;
    const id = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
    return id || null;
  } catch (e) {
    return null;
  }
}

export function getStoredDirectChats(): import("../types").DirectChatMessage[] {
  try {
    const raw = localStorage.getItem("rishi_jobs_direct_chats_v1");
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveStoredDirectChats(chats: import("../types").DirectChatMessage[]): void {
  try {
    localStorage.setItem("rishi_jobs_direct_chats_v1", JSON.stringify(chats));
  } catch (e) {
    console.error("Failed to save direct chats", e);
  }
}

export function saveCurrentUserId(id: string | null): void {
  try {
    if (id) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, id);
      localStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, "true");
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
      localStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, "false");
    }
  } catch (e) {}
}

export function resetToDefaults(): Candidate[] {
  localStorage.setItem(STORAGE_KEYS.CANDIDATES, JSON.stringify(INITIAL_CANDIDATES));
  localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(TEAM_MEMBERS));
  localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(CLIENT_COMPANIES));
  return INITIAL_CANDIDATES;
}
