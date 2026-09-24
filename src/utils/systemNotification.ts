// System Desktop Notifications (W3C Web Notifications API) & WhatsApp Alerts Integration

import { Candidate, TeamMember } from "../types";
import { playUrgentRedAlertSound, playNotificationChime } from "./audioAlert";

export interface NotificationSettings {
  systemNotificationsEnabled: boolean;
  requireInteraction: boolean; // Keep OS notification on screen until user interacts
  flashTabTitle: boolean; // Flash browser tab title when user is in another window
  repeatSoundWhenAway: boolean; // Repeat sound buzzer if tab is hidden
  whatsappEnabled: boolean;
  defaultWhatsappNumber: string; // e.g. "+919876543210"
  autoTriggerWhatsappOnRedAlert: boolean;
  // Automated background webhook (e.g. CallMeBot or custom webhook)
  whatsappWebhookType: "direct_link" | "callmebot" | "custom_webhook";
  callmebotPhone: string;
  callmebotApiKey: string;
  customWebhookUrl: string;
}

const SETTINGS_STORAGE_KEY = "rishi_jobs_notification_settings";

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  systemNotificationsEnabled: true,
  requireInteraction: true,
  flashTabTitle: true,
  repeatSoundWhenAway: true,
  whatsappEnabled: true,
  defaultWhatsappNumber: "+91 98765 43210",
  autoTriggerWhatsappOnRedAlert: false,
  whatsappWebhookType: "direct_link",
  callmebotPhone: "",
  callmebotApiKey: "",
  customWebhookUrl: "",
};

export function getNotificationSettings(): NotificationSettings {
  if (typeof window === "undefined") return DEFAULT_NOTIFICATION_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_NOTIFICATION_SETTINGS;
    return { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_NOTIFICATION_SETTINGS;
  }
}

export function saveNotificationSettings(settings: NotificationSettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.warn("Could not save notification settings", err);
  }
}

/**
 * Check browser support and current permission
 */
export function getSystemNotificationPermission(): "granted" | "denied" | "default" | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission;
}

/**
 * Request OS system desktop notification permission from user
 */
export async function requestSystemNotificationPermission(): Promise<"granted" | "denied" | "default" | "unsupported"> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  try {
    const result = await Notification.requestPermission();
    return result;
  } catch (err) {
    console.warn("Error requesting notification permission:", err);
    return Notification.permission;
  }
}

export interface SystemNotificationOptions {
  title: string;
  body: string;
  tag?: string;
  onClick?: () => void;
  urgent?: boolean;
  urgency?: "normal" | "critical";
  requireInteraction?: boolean;
}

/**
 * Send an OS-level System Desktop Notification that appears in Windows Action Center / macOS Notification Center
 */
export function sendSystemDesktopNotification(options: SystemNotificationOptions): Notification | null {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return null;
  }

  const settings = getNotificationSettings();
  if (!settings.systemNotificationsEnabled) {
    return null;
  }

  if (Notification.permission !== "granted") {
    // Cannot send if permission is not granted
    return null;
  }

  try {
    const notif = new Notification(options.title, {
      body: options.body,
      icon: "/favicon.ico",
      tag: options.tag || "rishi-jobs-notification",
      // requireInteraction keeps the notification visible on screen indefinitely until user clicks or dismisses it
      requireInteraction: options.requireInteraction ?? (options.urgent ? true : settings.requireInteraction),
      silent: false,
    });

    notif.onclick = () => {
      try {
        window.focus();
      } catch {
        // ignore
      }
      if (options.onClick) {
        options.onClick();
      }
      notif.close();
    };

    return notif;
  } catch (err) {
    console.warn("Failed to create system notification:", err);
    return null;
  }
}

// -------------------------------------------------------------
// Document Title Flashing when Tab is Inactive / In Background
// -------------------------------------------------------------

let titleFlashInterval: NodeJS.Timeout | null = null;
let originalDocumentTitle = typeof document !== "undefined" ? document.title : "Rishi Jobs";

export function startTabTitleFlashing(urgentMessage: string, _durationTimes?: number): void {
  if (typeof document === "undefined") return;
  const settings = getNotificationSettings();
  if (!settings.flashTabTitle) return;

  if (titleFlashInterval) {
    clearInterval(titleFlashInterval);
  }

  originalDocumentTitle = document.title.replace(/^⚠️ [^|]+ \| /, "");
  let showUrgent = true;

  titleFlashInterval = setInterval(() => {
    if (document.hidden) {
      document.title = showUrgent ? `⚠️ ACTION NEEDED: ${urgentMessage}` : `🚨 Rishi Jobs Alert`;
      showUrgent = !showUrgent;
    } else {
      stopTabTitleFlashing();
    }
  }, 1200);

  // Auto-stop when window receives focus
  const onFocus = () => {
    stopTabTitleFlashing();
    window.removeEventListener("focus", onFocus);
  };
  window.addEventListener("focus", onFocus);
}

export function stopTabTitleFlashing(): void {
  if (titleFlashInterval) {
    clearInterval(titleFlashInterval);
    titleFlashInterval = null;
  }
  if (typeof document !== "undefined") {
    document.title = originalDocumentTitle || "Rishi Jobs - Agency Recruiting Platform";
  }
}

// -------------------------------------------------------------
// WhatsApp Alert Integration
// -------------------------------------------------------------

