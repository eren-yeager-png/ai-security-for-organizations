import { Conversation, ChatMessage, CitationSource, TemporaryChatFile, User } from '../api/types';
import { canAccessDocument } from '../security/rbac';

export const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv_sec_01',
    title: 'Enterprise VPN & Password Security Standards',
    createdAt: '2026-09-15T14:20:00Z',
    updatedAt: '2026-09-15T14:35:00Z',
    messageCount: 4,
    lastMessagePreview: 'MFA is strictly required for all internal connections with 90-day password rotation...',
  },
  {
    id: 'conv_fin_02',
    title: 'Q3 Financial Analysis & Audit Inquiries',
    createdAt: '2026-09-14T10:00:00Z',
    updatedAt: '2026-09-14T10:15:00Z',
    messageCount: 2,
    lastMessagePreview: 'According to the Q3 Financial Audit, operational expenditures decreased by 4.2%...',
  },
  {
    id: 'conv_hr_03',
    title: 'Remote Work Stipend & Equipment Reimbursement',
    createdAt: '2026-09-12T09:10:00Z',
    updatedAt: '2026-09-12T09:25:00Z',
    messageCount: 3,
    lastMessagePreview: 'Employees are eligible for an annual home office ergonomics stipend of $1,200...',
  },
];

export const INITIAL_MESSAGES: Record<string, ChatMessage[]> = {
  conv_sec_01: [
    {
      id: 'msg_01',
      conversationId: 'conv_sec_01',
      role: 'user',
      content: 'What are our organization requirements for VPN access and password complexity?',
      createdAt: '2026-09-15T14:20:00Z',
    },
    {
      id: 'msg_02',
      conversationId: 'conv_sec_01',
      role: 'assistant',
      content: `Based on your organization's internal security documentation, here are the requirements for corporate VPN access and password management:

### 1. Corporate VPN Access
* **Mandatory Multi-Factor Authentication (MFA)**: All remote connections must authenticate using hardware security keys (FIDO2/WebAuthn) or time-based one-time password (TOTP) authenticators.
* **Device Posture Verification**: Connecting endpoints must be enrolled in MDM with disk encryption (BitLocker/FileVault) enabled.
* **Session Inactivity**: VPN tunnels automatically terminate after **4 hours** of idle state or a maximum session lifetime of **12 hours**.

### 2. Password Standards
\`\`\`text
Minimum Length:    16 characters
Complexity:        Must include uppercase, lowercase, numbers, and symbols
Expiration:        90-day rotation for privileged accounts
History:           Cannot reuse the last 12 passwords
\`\`\`

> **Note**: Storing company passwords in unapproved browser vaults is strictly prohibited. You must use the enterprise-licensed password vault.`,
      createdAt: '2026-09-15T14:20:05Z',
      sources: [
        {
          id: 'cite_01',
          documentId: 'doc_int_01',
          title: 'Internal IT Security & Password Standards.pdf',
          safeLabel: 'Internal IT Security Standards (Page 12)',
          pageNumber: 12,
          snippet: 'All employees connecting remotely must authenticate through corporate wireguard VPN gateway with hardware MFA.',
          similarityScore: 0.94,
        },
        {
          id: 'cite_02',
          documentId: 'doc_pub_01',
          title: 'Enterprise Code of Conduct & Ethics.pdf',
          safeLabel: 'Enterprise Code of Conduct (Page 18)',
          pageNumber: 18,
          snippet: 'Information assets must be safeguarded with authorized credential management practices.',
          similarityScore: 0.81,
        },
      ],
    },
  ],
};

let conversationsStore = [...INITIAL_CONVERSATIONS];
const messagesStore = { ...INITIAL_MESSAGES };

export async function mockGetConversations(): Promise<Conversation[]> {
  await new Promise((r) => setTimeout(r, 200));
  return [...conversationsStore];
}

export async function mockCreateConversation(initialTitle?: string): Promise<Conversation> {
  await new Promise((r) => setTimeout(r, 150));
  const newConv: Conversation = {
    id: `conv_${Date.now()}`,
    title: initialTitle || 'New Conversation',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messageCount: 0,
  };
  conversationsStore = [newConv, ...conversationsStore];
  messagesStore[newConv.id] = [];
  return newConv;
}

export async function mockRenameConversation(id: string, newTitle: string): Promise<Conversation> {
  await new Promise((r) => setTimeout(r, 150));
  const conv = conversationsStore.find((c) => c.id === id);
  if (!conv) throw new Error('Conversation not found');
  conv.title = newTitle;
  conv.updatedAt = new Date().toISOString();
  return { ...conv };
}

