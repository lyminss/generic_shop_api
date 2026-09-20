import { createContext, useContext, useState, useCallback } from 'react';
import './Toast.css';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

let toastId = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3800) => {
    const id = ++toastId;
    let safeMessage = message;
    if (typeof message === 'object' && message !== null) {
      safeMessage = message.message || message.error || JSON.stringify(message);
    }
    setToasts(prev => [...prev.slice(-4), { id, message: String(safeMessage ?? ''), type, duration }]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = {
    success: (msg, duration) => addToast(msg, 'success', duration),
    error: (msg, duration) => addToast(msg, 'error', duration),
    info: (msg, duration) => addToast(msg, 'info', duration),
    warning: (msg, duration) => addToast(msg, 'warning', duration),
  };

  const getTypeDetails = (type) => {
    switch (type) {
      case 'success':
        return {
          title: 'Thành công',
          icon: <CheckCircle2 size={20} className="toast-icon-svg" />,
        };
      case 'error':
        return {
          title: 'Đã có lỗi xảy ra',
          icon: <AlertCircle size={20} className="toast-icon-svg" />,
        };
      case 'warning':
        return {
          title: 'Lưu ý',
          icon: <AlertTriangle size={20} className="toast-icon-svg" />,
        };
      default:
        return {
          title: 'Thông báo',
          icon: <Info size={20} className="toast-icon-svg" />,
        };
    }
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-container" aria-live="polite">
        {toasts.map(t => {
          const details = getTypeDetails(t.type);
          return (
            <div key={t.id} className={`toast toast-${t.type}`} role="alert">
              <div className="toast-left-stripe" />
              <div className="toast-icon-wrapper">
                {details.icon}
              </div>
              <div className="toast-body">
                <div className="toast-title">{details.title}</div>
                <div className="toast-message">{t.message}</div>
              </div>
              <button 
                type="button"
                className="toast-close" 
                onClick={() => removeToast(t.id)} 
                aria-label="Đóng thông báo"
              >
                <X size={15} />
              </button>
              <div 
                className="toast-progress-bar"
                style={{ animationDuration: `${t.duration || 3800}ms` }}
              />
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
