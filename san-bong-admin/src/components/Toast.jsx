import { createContext, useContext, useMemo, useState } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const api = useMemo(
    () => ({
      showToast(message, type = 'success') {
        const id = crypto.randomUUID();
        setToasts((items) => [...items, { id, message, type }]);
        setTimeout(() => setToasts((items) => items.filter((t) => t.id !== id)), 3000);
      },
    }),
    [],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div id="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <span>{toast.type === 'error' ? '✕' : toast.type === 'info' ? 'ℹ' : '✓'}</span>
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