/**
 * Format a phone number into international WhatsApp clean format (digits only, e.g. 919876543210)
 */
export function cleanWhatsappNumber(phone: string): string {
  if (!phone) return "";
  let digits = phone.replace(/\D/g, "");
  // If user entered a 10-digit number like 9876543210, prepend India country code 91 by default if no country code
  if (digits.length === 10) {
    digits = "91" + digits;
  }
  return digits;
}

export interface WhatsappAlertPayload {
  candidate: Candidate;
  clientName?: string;
  assignedMember?: TeamMember;
  actionOwnerText: string;
  overdueMinutes?: number;
  customNote?: string;
}

/**
 * Build a professionally formatted WhatsApp urgent notification message
 */
export function buildWhatsappAlertMessage(payload: WhatsappAlertPayload): string {
  const { candidate, clientName, assignedMember, actionOwnerText, overdueMinutes } = payload;

  const overdueStr = overdueMinutes && overdueMinutes > 0
    ? `⏳ *PENDING / UNANSWERED:* ${overdueMinutes} minutes (10+ min Red Alert SLA breached)`
    : `⚡ *STATUS:* Pending Action Required`;

  const appUrl = typeof window !== "undefined" ? window.location.href : "https://rishi-jobs.web.app";

  return `🚨 *RISHI JOBS - CANDIDATE ACTION ALERT* 🚨
━━━━━━━━━━━━━━━━━━━━
👤 *Candidate:* ${candidate.name}
💼 *Role:* ${candidate.targetRole}
🏢 *Target Client:* ${clientName || "Client"}
${overdueStr}

👉 *ACTION REQUIRED:*
${candidate.actionDescription || "Review candidate status & advance pipeline"}

👥 *Assigned To:* ${assignedMember?.name || actionOwnerText} (${candidate.actionOwner === "recruiter" ? "Team X Recruiter" : "Client PM"})
📱 *Contact:* ${assignedMember?.phone || candidate.phone || "N/A"}

🔗 *Open in Rishi Jobs App:*
${appUrl}
━━━━━━━━━━━━━━━━━━━━
_Please respond or update in app to resolve this alert._`;
}

/**
 * Open WhatsApp Web / App directly in a new tab with the pre-filled alert message
 */
export function openWhatsappAlert(payload: WhatsappAlertPayload, overridePhone?: string): void {
  const settings = getNotificationSettings();
  const phoneToUse = overridePhone || payload.assignedMember?.phone || settings.defaultWhatsappNumber;
  const cleanPhone = cleanWhatsappNumber(phoneToUse);
  const message = buildWhatsappAlertMessage(payload);

  const encodedMsg = encodeURIComponent(message);
  let whatsappUrl = `https://wa.me/?text=${encodedMsg}`;
  if (cleanPhone) {
    whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMsg}`;
  }

  // Open WhatsApp in new tab / app
  if (typeof window !== "undefined") {
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  }
}

/**
 * Send an automated WhatsApp notification via CallMeBot or Custom Webhook in the background
 */
export async function sendBackgroundWhatsappAlert(
  payload: WhatsappAlertPayload
): Promise<{ success: boolean; message: string }> {
  const settings = getNotificationSettings();
  const message = buildWhatsappAlertMessage(payload);

  if (settings.whatsappWebhookType === "callmebot") {
    const phone = cleanWhatsappNumber(settings.callmebotPhone || settings.defaultWhatsappNumber);
    const apikey = settings.callmebotApiKey.trim();

    if (!phone || !apikey) {
      return {
        success: false,
        message: "CallMeBot phone or API key is not configured in WhatsApp Settings.",
      };
    }

    try {
      const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(
        phone
      )}&text=${encodeURIComponent(message)}&apikey=${encodeURIComponent(apikey)}`;
      
      const res = await fetch(url, { method: "GET", mode: "no-cors" });
      return {
        success: true,
        message: "WhatsApp alert dispatched via CallMeBot gateway to " + phone,
      };
    } catch (err: unknown) {
      const errMessage = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        message: "CallMeBot network error: " + errMessage,
      };
    }
  }

  if (settings.whatsappWebhookType === "custom_webhook") {
    if (!settings.customWebhookUrl) {
      return {
        success: false,
        message: "Custom WhatsApp Webhook URL is empty.",
      };
    }

    try {
      const res = await fetch(settings.customWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: "unanswered_candidate_action",
          candidateId: payload.candidate.id,
          candidateName: payload.candidate.name,
          role: payload.candidate.targetRole,
          client: payload.clientName,
          overdueMinutes: payload.overdueMinutes,
          actionDescription: payload.candidate.actionDescription,
          assignedTo: payload.assignedMember?.name,
          phone: payload.assignedMember?.phone,
          whatsappFormattedMessage: message,
          timestamp: new Date().toISOString(),
        }),
      });

      if (res.ok) {
        return { success: true, message: "Webhook successfully sent to WhatsApp gateway." };
      } else {
        return { success: false, message: `Webhook returned status ${res.status}` };
      }
    } catch (err: unknown) {
      const errMessage = err instanceof Error ? err.message : String(err);
      return { success: false, message: "Webhook dispatch error: " + errMessage };
    }
  }

  // Default: Direct Link
  return {
    success: true,
    message: "Ready for direct 1-click WhatsApp dispatch.",
  };
}
