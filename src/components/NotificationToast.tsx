import React, { useEffect } from "react";
import { CheckCircle2, AlertCircle, Calendar, ArrowRight, X, Clock, RefreshCw } from "lucide-react";
import { InAppNotification, Candidate } from "../types";

interface NotificationToastProps {
  notification: InAppNotification | null;
  onDismiss: () => void;
  onOpenCandidate?: (candidateId: string) => void;
  candidates: Candidate[];
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onDismiss,
  onOpenCandidate,
  candidates,
}) => {
  useEffect(() => {
    if (!notification) return;

    // Auto dismiss after 8 seconds
    const timer = setTimeout(() => {
      onDismiss();
    }, 8000);

    return () => clearTimeout(timer);
  }, [notification, onDismiss]);

  if (!notification) return null;

  const getIcon = () => {
    switch (notification.type) {
      case "submission":
        return <ArrowRight className="w-5 h-5 text-indigo-600" />;
      case "interview":
        return <Calendar className="w-5 h-5 text-emerald-600" />;
      case "process_advanced":
        return <CheckCircle2 className="w-5 h-5 text-blue-600" />;
      case "red_alert_reminder":
        return <AlertCircle className="w-5 h-5 text-rose-600" />;
      default:
        return <RefreshCw className="w-5 h-5 text-amber-600" />;
    }
  };

  const getBgStyle = () => {
    if (notification.priority === "urgent_red_alert") {
      return "border-rose-400 bg-rose-50 text-rose-950 ring-4 ring-rose-500/20";
    }
    return "border-slate-200 bg-white text-slate-900 shadow-xl";
  };

  const candidateExists = candidates.some((c) => c.id === notification.candidateId);

  return (
    <div
      id="notification-toast-container"
      className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-in slide-in-from-bottom-5 duration-300 pointer-events-auto"
    >
      <div className={`p-4 rounded-2xl border ${getBgStyle()} flex items-start gap-3 relative`}>
        <div className="p-2 rounded-xl bg-slate-100/80 shrink-0 mt-0.5">
          {getIcon()}
        </div>

        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span
              className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded tracking-wide ${
                notification.priority === "urgent_red_alert"
                  ? "bg-rose-600 text-white"
                  : "bg-indigo-100 text-indigo-700"
              }`}
            >
              {notification.type.replace(/_/g, " ")}
            </span>
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Just now
            </span>
          </div>

          <h4 className="text-xs font-bold text-slate-900 leading-tight">
            {notification.title}
          </h4>

          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            {notification.message}
          </p>

          <div className="mt-2.5 flex items-center gap-2">
            {candidateExists && onOpenCandidate && (
              <button
                onClick={() => {
                  onOpenCandidate(notification.candidateId);
                  onDismiss();
                }}
                className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition-colors"
              >
                <span>View Candidate Details</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
            <button
              onClick={onDismiss}
              className="text-xs font-medium text-slate-500 hover:text-slate-800 px-2 py-1"
            >
              Dismiss
            </button>
          </div>
        </div>

        <button
          onClick={onDismiss}
          className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          title="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
