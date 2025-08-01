"use client";

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// TOAST TYPES & INTERFACES
// ============================================================================

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

// ============================================================================
// TOAST CONTEXT
// ============================================================================

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: Toast = {
      id,
      duration: 5000, // Default 5 seconds
      ...toast,
    };

    setToasts(prev => [...prev, newToast]);

    // Auto-remove toast after duration
    if (newToast.duration !== Infinity) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const clearToasts = () => {
    setToasts([]);
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearToasts }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// ============================================================================
// TOAST COMPONENTS
// ============================================================================

function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  // Only render portal on client side
  if (typeof window === 'undefined') {
    return null;
  }

  return createPortal(
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>,
    document.body
  );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleRemove = () => {
    setIsVisible(false);
    setTimeout(() => onRemove(toast.id), 150);
  };

  const getToastStyles = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'border-success-200 bg-success-50 text-success-800';
      case 'error':
        return 'border-error-200 bg-error-50 text-error-800';
      case 'warning':
        return 'border-warning-200 bg-warning-50 text-warning-800';
      case 'info':
        return 'border-primary-200 bg-primary-50 text-primary-800';
      default:
        return 'border-gray-200 bg-white text-gray-800';
    }
  };

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-success-600" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-error-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-warning-600" />;
      case 'info':
        return <Info className="w-5 h-5 text-primary-600" />;
      default:
        return null;
    }
  };

  return (
    <div
      className={cn(
        'glass-sm rounded-glass-sm p-4 border transition-all duration-200 ease-in-out',
        'transform translate-x-full opacity-0',
        isVisible && 'translate-x-0 opacity-100',
        getToastStyles(toast.type)
      )}
    >
      <div className="flex items-start gap-3">
        {getIcon(toast.type)}
        
        <div className="flex-1 min-w-0">
          {toast.title && (
            <h4 className="font-semibold text-sm mb-1">{toast.title}</h4>
          )}
          <p className="text-sm leading-relaxed">{toast.message}</p>
          
          {toast.action && (
            <button
              onClick={toast.action.onClick}
              className="mt-2 text-sm font-medium underline hover:no-underline transition-all"
            >
              {toast.action.label}
            </button>
          )}
        </div>

        <button
          onClick={handleRemove}
          className="flex-shrink-0 p-1 rounded-full hover:bg-black/5 transition-colors"
          aria-label="Close toast"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// CONVENIENCE HOOKS
// ============================================================================

export function useToastHelpers() {
  const { addToast } = useToast();

  return {
    success: (message: string, title?: string, options?: Partial<Toast>) => {
      addToast({ type: 'success', message, title, ...options });
    },
    error: (message: string, title?: string, options?: Partial<Toast>) => {
      addToast({ type: 'error', message, title, ...options });
    },
    warning: (message: string, title?: string, options?: Partial<Toast>) => {
      addToast({ type: 'warning', message, title, ...options });
    },
    info: (message: string, title?: string, options?: Partial<Toast>) => {
      addToast({ type: 'info', message, title, ...options });
    },
  };
}

// ============================================================================
// EXPORT CONVENIENCE FUNCTIONS
// ============================================================================

export const toast = {
  success: (message: string, title?: string) => {
    // This will be used when ToastProvider is not available
    console.log(`[SUCCESS] ${title || ''}: ${message}`);
  },
  error: (message: string, title?: string) => {
    console.error(`[ERROR] ${title || ''}: ${message}`);
  },
  warning: (message: string, title?: string) => {
    console.warn(`[WARNING] ${title || ''}: ${message}`);
  },
  info: (message: string, title?: string) => {
    console.info(`[INFO] ${title || ''}: ${message}`);
  },
}; 