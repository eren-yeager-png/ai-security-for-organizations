import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { DocumentVisibility } from '../../api/types';
import { useAuth } from '../../context/AuthContext';
import { getAccessibleVisibilities } from '../../security/rbac';
import { containsCredentials, sanitizeUrl, getSafeSourceLabel } from '../../security/urlMasker';
import { Globe, AlertTriangle, ShieldCheck } from 'lucide-react';

interface UrlIngestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIngest: (url: string, title: string, visibility: DocumentVisibility, department: string) => Promise<void>;
}

export const UrlIngestionModal: React.FC<UrlIngestionModalProps> = ({
  isOpen,
  onClose,
  onIngest,
}) => {
  const { user } = useAuth();
  const allowedVisibilities = getAccessibleVisibilities(user);

  const [rawUrl, setRawUrl] = useState('');
  const [title, setTitle] = useState('');
  const [visibility, setVisibility] = useState<DocumentVisibility>('INTERNAL');
  const [department, setDepartment] = useState(user?.department || 'Operations');
  const [isLoading, setIsLoading] = useState(false);

  const hasCredentials = containsCredentials(rawUrl);
  const sanitized = sanitizeUrl(rawUrl);
  const safeLabel = getSafeSourceLabel({ title, rawUrl: sanitized, fileType: 'url' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawUrl.trim()) return;

    setIsLoading(true);
    try {
      // Ingest using sanitized URL to ensure credentials are never committed
      await onIngest(sanitized, title.trim() || safeLabel, visibility, department);
      onClose();
      setRawUrl('');
      setTitle('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Ingest Enterprise URL Source"
      description="Connect intranet websites, documentation portals, or online wikis."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Resource URL"
          type="text"
          value={rawUrl}
          onChange={(e) => setRawUrl(e.target.value)}
          placeholder="https://wiki.corp.internal/docs/architecture"
          leftIcon={<Globe className="w-4 h-4" />}
          required
        />

        {/* URL Security Credential Warning */}
        {hasCredentials && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs space-y-1.5 animate-in fade-in">
            <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <span>URL Credentials Detected & Neutralized</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              The entered URL contains embedded authentication credentials or tokens. The system has automatically stripped sensitive credentials from presentation safeguards:
            </p>
            <p className="font-mono text-[10px] bg-slate-100 dark:bg-slate-950/80 p-2 rounded-lg border border-amber-500/20 text-slate-800 dark:text-slate-300 break-all">
              Sanitized URL: {sanitized}
            </p>
          </div>
        )}

        <Input
          label="Display Title (Optional)"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Corporate Technical Wiki"
          helperText={`Safe Presentation Label: "${safeLabel}"`}
        />

        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 tracking-wide block mb-1.5">
            Security Visibility Classification
          </label>
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as DocumentVisibility)}
            className="w-full rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 text-xs py-2.5 px-3 focus:outline-none focus:border-cyan-500"
          >
            {allowedVisibilities.map((vis) => (
              <option key={vis} value={vis} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">
                {vis}
              </option>
            ))}
          </select>
        </div>

        <Input
          label="Department"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          placeholder="e.g. Operations, IT"
          required
        />

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={!rawUrl.trim() || isLoading}
            isLoading={isLoading}
            leftIcon={<ShieldCheck className="w-4 h-4" />}
          >
            Ingest URL Safely
          </Button>
        </div>
      </form>
    </Modal>
  );
};
