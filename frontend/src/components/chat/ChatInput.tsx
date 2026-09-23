import React, { useState, useRef, useEffect } from 'react';
import { Send, Square, Paperclip, X, FileText, AlertCircle, Loader2 } from 'lucide-react';
import { TemporaryChatFile } from '../../api/types';

interface ChatInputProps {
  onSendMessage: (text: string, tempFiles?: TemporaryChatFile[]) => void;
  onStopGeneration?: () => void;
  isStreaming: boolean;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onStopGeneration,
  isStreaming,
  disabled = false,
}) => {
  const [text, setText] = useState('');
  const [tempFiles, setTempFiles] = useState<TemporaryChatFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [text]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if ((!text.trim() && tempFiles.length === 0) || isStreaming || disabled) return;
    onSendMessage(text.trim(), tempFiles.length > 0 ? tempFiles : undefined);
    setText('');
    setTempFiles([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const ext = file.name.split('.').pop()?.toLowerCase();

    if (ext !== 'pdf' && ext !== 'csv') {
      alert('Only PDF and CSV files are supported for session analysis.');
      return;
    }

    setIsUploading(true);
    const tempFileItem: TemporaryChatFile = {
      id: `temp_${Date.now()}`,
      name: file.name,
      size: file.size,
      type: ext as 'pdf' | 'csv',
      status: 'uploading',
      progress: 20,
    };

    setTempFiles([tempFileItem]);

    // Simulate progress and processing
    setTimeout(() => {
      setTempFiles([{ ...tempFileItem, status: 'processing', progress: 70 }]);
      setTimeout(() => {
        setTempFiles([{ ...tempFileItem, status: 'ready', progress: 100 }]);
        setIsUploading(false);
      }, 500);
    }, 400);

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeTempFile = (id: string) => {
    setTempFiles((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <div className="p-4 bg-white/85 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800/80 backdrop-blur-xl">
      <div className="max-w-4xl mx-auto space-y-2.5">
        {/* Active Temporary File Chip */}
        {tempFiles.length > 0 && (
          <div className="flex items-center gap-2">
            {tempFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-cyan-300 dark:border-cyan-500/30 text-xs text-slate-800 dark:text-slate-200 shadow-xs animate-in fade-in"
              >
                <FileText className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 dark:text-white truncate max-w-xs">{file.name}</p>
                  <p className="text-[10px] text-cyan-700 dark:text-cyan-400">
                    {file.status === 'uploading' && `Uploading (${file.progress}%)...`}
                    {file.status === 'processing' && 'Processing for session...'}
                    {file.status === 'ready' && 'Ready for contextual analysis'}
                  </p>
                </div>
                {file.status === 'processing' || file.status === 'uploading' ? (
                  <Loader2 className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 animate-spin" />
                ) : (
                  <button
                    onClick={() => removeTempFile(file.id)}
                    className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-0.5 rounded transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
            <span className="text-[10px] text-slate-500 dark:text-slate-400 italic hidden sm:inline">
              (Temporary input — not stored in permanent knowledge base)
            </span>
          </div>
        )}

        {/* Input Container */}
        <div className="relative flex items-end gap-2 p-2 rounded-2xl bg-slate-100/90 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 focus-within:border-cyan-500/80 focus-within:ring-2 focus-within:ring-cyan-500/20 transition-all shadow-xs dark:shadow-xl">
          {/* File Upload Button */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".pdf,.csv"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || isStreaming}
            title="Upload temporary PDF/CSV for localized analysis"
            className="p-2.5 text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/80 rounded-xl transition-colors disabled:opacity-40 cursor-pointer flex-shrink-0"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          {/* Text Area */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about policies, security standards, or organizational documents..."
            disabled={isStreaming || disabled}
            className="flex-1 max-h-44 bg-transparent border-0 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs sm:text-sm py-2 px-1 focus:outline-none resize-none leading-relaxed"
          />

          {/* Stop / Send Button */}
          {isStreaming ? (
            <button
              type="button"
              onClick={onStopGeneration}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-md shadow-rose-600/20 border border-rose-400/30 transition-all cursor-pointer flex-shrink-0"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={(!text.trim() && tempFiles.length === 0) || disabled}
              className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-md shadow-cyan-500/20 border border-cyan-400/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Security Subtext */}
        <div className="flex items-center justify-between px-1 text-[11px] text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <AlertCircle className="w-3 h-3 text-cyan-600 dark:text-cyan-500" />
            AI responses grounded strictly in authorized organizational documents.
          </span>
          <span className="hidden md:inline">Shift + Enter for new line</span>
        </div>
      </div>
    </div>
  );
};
