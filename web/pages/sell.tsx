import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import Navbar from '../components/Navbar';

import { API_URL } from '../lib/api';

const categories = [
  { id: 'persona', name: 'AI Persona', description: 'A complete AI worker with specific skills and personality' },
  { id: 'skill', name: 'Agent Skill', description: 'A specific capability or workflow for an AI agent' },
  { id: 'mcp_server', name: 'MCP Server', description: 'Infrastructure that connects agents to external systems' },
];

const fileStructureGuide: Record<string, { required: string[], optional: string[], example: string }> = {
  persona: {
    required: ['PERSONA.md or SKILL.md'],
    optional: ['README.md', 'avatar.png', 'system-prompt.txt', 'knowledge/'],
    example: `my-persona/
├── PERSONA.md          # Required: Role definition, capabilities, communication style
├── README.md           # Optional: User-facing description
├── avatar.png          # Optional: Persona avatar image
└── knowledge/          # Optional: Reference documents
    └── guidelines.pdf`
  },
  skill: {
    required: ['SKILL.md'],
    optional: ['README.md', 'examples/', 'templates/'],
    example: `my-skill/
├── SKILL.md            # Required: Skill definition, usage, parameters
├── README.md           # Optional: User guide
└── examples/           # Optional: Example prompts and outputs
    └── example1.md`
  },
  mcp_server: {
    required: ['mcp.json or manifest.json'],
    optional: ['README.md', 'src/', 'config/'],
    example: `my-mcp-server/
├── mcp.json            # Required: MCP manifest with server info
├── README.md           # Optional: Setup instructions
└── src/                # Optional: Server source code
    └── server.js`
  }
};

const tags = [
  'Executive', 'Finance', 'Growth', 'HR', 'Legal', 'Marketing',
  'Ops', 'Personal', 'Product', 'Productivity', 'Research', 'Sales', 'Support'
];

