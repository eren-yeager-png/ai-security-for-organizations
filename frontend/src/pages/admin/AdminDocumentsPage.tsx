import React, { useState, useEffect, useMemo } from 'react';
import { DocumentItem, DocumentVisibility } from '../../api/types';
import {
  getDocuments,
  uploadDocument,
  ingestUrl,
  deleteDocument,
  retryProcessing,
} from '../../api/documents';
import { useNotification } from '../../context/NotificationContext';
import { VisibilityBadge, StatusBadge } from '../../components/documents/AccessBadge';
import { DocumentUploadModal } from '../../components/documents/DocumentUploadModal';
import { UrlIngestionModal } from '../../components/documents/UrlIngestionModal';
import { DocumentDetailModal } from '../../components/documents/DocumentDetailModal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Button } from '../../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import {
  Search,
  Upload,
  Globe,
  FileText,
  Trash2,
  Eye,
  RotateCcw,
} from 'lucide-react';
import { getSafeSourceLabel } from '../../security/urlMasker';

export const AdminDocumentsPage: React.FC = () => {
  const { success, error: notifyError } = useNotification();

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState<string>('ALL');

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
  const [selectedDocForDetail, setSelectedDocForDetail] = useState<DocumentItem | null>(null);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);

  const fetchDocs = async () => {
    setIsLoading(true);
    try {
      const data = await getDocuments();
      setDocuments(data);
    } catch {
      notifyError('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const filtered = useMemo(() => {
    return documents.filter((doc) => {
      if (visibilityFilter !== 'ALL' && doc.visibility !== visibilityFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const safeTitle = getSafeSourceLabel(doc).toLowerCase();
        if (!safeTitle.includes(q) && !doc.department.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [documents, visibilityFilter, searchQuery]);

  const handleUploadDocument = async (
    file: File,
    vis: DocumentVisibility,
    department: string,
    folder?: string
  ) => {
    try {
      const newDoc = await uploadDocument({ file, visibility: vis, department, folder });
      setDocuments((prev) => [newDoc, ...prev]);
      success('Document Uploaded', `${file.name} is now stored with ${vis} clearance.`);
    } catch {
      notifyError('Upload failed');
    }
  };

  const handleIngestUrl = async (
    url: string,
    title: string,
    vis: DocumentVisibility,
    dept: string
  ) => {
    try {
      const newDoc = await ingestUrl({ url, title, visibility: vis, department: dept });
      setDocuments((prev) => [newDoc, ...prev]);
      success('URL Source Ingested', `${title || url} stored with ${vis} clearance.`);
    } catch {
      notifyError('URL Ingestion failed');
    }
  };

  const handleDelete = async () => {
    if (!deletingDocId) return;
    try {
      await deleteDocument(deletingDocId);
      setDocuments((prev) => prev.filter((d) => d.id !== deletingDocId));
      setDeletingDocId(null);
      success('Purged', 'Document and vector embeddings removed permanently.');
    } catch {
      notifyError('Delete failed');
    }
  };

  const handleRetry = async (id: string) => {
    try {
      const updated = await retryProcessing(id);
      setDocuments((prev) => prev.map((d) => (d.id === id ? updated : d)));
      if (selectedDocForDetail?.id === id) setSelectedDocForDetail(updated);
      success('Re-extraction Succeeded', 'Document processed.');
    } catch {
      notifyError('Retry failed');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Full Knowledge Governance</h1>
            <Badge variant="purple" size="sm">
              All 4 Visibility Levels
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Administrative control over all Public, Internal, Restricted, and Admin-Only documentation assets.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Globe className="w-3.5 h-3.5 text-cyan-400" />}
            onClick={() => setIsUrlModalOpen(true)}
          >
            Ingest URL
          </Button>
          <Button
            variant="glow"
            size="sm"
            leftIcon={<Upload className="w-3.5 h-3.5 text-slate-950" />}
            onClick={() => setIsUploadModalOpen(true)}
          >
            Upload Document
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search all enterprise assets..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Classification:</span>
          <select
            value={visibilityFilter}
            onChange={(e) => setVisibilityFilter(e.target.value)}
            className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs py-1.5 px-3 focus:outline-none focus:border-purple-500"
          >
            <option value="ALL">All Classifications</option>
            <option value="PUBLIC">PUBLIC</option>
            <option value="INTERNAL">INTERNAL</option>
            <option value="RESTRICTED">RESTRICTED</option>
            <option value="ADMIN_ONLY">ADMIN_ONLY</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading document vault...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document Title</TableHead>
                <TableHead>Classification</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>File Size</TableHead>
                <TableHead className="text-right">Governance Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((doc) => {
                const safeTitle = getSafeSourceLabel(doc);
                const sizeMb = (doc.sizeBytes / (1024 * 1024)).toFixed(2);

                return (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5 max-w-md">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-cyan-700 dark:text-cyan-400 flex-shrink-0">
                          {doc.fileType === 'url' ? (
                            <Globe className="w-4 h-4" />
                          ) : (
                            <FileText className="w-4 h-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p
                            className="font-bold text-slate-900 dark:text-slate-100 truncate hover:text-cyan-600 dark:hover:text-cyan-300 transition-colors cursor-pointer"
                            onClick={() => setSelectedDocForDetail(doc)}
                          >
                            {safeTitle}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate">{doc.fileName}</p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <VisibilityBadge visibility={doc.visibility} />
                    </TableCell>

                    <TableCell>
                      <StatusBadge status={doc.status} />
                    </TableCell>

                    <TableCell>
                      <span className="text-xs text-slate-800 dark:text-slate-300">{doc.department}</span>
                    </TableCell>

                    <TableCell>
                      <span className="font-mono text-xs text-slate-400">{sizeMb} MB</span>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedDocForDetail(doc)}
                          title="View Details"
                          className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-cyan-700 dark:hover:text-cyan-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {doc.status === 'Failed' && (
                          <button
                            onClick={() => handleRetry(doc.id)}
                            title="Retry Pipeline"
                            className="p-1.5 rounded-lg text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => setDeletingDocId(doc.id)}
                          title="Purge Document"
                          className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Modals */}
      <DocumentUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={handleUploadDocument}
      />

      <UrlIngestionModal
        isOpen={isUrlModalOpen}
        onClose={() => setIsUrlModalOpen(false)}
        onIngest={handleIngestUrl}
      />

      <DocumentDetailModal
        document={selectedDocForDetail}
        isOpen={!!selectedDocForDetail}
        onClose={() => setSelectedDocForDetail(null)}
        onRetryProcessing={handleRetry}
      />

      <ConfirmDialog
        isOpen={!!deletingDocId}
        onClose={() => setDeletingDocId(null)}
        onConfirm={handleDelete}
        title="Permanently Purge Knowledge Asset?"
        message="This document, its vector chunk index, and any cached semantic representations will be permanently purged from the enterprise storage layer."
        confirmLabel="Purge Asset"
        isDestructive={true}
      />
    </div>
  );
};
