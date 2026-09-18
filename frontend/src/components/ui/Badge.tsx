import React from 'react';
import { clsx } from 'clsx';

export type BadgeVariant =
  | 'cyan'
  | 'blue'
  | 'emerald'
  | 'amber'
  | 'rose'
  | 'purple'
  | 'slate'
  | 'outline';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  pulse?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'cyan',
  size = 'sm',
  pulse = false,
  children,
  ...props
}) => {
  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 font-medium tracking-wide',
    md: 'text-xs px-2.5 py-1 font-semibold tracking-wide',
  };

  const variantStyles: Record<BadgeVariant, string> = {
    cyan: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30',
    blue: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30',
    emerald: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30',
    amber: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30',
    rose: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30',
    purple: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30',
    slate: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
    outline: 'bg-transparent text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full backdrop-blur-md uppercase select-none transition-all',
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {pulse && (
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />
      )}
      <span>{children}</span>
    </span>
  );
};
