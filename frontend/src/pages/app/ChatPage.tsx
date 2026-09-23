import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Conversation, ChatMessage, TemporaryChatFile } from '../../api/types';
import {
  getConversations,
  createConversation,
  renameConversation,
  deleteConversation,
  getMessages,
  streamChatMessage,
} from '../../api/chat';
import { ConversationSidebar } from '../../components/chat/ConversationSidebar';
import { MessageBubble } from '../../components/chat/MessageBubble';
import { ChatInput } from '../../components/chat/ChatInput';
import { EmptyState } from '../../components/chat/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

export const ChatPage: React.FC = () => {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error: notifyError } = useNotification();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(conversationId || null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Load conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const list = await getConversations();
        setConversations(list);
        if (!activeConvId && list.length > 0) {
          setActiveConvId(list[0].id);
          navigate(`/app/chat/${list[0].id}`, { replace: true });
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to load conversations';
        notifyError('Connection Error', msg);
      }
    };
    fetchConversations();
  }, []);

  // Sync route param with activeConvId
  useEffect(() => {
    if (conversationId && conversationId !== activeConvId) {
      setActiveConvId(conversationId);
    }
  }, [conversationId]);

  // Load messages when activeConvId changes
  useEffect(() => {
    if (!activeConvId) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      setIsLoadingMessages(true);
      try {
        const msgs = await getMessages(activeConvId);
        setMessages(msgs);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to load conversation history';
        notifyError('Data Error', msg);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [activeConvId]);

  // Auto scroll to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  const handleSelectConversation = (id: string) => {
    setActiveConvId(id);
    navigate(`/app/chat/${id}`);
  };

  const handleNewConversation = async () => {
    try {
      const newConv = await createConversation('New Conversation');
      setConversations((prev) => [newConv, ...prev]);
      setActiveConvId(newConv.id);
      setMessages([]);
      navigate(`/app/chat/${newConv.id}`);
      success('New Conversation Created', 'Ready for inquiries.');
    } catch {
      notifyError('Failed to create new conversation');
    }
  };

  const handleRename = async (id: string, newTitle: string) => {
    try {
      const updated = await renameConversation(id, newTitle);
      setConversations((prev) => prev.map((c) => (c.id === id ? updated : c)));
      success('Conversation Renamed', updated.title);
    } catch {
      notifyError('Failed to rename conversation');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteConversation(id);
      const remaining = conversations.filter((c) => c.id !== id);
      setConversations(remaining);
      if (activeConvId === id) {
        const nextId = remaining.length > 0 ? remaining[0].id : null;
        setActiveConvId(nextId);
        if (nextId) {
          navigate(`/app/chat/${nextId}`);
        } else {
          navigate('/app/chat');
        }
      }
      success('Conversation Deleted');
    } catch {
      notifyError('Failed to delete conversation');
    }
  };

  const handleSendMessage = async (text: string, tempFiles?: TemporaryChatFile[]) => {
    let currentId = activeConvId;

    if (!currentId) {
      const newConv = await createConversation(text.slice(0, 30) || 'New Conversation');
      setConversations((prev) => [newConv, ...prev]);
      currentId = newConv.id;
      setActiveConvId(newConv.id);
      navigate(`/app/chat/${newConv.id}`);
    }

    const userMessage: ChatMessage = {
      id: `msg_user_${Date.now()}`,
      conversationId: currentId,
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
      tempFiles,
    };

    setMessages((prev) => [...prev, userMessage]);

    // Setup streaming message placeholder
    const streamingMessageId = `msg_stream_${Date.now()}`;
    const streamingPlaceholder: ChatMessage = {
      id: streamingMessageId,
      conversationId: currentId,
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, streamingPlaceholder]);
    setIsStreaming(true);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      await streamChatMessage(
        currentId,
        text,
        user,
        tempFiles,
        (chunk) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === streamingMessageId
                ? { ...msg, content: msg.content + chunk }
                : msg
            )
          );
        },
        (completedMessage) => {
          setMessages((prev) =>
            prev.map((msg) => (msg.id === streamingMessageId ? completedMessage : msg))
          );
        },
        abortController.signal
      );
    } catch {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === streamingMessageId
            ? {
                ...msg,
                content:
                  msg.content ||
                  'Generation interrupted or network error. Please verify backend connectivity.',
                isStreaming: false,
              }
            : msg
        )
      );
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
      setMessages((prev) =>
        prev.map((msg) => (msg.isStreaming ? { ...msg, isStreaming: false } : msg))
      );
    }
  };

  const handleRegenerate = () => {
    if (messages.length === 0) return;
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUserMsg) {
      handleSendMessage(lastUserMsg.content, lastUserMsg.tempFiles);
    }
  };

  const handleViewSource = (documentId: string) => {
    navigate(`/app/documents?docId=${documentId}`);
  };

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Conversations Left Panel */}
      <ConversationSidebar
        conversations={conversations}
        activeConversationId={activeConvId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onRenameConversation={handleRename}
        onDeleteConversation={handleDelete}
      />

      {/* Main AI Chat Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50/70 dark:bg-slate-950/20">
        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto">
          {isLoadingMessages ? (
            <div className="flex h-full items-center justify-center text-slate-500 text-xs">
              <div className="flex flex-col items-center gap-3">
                <div className="w-6 h-6 border-2 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
                <span>Decrypting conversation records...</span>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="py-2">
              {messages.map((msg, index) => {
                const isLatestAssistant =
                  index === messages.length - 1 && msg.role === 'assistant';
                return (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    isLatestAssistant={isLatestAssistant}
                    onRegenerate={handleRegenerate}
                    onViewSource={handleViewSource}
                  />
                );
              })}
              <div ref={chatBottomRef} />
            </div>
          )}
        </div>

        {/* Input Bar */}
        <ChatInput
          onSendMessage={handleSendMessage}
          onStopGeneration={handleStopGeneration}
          isStreaming={isStreaming}
        />
      </div>
    </div>
  );
};
