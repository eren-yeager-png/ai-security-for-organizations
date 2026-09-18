import { apiClient, USE_MOCK_API } from './client';
import { Conversation, ChatMessage, TemporaryChatFile, User } from './types';
import {
  mockGetConversations,
  mockCreateConversation,
  mockRenameConversation,
  mockDeleteConversation,
  mockGetMessages,
  mockStreamAiResponse,
} from '../mocks/chat.mock';

export async function getConversations(): Promise<Conversation[]> {
  if (USE_MOCK_API) {
    return mockGetConversations();
  }
  return apiClient<Conversation[]>('/chat/conversations');
}

export async function createConversation(title?: string): Promise<Conversation> {
  if (USE_MOCK_API) {
    return mockCreateConversation(title);
  }
  return apiClient<Conversation>('/chat/conversations', {
    method: 'POST',
    body: JSON.stringify({ title }),
  });
}

export async function renameConversation(id: string, title: string): Promise<Conversation> {
  if (USE_MOCK_API) {
    return mockRenameConversation(id, title);
  }
  return apiClient<Conversation>(`/chat/conversations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ title }),
  });
}

export async function deleteConversation(id: string): Promise<{ success: boolean }> {
  if (USE_MOCK_API) {
    return mockDeleteConversation(id);
  }
  return apiClient<{ success: boolean }>(`/chat/conversations/${id}`, {
    method: 'DELETE',
  });
}

export async function getMessages(conversationId: string): Promise<ChatMessage[]> {
  if (USE_MOCK_API) {
    return mockGetMessages(conversationId);
  }
  return apiClient<ChatMessage[]>(`/chat/conversations/${conversationId}/messages`);
}

export async function streamChatMessage(
  conversationId: string,
  prompt: string,
  currentUser: User | null,
  tempFiles?: TemporaryChatFile[],
  onChunk?: (textChunk: string) => void,
  onComplete?: (message: ChatMessage) => void,
  abortSignal?: AbortSignal
): Promise<ChatMessage> {
  if (USE_MOCK_API) {
    return mockStreamAiResponse(
      conversationId,
      prompt,
      currentUser,
      tempFiles,
      onChunk,
      onComplete,
      abortSignal
    );
  }

  // Real backend SSE / chunked streaming endpoint
  const response = await fetch(`/api/v1/chat/conversations/${conversationId}/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, temp_files: tempFiles?.map((f) => f.id) }),
    signal: abortSignal,
  });

  if (!response.ok) {
    throw new Error('Failed to stream AI response');
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let accumulated = '';

  if (reader) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      accumulated += chunk;
      if (onChunk) onChunk(chunk);
    }
  }

  const completedMessage: ChatMessage = {
    id: `msg_${Date.now()}`,
    conversationId,
    role: 'assistant',
    content: accumulated,
    createdAt: new Date().toISOString(),
  };

  if (onComplete) onComplete(completedMessage);
  return completedMessage;
}
