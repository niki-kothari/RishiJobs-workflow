import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  getDocs,
  Unsubscribe,
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { Candidate, ClientCompany, TeamMember, DirectChatMessage } from "../types";
import { TEAM_MEMBERS } from "../data/mockData";

// Helper to sanitize objects for Firestore (removes undefined fields and guards 1MB doc limit)
function sanitizeForFirestore<T>(data: T): Record<string, any> {
  const jsonString = JSON.stringify(data, (_, value) =>
    value === undefined ? null : value
  );
  const parsed = JSON.parse(jsonString);

  // Guard against Firestore 1MiB document limit:
  // If uploadedCv contains a huge base64 data URL (>200KB), truncate the raw payload for Firestore, keeping all metadata.
  if (parsed?.uploadedCv?.fileDataUrl && typeof parsed.uploadedCv.fileDataUrl === "string") {
    if (parsed.uploadedCv.fileDataUrl.length > 200000) {
      parsed.uploadedCv.fileDataUrl = parsed.uploadedCv.fileDataUrl.substring(0, 500) + "...[stored-locally]";
      parsed.uploadedCv.isStoredLocally = true;
    }
  }

  return parsed;
}

// ---------------- CANDIDATES ----------------
const CANDIDATES_COLLECTION = "candidates";

export function subscribeCandidates(
  onUpdate: (candidates: Candidate[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const colRef = collection(db, CANDIDATES_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: Candidate[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as Candidate);
      });
      // Sort by updatedAt or createdAt desc
      items.sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
      onUpdate(items);
    },
    (error) => {
      console.error("Error subscribing to candidates:", error);
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, CANDIDATES_COLLECTION);
    }
  );
}

