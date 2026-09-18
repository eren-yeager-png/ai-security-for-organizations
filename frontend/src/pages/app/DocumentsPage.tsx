import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DocumentItem, DocumentVisibility } from '../../api/types';
import {
  getDocuments,
  uploadDocument,
  ingestUrl,
  deleteDocument,
  retryProcessing,
} from '../../api/documents';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { canAccessDocument, hasPermission } from '../../security/rbac';
import { VisibilityBadge, StatusBadge } from '../../components/documents/AccessBadge';
import { DocumentUploadModal } from '../../components/documents/DocumentUploadModal';
import { UrlIngestionModal } from '../../components/documents/UrlIngestionModal';
import { DocumentDetailModal } from '../../components/documents/DocumentDetailModal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Button } from '../../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import {
  Search,
  Upload,
  Globe,
  FileText,
  Trash2,
  Eye,
  RotateCcw,
  Lock,
  Layers,
} from 'lucide-react';
import { getSafeSourceLabel } from '../../security/urlMasker';

export const DocumentsPage: React.FC = () => {
  const { user } = useAuth();
  const { success, error: notifyError } = useNotification();
  const [searchParams] = useSearchParams();

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
  const [selectedDocForDetail, setSelectedDocForDetail] = useState<DocumentItem | null>(null);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);

  const canUpload = hasPermission(user, 'DOCUMENTS_UPLOAD');
  const canDelete = hasPermission(user, 'DOCUMENTS_DELETE');

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const data = await getDocuments();
      setDocuments(data);

      // Check if docId query param is present
      const docIdParam = searchParams.get('docId');
      if (docIdParam) {
        const found = data.find((d) => d.id === docIdParam);
        if (found) setSelectedDocForDetail(found);
      }
    } catch {
      notifyError('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  // Filter documents according to user clearance and selected filters
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      // Security Guard: Check if user is cleared for this document
      const isCleared = canAccessDocument(user, doc);
      if (!isCleared) return false;

      // Visibility Filter
      if (visibilityFilter !== 'ALL' && doc.visibility !== visibilityFilter) {
        return false;
      }

      // Status Filter
      if (statusFilter !== 'ALL' && doc.status !== statusFilter) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const safeTitle = getSafeSourceLabel(doc).toLowerCase();
        const matchTitle = safeTitle.includes(q);
        const matchDept = doc.department.toLowerCase().includes(q);
        const matchTags = doc.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchTitle && !matchDept && !matchTags) return false;
      }

      return true;
    });
  }, [documents, user, visibilityFilter, statusFilter, searchQuery]);

  const handleUploadDocument = async (
    file: File,
    vis: DocumentVisibility,
    department: string,
    folder?: string
  ) => {
    try {
      const newDoc = await uploadDocument({ file, visibility: vis, department, folder });
      setDocuments((prev) => [newDoc, ...prev]);
      success('Document Ingested', `${file.name} is now available in knowledge base.`);
    } catch {
      notifyError('Failed to upload document');
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
      success('URL Source Ingested', `${title || url} is indexed.`);
    } catch {
      notifyError('Failed to ingest URL source');
    }
  };

  const handleDelete = async () => {
    if (!deletingDocId) return;
    try {
      await deleteDocument(deletingDocId);
      setDocuments((prev) => prev.filter((d) => d.id !== deletingDocId));
      setDeletingDocId(null);
      success('Document Removed', 'The item was deleted from storage.');
    } catch {
      notifyError('Failed to delete document');
    }
  };

  const handleRetryProcessing = async (id: string) => {
    try {
      const updated = await retryProcessing(id);
      setDocuments((prev) => prev.map((d) => (d.id === id ? updated : d)));
      if (selectedDocForDetail?.id === id) {
        setSelectedDocForDetail(updated);
      }
      success('Processing Succeeded', 'Document text parsed and vectorized.');
    } catch {
      notifyError('Retry failed');
    }
  };

  const tabs = [
    { id: 'ALL', label: 'All Accessible' },
    { id: 'PUBLIC', label: 'Public' },
    { id: 'INTERNAL', label: 'Internal' },
    ...(user?.role === 'Manager' || user?.role === 'Admin'
      ? [{ id: 'RESTRICTED', label: 'Restricted' }]
      : []),
    ...(user?.role === 'Admin' ? [{ id: 'ADMIN_ONLY', label: 'Admin Only' }] : []),
  ];

  return (
    <div className="h-full flex flex-col p-6 overflow-hidden max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Enterprise Knowledge Base
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/25 font-semibold">
              {filteredDocuments.length} Sources
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Access-governed organizational policies, technical runbooks, and ingested knowledge assets.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          {canUpload ? (
            <>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Globe className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />}
                onClick={() => setIsUrlModalOpen(true)}
              >
                Ingest URL
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Upload className="w-3.5 h-3.5" />}
                onClick={() => setIsUploadModalOpen(true)}
              >
                Upload Document
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-500 bg-slate-100 dark:bg-slate-900/60 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
              <Lock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>Read-Only Clearance</span>
            </div>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 py-4">
        {/* Classification Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = visibilityFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setVisibilityFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer select-none ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800/60'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search & Status Filter */}
        <div className="flex items-center gap-2.5">
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by name, department, tag..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs py-1.5 px-3 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="ALL" className="bg-white dark:bg-slate-900">All Statuses</option>
            <option value="Ready" className="bg-white dark:bg-slate-900">Ready</option>
            <option value="Processing" className="bg-white dark:bg-slate-900">Processing</option>
            <option value="Failed" className="bg-white dark:bg-slate-900">Failed</option>
          </select>
        </div>
      </div>

      {/* Documents Table */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center text-slate-400 text-xs">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
              <span>Querying verified knowledge catalog...</span>
            </div>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-900/30">
            <Layers className="w-10 h-10 text-slate-400 dark:text-slate-600 mb-3" />
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-300">No documents found</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              No knowledge assets match your active filters or your account's classification tier.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document Title</TableHead>
                <TableHead>Classification</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Ingested</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.map((doc) => {
                const safeTitle = getSafeSourceLabel(doc);
                const sizeMb = (doc.sizeBytes / (1024 * 1024)).toFixed(2);

                return (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5 max-w-md">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-cyan-600 dark:text-cyan-400 flex-shrink-0">
                          {doc.fileType === 'url' ? (
                            <Globe className="w-4 h-4" />
                          ) : (
                            <FileText className="w-4 h-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 dark:text-slate-100 truncate hover:text-cyan-600 dark:hover:text-cyan-300 transition-colors cursor-pointer" onClick={() => setSelectedDocForDetail(doc)}>
                            {safeTitle}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate">
                            {doc.folder ? `${doc.folder} • ` : ''}
                            {doc.fileName}
                          </p>
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
                      <span className="text-xs text-slate-700 dark:text-slate-300">{doc.department}</span>
                    </TableCell>

                    <TableCell>
                      <span className="text-xs text-slate-600 dark:text-slate-400 font-mono">{sizeMb} MB</span>
                    </TableCell>

                    <TableCell>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {new Date(doc.uploadedAt).toLocaleDateString()}
                      </span>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedDocForDetail(doc)}
                          title="View Details"
                          className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {doc.status === 'Failed' && (
                          <button
                            onClick={() => handleRetryProcessing(doc.id)}
                            title="Retry Ingestion"
                            className="p-1.5 rounded-lg text-amber-600 dark:text-amber-400 hover:text-amber-500 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}

                        {canDelete && (
                          <button
                            onClick={() => setDeletingDocId(doc.id)}
                            title="Delete Document"
                            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
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
        onRetryProcessing={handleRetryProcessing}
      />

      <ConfirmDialog
        isOpen={!!deletingDocId}
        onClose={() => setDeletingDocId(null)}
        onConfirm={handleDelete}
        title="Delete Knowledge Document?"
        message="This document and its vector embeddings will be permanently purged from the enterprise knowledge store."
        confirmLabel="Delete Permanently"
        isDestructive={true}
      />
    </div>
  );
};
