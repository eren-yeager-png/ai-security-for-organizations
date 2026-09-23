import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { DocumentItem } from '../../api/types';
import { VisibilityBadge, StatusBadge } from './AccessBadge';
import { FileText, Globe, Calendar, User, Tag, HardDrive, RotateCcw } from 'lucide-react';
import { getSafeSourceLabel } from '../../security/urlMasker';

interface DocumentDetailModalProps {
  document: DocumentItem | null;
  isOpen: boolean;
  onClose: () => void;
  onRetryProcessing?: (id: string) => void;
}

export const DocumentDetailModal: React.FC<DocumentDetailModalProps> = ({
  document,
  isOpen,
  onClose,
  onRetryProcessing,
}) => {
  if (!document) return null;

  const safeTitle = getSafeSourceLabel(document);
  const sizeMb = (document.sizeBytes / (1024 * 1024)).toFixed(2);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2.5">
          {document.fileType === 'url' ? (
            <Globe className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
          ) : (
            <FileText className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
          )}
          <span className="truncate max-w-sm">{safeTitle}</span>
        </div>
      }
      maxWidth="lg"
    >
      <div className="space-y-4 text-xs">
        {/* Badges Bar */}
        <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
          <VisibilityBadge visibility={document.visibility} />
          <StatusBadge status={document.status} />
          <span className="text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-mono uppercase">
            {document.fileType}
          </span>
          {document.folder && (
            <span className="text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px]">
              📁 {document.folder}
            </span>
          )}
        </div>

        {/* Summary */}
        <div>
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Document Summary & Content Scope
          </h4>
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800/80">
            {document.summary || 'No executive summary available for this file.'}
          </p>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500 font-semibold uppercase flex items-center gap-1">
              <HardDrive className="w-3 h-3 text-cyan-600 dark:text-cyan-400" /> Storage Footprint
            </span>
            <p className="font-semibold text-slate-800 dark:text-slate-200">{sizeMb} MB</p>
            {document.pageCount && (
              <p className="text-[10px] text-slate-500 dark:text-slate-400">{document.pageCount} Pages Parsed</p>
            )}
            {document.rowCount && (
              <p className="text-[10px] text-slate-500 dark:text-slate-400">{document.rowCount} Data Rows</p>
            )}
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500 font-semibold uppercase flex items-center gap-1">
              <User className="w-3 h-3 text-cyan-600 dark:text-cyan-400" /> Ingested By
            </span>
            <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{document.uploadedBy}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">{document.department} Department</p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500 font-semibold uppercase flex items-center gap-1">
              <Calendar className="w-3 h-3 text-cyan-600 dark:text-cyan-400" /> Ingestion Date
            </span>
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              {new Date(document.uploadedAt).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              {new Date(document.uploadedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500 font-semibold uppercase flex items-center gap-1">
              <Tag className="w-3 h-3 text-cyan-600 dark:text-cyan-400" /> Semantic Tags
            </span>
            <div className="flex flex-wrap gap-1 mt-1">
              {document.tags.map((t) => (
                <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-cyan-700 dark:text-cyan-300 font-mono">
                  #{t}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
          {document.status === 'Failed' && onRetryProcessing ? (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RotateCcw className="w-3.5 h-3.5 text-cyan-400" />}
              onClick={() => onRetryProcessing(document.id)}
            >
              Retry Extraction
            </Button>
          ) : (
            <div />
          )}

          <Button variant="primary" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
};
