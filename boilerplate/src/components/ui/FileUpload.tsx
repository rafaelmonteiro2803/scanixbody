'use client';

import React, { useCallback, useRef, useState } from 'react';
import { Upload, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FileUploadProps extends React.HTMLAttributes<HTMLDivElement> {
  accept?: string;
  maxSize?: number;
  onFileSelect?: (file: File) => void;
  onClear?: () => void;
  file?: File | null;
  error?: string;
  placeholder?: string;
  hint?: string;
  disabled?: boolean;
  multiple?: boolean;
  onFilesSelect?: (files: File[]) => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function matchesAccept(file: File, accept: string): boolean {
  return accept.split(',').map((a) => a.trim()).some((a) => {
    if (a.startsWith('.')) return file.name.toLowerCase().endsWith(a.toLowerCase());
    if (a.endsWith('/*')) return file.type.startsWith(a.slice(0, -2));
    return file.type === a;
  });
}

export function FileUpload({
  accept,
  maxSize,
  onFileSelect,
  onClear,
  file: controlledFile,
  error: externalError,
  placeholder = 'Drag a file here or click to select',
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

      for (const f of fileArr) {
        if (accept && !matchesAccept(f, accept)) {
          setInternalError(`"${f.name}" is not an accepted format.`);
          return;
        }
        if (maxSize && f.size > maxSize) {
          setInternalError(`"${f.name}" exceeds the maximum size of ${formatBytes(maxSize)}.`);
          return;
        }
      }

      setInternalError(null);
      if (multiple) {
        onFilesSelect?.(fileArr);
      } else {
        setInternalFile(fileArr[0]);
        onFileSelect?.(fileArr[0]);
      }
    },
    [accept, maxSize, multiple, onFileSelect, onFilesSelect],
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;
    validateAndSelect(e.dataTransfer.files);
  };

  const handleClick = () => { if (!disabled) inputRef.current?.click(); };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setInternalFile(null);
    setInternalError(null);
    onClear?.();
  };

  const hasFile = Boolean(selectedFile);

  return (
    <div className={cn('flex flex-col gap-1.5', className)} {...props}>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        aria-label="File upload area"
        onClick={handleClick}
        onDragEnter={(e) => { e.preventDefault(); if (!disabled) setIsDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false); }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleClick()}
        className={cn(
          'relative flex flex-col items-center justify-center',
          'border-2 border-dashed rounded-xl p-8 min-h-[140px]',
          'transition-all duration-200 cursor-pointer select-none',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          disabled
            ? 'opacity-50 cursor-not-allowed bg-background-card border-border'
            : isDragging
              ? 'border-primary bg-primary/5'
              : hasFile
                ? 'border-primary/40 bg-primary/5'
                : displayError
                  ? 'border-danger/50 bg-danger/5'
                  : 'border-border bg-background-card hover:border-border-strong hover:bg-surface-1',
        )}
      >
        {hasFile && selectedFile ? (
          <div className="flex flex-col items-center gap-3 w-full">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
              <CheckCircle2 className="w-6 h-6 text-primary" aria-hidden />
            </div>
            <div className="text-center min-w-0 max-w-full px-4">
              <p className="text-sm font-semibold text-text-primary truncate">{selectedFile.name}</p>
              <p className="text-xs text-text-muted mt-0.5">{formatBytes(selectedFile.size)}</p>
            </div>
            {!disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-text-muted hover:text-danger hover:bg-danger/10 transition-colors duration-150 focus:outline-none"
                aria-label="Remove file"
              >
                <X className="w-3.5 h-3.5" aria-hidden />
                Remove
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 pointer-events-none">
            <div className={cn('flex items-center justify-center w-12 h-12 rounded-xl transition-colors duration-200', isDragging ? 'bg-primary/20' : 'bg-surface-2')}>
              <Upload className={cn('w-6 h-6 transition-colors duration-200', isDragging ? 'text-primary' : 'text-text-muted')} aria-hidden />
            </div>
            <div className="text-center">
              <p className={cn('text-sm font-medium transition-colors duration-200', isDragging ? 'text-primary' : 'text-text-primary')}>
                {isDragging ? 'Drop to upload' : placeholder}
              </p>
              {(hint || accept || maxSize) && (
                <p className="text-xs text-text-muted mt-1">
                  {hint ?? [accept && `Formats: ${accept}`, maxSize && `Max ${formatBytes(maxSize)}`].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {displayError && (
        <div className="flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-danger flex-shrink-0" aria-hidden />
          <p className="text-xs text-danger" role="alert">{displayError}</p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={(e) => { if (e.target.files) validateAndSelect(e.target.files); e.target.value = ''; }}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />
    </div>
  );
}

export default FileUpload;
