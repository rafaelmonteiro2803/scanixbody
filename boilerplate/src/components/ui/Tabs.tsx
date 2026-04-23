'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface TabItem<T extends string = string> {
  value: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  disabled?: boolean;
}

export type TabsVariant = 'underline' | 'pill' | 'boxed';
export type TabsSize = 'sm' | 'md' | 'lg';

export interface TabsProps<T extends string = string> {
  tabs: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  variant?: TabsVariant;
  size?: TabsSize;
  fullWidth?: boolean;
  className?: string;
}

export interface TabPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  activeValue: string;
  keepMounted?: boolean;
}

const sizeStyles: Record<TabsSize, { tab: string; icon: string }> = {
  sm: { tab: 'text-xs px-3 py-1.5 gap-1.5',   icon: 'w-3.5 h-3.5' },
  md: { tab: 'text-sm px-4 py-2 gap-2',        icon: 'w-4 h-4'     },
  lg: { tab: 'text-base px-5 py-2.5 gap-2.5',  icon: 'w-5 h-5'     },
};

function UnderlineTabs<T extends string>({ tabs, value, onChange, size = 'md', fullWidth, className }: TabsProps<T>) {
  const s = sizeStyles[size];
  return (
    <div role="tablist" className={cn('flex items-stretch border-b border-border overflow-x-auto', className)}>
      {tabs.map((tab) => {
        const isActive = tab.value === value;
        return (
          <button
            key={tab.value}
            role="tab"
            type="button"
            aria-selected={isActive}
            disabled={tab.disabled}
            onClick={() => !tab.disabled && onChange(tab.value)}
            className={cn(
              'relative inline-flex items-center justify-center font-medium whitespace-nowrap transition-all duration-150 flex-shrink-0',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              'disabled:opacity-40 disabled:cursor-not-allowed',
              s.tab,
              fullWidth && 'flex-1',
              isActive ? 'text-primary' : 'text-text-secondary hover:text-text-primary',
            )}
          >
            {tab.icon && <span className={cn(s.icon, 'flex-shrink-0')} aria-hidden>{tab.icon}</span>}
            {tab.label}
            {tab.badge && <span aria-label="badge">{tab.badge}</span>}
            {isActive && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" aria-hidden />}
          </button>
        );
      })}
    </div>
  );
}

function PillTabs<T extends string>({ tabs, value, onChange, size = 'md', fullWidth, className }: TabsProps<T>) {
  const s = sizeStyles[size];
  return (
    <div role="tablist" className={cn('flex items-center gap-1 p-1 rounded-xl bg-background-elevated border border-border overflow-x-auto', className)}>
      {tabs.map((tab) => {
        const isActive = tab.value === value;
        return (
          <button
            key={tab.value}
            role="tab"
            type="button"
            aria-selected={isActive}
            disabled={tab.disabled}
            onClick={() => !tab.disabled && onChange(tab.value)}
            className={cn(
              'inline-flex items-center justify-center font-medium rounded-lg whitespace-nowrap transition-all duration-150 flex-shrink-0',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              'disabled:opacity-40 disabled:cursor-not-allowed',
              s.tab,
              fullWidth && 'flex-1',
              isActive ? 'bg-primary text-white shadow-sm font-semibold' : 'text-text-secondary hover:text-text-primary hover:bg-surface-2',
            )}
          >
            {tab.icon && <span className={cn(s.icon, 'flex-shrink-0')} aria-hidden>{tab.icon}</span>}
            {tab.label}
            {tab.badge && <span aria-label="badge">{tab.badge}</span>}
          </button>
        );
      })}
    </div>
  );
}

function BoxedTabs<T extends string>({ tabs, value, onChange, size = 'md', fullWidth, className }: TabsProps<T>) {
  const s = sizeStyles[size];
  return (
    <div role="tablist" className={cn('flex items-center border border-border rounded-xl overflow-hidden divide-x divide-border', className)}>
      {tabs.map((tab) => {
        const isActive = tab.value === value;
        return (
          <button
            key={tab.value}
            role="tab"
            type="button"
            aria-selected={isActive}
            disabled={tab.disabled}
            onClick={() => !tab.disabled && onChange(tab.value)}
            className={cn(
              'inline-flex items-center justify-center font-medium whitespace-nowrap transition-all duration-150 flex-shrink-0',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset',
              'disabled:opacity-40 disabled:cursor-not-allowed',
              s.tab,
              fullWidth && 'flex-1',
              isActive ? 'bg-primary/10 text-primary border-b-2 border-b-primary' : 'bg-background-card text-text-secondary hover:text-text-primary hover:bg-surface-2',
            )}
          >
            {tab.icon && <span className={cn(s.icon, 'flex-shrink-0')} aria-hidden>{tab.icon}</span>}
            {tab.label}
            {tab.badge && <span aria-label="badge">{tab.badge}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function Tabs<T extends string = string>(props: TabsProps<T>) {
  switch (props.variant) {
    case 'pill':    return <PillTabs {...props} />;
    case 'boxed':   return <BoxedTabs {...props} />;
    default:        return <UnderlineTabs {...props} />;
  }
}

export function TabPanel({ value, activeValue, keepMounted = false, children, className, ...props }: TabPanelProps) {
  const isActive = value === activeValue;
  if (!isActive && !keepMounted) return null;
  return (
    <div role="tabpanel" hidden={!isActive} className={cn(className)} {...props}>
      {children}
    </div>
  );
}

export default Tabs;
