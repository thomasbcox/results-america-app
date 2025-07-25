"use client";

import { useState, ReactNode } from 'react';
import { X, AlertTriangle, AlertCircle, Info, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// CONFIRMATION DIALOG TYPES
// ============================================================================

export type ConfirmDialogVariant = 'default' | 'destructive' | 'warning' | 'info' | 'success';

export interface ConfirmDialogProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmDialogVariant;
  children?: ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

// ============================================================================
// CONFIRMATION DIALOG COMPONENT
// ============================================================================

export function ConfirmDialog({ 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  children,
  isOpen: controlledIsOpen,
  onOpenChange
}: ConfirmDialogProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  
  // Support both controlled and uncontrolled modes
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const setIsOpen = onOpenChange || setInternalIsOpen;

  const handleOpen = () => setIsOpen(true);
  const handleClose = () => setIsOpen(false);

  const handleConfirm = () => {
    onConfirm();
    handleClose();
  };

  const handleCancel = () => {
    onCancel?.();
    handleClose();
  };

  const getVariantStyles = (variant: ConfirmDialogVariant) => {
    switch (variant) {
      case 'destructive':
        return {
          icon: <AlertTriangle className="w-6 h-6 text-error-600" />,
          confirmButton: 'bg-error-600 hover:bg-error-700 text-white',
          cancelButton: 'border-gray-300 text-gray-700 hover:bg-gray-50',
          iconBg: 'bg-error-100',
        };
      case 'warning':
        return {
          icon: <AlertCircle className="w-6 h-6 text-warning-600" />,
          confirmButton: 'bg-warning-600 hover:bg-warning-700 text-white',
          cancelButton: 'border-gray-300 text-gray-700 hover:bg-gray-50',
          iconBg: 'bg-warning-100',
        };
      case 'info':
        return {
          icon: <Info className="w-6 h-6 text-primary-600" />,
          confirmButton: 'bg-primary-600 hover:bg-primary-700 text-white',
          cancelButton: 'border-gray-300 text-gray-700 hover:bg-gray-50',
          iconBg: 'bg-primary-100',
        };
      case 'success':
        return {
          icon: <CheckCircle className="w-6 h-6 text-success-600" />,
          confirmButton: 'bg-success-600 hover:bg-success-700 text-white',
          cancelButton: 'border-gray-300 text-gray-700 hover:bg-gray-50',
          iconBg: 'bg-success-100',
        };
      default:
        return {
          icon: <AlertTriangle className="w-6 h-6 text-gray-600" />,
          confirmButton: 'bg-gray-600 hover:bg-gray-700 text-white',
          cancelButton: 'border-gray-300 text-gray-700 hover:bg-gray-50',
          iconBg: 'bg-gray-100',
        };
    }
  };

  const styles = getVariantStyles(variant);

  return (
    <>
      {/* Trigger Button */}
      {children && (
        <div onClick={handleOpen}>
          {children}
        </div>
      )}

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-modal-backdrop bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          {/* Modal Content */}
          <div className="glass rounded-glass p-6 max-w-md w-full animate-scale-in">
            {/* Header */}
            <div className="flex items-start gap-4 mb-4">
              <div className={cn('p-2 rounded-full', styles.iconBg)}>
                {styles.icon}
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {message}
                </p>
              </div>

              <button
                onClick={handleCancel}
                className="flex-shrink-0 p-1 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancel}
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-lg border transition-colors',
                  styles.cancelButton
                )}
              >
                {cancelText}
              </button>
              
              <button
                onClick={handleConfirm}
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                  styles.confirmButton
                )}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ============================================================================
// CONVENIENCE COMPONENTS
// ============================================================================

export function DestructiveConfirmDialog(props: Omit<ConfirmDialogProps, 'variant'>) {
  return <ConfirmDialog {...props} variant="destructive" />;
}

export function WarningConfirmDialog(props: Omit<ConfirmDialogProps, 'variant'>) {
  return <ConfirmDialog {...props} variant="warning" />;
}

export function InfoConfirmDialog(props: Omit<ConfirmDialogProps, 'variant'>) {
  return <ConfirmDialog {...props} variant="info" />;
}

export function SuccessConfirmDialog(props: Omit<ConfirmDialogProps, 'variant'>) {
  return <ConfirmDialog {...props} variant="success" />;
}

// ============================================================================
// HOOK FOR PROGRAMMATIC CONFIRMATION
// ============================================================================

export function useConfirmDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
    variant?: ConfirmDialogVariant;
  } | null>(null);

  const confirm = (config: {
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
    variant?: ConfirmDialogVariant;
  }) => {
    setConfig(config);
    setIsOpen(true);
  };

  const handleConfirm = () => {
    config?.onConfirm();
    setIsOpen(false);
  };

  const handleCancel = () => {
    config?.onCancel?.();
    setIsOpen(false);
  };

  const ConfirmDialogComponent = () => {
    if (!config || !isOpen) return null;

    return (
      <ConfirmDialog
        {...config}
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    );
  };

  return {
    confirm,
    ConfirmDialogComponent,
  };
} 