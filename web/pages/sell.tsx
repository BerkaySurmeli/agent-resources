import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const categories = [
  { id: 'personas', name: 'AI Persona', description: 'A complete AI worker with specific skills and personality' },
  { id: 'skills', name: 'Agent Skill', description: 'A specific capability or workflow for an AI agent' },
  { id: 'mcps', name: 'MCP Server', description: 'Infrastructure that connects agents to external systems' },
];

const tags = [
  'Executive', 'Finance', 'Growth', 'HR', 'Legal', 'Marketing',
  'Ops', 'Personal', 'Product', 'Productivity', 'Research', 'Sales', 'Support'
];

export default function Sell() {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    category: 'personas',
    description: '',
    price: '',
    tags: [] as string[],
    oneClickConfig: '',
  });
  const [submitting, setSubmitting] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 mb-4">Please sign in to sell listings</p>
          <Link href="/login" className="text-blue-600 hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async () => {
    setSubmitting(true);
    // TODO: Submit to API
    await new Promise(resolve => setTimeout(resolve, 1000));
    alert('Listing submitted for review!');
    window.location.href = '/listings';
  };

  const toggleTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>Sell a Listing | Agent Resources</title>
      </Head>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-slate-200 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">AR</span>
            </div>
            <span className="font-semibold text-slate-900">Agent Resources</span>
          </Link>
          <Link href="/listings" className="text-slate-600 hover:text-slate-900">Browse</Link>
        </div>
      </nav>

      <main className="pt-24 pb-12 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-semibold text-slate-900 mb-2">Sell a Listing</h1>
          <p className="text-slate-600 mb-8">Create and publish your AI persona, skill, or MCP server</p>

          {/* Progress */}
          <div className="flex items-center gap-4 mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                  s <= step ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
                }`}>
                  {s}
                </div>
                {s < 3 && <div className={`w-12 h-1 ${s < step ? 'bg-blue-600' : 'bg-slate-200'}`} />}
              </div>
            ))}
          </div>

          <div className="bg-slate-50 rounded-2xl p-8">
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-slate-900">What are you selling?</h2>
                
                <div className="space-y-4">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setFormData(prev => ({ ...prev, category: cat.id }))}
                      className={`w-full p-6 rounded-xl border-2 text-left transition-all ${
                        formData.category === cat.id
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-slate-200 bg-white hover:border-blue-300'
                      }`}
                    >
                      <h3 className="font-semibold text-slate-900 mb-1">{cat.name}</h3>
                      <p className="text-slate-600 text-sm">{cat.description}</p>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setStep(2)}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Continue
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-slate-900">Tell us about your listing</h2>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500"
                    placeholder="e.g., Social Media Manager"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500"
                    placeholder="Describe what your listing does and how it helps users..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Price (USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                      className="w-full pl-8 pr-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500"
                      placeholder="49"
                    />
                  </div>
                  <p className="text-sm text-slate-500 mt-1">
                    First 500 listings: No commission. After that: 15% platform fee.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {tags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                          formData.tags.includes(tag)
                            ? 'bg-blue-100 text-blue-700 border border-blue-300'
                            : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(1)}
                    className="px-6 py-3 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    disabled={!formData.name || !formData.description || !formData.price}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-slate-900">One-Click Config</h2>
                <p className="text-slate-600">
                  Provide the configuration that users will paste into their OpenClaw settings. 
                  This enables instant setup.
                </p>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    OpenClaw Configuration (JSON)
                  </label>
                  <textarea
                    value={formData.oneClickConfig}
                    onChange={(e) => setFormData(prev => ({ ...prev, oneClickConfig: e.target.value }))}
                    rows={8}
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 font-mono text-sm"
                    placeholder={`{\n  "persona": {\n    "name": "My Agent",\n    "role": "Assistant",\n    "system_prompt": "You are a helpful assistant..."\n  }\n}`}
                  />
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Security Notice:</strong> Your listing will be automatically scanned for 
                    malicious code before being published. This process typically takes a few minutes.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(2)}
                    className="px-6 py-3 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || !formData.oneClickConfig}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'Submit for Review'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
