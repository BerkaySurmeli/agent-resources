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
  { id: 'name', label: 'Name: A-Z' },
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

  // Fetch listings from API
  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      const response = await fetch(`${API_URL}/listings/public`);
      if (response.ok) {
        const data = await response.json();
        setListings(data);
      } else {
        setError('Failed to load listings');
      }
    } catch (err) {
      setError('Failed to load listings');
    } finally {
      setLoading(false);
    }
  };

  // Filter listings by category and availability
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

  const displayOrchestrators = orchestrators;
  const displayTeamMembers = teamMembers;
  const displayMcpServers = mcpServers;

  const toggleTeamMember = (id: string) => {
    setSelectedTeam(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const toggleMCP = (id: string) => {
    setSelectedMCPs(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const sortedTeam = [...displayTeamMembers].sort((a, b) => {
    switch (sortBy) {
      case 'price-low': return a.price_cents - b.price_cents;
      case 'price-high': return b.price_cents - a.price_cents;
      case 'name': return a.name.localeCompare(b.name);
      default: return 0;
    }
  });

  const selectedItems = [
    ...(selectedOrchestrator ? displayOrchestrators.filter(o => o.id === selectedOrchestrator) : []),
    ...displayTeamMembers.filter(t => selectedTeam.includes(t.id)),
    ...displayMcpServers.filter(m => selectedMCPs.includes(m.id))
  ];

  const totalCents = selectedItems.reduce((sum, item) => sum + item.price_cents, 0);
  const bundleDiscountCents = selectedItems.length >= 3 ? Math.round(totalCents * 0.15) : 0;
  const finalTotalCents = totalCents - bundleDiscountCents;
  const total = totalCents / 100;
  const bundleDiscount = bundleDiscountCents / 100;
  const finalTotal = finalTotalCents / 100;

  const handleCheckout = () => {
    // Add all items to cart with proper IDs
    selectedItems.forEach(item => {
      addToCart({
        id: item.id,
        slug: item.slug,
        name: item.name,
        price: item.price_cents / 100,
        category: item.category
      });
    });
    window.location.href = '/cart';
  };

  // Helper function to format prices
  const formatPrice = (priceCents: number) => `$${(priceCents / 100).toFixed(2)}`;

  // Get role from tags or category
  const getRole = (item: Listing) => {
    if (item.tags?.includes('developer')) return 'Developer';
    if (item.tags?.includes('designer')) return 'Designer';
    if (item.tags?.includes('marketer')) return 'Marketer';
    if (item.tags?.includes('orchestrator') || item.tags?.includes('project-manager')) return 'Project Manager';
    return item.category === 'mcp_server' ? 'MCP Server' : 'AI Persona';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading available agents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <Head>
        <title>Build Your AI Team | Agent Resources</title>
      </Head>

      {/* Navigation */}
      <Navbar />

      <main className="pt-20 pb-12 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl font-semibold text-white mb-2">Build Your AI Team</h1>
            <p className="text-slate-400">New to OpenClaw? Let&apos;s set up your complete AI workforce.</p>
          </div>

          {/* Progress */}
          <div className="flex items-center justify-center mb-12">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                  index <= currentStep ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'
                }`}>
                  {index < currentStep ? '✓' : index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-1 mx-2 transition-colors ${
                    index < currentStep ? 'bg-blue-600' : 'bg-slate-700'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
            <h2 className="text-2xl font-semibold text-white mb-2">{steps[currentStep].title}</h2>
            <p className="text-slate-400 mb-8">{steps[currentStep].description}</p>

            {error && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400">
                {error}
              </div>
            )}

            {currentStep === 0 && (
              <div className="grid md:grid-cols-2 gap-6">
                {displayOrchestrators.map(orch => (
                  <button
                    key={orch.id}
                    onClick={() => setSelectedOrchestrator(orch.id)}
                    className={`p-6 rounded-xl border-2 text-left transition-all ${
                      selectedOrchestrator === orch.id
                        ? 'border-blue-600 bg-blue-600/10'
                        : 'border-slate-700 bg-slate-800/50 hover:border-blue-500/50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <span className="text-2xl font-bold text-white">{formatPrice(orch.price_cents)}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-1">{orch.name}</h3>
                    <p className="text-blue-400 text-sm mb-2">{getRole(orch)}</p>
                    <p className="text-slate-400 text-sm">{orch.description}</p>
                  </button>
                ))}
              </div>
            )}

            {currentStep === 1 && (
              <>
                {/* Sort */}
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-sm text-slate-400">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500"
                  >
                    {sortOptions.map(opt => (
                      <option key={opt.id} value={opt.id}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Team Grid */}
                <div className="grid md:grid-cols-2 gap-4">
                  {sortedTeam.map(member => (
                    <button
                      key={member.id}
                      onClick={() => toggleTeamMember(member.id)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        selectedTeam.includes(member.id)
                          ? 'border-blue-600 bg-blue-600/10'
                          : 'border-slate-700 bg-slate-800/50 hover:border-blue-500/50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-white">{member.name}</h3>
                          <p className="text-blue-400 text-sm">{getRole(member)}</p>
                          <p className="text-slate-400 text-sm mt-1 line-clamp-2">{member.description}</p>
                        </div>
                        <div className="text-right ml-4">
                          <span className="font-semibold text-white">{formatPrice(member.price_cents)}</span>
                          {selectedTeam.includes(member.id) && (
                            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center mt-2 ml-auto">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}

            {currentStep === 2 && (
              <>
                <p className="text-slate-400 mb-6">
                  MCP (Model Context Protocol) servers give your AI team superpowers. Each server adds new capabilities like searching the web, managing databases, or automating tasks.
                </p>

                {/* MCP Categories */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {displayMcpServers.map(mcp => (
                    <button
                      key={mcp.id}
                      onClick={() => toggleMCP(mcp.id)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        selectedMCPs.includes(mcp.id)
                          ? 'border-blue-600 bg-blue-600/10'
                          : 'border-slate-700 bg-slate-800/50 hover:border-blue-500/50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-white">{mcp.name}</h3>
                          <p className="text-blue-400 text-sm capitalize">{mcp.tags?.[0] || mcp.category}</p>
                          <p className="text-slate-400 text-sm mt-1 line-clamp-2">{mcp.description}</p>
                        </div>
                        <div className="text-right ml-2">
                          <span className="font-semibold text-white">{formatPrice(mcp.price_cents)}</span>
                          {selectedMCPs.includes(mcp.id) && (
                            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center mt-2 ml-auto">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {selectedMCPs.length > 0 && (
                  <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                    <p className="text-blue-300 font-medium">
                      {selectedMCPs.length} MCP server{selectedMCPs.length > 1 ? 's' : ''} selected
                    </p>
                    <p className="text-blue-400/70 text-sm">
                      Your agents will prompt for API keys during setup. Zero configuration needed.
                    </p>
                  </div>
                )}
              </>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                {/* Selected Items */}
                <div className="bg-slate-800/50 border border-white/10 rounded-xl p-6">
                  <h3 className="font-semibold text-white mb-4">Your Complete AI Team</h3>

                  {/* Orchestrator */}
                  {selectedOrchestrator && (
                    <div className="mb-4">
                      <p className="text-sm text-slate-400 mb-2">Orchestrator</p>
                      {displayOrchestrators.filter(o => o.id === selectedOrchestrator).map(o => (
                        <div key={o.id} className="flex items-center justify-between py-2">
                          <span className="font-medium text-white">{o.name} ({getRole(o)})</span>
                          <span className="font-semibold text-white">{formatPrice(o.price_cents)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Team Members */}
                  {selectedTeam.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm text-slate-400 mb-2">Team Members</p>
                      {displayTeamMembers.filter(t => selectedTeam.includes(t.id)).map(t => (
                        <div key={t.id} className="flex items-center justify-between py-2">
                          <span className="font-medium text-white">{t.name} ({getRole(t)})</span>
                          <span className="font-semibold text-white">{formatPrice(t.price_cents)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* MCP Servers */}
                  {selectedMCPs.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm text-slate-400 mb-2">MCP Servers</p>
                      {displayMcpServers.filter(m => selectedMCPs.includes(m.id)).map(m => (
                        <div key={m.id} className="flex items-center justify-between py-2">
                          <span className="font-medium text-white">{m.name}</span>
                          <span className="font-semibold text-white">{formatPrice(m.price_cents)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Pricing */}
                  <div className="mt-6 pt-4 border-t border-white/10">
                    <div className="flex justify-between text-slate-400 mb-2">
                      <span>Subtotal</span>
                      <span>{formatPrice(Math.round(total * 100))}</span>
                    </div>
                    {bundleDiscount > 0 && (
                      <div className="flex justify-between text-green-400 mb-2">
                        <span>Bundle Discount (15%)</span>
                        <span>-{formatPrice(Math.round(bundleDiscount * 100))}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold text-white text-lg pt-2 border-t border-white/10">
                      <span>Total</span>
                      <span>{formatPrice(Math.round(finalTotal * 100))}</span>
                    </div>
                    {selectedItems.length >= 3 && (
                      <p className="text-sm text-green-400 mt-2">🎉 Bundle discount applied!</p>
                    )}
                  </div>
                </div>

                {/* Email & Checkout */}
                <div className="bg-slate-800/50 border border-white/10 rounded-xl p-6">
                  <h3 className="font-semibold text-white mb-4">Ready to deploy?</h3>
                  <p className="text-slate-400 text-sm mb-4">
                    Enter your email and we&apos;ll send you everything you need for one-click OpenClaw setup.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="flex-1 px-4 py-3 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={handleCheckout}
                      disabled={!email || selectedItems.length === 0}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Checkout
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <button
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
                className="px-6 py-3 rounded-lg border border-slate-600 text-slate-300 font-medium hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                Back
              </button>
              
              {currentStep < steps.length - 1 ? (
                <button
                  onClick={() => setCurrentStep(currentStep + 1)}
                  disabled={currentStep === 0 && !selectedOrchestrator}
                  className="px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  Continue
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
