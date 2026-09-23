import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatMessage } from '../../api/types';
import {
  Copy,
  Check,
  RotateCcw,
  FileText,
  ShieldCheck,
  Bot,
  User,
  Paperclip,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { getSafeSourceLabel } from '../../security/urlMasker';

interface MessageBubbleProps {
  message: ChatMessage;
  isLatestAssistant?: boolean;
  onRegenerate?: () => void;
  onViewSource?: (documentId: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isLatestAssistant = false,
  onRegenerate,
  onViewSource,
}) => {
  const isUser = message.role === 'user';
  const [hasCopied, setHasCopied] = useState(false);
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<number | null>(null);

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  const copyCodeSnippet = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedCodeIndex(index);
    setTimeout(() => setCopiedCodeIndex(null), 2000);
  };

  let codeBlockCounter = 0;

  return (
    <div
      className={`py-5 px-6 border-b transition-colors ${
        isUser
          ? 'bg-transparent border-slate-200/60 dark:border-slate-800/40'
          : 'bg-slate-100/70 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800/40'
      }`}
    >
      <div className="max-w-4xl mx-auto flex gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0 pt-0.5">
          {isUser ? (
            <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 shadow-xs">
              <User className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 dark:from-cyan-500 dark:to-blue-600 border border-cyan-400/40 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
              <Bot className="w-4 h-4" />
            </div>
          )}
        </div>

        {/* Message Content Area */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-tight text-slate-900 dark:text-slate-200">
                {isUser ? 'You' : 'Secure AI Assistant'}
              </span>
              {!isUser && (
                <Badge variant="cyan" size="sm">
                  Enterprise Verified
                </Badge>
              )}
            </div>
            <span className="text-[10px] text-slate-500">
              {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* Attached Temporary Files Chip */}
          {message.tempFiles && message.tempFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {message.tempFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-500/30 text-cyan-800 dark:text-cyan-300 text-xs shadow-xs"
                >
                  <Paperclip className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                  <span className="font-semibold truncate max-w-xs">{file.name}</span>
                  <span className="text-[10px] text-cyan-700 dark:text-cyan-400/70 uppercase">({file.type})</span>
                </div>
              ))}
            </div>
          )}

          {/* Markdown Parsed Content */}
          <div className="text-slate-800 dark:text-slate-100 text-xs sm:text-sm leading-relaxed max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => <p className="my-2 leading-relaxed text-slate-800 dark:text-slate-200">{children}</p>,
                h1: ({ children }) => <h1 className="text-lg font-bold text-slate-900 dark:text-white mt-4 mb-2">{children}</h1>,
                h2: ({ children }) => <h2 className="text-base font-bold text-slate-900 dark:text-white mt-3 mb-1.5">{children}</h2>,
                h3: ({ children }) => <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-3 mb-1">{children}</h3>,
                ul: ({ children }) => <ul className="list-disc list-inside space-y-1 my-2 text-slate-800 dark:text-slate-200">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 my-2 text-slate-800 dark:text-slate-200">{children}</ol>,
                li: ({ children }) => <li className="text-xs sm:text-sm">{children}</li>,
                strong: ({ children }) => <strong className="font-bold text-slate-900 dark:text-white">{children}</strong>,
                pre: ({ children }) => {
                  const blockIndex = codeBlockCounter++;
                  const codeText = String(
                    (children as React.ReactElement<{ children: string }>)?.props?.children || ''
                  );
                  return (
                    <div className="relative group my-3 rounded-xl overflow-hidden border border-slate-700/80 bg-slate-950/90 shadow-md">
                      <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-900/90 border-b border-slate-800 text-[11px] font-mono text-slate-400">
                        <span>Code Output</span>
                        <button
                          onClick={() => copyCodeSnippet(codeText, blockIndex)}
                          className="flex items-center gap-1.5 text-cyan-700 dark:text-slate-400 hover:text-cyan-800 dark:hover:text-cyan-300 transition-colors cursor-pointer"
                        >
                          {copiedCodeIndex === blockIndex ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400 text-[10px]">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span className="text-[10px]">Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="p-3.5 overflow-x-auto text-xs font-mono text-slate-200">
                        {children}
                      </pre>
                    </div>
                  );
                },
                code: ({ className, children, ...props }) => {
                  const match = /language-(\w+)/.exec(className || '');
                  return match ? (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  ) : (
                    <code className="px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800/80 text-cyan-800 dark:text-cyan-300 font-mono text-xs" {...props}>
                      {children}
                    </code>
                  );
                },
                table: ({ children }) => (
                  <div className="overflow-x-auto my-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
                    <table className="w-full text-left text-xs border-collapse divide-y divide-slate-200 dark:divide-slate-800">
                      {children}
                    </table>
                  </div>
                ),
                th: ({ children }) => (
                  <th className="px-3 py-2 bg-slate-100 dark:bg-slate-900 font-semibold text-slate-700 dark:text-slate-300 text-[11px] uppercase">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="px-3 py-2 text-slate-800 dark:text-slate-300 text-xs border-t border-slate-200 dark:border-slate-800/50">
                    {children}
                  </td>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-2 border-cyan-500 pl-3.5 py-1 text-slate-700 dark:text-slate-400 text-xs italic bg-cyan-50/60 dark:bg-slate-900/40 rounded-r-lg my-2">
                    {children}
                  </blockquote>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>

          {/* Streaming Indicator */}
          {message.isStreaming && (
            <div className="flex items-center gap-2 pt-1 text-cyan-600 dark:text-cyan-400 text-xs">
              <span className="w-2 h-2 rounded-full bg-cyan-500 animate-ping" />
              <span className="font-medium animate-pulse">Synthesizing verified response...</span>
            </div>
          )}

          {/* Distinct Enterprise Sources & Citations Section */}
          {message.sources && message.sources.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800/80">
              <div className="flex items-center gap-2 mb-2.5">
                <ShieldCheck className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Verified Knowledge Sources ({message.sources.length})
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {message.sources.map((src, idx) => {
                  const safeTitle = getSafeSourceLabel(src);
                  return (
                    <div
                      key={src.id}
                      onClick={() => onViewSource && onViewSource(src.documentId)}
                      className="p-3 rounded-xl bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 hover:border-cyan-400 dark:hover:border-cyan-500/40 hover:shadow-sm dark:hover:bg-slate-900/60 transition-all cursor-pointer group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-5 h-5 rounded-md bg-cyan-100 dark:bg-cyan-500/15 border border-cyan-200 dark:border-cyan-500/30 text-cyan-800 dark:text-cyan-300 font-mono text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors truncate">
                            {safeTitle}
                          </span>
                        </div>
                        <Badge variant="cyan" size="sm">
                          {Math.round(src.similarityScore * 100)}% match
                        </Badge>
                      </div>

                      {src.snippet && (
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed italic">
                          "{src.snippet}"
                        </p>
                      )}

                      {src.pageNumber && (
                        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                          <FileText className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                          <span>Referenced from Page {src.pageNumber}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Bar (Copy, Regenerate) */}
          {!isUser && !message.isStreaming && (
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => copyToClipboard(message.content)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors select-none cursor-pointer"
              >
                {hasCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Response</span>
                  </>
                )}
              </button>

              {isLatestAssistant && onRegenerate && (
                <button
                  onClick={onRegenerate}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-cyan-700 dark:hover:text-cyan-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors select-none cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Regenerate</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
