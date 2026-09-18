import React from 'react';
import { clsx } from 'clsx';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  glow?: boolean;
}

export const Card: React.FC<CardProps> = ({
  className,
  hover = false,
  glow = false,
  children,
  ...props
}) => {
  return (
    <div
      className={clsx(
        'rounded-2xl border bg-white/90 dark:bg-slate-900/60 backdrop-blur-xl border-slate-200/90 dark:border-slate-800/80 p-5 shadow-sm shadow-slate-200/60 dark:shadow-xl transition-all duration-200',
        hover && 'hover:border-slate-300 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-900/80 hover:shadow-md dark:hover:shadow-2xl',
        glow && 'border-cyan-500/40 shadow-[0_0_25px_rgba(6,182,212,0.15)]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
