import React, { useState } from 'react';
import { Conversation } from '../../api/types';
import { Plus, Search, MessageSquare, MoreVertical, Edit2, Trash2, Check, X } from 'lucide-react';
import { Dropdown } from '../ui/Dropdown';
import { ConfirmDialog } from '../ui/ConfirmDialog';

interface ConversationSidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onDeleteConversation: (id: string) => void;
  isLoading?: boolean;
}

export const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onRenameConversation,
  onDeleteConversation,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const startRename = (conv: Conversation) => {
    setEditingId(conv.id);
    setEditingTitle(conv.title);
  };

  const submitRename = (id: string) => {
    if (editingTitle.trim()) {
      onRenameConversation(id, editingTitle.trim());
    }
    setEditingId(null);
  };

  const confirmDelete = () => {
    if (deletingId) {
      onDeleteConversation(deletingId);
      setDeletingId(null);
    }
  };

  return (
    <aside className="w-80 h-full flex flex-col border-r border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/50 backdrop-blur-xl flex-shrink-0">
      {/* Header Actions */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800/80 space-y-3">
        <button
          onClick={onNewConversation}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs shadow-md shadow-cyan-500/20 border border-cyan-400/30 transition-all cursor-pointer select-none"
        >
          <Plus className="w-4 h-4" />
          <span>New AI Conversation</span>
        </button>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filtered.length === 0 ? (
          <div className="text-center py-8 px-4 text-slate-400 dark:text-slate-500 text-xs">
            {searchQuery ? 'No matching conversations' : 'No conversations yet'}
          </div>
        ) : (
          filtered.map((conv) => {
            const isActive = activeConversationId === conv.id;
            const isEditing = editingId === conv.id;

            return (
              <div
                key={conv.id}
                className={`group relative flex items-center justify-between p-2.5 rounded-xl text-xs transition-all cursor-pointer select-none ${
                  isActive
                    ? 'bg-cyan-50 dark:bg-cyan-500/15 text-cyan-900 dark:text-cyan-200 border border-cyan-200 dark:border-cyan-500/30 shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900/80 hover:text-slate-900 dark:hover:text-white'
                }`}
                onClick={() => !isEditing && onSelectConversation(conv.id)}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-500'}`} />
                  {isEditing ? (
                    <div className="flex items-center gap-1 flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && submitRename(conv.id)}
                        className="w-full bg-white dark:bg-slate-800 px-2 py-0.5 rounded text-xs text-slate-900 dark:text-white border border-cyan-500 focus:outline-none"
                        autoFocus
                      />
                      <button onClick={() => submitRename(conv.id)} className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 p-0.5">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setEditingId(null)} className="text-slate-400 hover:text-slate-700 p-0.5">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{conv.title}</p>
                      {conv.lastMessagePreview && (
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{conv.lastMessagePreview}</p>
                      )}
                    </div>
                  )}
                </div>

                {!isEditing && (
                  <div
                    className={`flex items-center ml-2 ${
                      isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    } transition-opacity`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Dropdown
                      trigger={
                        <button className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors">
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                      }
                      items={[
                        {
                          id: 'rename',
                          label: 'Rename',
                          icon: <Edit2 className="w-3.5 h-3.5" />,
                          onClick: () => startRename(conv),
                        },
                        {
                          id: 'delete',
                          label: 'Delete',
                          icon: <Trash2 className="w-3.5 h-3.5" />,
                          danger: true,
                          onClick: () => setDeletingId(conv.id),
                        },
                      ]}
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={confirmDelete}
        title="Delete Conversation?"
        message="This conversation history and all associated query logs will be permanently deleted."
        confirmLabel="Delete"
        isDestructive={true}
      />
    </aside>
  );
};
