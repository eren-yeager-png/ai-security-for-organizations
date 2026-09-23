import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  showNotification: (type: NotificationType, title: string, message?: string, duration?: number) => void;
  success: (title: string, message?: string, duration?: number) => void;
  error: (title: string, message?: string, duration?: number) => void;
  warning: (title: string, message?: string, duration?: number) => void;
  info: (title: string, message?: string, duration?: number) => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const showNotification = useCallback(
    (type: NotificationType, title: string, message?: string, duration = 4500) => {
      const id = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newNotification: NotificationItem = { id, type, title, message, duration };

      setNotifications((prev) => [...prev, newNotification]);

      if (duration > 0) {
        setTimeout(() => {
          removeNotification(id);
        }, duration);
      }
    },
    [removeNotification]
  );

  const success = useCallback((title: string, message?: string, duration?: number) => {
    showNotification('success', title, message, duration);
  }, [showNotification]);

  const error = useCallback((title: string, message?: string, duration?: number) => {
    showNotification('error', title, message, duration);
  }, [showNotification]);

  const warning = useCallback((title: string, message?: string, duration?: number) => {
    showNotification('warning', title, message, duration);
  }, [showNotification]);

  const info = useCallback((title: string, message?: string, duration?: number) => {
    showNotification('info', title, message, duration);
  }, [showNotification]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        showNotification,
        success,
        error,
        warning,
        info,
        removeNotification,
      }}
    >
      {children}
      {/* Toast Notification Container */}
      <div
        aria-live="polite"
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
      >
        {notifications.map((notif) => {
          const isError = notif.type === 'error';
          const isSuccess = notif.type === 'success';
          const isWarning = notif.type === 'warning';

          return (
            <div
              key={notif.id}
              role="alert"
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border backdrop-blur-xl shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-3 ${
                isSuccess
                  ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-100'
                  : isError
                  ? 'bg-rose-50 dark:bg-rose-950/80 border-rose-300 dark:border-rose-500/30 text-rose-800 dark:text-rose-100'
                  : isWarning
                  ? 'bg-amber-50 dark:bg-amber-950/80 border-amber-300 dark:border-amber-500/30 text-amber-800 dark:text-amber-100'
                  : 'bg-white dark:bg-slate-900/85 border-cyan-300 dark:border-cyan-500/30 text-slate-800 dark:text-slate-100'
              }`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />}
                {isError && <AlertCircle className="w-5 h-5 text-rose-700 dark:text-rose-400" />}
                {isWarning && <AlertTriangle className="w-5 h-5 text-amber-700 dark:text-amber-400" />}
                {!isSuccess && !isError && !isWarning && <Info className="w-5 h-5 text-cyan-700 dark:text-cyan-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold leading-tight">{notif.title}</p>
                {notif.message && (
                  <p className="text-xs mt-1 opacity-90 leading-relaxed break-words">{notif.message}</p>
                )}
              </div>
              <button
                onClick={() => removeNotification(notif.id)}
                className="flex-shrink-0 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors p-0.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500"
                aria-label="Close notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </NotificationContext.Provider>
  );
};

export function useNotification(): NotificationContextType {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