export async function saveCandidateToFirestore(candidate: Candidate): Promise<void> {
  const docPath = `${CANDIDATES_COLLECTION}/${candidate.id}`;
  try {
    const docRef = doc(db, CANDIDATES_COLLECTION, candidate.id);
    const sanitized = sanitizeForFirestore(candidate);
    await setDoc(docRef, sanitized, { merge: true });
    console.log("Candidate persisted to Firestore successfully:", candidate.id, candidate.name);
  } catch (error) {
    console.error("Firestore candidate write error:", error);
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

export async function deleteCandidateFromFirestore(candidateId: string): Promise<void> {
  const docPath = `${CANDIDATES_COLLECTION}/${candidateId}`;
  try {
    const docRef = doc(db, CANDIDATES_COLLECTION, candidateId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

// ---------------- CLIENTS ----------------
const CLIENTS_COLLECTION = "clients";

export function subscribeClients(
  onUpdate: (clients: ClientCompany[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const colRef = collection(db, CLIENTS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: ClientCompany[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as ClientCompany);
      });
      items.sort((a, b) => a.name.localeCompare(b.name));
      onUpdate(items);
    },
    (error) => {
      console.error("Error subscribing to clients:", error);
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, CLIENTS_COLLECTION);
    }
  );
}

export async function saveClientToFirestore(client: ClientCompany): Promise<void> {
  const docPath = `${CLIENTS_COLLECTION}/${client.id}`;
  try {
    const docRef = doc(db, CLIENTS_COLLECTION, client.id);
    const sanitized = sanitizeForFirestore(client);
    await setDoc(docRef, sanitized, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

export async function deleteClientFromFirestore(clientId: string): Promise<void> {
  const docPath = `${CLIENTS_COLLECTION}/${clientId}`;
  try {
    const docRef = doc(db, CLIENTS_COLLECTION, clientId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

// ---------------- MEMBERS ----------------
const MEMBERS_COLLECTION = "members";

export function subscribeMembers(
  onUpdate: (members: TeamMember[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const colRef = collection(db, MEMBERS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: TeamMember[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as TeamMember);
      });
      if (items.length > 0) {
        onUpdate(items);
      }
    },
    (error) => {
      console.error("Error subscribing to members:", error);
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, MEMBERS_COLLECTION);
    }
  );
}

export async function saveMemberToFirestore(member: TeamMember): Promise<void> {
  const docPath = `${MEMBERS_COLLECTION}/${member.id}`;
  try {
    const docRef = doc(db, MEMBERS_COLLECTION, member.id);
    const sanitized = sanitizeForFirestore(member);
    await setDoc(docRef, sanitized, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

// Bootstrapping default team members in Firestore if empty
export async function bootstrapMembersIfEmpty(): Promise<void> {
  try {
    const colRef = collection(db, MEMBERS_COLLECTION);
    const snap = await getDocs(colRef);
    if (snap.empty) {
      console.log("Seeding initial team members to Firestore...");
      for (const member of TEAM_MEMBERS) {
        const docRef = doc(db, MEMBERS_COLLECTION, member.id);
        await setDoc(docRef, sanitizeForFirestore(member));
      }
      console.log("Team members seeded into Firestore successfully.");
    }
  } catch (e) {
    console.warn("Could not check/seed members in Firestore:", e);
  }
}

// ---------------- DIRECT CHATS & PIPELINE NUDGES ----------------
const CHATS_COLLECTION = "direct_chats";

export function subscribeDirectChats(
  onUpdate: (messages: DirectChatMessage[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const colRef = collection(db, CHATS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: DirectChatMessage[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as DirectChatMessage);
      });
      // Sort chronologically ascending
      items.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      onUpdate(items);
    },
    (error) => {
      console.error("Error subscribing to direct chats:", error);
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, CHATS_COLLECTION);
    }
  );
}

export async function saveDirectChatMessageToFirestore(msg: DirectChatMessage): Promise<void> {
  const docPath = `${CHATS_COLLECTION}/${msg.id}`;
  try {
    const docRef = doc(db, CHATS_COLLECTION, msg.id);
    const sanitized = sanitizeForFirestore(msg);
    await setDoc(docRef, sanitized, { merge: true });
  } catch (error) {
    console.error("Firestore direct chat write error:", error);
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

export async function deleteDirectChatMessageFromFirestore(messageId: string): Promise<void> {
  const docPath = `${CHATS_COLLECTION}/${messageId}`;
  try {
    const docRef = doc(db, CHATS_COLLECTION, messageId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

export async function markDirectChatMessageReadInFirestore(messageId: string): Promise<void> {
  const docPath = `${CHATS_COLLECTION}/${messageId}`;
  try {
    const docRef = doc(db, CHATS_COLLECTION, messageId);
    await updateDoc(docRef, { read: true });
  } catch (error) {
    console.warn("Error marking chat read in Firestore:", error);
  }
}

/**
 * Requirement:
 * "just store the important details of the chat, ignore the rest after the candidate is placed or rejected."
 *
 * When a candidate reaches terminal state (placed or rejected):
 * 1. Collect all messages for this candidateId.
 * 2. Extract key important takeaways (messages marked important, offers, CTC, client verdicts, dates, placement terms).
 * 3. Delete / archive transient ping messages so they are ignored.
 * 4. Return the consolidated list of important highlights to store permanently on the candidate.
 */
export async function pruneCandidateChatOnTerminalState(
  candidateId: string,
  terminalStage: "placed" | "rejected",
  currentMessages: DirectChatMessage[],
  candidateName: string
): Promise<string[]> {
  const relatedMessages = currentMessages.filter((m) => m.candidateId === candidateId);
  if (relatedMessages.length === 0) return [];

  const importantHighlights: string[] = [];

  for (const m of relatedMessages) {
    const isImportant =
      m.isImportantDetail ||
      m.text.toLowerCase().includes("placed") ||
      m.text.toLowerCase().includes("offer") ||
      m.text.toLowerCase().includes("ctc") ||
      m.text.toLowerCase().includes("joining") ||
      m.text.toLowerCase().includes("salary") ||
      m.text.toLowerCase().includes("fee") ||
      m.text.toLowerCase().includes("reject") ||
      m.text.toLowerCase().includes("debrief");

    if (isImportant) {
      importantHighlights.push(`[${m.senderName} - ${new Date(m.createdAt).toLocaleDateString()}]: ${m.text}`);
      // Mark as permanently archived with important tag in Firestore
      saveDirectChatMessageToFirestore({
        ...m,
        archived: true,
        isImportantDetail: true,
      }).catch(() => {});
    } else {
      // Transient chatter (e.g. "look into this", "pinging", "are you free", "done") -> delete/ignore from Firestore
      deleteDirectChatMessageFromFirestore(m.id).catch(() => {});
    }
  }

  // Add consolidated resolution summary
  if (importantHighlights.length === 0) {
    importantHighlights.push(
      `Candidate ${candidateName} process concluded with outcome: ${terminalStage.toUpperCase()}. All transient chat pings pruned.`
    );
  }

  return importantHighlights;
}
