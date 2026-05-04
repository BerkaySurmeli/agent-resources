import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import Navbar from '../components/Navbar';
import { API_URL } from '../lib/api';

const steps = [
  { id: 'orchestrator', title: 'Choose Your Orchestrator', description: 'Select a project manager to coordinate your AI team' },
  { id: 'team', title: 'Build Your Team', description: 'Add specialists to handle specific tasks' },
  { id: 'mcp', title: 'Add MCP Servers', description: 'Supercharge your team with tools and integrations' },
  { id: 'review', title: 'Review & Download', description: 'One-click setup for your complete AI team' },
];

const sortOptions = [
  { id: 'popular', label: 'Most Popular' },
  { id: 'price-low', label: 'Price: Low to High' },
  { id: 'price-high', label: 'Price: High to Low' },
  { id: 'name', label: 'Name: A–Z' },
];

interface Listing {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  price_cents: number;
  tags: string[];
  virus_scan_status: string;
  seller?: { name: string };
}

export default function Wizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedOrchestrator, setSelectedOrchestrator] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string[]>([]);
  const [selectedMCPs, setSelectedMCPs] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('popular');
  const [email, setEmail] = useState('');
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { addToCart } = useCart();

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      const response = await fetch(`${API_URL}/listings/public`);
      if (response.ok) {
        setListings(await response.json());
      } else {
        setError('Failed to load listings');
      }
    } catch {
      setError('Failed to load listings');
    } finally {
      setLoading(false);
    }
  };

  const orchestrators = listings.filter(l =>
    l.category === 'persona' &&
    l.virus_scan_status === 'clean' &&
    (l.tags?.includes('orchestrator') ||
      l.tags?.includes('project-manager') ||
      l.name.toLowerCase().includes('project manager') ||
      l.name.toLowerCase().includes('orchestrator'))
  );

  const teamMembers = listings.filter(l =>
    l.category === 'persona' &&
    l.virus_scan_status === 'clean' &&
    !orchestrators.find(o => o.id === l.id)
  );

  const mcpServers = listings.filter(l =>
    l.category === 'mcp_server' &&
    l.virus_scan_status === 'clean'
  );

  const toggleTeamMember = (id: string) => {
    setSelectedTeam(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const toggleMCP = (id: string) => {
    setSelectedMCPs(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const sortedTeam = [...teamMembers].sort((a, b) => {
    switch (sortBy) {
      case 'price-low': return a.price_cents - b.price_cents;
      case 'price-high': return b.price_cents - a.price_cents;
      case 'name': return a.name.localeCompare(b.name);
      default: return 0;
    }
  });

  const selectedItems = [
    ...(selectedOrchestrator ? orchestrators.filter(o => o.id === selectedOrchestrator) : []),
    ...teamMembers.filter(t => selectedTeam.includes(t.id)),
    ...mcpServers.filter(m => selectedMCPs.includes(m.id))
  ];

  const totalCents = selectedItems.reduce((sum, item) => sum + item.price_cents, 0);
  const bundleDiscountCents = selectedItems.length >= 3 ? Math.round(totalCents * 0.15) : 0;
  const finalTotalCents = totalCents - bundleDiscountCents;

  const handleCheckout = () => {
    selectedItems.forEach(item => {
      addToCart({ id: item.id, slug: item.slug, name: item.name, price: item.price_cents / 100, category: item.category });
    });
    window.location.href = '/cart';
  };

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const getRole = (item: Listing) => {
    if (item.tags?.includes('developer')) return 'Developer';
    if (item.tags?.includes('designer')) return 'Designer';
    if (item.tags?.includes('marketer')) return 'Marketer';
    if (item.tags?.includes('orchestrator') || item.tags?.includes('project-manager')) return 'Project Manager';
    return item.category === 'mcp_server' ? 'MCP Server' : 'AI Persona';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-terra-500 mx-auto mb-4" />
          <p className="text-ink-400">Loading available agents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-100">
      <Head>
        <title>Build Your AI Team | Agent Resources</title>
      </Head>

      <Navbar />

      <main className="pt-20 pb-16 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="heading-serif text-3xl md:text-4xl text-ink-900 mb-2">Build Your AI Team</h1>
            <p className="text-ink-500">Assemble a complete AI workforce in minutes.</p>
          </div>

          {/* Progress steps */}
          <div className="flex items-center justify-center mb-10">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                  index < currentStep
                    ? 'bg-terra-500 text-white'
                    : index === currentStep
                      ? 'bg-terra-500 text-white ring-4 ring-terra-100'
                      : 'bg-cream-200 text-ink-400'
                }`}>
                  {index < currentStep ? '✓' : index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-14 h-0.5 mx-1.5 transition-colors ${
                    index < currentStep ? 'bg-terra-500' : 'bg-cream-200'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Step card */}
          <div className="card p-8">
            <h2 className="text-xl font-semibold text-ink-900 mb-1">{steps[currentStep].title}</h2>
            <p className="text-ink-500 text-sm mb-7">{steps[currentStep].description}</p>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Step 0 — Orchestrator */}
            {currentStep === 0 && (
              <div>
                {orchestrators.length === 0 ? (
                  <div className="text-center py-12 text-ink-400">
                    <p className="mb-2">No orchestrators available yet.</p>
                    <Link href="/listings" className="text-terra-600 hover:text-terra-700 font-medium text-sm">Browse all listings →</Link>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {orchestrators.map(orch => (
                      <button
                        key={orch.id}
                        onClick={() => setSelectedOrchestrator(orch.id)}
                        className={`p-5 rounded-xl border-2 text-left transition-all ${
                          selectedOrchestrator === orch.id
                            ? 'border-terra-400 bg-terra-50'
                            : 'border-cream-200 bg-white hover:border-cream-300'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: 'linear-gradient(135deg, #3549D4, #6470FA)' }}>
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                          </div>
                          <span className="font-bold text-ink-900">{formatPrice(orch.price_cents)}</span>
                        </div>
                        <h3 className="font-semibold text-ink-900 mb-0.5">{orch.name}</h3>
                        <p className="text-terra-600 text-xs font-medium mb-2">{getRole(orch)}</p>
                        <p className="text-ink-500 text-sm line-clamp-2">{orch.description}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 1 — Team */}
            {currentStep === 1 && (
              <>
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-sm text-ink-500">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="input !py-1.5 !px-3 !w-auto text-sm"
                  >
                    {sortOptions.map(opt => (
                      <option key={opt.id} value={opt.id}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {sortedTeam.length === 0 ? (
                  <div className="text-center py-12 text-ink-400">
                    <p className="mb-2">No team members available yet.</p>
                    <Link href="/listings" className="text-terra-600 hover:text-terra-700 font-medium text-sm">Browse all listings →</Link>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {sortedTeam.map(member => (
                      <button
                        key={member.id}
                        onClick={() => toggleTeamMember(member.id)}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          selectedTeam.includes(member.id)
                            ? 'border-terra-400 bg-terra-50'
                            : 'border-cream-200 bg-white hover:border-cream-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-ink-900 truncate">{member.name}</h3>
                            <p className="text-terra-600 text-xs font-medium mb-1">{getRole(member)}</p>
                            <p className="text-ink-500 text-sm line-clamp-2">{member.description}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <span className="font-semibold text-ink-900 text-sm">{formatPrice(member.price_cents)}</span>
                            {selectedTeam.includes(member.id) && (
                              <div className="w-5 h-5 bg-terra-500 rounded-full flex items-center justify-center mt-2 ml-auto">
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Step 2 — MCP Servers */}
            {currentStep === 2 && (
              <>
                <p className="text-ink-500 text-sm mb-5">
                  MCP servers give your AI team superpowers — web search, database access, API integrations, and more.
                </p>

                {mcpServers.length === 0 ? (
                  <div className="text-center py-12 text-ink-400">
                    <p className="mb-2">No MCP servers available yet.</p>
                    <Link href="/listings" className="text-terra-600 hover:text-terra-700 font-medium text-sm">Browse all listings →</Link>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {mcpServers.map(mcp => (
                      <button
                        key={mcp.id}
                        onClick={() => toggleMCP(mcp.id)}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          selectedMCPs.includes(mcp.id)
                            ? 'border-terra-400 bg-terra-50'
                            : 'border-cream-200 bg-white hover:border-cream-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-ink-900 truncate">{mcp.name}</h3>
                            <p className="text-terra-600 text-xs font-medium mb-1 capitalize">{mcp.tags?.[0] || mcp.category}</p>
                            <p className="text-ink-500 text-sm line-clamp-2">{mcp.description}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <span className="font-semibold text-ink-900 text-sm">{formatPrice(mcp.price_cents)}</span>
                            {selectedMCPs.includes(mcp.id) && (
                              <div className="w-5 h-5 bg-terra-500 rounded-full flex items-center justify-center mt-2 ml-auto">
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {selectedMCPs.length > 0 && (
                  <div className="mt-5 p-4 bg-terra-50 border border-terra-200 rounded-xl">
                    <p className="text-terra-700 font-medium text-sm">
                      {selectedMCPs.length} MCP server{selectedMCPs.length > 1 ? 's' : ''} selected
                    </p>
                    <p className="text-terra-600/80 text-xs mt-0.5">
                      Your agents will prompt for API keys during setup.
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Step 3 — Review */}
            {currentStep === 3 && (
              <div className="space-y-5">
                <div className="bg-cream-100 border border-cream-200 rounded-xl p-6">
                  <h3 className="font-semibold text-ink-900 mb-4">Your Complete AI Team</h3>

                  {selectedOrchestrator && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-ink-400 uppercase tracking-wider mb-2">Orchestrator</p>
                      {orchestrators.filter(o => o.id === selectedOrchestrator).map(o => (
                        <div key={o.id} className="flex items-center justify-between py-2">
                          <span className="text-ink-700 font-medium">{o.name} <span className="text-ink-400 font-normal">({getRole(o)})</span></span>
                          <span className="font-semibold text-ink-900">{formatPrice(o.price_cents)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedTeam.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-ink-400 uppercase tracking-wider mb-2">Team Members</p>
                      {teamMembers.filter(t => selectedTeam.includes(t.id)).map(t => (
                        <div key={t.id} className="flex items-center justify-between py-2">
                          <span className="text-ink-700 font-medium">{t.name} <span className="text-ink-400 font-normal">({getRole(t)})</span></span>
                          <span className="font-semibold text-ink-900">{formatPrice(t.price_cents)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedMCPs.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-ink-400 uppercase tracking-wider mb-2">MCP Servers</p>
                      {mcpServers.filter(m => selectedMCPs.includes(m.id)).map(m => (
                        <div key={m.id} className="flex items-center justify-between py-2">
                          <span className="text-ink-700 font-medium">{m.name}</span>
                          <span className="font-semibold text-ink-900">{formatPrice(m.price_cents)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedItems.length === 0 && (
                    <p className="text-ink-400 text-sm py-4 text-center">Nothing selected yet. Go back and add some agents.</p>
                  )}

                  <div className="mt-4 pt-4 border-t border-cream-200 space-y-2">
                    <div className="flex justify-between text-ink-500 text-sm">
                      <span>Subtotal</span>
                      <span>{formatPrice(totalCents)}</span>
                    </div>
                    {bundleDiscountCents > 0 && (
                      <div className="flex justify-between text-green-700 text-sm">
                        <span>Bundle discount (15%)</span>
                        <span>−{formatPrice(bundleDiscountCents)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold text-ink-900 pt-2 border-t border-cream-200">
                      <span>Total</span>
                      <span>{formatPrice(finalTotalCents)}</span>
                    </div>
                    {selectedItems.length >= 3 && (
                      <p className="text-xs text-green-700 mt-1">Bundle discount applied — 3+ items saves 15%</p>
                    )}
                  </div>
                </div>

                {/* Checkout */}
                <div className="card p-6">
                  <h3 className="font-semibold text-ink-900 mb-1">Ready to deploy?</h3>
                  <p className="text-ink-500 text-sm mb-4">
                    Add everything to cart and check out with Stripe.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="input flex-1"
                    />
                    <button
                      onClick={handleCheckout}
                      disabled={!email || selectedItems.length === 0}
                      className="btn-primary whitespace-nowrap disabled:opacity-50"
                    >
                      Go to Cart
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-6 border-t border-cream-200">
              <button
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
                className="btn-secondary disabled:opacity-50"
              >
                Back
              </button>

              {currentStep < steps.length - 1 && (
                <button
                  onClick={() => setCurrentStep(currentStep + 1)}
                  disabled={currentStep === 0 && !selectedOrchestrator}
                  className="btn-primary disabled:opacity-50"
                >
                  Continue
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
