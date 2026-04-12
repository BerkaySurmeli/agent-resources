import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { useCart } from '../context/CartContext';
import Logo from '../components/Logo';

const steps = [
  { id: 'orchestrator', title: 'Choose Your Orchestrator', description: 'Select a project manager to coordinate your AI team' },
  { id: 'team', title: 'Build Your Team', description: 'Add specialists to handle specific tasks' },
  { id: 'mcp', title: 'Add MCP Servers', description: 'Supercharge your team with tools and integrations' },
  { id: 'review', title: 'Review & Download', description: 'One-click setup for your complete AI team' },
];

const orchestrators = [
  { slug: 'claudia-project-manager', name: 'Claudia', role: 'Project Manager', price: 49, description: 'Coordinates projects, delegates tasks, tracks progress', icon: 'clipboard' },
];

const teamMembers = [
  { slug: 'chen-developer', name: 'Chen', role: 'Developer', category: 'development', price: 59, description: 'Writes code, builds features, fixes bugs', icon: 'code' },
  { slug: 'adrian-ux-designer', name: 'Adrian', role: 'UX Designer', category: 'design', price: 49, description: 'Designs interfaces, writes copy, creates experiences', icon: 'palette' },
  { slug: 'content-marketer', name: 'Maya', role: 'Content Marketer', category: 'marketing', price: 39, description: 'Creates content, manages social media, writes copy', icon: 'megaphone' },
  { slug: 'financial-analyst', name: 'Finn', role: 'Financial Analyst', category: 'finance', price: 45, description: 'Analyzes data, creates reports, provides insights', icon: 'chart' },
  { slug: 'hr-specialist', name: 'Hannah', role: 'HR Specialist', category: 'hr', price: 35, description: 'Manages people ops, onboarding, documentation', icon: 'users' },
  { slug: 'operations-manager', name: 'Oliver', role: 'Operations Manager', category: 'operations', price: 42, description: 'Streamlines processes, manages tools, optimizes workflows', icon: 'cog' },
];

const mcpServers = [
  { slug: 'mcp-github', name: 'GitHub', category: 'development', price: 0.99, description: 'Create repos, manage issues, review PRs, and search code', icon: 'github' },
  { slug: 'mcp-slack', name: 'Slack', category: 'communication', price: 0.99, description: 'Send messages, manage channels, and search conversations', icon: 'slack' },
  { slug: 'mcp-notion', name: 'Notion', category: 'productivity', price: 0.99, description: 'Create pages, manage databases, and search workspace', icon: 'notion' },
  { slug: 'mcp-linear', name: 'Linear', category: 'project-management', price: 0.99, description: 'Create issues, manage projects, and track progress', icon: 'linear' },
  { slug: 'mcp-postgres', name: 'PostgreSQL', category: 'database', price: 0.99, description: 'Query databases, analyze data, and generate reports', icon: 'database' },
  { slug: 'mcp-puppeteer', name: 'Puppeteer', category: 'automation', price: 0.99, description: 'Web scraping, screenshots, and browser automation', icon: 'browser' },
  { slug: 'mcp-filesystem', name: 'File System', category: 'utilities', price: 0.99, description: 'Read, write, and manage files with intelligent search', icon: 'folder' },
  { slug: 'mcp-fetch', name: 'Fetch', category: 'utilities', price: 0.99, description: 'Make HTTP requests and fetch data from any API', icon: 'globe' },
  { slug: 'mcp-brave', name: 'Brave Search', category: 'research', price: 0.99, description: 'Web search with privacy-focused results', icon: 'search' },
  { slug: 'mcp-weather', name: 'Weather', category: 'utilities', price: 0.99, description: 'Get current weather and forecasts for any location', icon: 'cloud' },
  { slug: 'mcp-calendar', name: 'Google Calendar', category: 'productivity', price: 0.99, description: 'Schedule meetings, check availability, manage events', icon: 'calendar' },
  { slug: 'mcp-gmail', name: 'Gmail', category: 'communication', price: 0.99, description: 'Send emails, search inbox, manage labels', icon: 'mail' },
];

