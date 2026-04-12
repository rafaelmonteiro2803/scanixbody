'use client';

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

// ── Types ────────────────────────────────────────────────────

export type ScoreRingSize = 'sm' | 'md' | 'lg' | 'xl';

export interface ScoreRingProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Score 0–100 */
  score: number;
  /** Max value (default: 100) */
  max?: number;
  size?: ScoreRingSize;
  /** Label under the score number */
  label?: string;
  /** Override automatic color */
  color?: string;
  /** Animate the ring fill on mount */
  animated?: boolean;
  /** Sub-label or unit string */
  sublabel?: string;
  /** Show a badge below the score with a category label */
  category?: string;
  /** Thickness of the ring stroke */
  strokeWidth?: number;
}

// ── Size map ───────────────────────────────────────────────

const sizeMap: Record<ScoreRingSize, { diameter: number; scoreText: string; labelText: string }> = {
  sm: { diameter: 80,  scoreText: 'text-2xl',  labelText: 'text-2xs' },
  md: { diameter: 120, scoreText: 'text-3xl',  labelText: 'text-xs'  },
  lg: { diameter: 160, scoreText: 'text-4xl',  labelText: 'text-sm'  },
  xl: { diameter: 200, scoreText: 'text-5xl',  labelText: 'text-base'},
};

// ── Helpers ─────────────────────────────────────────────────

function scoreColor(score: number): string {
  if (score >= 70) return '#00ff88'; // success green
  if (score >= 40) return '#ffaa00'; // warning yellow
  return '#ff4444';                  // danger red
}

// ── Component ──────────────────────────────────────────────

export function ScoreRing({
  score,
  max = 100,
  size = 'md',
  label,
  color,
  animated = true,
  sublabel,
  category,
  strokeWidth,
  className,
  ...props
}: ScoreRingProps) {
  const { diameter, scoreText, labelText } = sizeMap[size];
  const stroke = strokeWidth ?? Math.max(6, diameter * 0.07);
  const radius = (diameter - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  const clampedScore = Math.min(Math.max(0, score), max);
  const percentage = clampedScore / max;
  const trackDashOffset = 0;
  const fillDashOffset = circumference * (1 - percentage);

  const resolvedColor = color ?? scoreColor(clampedScore);

  // Animate: start from full offset → computed offset
  const [currentOffset, setCurrentOffset] = useState(
    animated ? circumference : fillDashOffset,
  );

  const hasMounted = useRef(false);
  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      if (animated) {
        requestAnimationFrame(() => {
          setCurrentOffset(fillDashOffset);
        });
      }
      return;
    }
    setCurrentOffset(fillDashOffset);
  }, [fillDashOffset, animated]);

  return (
    <div
      className={cn('inline-flex flex-col items-center gap-2', className)}
      role="img"
      aria-label={`${label ?? 'Score'}: ${Math.round(clampedScore)} de ${max}`}
      {...props}
    >
      {/* SVG Ring */}
      <div className="relative" style={{ width: diameter, height: diameter }}>
        <svg
          width={diameter}
          height={diameter}
          viewBox={`0 0 ${diameter} ${diameter}`}
          fill="none"
          className="-rotate-90"
          aria-hidden="true"
        >
          {/* Background track */}
          <circle
            cx={diameter / 2}
            cy={diameter / 2}
            r={radius}
            stroke="#2a2a2a"
            strokeWidth={stroke}
            fill="none"
          />

          {/* Colored fill arc */}
          <circle
            cx={diameter / 2}
            cy={diameter / 2}
            r={radius}
            stroke={resolvedColor}
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={currentOffset}
            strokeLinecap="round"
            style={{
              transition: animated ? 'stroke-dashoffset 1s cubic-bezier(0.16, 1, 0.3, 1)' : undefined,
              filter: `drop-shadow(0 0 6px ${resolvedColor}60)`,
            }}
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={cn(
              'stat-number font-bold leading-none text-text-primary',
              scoreText,
            )}
            style={{ color: resolvedColor }}
          >
            {Math.round(clampedScore)}
          </span>
          {sublabel && (
            <span className={cn('text-text-muted font-medium mt-0.5', labelText)}>
              {sublabel}
            </span>
          )}
        </div>
      </div>

      {/* Below-ring labels */}
      {(label || category) && (
        <div className="flex flex-col items-center gap-1">
          {label && (
            <span className={cn('font-semibold text-text-primary text-center', labelText)}>
              {label}
            </span>
          )}
          {category && (
            <span
              className={cn(
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-2xs font-bold',
                'border',
              )}
              style={{
                color: resolvedColor,
                borderColor: `${resolvedColor}40`,
                backgroundColor: `${resolvedColor}15`,
              }}
            >
              {category}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default ScoreRing;
