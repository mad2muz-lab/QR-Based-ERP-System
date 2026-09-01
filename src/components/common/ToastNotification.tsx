import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextType {
  addToast: (type: ToastType, message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, message: string, duration = 4000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setToasts(prev => [...prev, { id, type, message, duration }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success': return <CheckCircle style={{ width: '20px', height: '20px' }} />;
      case 'error': return <AlertCircle style={{ width: '20px', height: '20px' }} />;
      case 'warning': return <AlertTriangle style={{ width: '20px', height: '20px' }} />;
      default: return <Info style={{ width: '20px', height: '20px' }} />;
    }
  };

  const getColors = (type: ToastType) => {
    switch (type) {
      case 'success': return { bg: '#ecfdf5', border: '#6ee7b7', text: '#065f46', icon: '#059669' };
      case 'error': return { bg: '#fef2f2', border: '#fca5a5', text: '#991b1b', icon: '#dc2626' };
      case 'warning': return { bg: '#fffbeb', border: '#fde68a', text: '#92400e', icon: '#d97706' };
      default: return { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af', icon: '#2563eb' };
    }
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '400px' }}>
        {toasts.map(toast => {
          const colors = getColors(toast.type);
          return (
            <div
              key={toast.id}
              style={{
                background: colors.bg,
                border: `2px solid ${colors.border}`,
                borderRadius: '12px',
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                animation: 'slideIn 0.3s ease-out',
                minWidth: '300px'
              }}
            >
              <div style={{ color: colors.icon, flexShrink: 0 }}>{getIcon(toast.type)}</div>
              <span style={{ flex: 1, fontSize: '15px', fontWeight: '600', color: colors.text }}>{toast.message}</span>
              <button onClick={() => removeToast(toast.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.icon, padding: '4px' }}>
                <X style={{ width: '16px', height: '16px' }} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};
