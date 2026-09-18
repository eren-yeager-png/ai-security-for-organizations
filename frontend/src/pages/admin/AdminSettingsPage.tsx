import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { useNotification } from '../../context/NotificationContext';
import { Shield, Database, Cpu } from 'lucide-react';
import { BASE_URL, USE_MOCK_API } from '../../api/client';

export const AdminSettingsPage: React.FC = () => {
  const { success } = useNotification();
  const [tokenExpireMins, setTokenExpireMins] = useState('30');
  const [topK, setTopK] = useState('5');
  const [similarityThreshold, setSimilarityThreshold] = useState('0.75');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    success('System Settings Saved', 'Runtime governance configurations updated.');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">System & Governance Configuration</h1>
        <p className="text-xs text-slate-400 mt-1">
          Cluster-wide parameters for authentication tokens, vector search thresholds, and backend endpoints.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Environment & Backend Card */}
        <Card>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-200 mb-4 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-purple-400" />
            <span>FastAPI Backend Gateway</span>
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Backend Target URL"
                value={BASE_URL}
                disabled
                helperText="Configured via VITE_API_BASE_URL"
              />

              <div>
                <label className="text-xs font-semibold text-slate-300 tracking-wide block mb-1.5">
                  Service Adapter Mode
                </label>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-mono font-bold text-cyan-300">
                    {USE_MOCK_API ? 'Isolated Mock Adapter' : 'Live FastAPI Backend'}
                  </span>
                  <Badge variant={USE_MOCK_API ? 'cyan' : 'emerald'} size="sm">
                    {USE_MOCK_API ? 'Dev Mock' : 'Live Connected'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Security & Token Lifecycle */}
        <Card>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-200 mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyan-400" />
            <span>Authentication Token Lifespans</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Access Token Expiration (Minutes)"
              type="number"
              value={tokenExpireMins}
              onChange={(e) => setTokenExpireMins(e.target.value)}
              required
            />

            <Input
              label="Refresh Token Expiration (Days)"
              type="number"
              value="7"
              disabled
              helperText="Managed by server JWT policy"
            />
          </div>
        </Card>

        {/* Retrieval & Vector Settings */}
        <Card>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-200 mb-4 flex items-center gap-2">
            <Database className="w-4 h-4 text-blue-400" />
            <span>RAG Retrieval & Citation Safeguards</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Max Cited Documents (Top-K)"
              type="number"
              value={topK}
              onChange={(e) => setTopK(e.target.value)}
              required
            />

            <Input
              label="Similarity Threshold (0.0 – 1.0)"
              type="number"
              step="0.05"
              value={similarityThreshold}
              onChange={(e) => setSimilarityThreshold(e.target.value)}
              required
            />
          </div>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" variant="primary">
            Apply System Settings
          </Button>
        </div>
      </form>
    </div>
  );
};