const sortOptions = [
  { id: 'popular', label: 'Most Popular' },
  { id: 'price-low', label: 'Price: Low to High' },
  { id: 'price-high', label: 'Price: High to Low' },
  { id: 'name', label: 'Name: A-Z' },
];

export default function Wizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedOrchestrator, setSelectedOrchestrator] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string[]>([]);
  const [selectedMCPs, setSelectedMCPs] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('popular');
  const [email, setEmail] = useState('');
  const { addToCart } = useCart();

  const toggleTeamMember = (slug: string) => {
    setSelectedTeam(prev =>
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
    );
  };

  const toggleMCP = (slug: string) => {
    setSelectedMCPs(prev =>
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
    );
  };

  const sortedTeam = [...teamMembers].sort((a, b) => {
    switch (sortBy) {
      case 'price-low': return a.price - b.price;
      case 'price-high': return b.price - a.price;
      case 'name': return a.name.localeCompare(b.name);
      default: return 0;
    }
  });

  const selectedItems = [
    ...(selectedOrchestrator ? orchestrators.filter(o => o.slug === selectedOrchestrator) : []),
    ...teamMembers.filter(t => selectedTeam.includes(t.slug)),
    ...mcpServers.filter(m => selectedMCPs.includes(m.slug))
  ];

  const total = selectedItems.reduce((sum, item) => sum + item.price, 0);
  const bundleDiscount = selectedItems.length >= 3 ? Math.round(total * 0.15) : 0;
  const finalTotal = total - bundleDiscount;

  const handleCheckout = () => {
    // Add all items to cart
    selectedItems.forEach(item => {
      addToCart({
        slug: item.slug,
        name: item.name,
        price: Number(item.price.toFixed(2)),
        category: 'persona'
      });
    });
    window.location.href = '/cart';
  };

  // Helper function to format prices with 2 decimal places
  const formatPrice = (price: number) => `$${price.toFixed(2)}`;

  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>Build Your AI Team | Agent Resources</title>
      </Head>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-slate-200 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Logo variant="full" size="md" className="text-slate-900" />
          </Link>
          <Link href="/" className="text-slate-600 hover:text-slate-900">Exit Wizard</Link>
        </div>
      </nav>

      <main className="pt-24 pb-12 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl font-semibold text-slate-900 mb-2">Build Your AI Team</h1>
            <p className="text-slate-600">New to OpenClaw? Let's set up your complete AI workforce.</p>
          </div>

          {/* Progress */}
          <div className="flex items-center justify-center mb-12">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  index <= currentStep ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
                }`}>
                  {index < currentStep ? '✓' : index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-1 mx-2 ${
                    index < currentStep ? 'bg-blue-600' : 'bg-slate-200'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="bg-slate-50 rounded-2xl p-8">
            <h2 className="text-2xl font-semibold text-slate-900 mb-2">{steps[currentStep].title}</h2>
            <p className="text-slate-600 mb-8">{steps[currentStep].description}</p>

            {currentStep === 0 && (
              <div className="grid md:grid-cols-2 gap-6">
                {orchestrators.map(orch => (
                  <button
                    key={orch.slug}
                    onClick={() => setSelectedOrchestrator(orch.slug)}
                    className={`p-6 rounded-xl border-2 text-left transition-all ${
                      selectedOrchestrator === orch.slug
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-slate-200 bg-white hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <span className="text-2xl font-bold text-slate-900">{formatPrice(orch.price)}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">{orch.name}</h3>
                    <p className="text-blue-600 text-sm mb-2">{orch.role}</p>
                    <p className="text-slate-600 text-sm">{orch.description}</p>
                  </button>
                ))}
              </div>
            )}

            {currentStep === 1 && (
              <>
                {/* Sort */}
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-sm text-slate-500">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
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
                      key={member.slug}
                      onClick={() => toggleTeamMember(member.slug)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        selectedTeam.includes(member.slug)
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-slate-200 bg-white hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-slate-900">{member.name}</h3>
                          <p className="text-blue-600 text-sm">{member.role}</p>
                          <p className="text-slate-600 text-sm mt-1">{member.description}</p>
                        </div>
                        <div className="text-right">
                          <span className="font-semibold text-slate-900">{formatPrice(member.price)}</span>
                          {selectedTeam.includes(member.slug) && (
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
                <p className="text-slate-600 mb-6">
                  MCP (Model Context Protocol) servers give your AI team superpowers. Each server adds new capabilities like searching the web, managing databases, or automating tasks. Only $0.99 each with 1-click installation.
                </p>

                {/* MCP Categories */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {mcpServers.map(mcp => (
                    <button
                      key={mcp.slug}
                      onClick={() => toggleMCP(mcp.slug)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        selectedMCPs.includes(mcp.slug)
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-slate-200 bg-white hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900">{mcp.name}</h3>
                          <p className="text-blue-600 text-sm capitalize">{mcp.category}</p>
                          <p className="text-slate-600 text-sm mt-1">{mcp.description}</p>
                        </div>
                        <div className="text-right ml-2">
                          <span className="font-semibold text-slate-900">{formatPrice(mcp.price)}</span>
                          {selectedMCPs.includes(mcp.slug) && (
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
                  <div className="mt-6 p-4 bg-blue-50 rounded-xl">
                    <p className="text-blue-800 font-medium">
                      {selectedMCPs.length} MCP server{selectedMCPs.length > 1 ? 's' : ''} selected
                    </p>
                    <p className="text-blue-600 text-sm">
                      Your agents will prompt for API keys during setup. Zero configuration needed.
                    </p>
                  </div>
                )}
              </>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                {/* Selected Items */}
                <div className="bg-white rounded-xl p-6">
                  <h3 className="font-semibold text-slate-900 mb-4">Your Complete AI Team</h3>

                  {/* Orchestrator */}
                  {selectedOrchestrator && (
                    <div className="mb-4">
                      <p className="text-sm text-slate-500 mb-2">Orchestrator</p>
                      {orchestrators.filter(o => o.slug === selectedOrchestrator).map(o => (
                        <div key={o.slug} className="flex items-center justify-between py-2">
                          <span className="font-medium text-slate-900">{o.name} ({o.role})</span>
                          <span className="font-semibold">{formatPrice(o.price)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Team Members */}
                  {selectedTeam.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm text-slate-500 mb-2">Team Members</p>
                      {teamMembers.filter(t => selectedTeam.includes(t.slug)).map(t => (
                        <div key={t.slug} className="flex items-center justify-between py-2">
                          <span className="font-medium text-slate-900">{t.name} ({t.role})</span>
                          <span className="font-semibold">{formatPrice(t.price)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* MCP Servers */}
                  {selectedMCPs.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm text-slate-500 mb-2">MCP Servers</p>
                      {mcpServers.filter(m => selectedMCPs.includes(m.slug)).map(m => (
                        <div key={m.slug} className="flex items-center justify-between py-2">
                          <span className="font-medium text-slate-900">{m.name}</span>
                          <span className="font-semibold">{formatPrice(m.price)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Pricing */}
                  <div className="mt-6 pt-4 border-t border-slate-200">
                    <div className="flex justify-between text-slate-600 mb-2">
                      <span>Subtotal</span>
                      <span>{formatPrice(total)}</span>
                    </div>
                    {bundleDiscount > 0 && (
                      <div className="flex justify-between text-green-600 mb-2">
                        <span>Bundle Discount (15%)</span>
                        <span>-{formatPrice(bundleDiscount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold text-slate-900 text-lg pt-2 border-t border-slate-200">
                      <span>Total</span>
                      <span>{formatPrice(finalTotal)}</span>
                    </div>
                    {selectedItems.length >= 3 && (
                      <p className="text-sm text-green-600 mt-2">🎉 Bundle discount applied!</p>
                    )}
                  </div>
                </div>

                {/* Email & Checkout */}
                <div className="bg-white rounded-xl p-6">
                  <h3 className="font-semibold text-slate-900 mb-4">Ready to deploy?</h3>
                  <p className="text-slate-600 text-sm mb-4">
                    Enter your email and we'll send you everything you need for one-click OpenClaw setup.
                  </p>
                  <div className="flex gap-3">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="flex-1 px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={handleCheckout}
                      disabled={!email}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
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
                className="px-6 py-3 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
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
