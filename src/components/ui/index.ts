/**
 * SCANIX BODY — UI Component Library
 * Re-exports all UI primitives from a single entry point.
 */

// ── Primitives ────────────────────────────────────────────
export { Button, IconButton } from './Button';
export type { ButtonProps, IconButtonProps, ButtonVariant, ButtonSize } from './Button';

export { Input } from './Input';
export type { InputProps, InputVariant, InputSize } from './Input';

export { Textarea } from './Textarea';
export type { TextareaProps, TextareaVariant, TextareaResize } from './Textarea';

export { Select } from './Select';
export type { SelectProps, SelectOption } from './Select';

// ── Layout / containers ───────────────────────────────────
export { Card, CardHeader, CardBody, CardFooter } from './Card';
export type { CardProps, CardHeaderProps, CardBodyProps, CardFooterProps, CardVariant } from './Card';

// ── Feedback ──────────────────────────────────────────────
export { Badge } from './Badge';
export type { BadgeProps, BadgeVariant, BadgeSize } from './Badge';

export { Spinner, PageLoader } from './Spinner';
export type { SpinnerProps, SpinnerSize, SpinnerVariant } from './Spinner';

export { Modal, ModalHeader, ModalBody, ModalFooter } from './Modal';
export type { ModalProps, ModalHeaderProps, ModalBodyProps, ModalFooterProps, ModalSize } from './Modal';

export { EmptyState } from './EmptyState';
export type { EmptyStateProps, EmptyStateAction } from './EmptyState';

// ── Data display ──────────────────────────────────────────
export { StatCard } from './StatCard';
export type { StatCardProps, StatCardTrend, TrendDirection, StatCardAccent } from './StatCard';

export { ProgressBar, SegmentedProgress } from './ProgressBar';
export type { ProgressBarProps, SegmentedProgressProps, ProgressBarVariant, ProgressBarSize } from './ProgressBar';

export { ScoreRing } from './ScoreRing';
export type { ScoreRingProps, ScoreRingSize } from './ScoreRing';

export { Table } from './Table';
export type { TableProps, ColumnDef, SortDirection } from './Table';

// ── Navigation / tabs ─────────────────────────────────────
export { Tabs, TabPanel } from './Tabs';
export type { TabsProps, TabPanelProps, TabItem, TabsVariant, TabsSize } from './Tabs';

// ── Upload ────────────────────────────────────────────────
export { FileUpload } from './FileUpload';
export type { FileUploadProps } from './FileUpload';
