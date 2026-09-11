import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext();

const STYLES = {
  success: {
    icon: CheckCircle2,
    tone: 'bg-white border-green-200',
    iconTone: 'text-green-600',
  },
  error: {
    icon: AlertCircle,
    tone: 'bg-white border-red-200',
    iconTone: 'text-red-600',
  },
  info: {
    icon: Info,
    tone: 'bg-white border-gray-200',
    iconTone: 'text-gray-500',
  },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (message, type = 'info', duration = 4000) => {
      // crypto.randomUUID avoids two toasts sharing a key when fired together
      const id = crypto.randomUUID();

      setToasts((prev) => [...prev, { id, message, type }]);

      if (duration) {
        setTimeout(() => dismiss(id), duration);
      }

      return id;
    },
    [dismiss]
  );

  const toast = {
    success: (message, duration) => push(message, 'success', duration),
    error: (message, duration) => push(message, 'error', duration ?? 6000),
    info: (message, duration) => push(message, 'info', duration),
    dismiss,
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}

      <div className="fixed bottom-4 right-4 z-60 flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]">
        {toasts.map((t) => {
          const style = STYLES[t.type] || STYLES.info;
          const Icon = style.icon;

          return (
            <div
              key={t.id}
              role="status"
              className={`flex items-start gap-3 border rounded-lg shadow-lg p-3.5 ${style.tone}`}
            >
              <Icon size={18} className={`shrink-0 mt-0.5 ${style.iconTone}`} />

              <p className="flex-1 text-sm">{t.message}</p>

              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss"
                className="p-0.5 rounded text-gray-400 hover:text-gray-900 cursor-pointer shrink-0"
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  return useContext(ToastContext);
}