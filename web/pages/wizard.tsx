import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { API_URL } from '../lib/api';

const BUNDLE_DISCOUNT_RATE = 0.15;
const BUNDLE_MIN_ITEMS = 3;

const steps = [
  { id: 'orchestrator', title: 'Choose Your Orchestrator', description: 'Pick a project manager to coordinate your AI team' },
  { id: 'team',         title: 'Add Specialists',          description: 'Bring in personas to handle specific domains' },
  { id: 'skills',       title: 'Equip with Skills',        description: 'Add reusable capabilities your agents can call on' },
  { id: 'mcp',          title: 'Connect MCP Servers',      description: 'Wire up tools: databases, APIs, web search, and more' },
  { id: 'review',       title: 'Review & Checkout',        description: 'Your complete AI team, ready to deploy' },
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
  quality_score?: number;
  download_count?: number;
  seller?: { name: string };
}

const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

function CategoryIcon({ category }: { category: string }) {
  if (category === 'persona') return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
  if (category === 'skill') return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
    </svg>
  );
}

function CheckBadge() {
  return (
    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
      style={{ background: 'linear-gradient(135deg, #3549D4, #6470FA)' }}>
      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
      </svg>
    </div>
  );
}

interface CardProps {
  listing: Listing;
  selected: boolean;
  onToggle: () => void;
  radio?: boolean;
}

