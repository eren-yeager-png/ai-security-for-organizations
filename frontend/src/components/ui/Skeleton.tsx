import React from 'react';
import { clsx } from 'clsx';

export const Skeleton: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => {
  return (
    <div
      className={clsx('animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800/60', className)}
      {...props}
    />
  );
};
