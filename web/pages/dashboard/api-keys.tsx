import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import { API_URL } from '../../lib/api';

interface OAuthClient {
  id: string;
  client_id: string;
  name: string;
  scopes_allowed: string[];
  spending_limit_cents: number;
  spent_cents: number;
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
}

interface NewClientSecret {
  client_id: string;
  client_secret: string;
  name: string;
}

const SCOPE_LABELS: Record<string, { label: string; description: string }> = {
  'catalog:read':   { label: 'Catalog Read',    description: 'Search and browse listings' },
  'orders:create':  { label: 'Orders Create',   description: 'Purchase listings from wallet' },
};

export default function ApiKeysPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [clients, setClients] = useState<OAuthClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create form state
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newBudget, setNewBudget] = useState('');
  const [newScopes, setNewScopes] = useState<string[]>(['catalog:read', 'orders:create']);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Revealed secret after creation
  const [revealed, setRevealed] = useState<NewClientSecret | null>(null);
  const [copied, setCopied] = useState<'id' | 'secret' | null>(null);

  // Revoke state
  const [revoking, setRevoking] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchClients();
  }, [user?.id]);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('ar-token');
      const res = await fetch(`${API_URL}/oauth/clients`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setClients(data);
      } else {
        setError('Failed to load API clients');
      }
    } catch {
      setError('Failed to load API clients');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) { setCreateError('Name is required'); return; }
    if (newScopes.length === 0) { setCreateError('Select at least one scope'); return; }

    setCreating(true);
    setCreateError('');
    try {
      const token = localStorage.getItem('ar-token');
      const res = await fetch(`${API_URL}/oauth/clients`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          scopes_requested: newScopes,
          spending_limit_cents: newBudget ? Math.round(parseFloat(newBudget) * 100) : 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreateError(data.detail || 'Failed to create client');
        return;
      }
      setRevealed({ client_id: data.client_id, client_secret: data.client_secret, name: data.name });
      setShowCreate(false);
      setNewName('');
      setNewBudget('');
      setNewScopes(['catalog:read', 'orders:create']);
      await fetchClients();
    } catch {
      setCreateError('Failed to create client');
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (clientId: string) => {
    if (!confirm('Revoke this client? Any agent using it will stop working immediately.')) return;
    setRevoking(clientId);
    try {
      const token = localStorage.getItem('ar-token');
      await fetch(`${API_URL}/oauth/clients/${clientId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchClients();
    } catch {
      // silently ignore
    } finally {
      setRevoking(null);
    }
  };

  const copyToClipboard = async (text: string, field: 'id' | 'secret') => {
    await navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  const toggleScope = (scope: string) => {
    setNewScopes(prev =>
      prev.includes(scope) ? prev.filter(s => s !== scope) : [...prev, scope]
    );
  };

  if (authLoading) return null;

  if (!user) {
    return (
      <div className="min-h-screen bg-cream-100">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <p className="text-ink-500 mb-4">Sign in to manage your API keys.</p>
          <Link href="/login" className="btn-primary">Sign in</Link>
        </div>
      </div>
    );
  }

  const activeClients = clients.filter(c => c.is_active);

  return (
    <>
      <Head>
        <title>API Keys — Agent Resources</title>
      </Head>
      <div className="min-h-screen bg-cream-100">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 text-sm text-ink-400 mb-1">
                <Link href="/dashboard" className="hover:text-ink-700 transition-colors">Dashboard</Link>
                <span>/</span>
                <span>API Keys</span>
              </div>
              <h1 className="text-2xl font-bold text-ink-900">API Keys</h1>
              <p className="text-sm text-ink-500 mt-1">
                OAuth 2.1 client credentials for your agents. Each key can search the catalog, buy listings, and fetch install manifests.
              </p>
            </div>
            <button
              onClick={() => { setShowCreate(true); setRevealed(null); }}
              className="btn-primary text-sm px-5 py-2.5 whitespace-nowrap"
            >
              + New API key
            </button>
          </div>

          {/* Revealed secret banner */}
          {revealed && (
            <div className="mb-6 rounded-xl border-2 border-brand/30 bg-brand/5 p-5">
              <div className="flex items-start gap-3 mb-4">
                <span className="text-brand text-xl">🔑</span>
                <div>
                  <p className="font-semibold text-ink-900">Save your secret now — it won't be shown again</p>
                  <p className="text-sm text-ink-500">Created: <strong>{revealed.name}</strong></p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-ink-400 uppercase tracking-wide">Client ID</label>
                  <div className="mt-1 flex items-center gap-2">
                    <code className="flex-1 bg-white border border-cream-300 rounded-lg px-3 py-2 text-sm font-mono text-ink-800 select-all">
                      {revealed.client_id}
                    </code>
                    <button
                      onClick={() => copyToClipboard(revealed.client_id, 'id')}
                      className="btn-secondary text-xs px-3 py-2 whitespace-nowrap"
                    >
                      {copied === 'id' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-ink-400 uppercase tracking-wide">Client Secret</label>
                  <div className="mt-1 flex items-center gap-2">
                    <code className="flex-1 bg-white border border-cream-300 rounded-lg px-3 py-2 text-sm font-mono text-ink-800 select-all break-all">
                      {revealed.client_secret}
                    </code>
                    <button
                      onClick={() => copyToClipboard(revealed.client_secret, 'secret')}
                      className="btn-secondary text-xs px-3 py-2 whitespace-nowrap"
                    >
                      {copied === 'secret' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>
              <div className="mt-4 p-3 bg-ink-900 rounded-lg">
                <p className="text-xs text-white/50 font-mono mb-1"># Get a token</p>
                <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">{`curl -X POST https://api.shopagentresources.com/oauth/token \\
  -d "grant_type=client_credentials" \\
  -d "client_id=${revealed.client_id}" \\
  -d "client_secret=${revealed.client_secret}"`}</pre>
              </div>
              <button
                onClick={() => setRevealed(null)}
                className="mt-4 text-xs text-ink-400 hover:text-ink-600 underline"
              >
                I've saved it — dismiss
              </button>
            </div>
          )}

          {/* Create form */}
          {showCreate && (
            <div className="mb-6 card p-6">
              <h2 className="text-base font-semibold text-ink-900 mb-4">New API key</h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-ink-700">Name</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="e.g. my-research-agent"
                    className="input mt-1 w-full text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-ink-700">Spending limit (optional)</label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 text-sm">$</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={newBudget}
                      onChange={e => setNewBudget(e.target.value)}
                      placeholder="0 = unlimited"
                      className="input w-full pl-7 text-sm"
                    />
                  </div>
                  <p className="text-xs text-ink-400 mt-1">Max this agent can spend from your wallet. Leave blank for no limit.</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-ink-700 block mb-2">Permissions</label>
                  <div className="space-y-2">
                    {Object.entries(SCOPE_LABELS).map(([scope, { label, description }]) => (
                      <label key={scope} className="flex items-start gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={newScopes.includes(scope)}
                          onChange={() => toggleScope(scope)}
                          className="mt-0.5 accent-brand"
                        />
                        <div>
                          <span className="text-sm font-medium text-ink-800 group-hover:text-ink-900">{label}</span>
                          <span className="text-xs text-ink-400 ml-2">{description}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                {createError && <p className="text-sm text-terra-600">{createError}</p>}
                <div className="flex gap-3 pt-1">
                  <button type="submit" disabled={creating} className="btn-primary text-sm px-5 py-2.5 disabled:opacity-50">
                    {creating ? 'Creating…' : 'Create key'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowCreate(false); setCreateError(''); }}
                    className="btn-secondary text-sm px-5 py-2.5"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Clients list */}
          {loading ? (
            <div className="text-center py-16 text-ink-400">Loading…</div>
          ) : error ? (
            <div className="text-center py-16 text-terra-600">{error}</div>
          ) : activeClients.length === 0 ? (
            <div className="card p-10 text-center">
              <div className="text-4xl mb-3">🤖</div>
              <p className="font-medium text-ink-800 mb-1">No API keys yet</p>
              <p className="text-sm text-ink-500 mb-5">Create your first key so an agent can authenticate headlessly.</p>
              <button onClick={() => setShowCreate(true)} className="btn-primary text-sm px-5 py-2.5">
                Create your first key
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {activeClients.map(client => (
                <div key={client.id} className="card p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-ink-900">{client.name}</span>
                        <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">Active</span>
                      </div>
                      <code className="text-xs text-ink-500 font-mono">{client.client_id}</code>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {client.scopes_allowed.map(s => (
                          <span key={s} className="text-xs bg-brand/10 text-brand border border-brand/20 px-2 py-0.5 rounded-full font-mono">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRevoke(client.id)}
                      disabled={revoking === client.id}
                      className="text-xs text-terra-500 hover:text-terra-700 border border-terra-200 hover:border-terra-400 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap disabled:opacity-50"
                    >
                      {revoking === client.id ? 'Revoking…' : 'Revoke'}
                    </button>
                  </div>
                  <div className="flex items-center gap-6 mt-3 pt-3 border-t border-cream-200 text-xs text-ink-400">
                    <span>
                      Spent: <strong className="text-ink-700">${(client.spent_cents / 100).toFixed(2)}</strong>
                      {client.spending_limit_cents > 0 && (
                        <> of ${(client.spending_limit_cents / 100).toFixed(2)} limit</>
                      )}
                    </span>
                    <span>
                      Last used: <strong className="text-ink-700">
                        {client.last_used_at
                          ? new Date(client.last_used_at).toLocaleDateString()
                          : 'Never'}
                      </strong>
                    </span>
                    <span>
                      Created: <strong className="text-ink-700">{new Date(client.created_at).toLocaleDateString()}</strong>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Usage snippet */}
          <div className="mt-8 card p-5">
            <h3 className="text-sm font-semibold text-ink-800 mb-3">Using your key</h3>
            <div className="bg-ink-900 rounded-lg p-4 overflow-x-auto">
              <pre className="text-xs text-green-400 font-mono whitespace-pre">{`# 1. Get a token (30 min TTL)
curl -X POST https://api.shopagentresources.com/oauth/token \\
  -d "grant_type=client_credentials" \\
  -d "client_id=YOUR_CLIENT_ID" \\
  -d "client_secret=YOUR_CLIENT_SECRET"

# 2. Search via MCP
curl -X POST https://api.shopagentresources.com/mcp \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"search_listings","arguments":{"limit":5}}}'`}</pre>
            </div>
            <p className="text-xs text-ink-400 mt-3">
              Full docs at <a href="/.well-known/oauth-authorization-server" className="underline hover:text-ink-600">.well-known/oauth-authorization-server</a>
            </p>
          </div>

        </div>
      </div>
    </>
  );
}