export default function Sell() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    category: 'persona',
    description: '',
    price: '',
    version: '1.0.0',
    tags: [] as string[],
    files: [] as File[],
    termsAccepted: false,
    developerCode: '',
  });
  const [isDragging, setIsDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');

  if (authLoading) {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-terra-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-ink-500 mb-4">Please sign in to list an item</p>
          <Link href="/login" className="text-terra-600 hover:text-terra-700 font-medium">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (!user.isVerified) {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="heading-serif text-2xl text-ink-900 mb-4">Email Verification Required</h1>
          <p className="text-ink-500 mb-6">
            You must verify your email address before creating a listing.
            Please check your inbox for the verification link.
          </p>
          <div className="space-y-3">
            <Link
              href="/dashboard"
              className="btn-primary w-full justify-center"
            >
              Go to Dashboard
            </Link>
            <button
              onClick={() => window.location.reload()}
              className="btn-secondary w-full justify-center"
            >
              I've verified my email
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const detectCategoryFromFiles = (files: File[]): string | null => {
    const filenames = files.map(f => f.name.toLowerCase());
    if (filenames.some(name => name.endsWith('mcp.json') || name.endsWith('manifest.json'))) return 'mcp_server';
    if (filenames.some(name => name.endsWith('persona.md'))) return 'persona';
    if (filenames.some(name => name.endsWith('skill.md'))) return 'skill';
    return null;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    const detectedCategory = detectCategoryFromFiles(droppedFiles);
    if (detectedCategory && formData.category !== detectedCategory) {
      setFormData(prev => ({ ...prev, files: [...prev.files, ...droppedFiles], category: detectedCategory }));
    } else {
      setFormData(prev => ({ ...prev, files: [...prev.files, ...droppedFiles] }));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      const detectedCategory = detectCategoryFromFiles(selectedFiles);
      if (detectedCategory && formData.category !== detectedCategory) {
        setFormData(prev => ({ ...prev, files: [...prev.files, ...selectedFiles], category: detectedCategory }));
      } else {
        setFormData(prev => ({ ...prev, files: [...prev.files, ...selectedFiles] }));
      }
    }
  };

  const removeFile = (index: number) => {
    setFormData(prev => ({ ...prev, files: prev.files.filter((_, i) => i !== index) }));
  };

  const hasSkillMd = formData.files.some(f => f.name.toLowerCase().endsWith('skill.md'));
  const hasPersonaMd = formData.files.some(f => f.name.toLowerCase().endsWith('persona.md'));
  const hasMcpManifest = formData.files.some(f =>
    f.name.toLowerCase().endsWith('mcp.json') || f.name.toLowerCase().endsWith('manifest.json')
  );

  const hasRequiredFile = () => {
    switch (formData.category) {
      case 'skill': return hasSkillMd;
      case 'persona': return hasSkillMd || hasPersonaMd;
      case 'mcp_server': return hasMcpManifest;
      default: return hasSkillMd;
    }
  };

  const getCategoryMismatchWarning = (): string | null => {
    if (formData.files.length === 0) return null;
    const detected = detectCategoryFromFiles(formData.files);
    if (!detected || detected === formData.category) return null;
    const names: Record<string, string> = { skill: 'Agent Skill', persona: 'AI Persona', mcp_server: 'MCP Server' };
    return `Your files look like a ${names[detected]}, but you selected ${names[formData.category]}. The category has been auto-updated.`;
  };

  const totalSize = formData.files.reduce((acc, f) => acc + f.size, 0);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('ar-token');
      if (!token) throw new Error('Please sign in first');
      if (!formData.category) throw new Error('Please select a category');
      if (!formData.termsAccepted) throw new Error('Please accept the Terms and Conditions');

      if (!hasRequiredFile()) {
        const requiredFile = formData.category === 'skill' ? 'SKILL.md' :
          formData.category === 'persona' ? 'SKILL.md or PERSONA.md' : 'mcp.json or manifest.json';
        throw new Error(`Please include a ${requiredFile} file for ${formData.category} listings`);
      }

      const priceNum = parseFloat(formData.price);
      if (formData.price === '' || isNaN(priceNum) || priceNum < 0) {
        throw new Error('Please enter a valid price (0 for free)');
      }
      const priceCents = Math.round(priceNum * 100);

      const data = new FormData();
      data.append('name', formData.name);
      data.append('description', formData.description);
      data.append('category', formData.category);
      data.append('price_cents', String(priceCents));
      data.append('version', formData.version || '1.0.0');
      data.append('tags', JSON.stringify(formData.tags));

      if (formData.developerCode.trim()) {
        data.append('developer_code', formData.developerCode.trim());
      }

      formData.files.forEach(file => {
        data.append('files', file);
      });

      setUploadProgress(10);

      const response = await fetch(`${API_URL}/listings/create`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: data
      });

      setUploadProgress(80);

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Failed to create listing');
      }

      await response.json();
      setUploadProgress(100);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to submit listing');
      setSubmitting(false);
      setUploadProgress(0);
    }
  };

  const toggleTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter(t => t !== tag) : [...prev.tags, tag]
    }));
  };

  return (
    <div className="min-h-screen bg-cream-100">
      <Head>
        <title>List an Item | Agent Resources</title>
      </Head>

      <Navbar />

      <main className="pt-24 pb-12 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="heading-serif text-3xl text-ink-900 mb-1">List an Item</h1>
          <p className="text-ink-500 mb-8">Create and publish your AI persona, skill, or MCP server</p>

          {/* Progress Steps */}
          <div className="flex items-center gap-4 mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                  s <= step ? 'bg-terra-500 text-white' : 'bg-cream-200 text-ink-400'
                }`}>
                  {s}
                </div>
                {s < 3 && <div className={`w-12 h-0.5 transition-colors ${s < step ? 'bg-terra-500' : 'bg-cream-300'}`} />}
              </div>
            ))}
          </div>

          <div className="card p-8">
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-ink-900">What are you selling?</h2>

                <div className="space-y-3">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setFormData(prev => ({ ...prev, category: cat.id }))}
                      className={`w-full p-5 rounded-xl border-2 text-left transition-all ${
                        formData.category === cat.id
                          ? 'border-terra-400 bg-terra-50'
                          : 'border-cream-300 bg-white hover:border-terra-300'
                      }`}
                    >
                      <h3 className="font-semibold text-ink-900 mb-1">{cat.name}</h3>
                      <p className="text-ink-500 text-sm">{cat.description}</p>
                    </button>
                  ))}
                </div>

                <button onClick={() => setStep(2)} className="btn-primary w-full justify-center">
                  Continue
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-ink-900">Tell us about your listing</h2>

                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-2">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="input"
                    placeholder="e.g., Social Media Manager"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className="input"
                    placeholder="Describe what your listing does and how it helps users..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-2">Price (USD)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400">$</span>
                      <input
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                        className="input pl-8"
                        placeholder="49"
                      />
                    </div>
                    <p className="text-xs text-ink-400 mt-1">10% platform fee on sales</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-2">Version</label>
                    <input
                      type="text"
                      value={formData.version}
                      onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
                      className="input"
                      placeholder="1.0.0"
                    />
                    <p className="text-xs text-ink-400 mt-1">Semver format (e.g., 1.0.0)</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-2">Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {tags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1.5 rounded-full text-sm transition-colors border ${
                          formData.tags.includes(tag)
                            ? 'bg-terra-50 text-terra-700 border-terra-300'
                            : 'bg-white text-ink-500 border-cream-300 hover:border-terra-300'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Developer Code */}
                <div className="bg-cream-200/50 border border-cream-300 rounded-xl p-4">
                  <label className="block text-sm font-medium text-ink-700 mb-2">
                    Developer Code <span className="text-ink-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.developerCode}
                    onChange={(e) => setFormData(prev => ({ ...prev, developerCode: e.target.value.toUpperCase() }))}
                    className="input uppercase"
                    placeholder="ENTER CODE"
                  />
                  <p className="text-xs text-ink-400 mt-2">
                    Have a developer code? Enter it to get a $20 bonus after your first sale!
                  </p>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} className="btn-secondary px-6">
                    Back
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    disabled={!formData.name || !formData.description || !formData.price}
                    className="btn-primary flex-1 justify-center disabled:opacity-50"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-ink-900">Upload Your Files</h2>
                <p className="text-ink-500 text-sm">
                  {formData.category === 'mcp_server'
                    ? 'Drop a folder containing your mcp.json or manifest.json and any supporting files.'
                    : formData.category === 'persona'
                      ? 'Drop a folder containing your SKILL.md or PERSONA.md and any supporting files.'
                      : 'Drop a folder containing your SKILL.md and any supporting files.'}
                  {' '}Buyers will download this as a ZIP file.
                </p>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                )}

                {getCategoryMismatchWarning() && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <p className="text-amber-800 text-sm">{getCategoryMismatchWarning()}</p>
                    </div>
                  </div>
                )}

                {/* File Structure Guide */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <h3 className="text-sm font-medium text-blue-800 mb-2">
                    Required File Structure for {categories.find(c => c.id === formData.category)?.name}
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-blue-700 font-medium">Required:</p>
                      <p className="text-xs text-blue-600">{fileStructureGuide[formData.category]?.required.join(', ')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-700 font-medium">Optional:</p>
                      <p className="text-xs text-blue-600">{fileStructureGuide[formData.category]?.optional.join(', ')}</p>
                    </div>
                    <details className="mt-2">
                      <summary className="text-xs text-blue-700 cursor-pointer hover:text-blue-800">View example structure</summary>
                      <pre className="mt-2 p-2 bg-blue-100 rounded text-xs text-blue-700 overflow-x-auto">
                        {fileStructureGuide[formData.category]?.example}
                      </pre>
                    </details>
                  </div>
                </div>

                {/* Drop Zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                    isDragging
                      ? 'border-terra-400 bg-terra-50'
                      : 'border-cream-300 hover:border-terra-300 hover:bg-cream-200/30'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    {...{ webkitdirectory: '', directory: '' } as any}
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div className="w-12 h-12 bg-cream-200 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-ink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <p className="font-medium text-ink-900 mb-1">Drop a folder here</p>
                  <p className="text-sm text-ink-400 mb-4">
                    We keep folder paths and flatten the outer wrapper automatically
                  </p>
                  <button
                    type="button"
                    className="btn-secondary !py-1.5 !px-4 !text-sm"
                  >
                    Choose folder
                  </button>
                </div>

                {/* File List */}
                {formData.files.length > 0 && (
                  <div className="bg-cream-200/40 rounded-xl border border-cream-300 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-ink-700">
                        {formData.files.length} files • {(totalSize / 1024).toFixed(1)} KB
                      </span>
                      {hasRequiredFile() && (
                        <span className="badge bg-green-50 text-green-700 border border-green-200">
                          ✓ {formData.category === 'mcp_server' ? 'Manifest' : formData.category === 'persona' ? 'SKILL.md/PERSONA.md' : 'SKILL.md'} found
                        </span>
                      )}
                    </div>

                    {/* ZIP Preview */}
                    <div className="mb-3 p-3 bg-white rounded-lg border border-cream-200">
                      <p className="text-xs font-medium text-ink-400 mb-2">ZIP Structure Preview:</p>
                      <ul className="space-y-1 max-h-32 overflow-y-auto text-xs font-mono">
                        {formData.files.map((file, index) => {
                          const pathParts = file.name.split('/');
                          const displayPath = pathParts.length > 1 ? pathParts.slice(1).join('/') : file.name;
                          return (
                            <li key={index} className="flex items-center gap-2">
                              <span className="text-ink-400">📄</span>
                              <span className="text-ink-500 truncate">{displayPath}</span>
                              <span className="text-ink-300 ml-auto">({(file.size / 1024).toFixed(1)} KB)</span>
                            </li>
                          );
                        })}
                      </ul>
                      {formData.files.some(f => f.name.includes('/')) && (
                        <p className="text-xs text-amber-700 mt-2">
                          ⚠️ Files in subfolders will be flattened in the ZIP (outer folder removed)
                        </p>
                      )}
                    </div>

                    <ul className="space-y-2 max-h-32 overflow-y-auto border-t border-cream-200 pt-3">
                      {formData.files.map((file, index) => (
                        <li key={index} className="flex items-center justify-between text-sm">
                          <span className="text-ink-500 truncate">{file.name}</span>
                          <button onClick={() => removeFile(index)} className="text-red-500 hover:text-red-600 ml-2">
                            ×
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Validation */}
                <div className="bg-cream-200/40 rounded-xl border border-cream-300 p-4">
                  <h3 className="text-sm font-medium text-ink-700 mb-2">Checklist</h3>
                  <ul className="space-y-1 text-sm">
                    <li className={formData.name ? 'text-green-700' : 'text-ink-400'}>
                      {formData.name ? '✓' : '○'} Name is required
                    </li>
                    <li className={formData.files.length > 0 ? 'text-green-700' : 'text-ink-400'}>
                      {formData.files.length > 0 ? '✓' : '○'} Add at least one file
                    </li>
                    <li className={hasRequiredFile() ? 'text-green-700' : 'text-ink-400'}>
                      {hasRequiredFile() ? '✓' : '○'} {formData.category === 'mcp_server' ? 'mcp.json or manifest.json' : formData.category === 'persona' ? 'SKILL.md or PERSONA.md' : 'SKILL.md'} is required
                    </li>
                    <li className={formData.termsAccepted ? 'text-green-700' : 'text-ink-400'}>
                      {formData.termsAccepted ? '✓' : '○'} Accept the{' '}
                      <Link href="/terms" target="_blank" className="underline text-terra-600">Terms and Conditions</Link>
                    </li>
                  </ul>
                </div>

                {/* Terms */}
                <div className="bg-cream-200/40 rounded-xl border border-cream-300 p-4">
                  <h3 className="text-sm font-medium text-ink-700 mb-3">Terms & Conditions</h3>
                  <label className="flex items-start gap-3 mb-4 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.termsAccepted}
                      onChange={(e) => setFormData(prev => ({ ...prev, termsAccepted: e.target.checked }))}
                      className="mt-1 w-4 h-4 text-terra-500 rounded border-cream-400 accent-terra-500"
                    />
                    <span className="text-sm text-ink-600">
                      I have the rights to this item and agree to the{' '}
                      <Link href="/terms" target="_blank" className="text-terra-600 hover:text-terra-700 underline">Terms and Conditions</Link>
                    </span>
                  </label>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-start gap-3">
                      <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <p className="text-sm text-blue-700">
                        Your files will be scanned for security before being published. This process typically takes a few minutes.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Submit */}
                {submitting ? (
                  <div className="bg-cream-200/40 rounded-xl border border-cream-300 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-ink-700">Uploading...</span>
                      <span className="text-sm text-ink-400">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-cream-200 rounded-full h-2">
                      <div
                        className="bg-terra-500 h-2 rounded-full transition-all"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <button onClick={() => setStep(2)} className="btn-secondary px-6">
                      Back
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={submitting || formData.files.length === 0 || !formData.termsAccepted || !hasRequiredFile()}
                      className="btn-primary flex-1 justify-center disabled:opacity-50"
                    >
                      Submit for Security Review
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
