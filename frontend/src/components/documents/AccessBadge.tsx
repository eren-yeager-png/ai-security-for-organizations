import React from 'react';
import { DocumentVisibility, ProcessingStatus } from '../../api/types';
import { Badge } from '../ui/Badge';
import { Lock, Globe, Shield, ShieldAlert, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

export const VisibilityBadge: React.FC<{ visibility: DocumentVisibility }> = ({ visibility }) => {
  switch (visibility) {
    case 'PUBLIC':
      return (
        <Badge variant="cyan" size="sm" className="gap-1">
          <Globe className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
          <span>Public</span>
        </Badge>
      );
    case 'INTERNAL':
      return (
        <Badge variant="blue" size="sm" className="gap-1">
          <Shield className="w-3 h-3 text-blue-600 dark:text-blue-400" />
          <span>Internal</span>
        </Badge>
      );
    case 'RESTRICTED':
      return (
        <Badge variant="amber" size="sm" className="gap-1">
          <Lock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
          <span>Restricted</span>
        </Badge>
      );
    case 'ADMIN_ONLY':
      return (
        <Badge variant="rose" size="sm" className="gap-1">
          <ShieldAlert className="w-3 h-3 text-rose-600 dark:text-rose-400" />
          <span>Admin Only</span>
        </Badge>
      );
  }
};

export const StatusBadge: React.FC<{ status: ProcessingStatus }> = ({ status }) => {
  switch (status) {
    case 'Ready':
      return (
        <Badge variant="emerald" size="sm" className="gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          <span>Ready</span>
        </Badge>
      );
    case 'Processing':
      return (
        <Badge variant="cyan" size="sm" pulse className="gap-1">
          <Loader2 className="w-3 h-3 text-cyan-600 dark:text-cyan-400 animate-spin" />
          <span>Processing</span>
        </Badge>
      );
    case 'Failed':
      return (
        <Badge variant="rose" size="sm" className="gap-1">
          <AlertCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
          <span>Failed</span>
        </Badge>
      );
    case 'Restricted':
      return (
        <Badge variant="slate" size="sm" className="gap-1">
          <Lock className="w-3 h-3 text-slate-500 dark:text-slate-400" />
          <span>Locked</span>
        </Badge>
      );
  }
};
