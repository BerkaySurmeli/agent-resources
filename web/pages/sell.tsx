import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';

import { API_URL } from '../lib/api';

const categories = [
  { id: 'persona', name: 'AI Persona', description: 'A complete AI worker with specific skills and personality' },
  { id: 'skill', name: 'Agent Skill', description: 'A specific capability or workflow for an AI agent' },
  { id: 'mcp_server', name: 'MCP Server', description: 'Infrastructure that connects agents to external systems' },
];

// File structure requirements for each category
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
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    category: 'persona',
    description: '',
    price: '',
    tags: [] as string[],
    files: [] as File[],
    termsAccepted: false,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400 mb-4">Please sign in to list an item</p>
          <Link href="/login" className="text-blue-400 hover:text-blue-300">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (!user.isVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-white mb-4">Email Verification Required</h1>
          <p className="text-slate-400 mb-6">
            You must verify your email address before creating a listing. 
            Please check your inbox for the verification link.
          </p>
          <div className="space-y-3">
            <Link
              href="/dashboard"
              className="block w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-500 transition-colors"
            >
              Go to Dashboard
            </Link>
            <button
              onClick={() => window.location.reload()}
              className="block w-full bg-white/10 text-white py-3 rounded-xl font-medium hover:bg-white/20 transition-colors"
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

  // Auto-detect category from files
  const detectCategoryFromFiles = (files: File[]): string | null => {
    const filenames = files.map(f => f.name.toLowerCase());
    
    // Check for MCP manifest
    if (filenames.some(name => name.endsWith('mcp.json') || name.endsWith('manifest.json'))) {
      return 'mcp_server';
    }
    
    // Check for PERSONA.md
    if (filenames.some(name => name.endsWith('persona.md'))) {
      return 'persona';
    }
    
    // Check for SKILL.md
    if (filenames.some(name => name.endsWith('skill.md'))) {
      return 'skill';
    }
    
    return null;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const items = e.dataTransfer.items;
    const files: File[] = [];
    
    // Process dropped items
    for (let i = 0; i < items.length; i++) {
      const item = items[i].webkitGetAsEntry();
      if (item) {
        // For now, just collect files from the drop
        // In production, you'd traverse directories
      }
    }
    
    // Also get files directly
    const droppedFiles = Array.from(e.dataTransfer.files);
    
    // Auto-detect category if not already set or if current category doesn't match files
    const detectedCategory = detectCategoryFromFiles(droppedFiles);
    if (detectedCategory && formData.category !== detectedCategory) {
      setFormData(prev => ({ 
        ...prev, 
        files: [...prev.files, ...droppedFiles],
        category: detectedCategory
      }));
    } else {
      setFormData(prev => ({ ...prev, files: [...prev.files, ...droppedFiles] }));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      
      // Auto-detect category if not already set or if current category doesn't match files
      const detectedCategory = detectCategoryFromFiles(selectedFiles);
      if (detectedCategory && formData.category !== detectedCategory) {
        setFormData(prev => ({ 
          ...prev, 
          files: [...prev.files, ...selectedFiles],
          category: detectedCategory
        }));
      } else {
        setFormData(prev => ({ ...prev, files: [...prev.files, ...selectedFiles] }));
      }
    }
  };

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }));
  };

  // Check for required files based on category
  const hasSkillMd = formData.files.some(f => f.name.toLowerCase().endsWith('skill.md'));
  const hasPersonaMd = formData.files.some(f => f.name.toLowerCase().endsWith('persona.md'));
  const hasMcpManifest = formData.files.some(f => 
    f.name.toLowerCase().endsWith('mcp.json') || f.name.toLowerCase().endsWith('manifest.json')
  );
  
  // Determine if required file is present based on category
  const hasRequiredFile = () => {
    switch (formData.category) {
      case 'skill':
        return hasSkillMd;
      case 'persona':
        return hasSkillMd || hasPersonaMd;
      case 'mcp_server':
        return hasMcpManifest;
      default:
        return hasSkillMd;
    }
  };
  
  // Check if files match the selected category (for warning display)
  const getCategoryMismatchWarning = (): string | null => {
    if (formData.files.length === 0) return null;
    
    const detected = detectCategoryFromFiles(formData.files);
    if (!detected) return null;
    
    if (detected !== formData.category) {
      const categoryNames: Record<string, string> = {
        'skill': 'Agent Skill',
        'persona': 'AI Persona',
        'mcp_server': 'MCP Server'
      };
      return `Your files look like a ${categoryNames[detected]}, but you selected ${categoryNames[formData.category]}. The category has been auto-updated.`;
    }
    return null;
  };
  
  const totalSize = formData.files.reduce((acc, f) => acc + f.size, 0);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    
    try {
      const token = localStorage.getItem('ar-token');
      if (!token) {
        throw new Error('Please sign in first');
      }

      // Validate category
      if (!formData.category) {
        throw new Error('Please select a category');
      }

      // Validate terms acceptance
      if (!formData.termsAccepted) {
        throw new Error('Please accept the Terms and Conditions');
      }

      // Validate required files based on category
      if (!hasRequiredFile()) {
        const requiredFile = formData.category === 'skill' ? 'SKILL.md' : 
                            formData.category === 'persona' ? 'SKILL.md or PERSONA.md' : 
                            'mcp.json or manifest.json';
        throw new Error(`Please include a ${requiredFile} file for ${formData.category} listings`);
      }
      
      // Create FormData
      const data = new FormData();
      data.append('name', formData.name);
      data.append('description', formData.description);
      data.append('category', formData.category);
      data.append('price_cents', String(parseInt(formData.price) * 100));
      data.append('tags', JSON.stringify(formData.tags));
      
      // Add files
      formData.files.forEach(file => {
        data.append('files', file);
      });
      
      // Upload with progress simulation
      setUploadProgress(10);
      
      const response = await fetch(`${API_URL}/listings/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: data
      });
      
      setUploadProgress(80);
      
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Failed to create listing');
      }
      
      const result = await response.json();
      setUploadProgress(100);
      
      // Redirect to dashboard
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
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <Head>
        <title>List an Item | Agent Resources</title>
      </Head>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-slate-900/80 backdrop-blur-md border-b border-white/10 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="group flex items-center gap-3">
            <Logo variant="full" size="md" textClassName="text-white group-hover:text-blue-400 transition-colors" />
          </Link>
          <Link href="/dashboard" className="text-slate-400 hover:text-white transition-colors">
            Dashboard
          </Link>
        </div>
      </nav>

      <main className="pt-24 pb-12 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-semibold text-white mb-2">List an Item</h1>
          <p className="text-slate-400 mb-8">Create and publish your AI persona, skill, or MCP server</p>

          {/* Progress */}
          <div className="flex items-center gap-4 mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                  s <= step ? 'bg-blue-600 text-white' : 'bg-white/10 text-slate-400'
                }`}>
                  {s}
                </div>
                {s < 3 && <div className={`w-12 h-1 ${s < step ? 'bg-blue-600' : 'bg-white/10'}`} />}
              </div>
            ))}
          </div>

          <div className="bg-white/5 rounded-2xl p-8 border border-white/10">
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-white">What are you selling?</h2>
                
                <div className="space-y-4">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setFormData(prev => ({ ...prev, category: cat.id }))}
                      className={`w-full p-6 rounded-xl border-2 text-left transition-all ${
                        formData.category === cat.id
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-white/10 bg-white/5 hover:border-blue-400/50'
                      }`}
                    >
                      <h3 className="font-semibold text-white mb-1">{cat.name}</h3>
                      <p className="text-slate-400 text-sm">{cat.description}</p>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setStep(2)}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-500 transition-colors"
                >
                  Continue
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-white">Tell us about your listing</h2>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500 placeholder-slate-500"
                    placeholder="e.g., Social Media Manager"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500 placeholder-slate-500"
                    placeholder="Describe what your listing does and how it helps users..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Price (USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                      className="w-full pl-8 pr-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500 placeholder-slate-500"
                      placeholder="49"
                    />
                  </div>
                  <p className="text-sm text-slate-400 mt-1">
                    No commission for free listings. Paid listings: 15% platform fee.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {tags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                          formData.tags.includes(tag)
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                            : 'bg-white/5 text-slate-400 border border-white/10 hover:border-white/30'
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
                    className="px-6 py-3 rounded-lg border border-white/10 text-slate-300 hover:bg-white/5"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    disabled={!formData.name || !formData.description || !formData.price}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-500 transition-colors disabled:opacity-50"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-white">Upload Your Files</h2>
                <p className="text-slate-400">
                  {formData.category === 'mcp_server' 
                    ? 'Drop a folder containing your mcp.json or manifest.json and any supporting files.' 
                    : formData.category === 'persona' 
                      ? 'Drop a folder containing your SKILL.md or PERSONA.md and any supporting files.' 
                      : 'Drop a folder containing your SKILL.md and any supporting files.'}
                  Buyers will download this as a ZIP file.
                </p>

                {/* Error Display */}
                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}
                
                {/* Category Mismatch Warning */}
                {getCategoryMismatchWarning() && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <p className="text-yellow-400 text-sm">{getCategoryMismatchWarning()}</p>
                    </div>
                  </div>
                )}
                
                {/* File Structure Guide */}
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-blue-300 mb-2">
                    Required File Structure for {categories.find(c => c.id === formData.category)?.name}
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-blue-400 font-medium">Required:</p>
                      <p className="text-xs text-blue-300">{fileStructureGuide[formData.category]?.required.join(', ')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-400 font-medium">Optional:</p>
                      <p className="text-xs text-blue-300">{fileStructureGuide[formData.category]?.optional.join(', ')}</p>
                    </div>
                    <details className="mt-2">
                      <summary className="text-xs text-blue-400 cursor-pointer hover:text-blue-300">View example structure</summary>
                      <pre className="mt-2 p-2 bg-blue-500/10 rounded text-xs text-blue-300 overflow-x-auto">
                        {fileStructureGuide[formData.category]?.example}
                      </pre>
                    </details>
                  </div>
                </div>

                {/* File Drop Zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                    isDragging 
                      ? 'border-blue-500 bg-blue-500/10' 
                      : 'border-white/20 hover:border-blue-400'
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
                  <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <p className="font-medium text-white mb-1">Drop a folder here</p>
                  <p className="text-sm text-slate-400 mb-4">
                    We keep folder paths and flatten the outer wrapper automatically
                  </p>
                  <button
                    type="button"
                    className="bg-white/10 border border-white/10 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/20"
                  >
                    Choose folder
                  </button>
                </div>

                {/* File List with ZIP Preview */}
                {formData.files.length > 0 && (
                  <div className="bg-white/5 rounded-lg border border-white/10 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-slate-300">
                        {formData.files.length} files • {(totalSize / 1024).toFixed(1)} KB
                      </span>
                      {hasRequiredFile() && (
                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                          ✓ {formData.category === 'mcp_server' ? 'Manifest' : formData.category === 'persona' ? 'SKILL.md/PERSONA.md' : 'SKILL.md'} found
                        </span>
                      )}
                    </div>
                    
                    {/* ZIP Structure Preview */}
                    <div className="mb-3 p-3 bg-white/5 rounded-lg">
                      <p className="text-xs font-medium text-slate-400 mb-2">ZIP Structure Preview:</p>
                      <ul className="space-y-1 max-h-32 overflow-y-auto text-xs font-mono">
                        {formData.files.map((file, index) => {
                          // Show flattened path (remove outer folder if present)
                          const pathParts = file.name.split('/');
                          const displayPath = pathParts.length > 1 
                            ? pathParts.slice(1).join('/')  // Remove outer folder
                            : file.name;
                          return (
                            <li key={index} className="flex items-center gap-2">
                              <span className="text-slate-500">📄</span>
                              <span className="text-slate-400 truncate">{displayPath}</span>
                              <span className="text-slate-500 ml-auto">({(file.size / 1024).toFixed(1)} KB)</span>
                            </li>
                          );
                        })}
                      </ul>
                      {formData.files.some(f => f.name.includes('/')) && (
                        <p className="text-xs text-yellow-400 mt-2">
                          ⚠️ Files in subfolders will be flattened in the ZIP (outer folder removed)
                        </p>
                      )}
                    </div>
                    
                    <ul className="space-y-2 max-h-32 overflow-y-auto border-t border-white/10 pt-3">
                      {formData.files.map((file, index) => (
                        <li key={index} className="flex items-center justify-between text-sm">
                          <span className="text-slate-400 truncate">{file.name}</span>
                          <button
                            onClick={() => removeFile(index)}
                            className="text-red-400 hover:text-red-300 ml-2"
                          >
                            ×
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Validation Messages */}
                <div className="bg-white/5 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-slate-300 mb-2">Validation</h3>
                  <ul className="space-y-1 text-sm">
                    <li className={formData.name ? 'text-green-400' : 'text-slate-500'}>
                      {formData.name ? '✓' : '○'} Name is required
                    </li>
                    <li className={formData.files.length > 0 ? 'text-green-400' : 'text-slate-500'}>
                      {formData.files.length > 0 ? '✓' : '○'} Add at least one file
                    </li>
                    <li className={hasRequiredFile() ? 'text-green-400' : 'text-slate-500'}>
                      {hasRequiredFile() ? '✓' : '○'} {formData.category === 'mcp_server' ? 'mcp.json or manifest.json' : formData.category === 'persona' ? 'SKILL.md or PERSONA.md' : 'SKILL.md'} is required
                    </li>
                    <li className={formData.termsAccepted ? 'text-green-400' : 'text-slate-500'}>
                      {formData.termsAccepted ? '✓' : '○'} Accept the <Link href="/terms" target="_blank" className="underline text-blue-400">Terms and Conditions</Link>
                    </li>
                  </ul>
                </div>

                {/* Terms and Security Notice */}
                <div className="bg-white/5 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-slate-300 mb-3">Terms & Conditions</h3>
                  <label className="flex items-start gap-3 mb-4">
                    <input
                      type="checkbox"
                      checked={formData.termsAccepted}
                      onChange={(e) => setFormData(prev => ({ ...prev, termsAccepted: e.target.checked }))}
                      className="mt-1 w-4 h-4 text-blue-600 rounded border-white/20 bg-white/5"
                    />
                    <span className="text-sm text-slate-300">
                      I have the rights to this item and agree to the <Link href="/terms" target="_blank" className="text-blue-400 hover:text-blue-300 underline">Terms and Conditions</Link>
                    </span>
                  </label>
                  
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <p className="text-sm text-slate-400">
                        Your files will be scanned for security before being published. This process typically takes a few minutes.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Submit */}
                {submitting ? (
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-300">Uploading...</span>
                      <span className="text-sm text-slate-500">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <button
                      onClick={() => setStep(2)}
                      className="px-6 py-3 rounded-lg border border-white/10 text-slate-300 hover:bg-white/5"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={formData.files.length === 0 || !formData.termsAccepted || !hasRequiredFile()}
                      className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-500 transition-colors disabled:opacity-50"
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
