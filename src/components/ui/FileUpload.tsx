'use client';

import React, { useCallback, useRef, useState } from 'react';
import { Upload, File, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Types ────────────────────────────────────────────────────

export interface FileUploadProps extends React.HTMLAttributes<HTMLDivElement> {
  /** MIME types string, e.g. "image/*,.pdf" */
  accept?: string;
  /** Max file size in bytes */
  maxSize?: number;
  /** Callback when a valid file is selected */
  onFileSelect?: (file: File) => void;
  /** Callback when selection is cleared */
  onClear?: () => void;
  /** Currently selected file (controlled) */
  file?: File | null;
  /** Show error from parent */
  error?: string;
  /** Placeholder text in the drop zone */
  placeholder?: string;
  /** Sub-hint text */
  hint?: string;
  disabled?: boolean;
  /** Allow multiple file selection */
  multiple?: boolean;
  /** Callback for multiple files */
  onFilesSelect?: (files: File[]) => void;
}

// ── Helpers ─────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function matchesAccept(file: File, accept: string): boolean {
  const acceptList = accept.split(',').map((a) => a.trim());
  return acceptList.some((a) => {
    if (a.startsWith('.')) return file.name.toLowerCase().endsWith(a.toLowerCase());
    if (a.endsWith('/*')) return file.type.startsWith(a.slice(0, -2));
    return file.type === a;
  });
}

// ── Component ──────────────────────────────────────────────

export function FileUpload({
  accept,
  maxSize,
  onFileSelect,
  onClear,
  file: controlledFile,
  error: externalError,
  placeholder = 'Arraste um arquivo ou clique para selecionar',
  hint,
  disabled = false,
  multiple = false,
  onFilesSelect,
  className,
  ...props
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [internalFile, setInternalFile] = useState<File | null>(null);
  const [internalError, setInternalError] = useState<string | null>(null);

  const selectedFile = controlledFile !== undefined ? controlledFile : internalFile;
  const displayError = externalError || internalError;

  const validateAndSelect = useCallback(
    (files: FileList | File[]) => {
      const fileArr = Array.from(files);
      if (!fileArr.length) return;

      const errors: string[] = [];

      for (const f of fileArr) {
        if (accept && !matchesAccept(f, accept)) {
          errors.push(`"${f.name}" não é um formato aceito.`);
          continue;
        }
        if (maxSize && f.size > maxSize) {
          errors.push(`"${f.name}" excede o tamanho máximo de ${formatBytes(maxSize)}.`);
          continue;
        }
      }

      if (errors.length) {
        setInternalError(errors[0]);
        return;
      }

      setInternalError(null);

      if (multiple) {
        onFilesSelect?.(fileArr);
      } else {
        const f = fileArr[0];
        setInternalFile(f);
        onFileSelect?.(f);
      }
    },
    [accept, maxSize, multiple, onFileSelect, onFilesSelect],
  );

  // ── Drag handlers ────────────────────────────────────────

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only clear if leaving the component entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;
    validateAndSelect(e.dataTransfer.files);
  };

  const handleClick = () => {
    if (!disabled) inputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) validateAndSelect(e.target.files);
    // Reset so same file can be re-selected
    e.target.value = '';
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setInternalFile(null);
    setInternalError(null);
    onClear?.();
  };

  // ── Render ───────────────────────────────────────────────

  const hasFile = Boolean(selectedFile);

  return (
    <div className={cn('flex flex-col gap-1.5', className)} {...props}>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        aria-label="Área de upload de arquivo"
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleClick()}
        className={cn(
          'relative flex flex-col items-center justify-center',
          'border-2 border-dashed rounded-xl p-8 min-h-[140px]',
          'transition-all duration-200 cursor-pointer select-none',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          // States
          disabled
            ? 'opacity-50 cursor-not-allowed bg-background-card border-border'
            : isDragging
              ? 'border-primary bg-primary/5 shadow-glow-sm'
              : hasFile
                ? 'border-primary/40 bg-primary/5'
                : displayError
                  ? 'border-danger/50 bg-danger/5'
                  : 'border-border bg-background-card hover:border-border-strong hover:bg-surface-1',
        )}
      >
        {hasFile && selectedFile ? (
          /* ── File selected state ──── */
          <div className="flex flex-col items-center gap-3 w-full">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
              <CheckCircle2 className="w-6 h-6 text-primary" aria-hidden />
            </div>
            <div className="text-center min-w-0 max-w-full px-4">
              <p className="text-sm font-semibold text-text-primary truncate">
                {selectedFile.name}
              </p>
              <p className="text-xs text-text-muted mt-0.5">
                {formatBytes(selectedFile.size)}
              </p>
            </div>
            {!disabled && (
              <button
                type="button"
                onClick={handleClear}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg',
                  'text-xs text-text-muted hover:text-danger hover:bg-danger/10',
                  'transition-colors duration-150',
                  'focus:outline-none focus-visible:ring-1 focus-visible:ring-danger',
                )}
                aria-label="Remover arquivo"
              >
                <X className="w-3.5 h-3.5" aria-hidden />
                Remover
              </button>
            )}
          </div>
        ) : (
          /* ── Empty / dragging state ── */
          <div className="flex flex-col items-center gap-3 pointer-events-none">
            <div
              className={cn(
                'flex items-center justify-center w-12 h-12 rounded-xl transition-colors duration-200',
                isDragging ? 'bg-primary/20' : 'bg-surface-2',
              )}
            >
              <Upload
                className={cn(
                  'w-6 h-6 transition-colors duration-200',
                  isDragging ? 'text-primary' : 'text-text-muted',
                )}
                aria-hidden
              />
            </div>
            <div className="text-center">
              <p
                className={cn(
                  'text-sm font-medium transition-colors duration-200',
                  isDragging ? 'text-primary' : 'text-text-primary',
                )}
              >
                {isDragging ? 'Solte para fazer upload' : placeholder}
              </p>
              {(hint || accept || maxSize) && (
                <p className="text-xs text-text-muted mt-1">
                  {hint ??
                    [
                      accept && `Formatos: ${accept}`,
                      maxSize && `Máx. ${formatBytes(maxSize)}`,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Error message */}
      {displayError && (
        <div className="flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-danger flex-shrink-0" aria-hidden />
          <p className="text-xs text-danger" role="alert">
            {displayError}
          </p>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleInputChange}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />
    </div>
  );
}

export default FileUpload;
