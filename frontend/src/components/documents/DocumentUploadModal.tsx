import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { DocumentVisibility } from '../../api/types';
import { useAuth } from '../../context/AuthContext';
import { getAccessibleVisibilities } from '../../security/rbac';
import { Upload, FileText, CheckCircle2 } from 'lucide-react';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File, visibility: DocumentVisibility, department: string, folder?: string) => Promise<void>;
}

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  onUpload,
}) => {
  const { user } = useAuth();
  const allowedVisibilities = getAccessibleVisibilities(user);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [visibility, setVisibility] = useState<DocumentVisibility>('INTERNAL');
  const [department, setDepartment] = useState(user?.department || 'General');
  const [folder, setFolder] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext !== 'pdf' && ext !== 'csv') {
        alert('Supported formats are PDF and CSV only.');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext !== 'pdf' && ext !== 'csv') {
        alert('Supported formats are PDF and CSV only.');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsLoading(true);
    try {
      await onUpload(selectedFile, visibility, department, folder || undefined);
      onClose();
      setSelectedFile(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Upload Knowledge Document"
      description="Ingest PDFs or CSV datasets into organizational semantic storage."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Dropzone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
            dragOver
              ? 'border-cyan-400 bg-cyan-500/10'
              : selectedFile
              ? 'border-emerald-500/50 bg-emerald-50 dark:bg-emerald-950/20'
              : 'border-slate-300 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-950/60 hover:border-slate-400 dark:hover:border-slate-600'
          }`}
          onClick={() => document.getElementById('file-upload-input')?.click()}
        >
          <input
            id="file-upload-input"
            type="file"
            accept=".pdf,.csv"
            onChange={handleFileChange}
            className="hidden"
          />

          {selectedFile ? (
            <div className="flex items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-xs">{selectedFile.name}</p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Ready for ingestion
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mx-auto">
                <Upload className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Click or drag & drop document here
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Supported formats: PDF, CSV (Up to 50 MB)</p>
            </div>
          )}
        </div>

        {/* Visibility Level Picker */}
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
                {vis === 'PUBLIC' && 'PUBLIC — All organization members'}
                {vis === 'INTERNAL' && 'INTERNAL — Employees, Managers & Admins'}
                {vis === 'RESTRICTED' && 'RESTRICTED — Managers & Admins only'}
                {vis === 'ADMIN_ONLY' && 'ADMIN-ONLY — Security Administrators only'}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="e.g. Engineering, Legal"
            required
          />

          <Input
            label="Folder (Optional)"
            value={folder}
            onChange={(e) => setFolder(e.target.value)}
            placeholder="e.g. Security Policies"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={!selectedFile || isLoading}
            isLoading={isLoading}
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
          >
            Start Ingestion
          </Button>
        </div>
      </form>
    </Modal>
  );
};
