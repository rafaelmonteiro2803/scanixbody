'use client';

import React, { useEffect, useCallback, useId } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: ModalSize;
  disableBackdropClose?: boolean;
  hideCloseButton?: boolean;
  className?: string;
}

export interface ModalHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  onClose?: () => void;
  hideCloseButton?: boolean;
}

export interface ModalBodyProps extends React.HTMLAttributes<HTMLDivElement> {}
export interface ModalFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  divider?: boolean;
}

const sizeStyles: Record<ModalSize, string> = {
  sm:   'max-w-sm',
  md:   'max-w-md',
  lg:   'max-w-lg',
  xl:   'max-w-xl',
  full: 'max-w-[calc(100vw-2rem)] h-[calc(100vh-2rem)]',
};

export const ModalHeader = React.forwardRef<HTMLDivElement, ModalHeaderProps>(
  ({ children, onClose, hideCloseButton = false, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-start justify-between gap-3 px-6 py-4 border-b border-border flex-shrink-0', className)}
      {...props}
    >
      <div className="min-w-0 flex-1">{children}</div>
      {!hideCloseButton && onClose && (
        <button
          type="button"
          onClick={onClose}
          className={cn(
            'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center',
            'text-text-muted hover:text-text-primary hover:bg-surface-2',
            'transition-colors duration-150',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          )}
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  ),
);
ModalHeader.displayName = 'ModalHeader';

export const ModalBody = React.forwardRef<HTMLDivElement, ModalBodyProps>(
  ({ children, className, ...props }, ref) => (
    <div ref={ref} className={cn('flex-1 overflow-y-auto px-6 py-5 min-h-0', className)} {...props}>
      {children}
    </div>
  ),
);
ModalBody.displayName = 'ModalBody';

export const ModalFooter = React.forwardRef<HTMLDivElement, ModalFooterProps>(
  ({ divider = true, children, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center justify-end gap-3 px-6 py-4 flex-shrink-0', divider && 'border-t border-border', className)}
      {...props}
    >
      {children}
    </div>
  ),
);
ModalFooter.displayName = 'ModalFooter';

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md',
  disableBackdropClose = false,
  hideCloseButton = false,
  className,
}: ModalProps) {
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !disableBackdropClose) onClose();
    },
    [onClose, disableBackdropClose],
  );

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const content = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => !disableBackdropClose && onClose()}
        aria-hidden="true"
      />
      <div
        className={cn(
          'relative z-10 w-full flex flex-col',
          'bg-background-card border border-border rounded-2xl shadow-card-xl',
          'max-h-[90vh]',
          sizeStyles[size],
          className,
        )}
      >
        {(title || !hideCloseButton) && (
          <ModalHeader onClose={onClose} hideCloseButton={hideCloseButton}>
            {title && (
              <div>
                <h2 id={titleId} className="text-lg font-semibold text-text-primary leading-tight">
                  {title}
                </h2>
                {subtitle && <p className="mt-0.5 text-sm text-text-secondary">{subtitle}</p>}
              </div>
            )}
          </ModalHeader>
        )}
        <ModalBody>{children}</ModalBody>
        {footer && <ModalFooter>{footer}</ModalFooter>}
      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(content, document.body);
}

export default Modal;
