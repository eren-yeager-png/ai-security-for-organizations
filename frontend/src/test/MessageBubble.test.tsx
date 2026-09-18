import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MessageBubble } from '../components/chat/MessageBubble';
import { ChatMessage } from '../api/types';

describe('MessageBubble Component', () => {
  const sampleMessage: ChatMessage = {
    id: 'msg_test_01',
    conversationId: 'conv_01',
    role: 'assistant',
    content: 'This is an **authenticated** response with `encryption` standards.',
    createdAt: '2026-09-16T12:00:00Z',
    sources: [
      {
        id: 'cite_01',
        documentId: 'doc_int_01',
        title: 'Internal IT Security Standards.pdf',
        safeLabel: 'Internal IT Security Standards',
        pageNumber: 12,
        snippet: 'Zero-Trust network architecture mandates hardware MFA.',
        similarityScore: 0.95,
      },
    ],
  };

  it('renders assistant role badge and markdown formatted content', () => {
    render(<MessageBubble message={sampleMessage} />);
    expect(screen.getByText('Secure AI Assistant')).toBeInTheDocument();
    expect(screen.getByText('Enterprise Verified')).toBeInTheDocument();
    expect(screen.getByText('authenticated')).toBeInTheDocument();
  });

  it('renders verified knowledge sources and safe citations', () => {
    render(<MessageBubble message={sampleMessage} />);
    expect(screen.getByText(/Verified Knowledge Sources/i)).toBeInTheDocument();
    expect(screen.getByText('Internal IT Security Standards')).toBeInTheDocument();
    expect(screen.getByText('95% match')).toBeInTheDocument();
    expect(screen.getByText(/Referenced from Page 12/i)).toBeInTheDocument();
  });

  it('renders copy response button for assistant responses', () => {
    render(<MessageBubble message={sampleMessage} />);
    expect(screen.getByText(/Copy Response/i)).toBeInTheDocument();
  });
});