function ListingCard({ listing, selected, onToggle, radio = false }: CardProps) {
  return (
    <button
      onClick={onToggle}
      className={`p-4 rounded-xl border-2 text-left w-full transition-all ${
        selected
          ? 'border-brand bg-blue-50/50'
          : 'border-cream-200 bg-white hover:border-cream-300'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-white"
          style={{ background: 'linear-gradient(135deg, #3549D4, #6470FA)' }}>
          <CategoryIcon category={listing.category} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-ink-900 text-sm leading-snug">{listing.name}</h3>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="font-semibold text-ink-900 text-sm">{formatPrice(listing.price_cents)}</span>
              {selected && <CheckBadge />}
            </div>
          </div>
          {listing.seller?.name && (
            <p className="text-xs text-ink-400 mt-0.5">by {listing.seller.name}</p>
          )}
          <p className="text-ink-500 text-xs mt-1.5 line-clamp-2 leading-relaxed">{listing.description}</p>
          {listing.tags && listing.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {listing.tags.slice(0, 3).map(tag => (
                <span key={tag} className="text-xs px-1.5 py-0.5 bg-cream-200 text-ink-500 rounded-md">{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

function EmptyStep({ label }: { label: string }) {
  return (
    <div className="text-center py-14 text-ink-400">
      <div className="w-12 h-12 bg-cream-200 rounded-xl flex items-center justify-center mx-auto mb-3">
        <svg className="w-6 h-6 text-ink-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      </div>
      <p className="text-sm mb-3">No {label} available yet.</p>
      <Link href="/listings" className="text-sm text-terra-600 hover:text-terra-700 font-medium">
        Browse all listings →
      </Link>
    </div>
  );
}

export default function Wizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedOrchestrator, setSelectedOrchestrator] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam]   = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedMCPs, setSelectedMCPs]   = useState<string[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const { addToCart } = useCart();
  const { user } = useAuth();

  useEffect(() => {
    fetch(`${API_URL}/listings/public`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => setListings(Array.isArray(data) ? data : (data.listings ?? [])))
      .catch(() => setError('Failed to load listings. Please refresh.'))
      .finally(() => setLoading(false));
  }, []);

  // Separate listings into roles
  const orchestrators = useMemo(() => listings.filter(l =>
    l.category === 'persona' &&
    l.virus_scan_status === 'clean' &&
    (l.tags?.some(t => ['orchestrator', 'project-manager', 'coordinator'].includes(t)) ||
     /orchestrat|project.manag|coordinator/i.test(l.name))
  ), [listings]);

  const orchestratorIds = useMemo(() => new Set(orchestrators.map(o => o.id)), [orchestrators]);

  const teamMembers = useMemo(() => listings.filter(l =>
    l.category === 'persona' &&
    l.virus_scan_status === 'clean' &&
    !orchestratorIds.has(l.id)
  ), [listings, orchestratorIds]);

  const skills = useMemo(() => listings.filter(l =>
    l.category === 'skill' &&
    l.virus_scan_status === 'clean'
  ), [listings]);

  const mcpServers = useMemo(() => listings.filter(l =>
    l.category === 'mcp_server' &&
    l.virus_scan_status === 'clean'
  ), [listings]);

  const toggle = (id: string, list: string[], setter: (v: string[]) => void) => {
    setter(list.includes(id) ? list.filter(x => x !== id) : [...list, id]);
  };

  // Build the selected items list for the sidebar and review
  const selectedItems = useMemo(() => [
    ...orchestrators.filter(o => o.id === selectedOrchestrator),
    ...teamMembers.filter(t => selectedTeam.includes(t.id)),
    ...skills.filter(s => selectedSkills.includes(s.id)),
    ...mcpServers.filter(m => selectedMCPs.includes(m.id)),
  ], [selectedOrchestrator, selectedTeam, selectedSkills, selectedMCPs, orchestrators, teamMembers, skills, mcpServers]);

  const subtotalCents = selectedItems.reduce((s, i) => s + i.price_cents, 0);
  const discountCents = selectedItems.length >= BUNDLE_MIN_ITEMS
    ? Math.round(subtotalCents * BUNDLE_DISCOUNT_RATE)
    : 0;
  const totalCents = subtotalCents - discountCents;

  const canAdvance = currentStep === 0 ? !!selectedOrchestrator : true;

  const handleCheckout = () => {
    selectedItems.forEach(item =>
      addToCart({ id: item.id, slug: item.slug, name: item.name, price: item.price_cents / 100, category: item.category })
    );
    // Pass bundle discount info to cart via sessionStorage so cart can apply it
    if (discountCents > 0) {
      sessionStorage.setItem('ar-bundle-discount', JSON.stringify({
        discountCents,
        subtotalCents,
        itemCount: selectedItems.length,
      }));
    }
    window.location.href = '/cart';
  };

  if (loading) return (
    <div className="min-h-screen bg-cream-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-terra-500 mx-auto mb-3" />
        <p className="text-ink-400 text-sm">Loading available agents...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-cream-100">
      <Head>
        <title>Build Your AI Team | Agent Resources</title>
        <meta name="description" content="Assemble a complete AI team — pick an orchestrator, add specialists, skills, and MCP servers in minutes." />
      </Head>

      <Navbar />

      <main className="pt-20 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="heading-serif text-3xl md:text-4xl text-ink-900 mb-2">Build Your AI Team</h1>
            <p className="text-ink-500">Assemble a complete AI workforce in minutes.{' '}
              {selectedItems.length >= BUNDLE_MIN_ITEMS
                ? <span className="text-green-700 font-medium">Bundle discount active — 15% off!</span>
                : <span className="text-ink-400">Add {BUNDLE_MIN_ITEMS}+ items for a 15% bundle discount.</span>
              }
            </p>
          </div>

          {/* Progress bar */}
          <div className="flex items-center justify-center mb-10 gap-0">
            {steps.map((step, i) => (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => i < currentStep && setCurrentStep(i)}
                  disabled={i > currentStep}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                    i < currentStep
                      ? 'bg-brand text-white cursor-pointer hover:opacity-80'
                      : i === currentStep
                        ? 'bg-brand text-white ring-4 ring-blue-100'
                        : 'bg-cream-200 text-ink-400 cursor-default'
                  }`}
                >
                  {i < currentStep ? (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : i + 1}
                </button>
                {i < steps.length - 1 && (
                  <div className={`w-12 h-0.5 transition-colors ${i < currentStep ? 'bg-brand' : 'bg-cream-200'}`} />
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-6 items-start">
            {/* Main panel */}
            <div className="flex-1 min-w-0">
              <div className="card p-6 sm:p-8">
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-ink-900">{steps[currentStep].title}</h2>
                  <p className="text-ink-500 text-sm mt-0.5">{steps[currentStep].description}</p>
                </div>

                {error && (
                  <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
                )}

                {/* Step 0 — Orchestrator */}
                {currentStep === 0 && (
                  orchestrators.length === 0
                    ? <EmptyStep label="orchestrators" />
                    : (
                      <div className="grid sm:grid-cols-2 gap-3">
                        {orchestrators.map(o => (
                          <ListingCard
                            key={o.id}
                            listing={o}
                            selected={selectedOrchestrator === o.id}
                            onToggle={() => setSelectedOrchestrator(selectedOrchestrator === o.id ? null : o.id)}
                            radio
                          />
                        ))}
                      </div>
                    )
                )}

                {/* Step 1 — Team */}
                {currentStep === 1 && (
                  teamMembers.length === 0
                    ? <EmptyStep label="specialist personas" />
                    : (
                      <>
                        <div className="grid sm:grid-cols-2 gap-3">
                          {teamMembers.map(m => (
                            <ListingCard
                              key={m.id}
                              listing={m}
                              selected={selectedTeam.includes(m.id)}
                              onToggle={() => toggle(m.id, selectedTeam, setSelectedTeam)}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-ink-400 mt-4 text-center">Optional — you can skip this step</p>
                      </>
                    )
                )}

                {/* Step 2 — Skills */}
                {currentStep === 2 && (
                  skills.length === 0
                    ? <EmptyStep label="skills" />
                    : (
                      <>
                        <div className="grid sm:grid-cols-2 gap-3">
                          {skills.map(s => (
                            <ListingCard
                              key={s.id}
                              listing={s}
                              selected={selectedSkills.includes(s.id)}
                              onToggle={() => toggle(s.id, selectedSkills, setSelectedSkills)}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-ink-400 mt-4 text-center">Optional — you can skip this step</p>
                      </>
                    )
                )}

                {/* Step 3 — MCP */}
                {currentStep === 3 && (
                  mcpServers.length === 0
                    ? <EmptyStep label="MCP servers" />
                    : (
                      <>
                        <div className="grid sm:grid-cols-2 gap-3">
                          {mcpServers.map(m => (
                            <ListingCard
                              key={m.id}
                              listing={m}
                              selected={selectedMCPs.includes(m.id)}
                              onToggle={() => toggle(m.id, selectedMCPs, setSelectedMCPs)}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-ink-400 mt-4 text-center">Optional — you can skip this step</p>
                      </>
                    )
                )}

                {/* Step 4 — Review */}
                {currentStep === 4 && (
                  <div className="space-y-5">
                    {selectedItems.length === 0 ? (
                      <div className="text-center py-10 text-ink-400">
                        <p className="mb-3 text-sm">You haven't selected anything yet.</p>
                        <button onClick={() => setCurrentStep(0)} className="text-sm text-terra-600 hover:text-terra-700 font-medium">
                          ← Start building
                        </button>
                      </div>
                    ) : (
                      <>
                        {/* Grouped items */}
                        {[
                          { label: 'Orchestrator', items: orchestrators.filter(o => o.id === selectedOrchestrator) },
                          { label: 'Specialists',  items: teamMembers.filter(t => selectedTeam.includes(t.id)) },
                          { label: 'Skills',       items: skills.filter(s => selectedSkills.includes(s.id)) },
                          { label: 'MCP Servers',  items: mcpServers.filter(m => selectedMCPs.includes(m.id)) },
                        ].filter(g => g.items.length > 0).map(group => (
                          <div key={group.label}>
                            <p className="text-xs font-medium text-ink-400 uppercase tracking-wider mb-2">{group.label}</p>
                            <div className="space-y-1.5">
                              {group.items.map(item => (
                                <div key={item.id} className="flex items-center justify-between py-1.5 px-3 bg-cream-100 rounded-lg">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 text-white"
                                      style={{ background: 'linear-gradient(135deg, #3549D4, #6470FA)' }}>
                                      <CategoryIcon category={item.category} />
                                    </div>
                                    <span className="text-sm text-ink-800 truncate">{item.name}</span>
                                  </div>
                                  <span className="text-sm font-medium text-ink-700 flex-shrink-0 ml-3">{formatPrice(item.price_cents)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}

                        {/* Totals */}
                        <div className="pt-4 border-t border-cream-200 space-y-2">
                          <div className="flex justify-between text-sm text-ink-500">
                            <span>Subtotal ({selectedItems.length} items)</span>
                            <span>{formatPrice(subtotalCents)}</span>
                          </div>
                          {discountCents > 0 && (
                            <div className="flex justify-between text-sm text-green-700">
                              <span>Bundle discount (15% off)</span>
                              <span>−{formatPrice(discountCents)}</span>
                            </div>
                          )}
                          <div className="flex justify-between font-semibold text-ink-900 pt-2 border-t border-cream-200">
                            <span>Total</span>
                            <span>{formatPrice(totalCents)}</span>
                          </div>
                        </div>

                        <button
                          onClick={handleCheckout}
                          className="btn-primary w-full justify-center"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          Add to Cart & Checkout
                        </button>
                        {!user && (
                          <p className="text-xs text-ink-400 text-center">
                            You can checkout as a guest — no account needed.
                          </p>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Navigation */}
                <div className="flex justify-between mt-8 pt-5 border-t border-cream-200">
                  <button
                    onClick={() => setCurrentStep(s => Math.max(0, s - 1))}
                    disabled={currentStep === 0}
                    className="btn-secondary disabled:opacity-40"
                  >
                    Back
                  </button>
                  {currentStep < steps.length - 1 && (
                    <button
                      onClick={() => setCurrentStep(s => s + 1)}
                      disabled={!canAdvance}
                      className="btn-primary disabled:opacity-40"
                    >
                      {currentStep === 0 && !selectedOrchestrator ? 'Select an orchestrator first' : 'Continue →'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Sticky sidebar — selection summary */}
            <div className="hidden lg:block w-72 flex-shrink-0">
              <div className="card p-5 lg:sticky lg:top-24">
                <h3 className="text-sm font-semibold text-ink-700 mb-4">Your Team</h3>

                {selectedItems.length === 0 ? (
                  <p className="text-xs text-ink-400 text-center py-4">Nothing selected yet</p>
                ) : (
                  <div className="space-y-1.5 mb-4">
                    {selectedItems.map(item => (
                      <div key={item.id} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 text-white"
                            style={{ background: 'linear-gradient(135deg, #3549D4, #6470FA)' }}>
                            <CategoryIcon category={item.category} />
                          </div>
                          <span className="text-xs text-ink-700 truncate">{item.name}</span>
                        </div>
                        <span className="text-xs text-ink-500 flex-shrink-0">{formatPrice(item.price_cents)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {selectedItems.length > 0 && (
                  <div className="border-t border-cream-200 pt-3 space-y-1.5">
                    <div className="flex justify-between text-xs text-ink-500">
                      <span>Subtotal</span>
                      <span>{formatPrice(subtotalCents)}</span>
                    </div>
                    {discountCents > 0 && (
                      <div className="flex justify-between text-xs text-green-700 font-medium">
                        <span>Bundle −15%</span>
                        <span>−{formatPrice(discountCents)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-semibold text-ink-900 pt-1">
                      <span>Total</span>
                      <span>{formatPrice(totalCents)}</span>
                    </div>

                    {selectedItems.length < BUNDLE_MIN_ITEMS && (
                      <p className="text-xs text-ink-400 mt-2 leading-relaxed">
                        Add {BUNDLE_MIN_ITEMS - selectedItems.length} more item{BUNDLE_MIN_ITEMS - selectedItems.length > 1 ? 's' : ''} for 15% off
                      </p>
                    )}

                    {currentStep === steps.length - 1 && (
                      <button onClick={handleCheckout} className="btn-primary w-full justify-center mt-3 !py-2 !text-sm">
                        Checkout
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
