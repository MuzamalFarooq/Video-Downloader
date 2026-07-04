'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback(({ title, description, type = 'info', duration = 4000 }) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, description, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast container overlay */}
      <div className="fixed bottom-5 right-5 z-9999 flex flex-col gap-3 w-full max-w-sm pointer-events-none px-4 sm:px-0">
        <AnimatePresence>
          {toasts.map((t) => {
            let Icon = Info;
            let iconColor = 'text-indigo-500';
            let borderColor = 'border-zinc-200 dark:border-zinc-800/80';
            let bgColor = 'bg-white/90 dark:bg-zinc-900/90';

            if (t.type === 'success') {
              Icon = CheckCircle;
              iconColor = 'text-emerald-500';
            } else if (t.type === 'error') {
              Icon = AlertCircle;
              iconColor = 'text-rose-500';
            }

            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
                className={`flex gap-3 p-4 rounded-xl border ${borderColor} ${bgColor} backdrop-blur-md shadow-lg pointer-events-auto overflow-hidden relative`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  {t.title && <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{t.title}</h4>}
                  {t.description && <p className="text-xs mt-1 text-zinc-500 dark:text-zinc-400 leading-normal">{t.description}</p>}
                </div>
                <button
                  onClick={() => removeToast(t.id)}
                  className="flex-shrink-0 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context.toast;
}
