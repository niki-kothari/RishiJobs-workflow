// Web Audio API sound synthesizer for immediate submission notifications and urgent red alerts

const SOUND_PREF_KEY = "rishi_jobs_sound_enabled";

export function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return false;
  const pref = localStorage.getItem(SOUND_PREF_KEY);
  return pref !== "false"; // default to true
}

export function setSoundEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SOUND_PREF_KEY, enabled ? "true" : "false");
}

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    return audioCtx;
  } catch (e) {
    console.warn("Could not initialize AudioContext", e);
    return null;
  }
}

/**
 * Standard notification chime: Pleasant, crisp 3-tone arpeggio (C5 -> E5 -> G5)
 * Triggered on any submission, process advance, interview booking, or update.
 */
export function playNotificationChime(): void {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const notes = [
    { freq: 523.25, time: 0.00, dur: 0.12 }, // C5
    { freq: 659.25, time: 0.09, dur: 0.12 }, // E5
    { freq: 783.99, time: 0.18, dur: 0.28 }, // G5
  ];

  notes.forEach(({ freq, time, dur }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now + time);

    gain.gain.setValueAtTime(0, now + time);
    gain.gain.linearRampToValueAtTime(0.2, now + time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + time);
    osc.stop(now + time + dur);
  });
}

/**
 * Urgent Red Alert Sound: Two-pulse alarm tone (880Hz / 660Hz)
 * Triggered when a candidate action is overdue (10+ minutes) and recurs every 10 mins.
 */
export function playUrgentRedAlertSound(): void {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const pulses = [
    { freq: 880, start: 0.00, dur: 0.15 },
    { freq: 659.25, start: 0.18, dur: 0.15 },
    { freq: 880, start: 0.36, dur: 0.22 },
  ];

  pulses.forEach(({ freq, start, dur }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle"; // sharper, urgent harmonic profile
    osc.frequency.setValueAtTime(freq, now + start);

    gain.gain.setValueAtTime(0, now + start);
    gain.gain.linearRampToValueAtTime(0.35, now + start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + start);
    osc.stop(now + start + dur);
  });
}

/**
 * Request browser desktop notification permission if supported
 */
export function requestDesktopNotificationPermission(): void {
  if (typeof window !== "undefined" && "Notification" in window) {
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }
}

/**
 * Trigger browser native desktop notification if permitted
 */
export function sendDesktopNotification(title: string, body: string): void {
  if (typeof window !== "undefined" && "Notification" in window) {
    if (Notification.permission === "granted") {
      try {
        new Notification(title, {
          body,
          icon: "/favicon.ico",
        });
      } catch (err) {
        console.warn("Desktop notification error:", err);
      }
    }
  }
}