export async function mockDeleteConversation(id: string): Promise<{ success: boolean }> {
  await new Promise((r) => setTimeout(r, 200));
  conversationsStore = conversationsStore.filter((c) => c.id !== id);
  delete messagesStore[id];
  return { success: true };
}

export async function mockGetMessages(conversationId: string): Promise<ChatMessage[]> {
  await new Promise((r) => setTimeout(r, 150));
  return messagesStore[conversationId] || [];
}

/**
 * Enterprise AI Streaming Response Generator
 * Respects user's RBAC access permissions for cited sources!
 */
export async function mockStreamAiResponse(
  conversationId: string,
  userPrompt: string,
  currentUser: User | null,
  tempFiles?: TemporaryChatFile[],
  onChunk?: (textChunk: string) => void,
  onComplete?: (message: ChatMessage) => void,
  abortSignal?: AbortSignal
): Promise<ChatMessage> {
  const promptLower = userPrompt.toLowerCase();

  // Determine relevant knowledge base topic
  let fullResponseText = '';
  let sources: CitationSource[] = [];

  const isFinancialQuery = promptLower.includes('finance') || promptLower.includes('revenue') || promptLower.includes('q3') || promptLower.includes('audit');
  const isSecurityQuery = promptLower.includes('security') || promptLower.includes('vpn') || promptLower.includes('password') || promptLower.includes('vault') || promptLower.includes('key');
  const isHrQuery = promptLower.includes('benefit') || promptLower.includes('remote') || promptLower.includes('stipend') || promptLower.includes('conduct') || promptLower.includes('leave');

  if (tempFiles && tempFiles.length > 0) {
    const file = tempFiles[0];
    fullResponseText = `I have analyzed your temporary file **"${file.name}"** (${(file.size / 1024).toFixed(1)} KB).

### Temporary Document Summary
* **Format**: ${file.type.toUpperCase()} file
* **Ingestion Mode**: Session-bound analysis only (will not be retained in the permanent knowledge base)
* **Key Findings**:
  1. The document contains structured records relating to your inquiry.
  2. Data fields align with organizational governance requirements.
  3. No unencrypted secrets or anomalous credential leaks were detected.

\`\`\`json
{
  "analyzedFile": "${file.name}",
  "recordsParsed": 42,
  "confidenceScore": 0.98,
  "sessionIsolated": true
}
\`\`\`

Would you like me to extract specific data tables or summarize key clauses?`;
  } else if (isFinancialQuery) {
    // Check if user has permission for RESTRICTED docs
    const canAccessFinancials = canAccessDocument(currentUser, 'RESTRICTED');

    if (!canAccessFinancials) {
      fullResponseText = `I couldn't find sufficient information in your organization's accessible documents.

> [!NOTE]
> Detailed Q3 executive revenue and audit records are classified as **RESTRICTED** organizational documents.
> Under organizational security policies, Employee accounts do not have clearance to query restricted financial disclosures. Please contact your manager or compliance administrator if you require access.`;
    } else {
      fullResponseText = `According to the **Q3 Financial Audit & Executive Revenue Projections**, here is the financial overview:

### Key Metrics
* **Total Revenue**: $48.2M (+14.8% YoY growth)
* **Gross Margin**: 76.4% across SaaS platform subscriptions
* **Operating Margin**: Operating expenses were reduced by **4.2%** through cloud infrastructure optimization.

\`\`\`text
Segment                 Q3 Actual    Variance vs Target
Enterprise Software     $32.4M       +6.2%
Professional Services   $11.6M       +1.1%
Security Add-ons        $4.2M        +18.4%
\`\`\`

### Governance Notes
All expenditure categories remain in full compliance with the board-approved annual budget.`;

      sources = [
        {
          id: 'cite_fin_01',
          documentId: 'doc_res_01',
          title: 'Q3 Financial Audit & Executive Revenue Projections.pdf',
          safeLabel: 'Q3 Financial Audit (Page 4)',
          pageNumber: 4,
          snippet: 'Enterprise SaaS subscription revenue registered $32.4M representing an 18.4% YoY surge.',
          similarityScore: 0.96,
        },
      ];
    }
  } else if (isSecurityQuery) {
    const isRootVaultQuery = promptLower.includes('vault') || promptLower.includes('root') || promptLower.includes('blueprint');
    const canAccessAdminOnly = canAccessDocument(currentUser, 'ADMIN_ONLY');

    if (isRootVaultQuery && !canAccessAdminOnly) {
      fullResponseText = `I couldn't find this information in your organization's available documents.

> [!WARNING]
> Root infrastructure keys, disaster recovery blueprints, and vault rotation ceremonies are classified as **ADMIN-ONLY**.
> This information is restricted to authorized Security Administrators.`;
    } else {
      fullResponseText = `Organizational security policy establishes mandatory protocols for data protection and endpoint hygiene:

* **Authentication**: Multi-Factor Authentication (FIDO2 or TOTP) enforced globally.
* **Network Isolation**: Zero-Trust access control with continuous session health monitoring.
* **Credential Hygiene**: Password rotation every 90 days for privileged systems with a 16-character minimum complexity standard.
* **Data Transmission**: TLS 1.3 encryption required for all transit channels; AES-256 for data at rest.`;

      sources = [
        {
          id: 'cite_sec_01',
          documentId: 'doc_int_01',
          title: 'Internal IT Security & Password Standards.pdf',
          safeLabel: 'Internal IT Security Standards (Page 8)',
          pageNumber: 8,
          snippet: 'Zero-Trust network architecture mandates FIDO2 authentication and continuous posture verification.',
          similarityScore: 0.92,
        },
      ];
    }
  } else if (isHrQuery) {
    fullResponseText = `According to the **Employee Benefits Playbook** and **Enterprise Code of Conduct**:

* **Remote Work Stipend**: Full-time employees receive an annual home office stipend of **$1,200** for ergonomic chairs, monitors, or desks.
* **Wellness Reimbursement**: Up to **$75/month** for gym memberships, fitness trackers, or mental health applications.
* **Core Hours**: Collaborative core working hours are **10:00 AM – 3:00 PM** in your regional time zone.`;

    sources = [
      {
        id: 'cite_hr_01',
        documentId: 'doc_int_02',
        title: 'Employee Benefits & Remote Work Playbook.pdf',
        safeLabel: 'Employee Benefits 2026 (Page 15)',
        pageNumber: 15,
        snippet: 'Full-time remote team members qualify for a $1,200 annual ergonomics allowance.',
        similarityScore: 0.89,
      },
    ];
  } else {
    fullResponseText = `I searched your organization's knowledge base regarding: **"${userPrompt}"**.

Based on accessible internal policies and published documentation:
* The system enforces role-based access control across all queried sources.
* All queries and document access events are cryptographically recorded in the enterprise audit log.
* If you require information from restricted executive or infrastructure sources, please request authorization from an Administrator.

Can I assist you with specific documentation regarding IT security, employee guidelines, or technical runbooks?`;

    sources = [
      {
        id: 'cite_gen_01',
        documentId: 'doc_pub_01',
        title: 'Enterprise Code of Conduct & Ethics.pdf',
        safeLabel: 'Enterprise Code of Conduct 2026',
        pageNumber: 3,
        snippet: 'Authorized personnel must utilize AI assistance tools in alignment with data classification governance.',
        similarityScore: 0.78,
      },
    ];
  }

  // Stream in chunks simulating realistic streaming
  const words = fullResponseText.split(' ');
  let accumulated = '';

  for (let i = 0; i < words.length; i++) {
    if (abortSignal?.aborted) {
      break;
    }
    const piece = (i === 0 ? '' : ' ') + words[i];
    accumulated += piece;
    if (onChunk) {
      onChunk(piece);
    }
    // Realistic variable typing delay
    await new Promise((r) => setTimeout(r, 25));
  }

  const assistantMessage: ChatMessage = {
    id: `msg_asst_${Date.now()}`,
    conversationId,
    role: 'assistant',
    content: accumulated,
    createdAt: new Date().toISOString(),
    sources: sources.length > 0 ? sources : undefined,
  };

  if (!messagesStore[conversationId]) {
    messagesStore[conversationId] = [];
  }
  messagesStore[conversationId].push(assistantMessage);

  // Update conversation lastMessagePreview and messageCount
  const conv = conversationsStore.find((c) => c.id === conversationId);
  if (conv) {
    conv.messageCount = messagesStore[conversationId].length;
    conv.lastMessagePreview = accumulated.slice(0, 80) + '...';
    conv.updatedAt = new Date().toISOString();
  }

  if (onComplete) {
    onComplete(assistantMessage);
  }

  return assistantMessage;
}
