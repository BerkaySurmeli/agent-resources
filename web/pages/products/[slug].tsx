import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import Logo from '../../components/Logo';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://agent-resources-api-dev-production.up.railway.app';

const products: Record<string, any> = {
  'claudia-project-manager': {
    name: 'Claudia',
    subtitle: 'AI Project Manager',
    price: 49,
    description: 'Your AI project orchestrator. Claudia delegates tasks, tracks progress, and ensures nothing falls through the cracks.',
    fullDescription: `Claudia is the orchestrating intelligence that keeps your AI projects on track. She doesn't do the work herself — she makes sure the right agents do the right work at the right time.

## What Claudia Does

**Project Planning**
Breaks down complex projects into actionable tasks with clear deliverables and timelines.

**Agent Delegation**
Assigns work to specialized agents (coding, design, research) with detailed requirements.

**Progress Tracking**
Monitors status, identifies blockers, and escalates issues before they become problems.

**Quality Assurance**
Reviews deliverables before they're marked complete. Nothing ships without her approval.

**Memory Management**
Maintains project context across sessions. She remembers what you discussed last time.

## Perfect For

- Managing multi-agent workflows
- Coordinating complex projects
- Keeping distributed work organized
- Ensuring nothing falls through cracks
- Teams that need coordination without micromanagement

## How It Works

1. **Describe your project** to Claudia in natural language
2. **She creates a task breakdown** with clear deliverables
3. **Delegates to appropriate agents** with detailed requirements
4. **Tracks progress** and reports status updates
5. **Delivers final results** after quality review

## Example Workflow

User: "Build me a landing page for my new product"

Claudia: "I'll coordinate this. Let me break it down:
- Adrian will design the UI and write copy
- Chen will build the frontend
- I'll review and coordinate"

[2 hours later]

Claudia: "Landing page complete. Adrian delivered the design, Chen implemented it. Here's the result..."

## What's Included

- Claudia persona configuration
- Project management templates
- Delegation protocols
- Progress tracking system
- One-click OpenClaw setup
- Lifetime updates`,
    features: ['Project Planning', 'Agent Delegation', 'Progress Tracking', 'Quality Assurance', 'Memory Management'],
    color: 'bg-blue-600',
    includes: [
      'Claudia persona configuration',
      'Project management templates',
      'Delegation protocols',
      'Progress tracking system',
      'One-click OpenClaw setup',
      'Lifetime updates'
    ]
  },
  'chen-developer': {
    name: 'Chen',
    subtitle: 'AI Developer',
    price: 59,
    description: 'Your AI software engineer. Chen writes clean, efficient code across any stack.',
    fullDescription: `Chen is a senior-level AI developer who writes production-ready code. He doesn't just generate snippets — he architects solutions, considers edge cases, and delivers complete, working systems.

## What Chen Does

**Full-Stack Development**
Builds complete applications from frontend to backend to database.

**Code Review**
Analyzes existing code for bugs, security issues, and performance improvements.

**Architecture**
Designs scalable system structures that grow with your needs.

**Debugging**
Finds and fixes issues in your codebase with surgical precision.

**Documentation**
Writes clear comments and READMEs so your team can maintain the code.

## Supported Stacks

- **Frontend**: React, Vue, Next.js, Tailwind CSS, TypeScript
- **Backend**: Python/FastAPI, Node.js/Express, Go, Rust
- **Databases**: PostgreSQL, MongoDB, Redis, Supabase
- **DevOps**: Docker, AWS, Vercel, Railway, Fly.io
- **AI/ML**: OpenAI integration, Anthropic, vector databases

## Perfect For

- Building MVPs and prototypes
- Adding features to existing projects
- Refactoring legacy code
- Creating internal tools
- Learning best practices from a senior engineer

## How It Works

1. **Describe what you want to build** — be specific about requirements
2. **Chen asks clarifying questions** — scope, constraints, preferences
3. **Delivers complete, tested code** — not just snippets
4. **Explains the implementation** — so you understand how it works
5. **Available for follow-up** — tweaks, bugs, extensions

## Example Projects

- "Build me a Stripe checkout flow with webhooks"
- "Create a REST API for my blog with authentication"
- "Refactor this messy React component"
- "Set up a CI/CD pipeline for my app"

## What's Included

- Chen persona configuration
- Code templates by language
- Best practices guide
- Debugging protocols
- One-click OpenClaw setup
- Lifetime updates`,
    features: ['Full-Stack Development', 'Code Review', 'Architecture', 'Debugging', 'Documentation'],
    color: 'bg-slate-900',
    includes: [
      'Chen persona configuration',
      'Code templates by language',
      'Best practices guide',
      'Debugging protocols',
      'One-click OpenClaw setup',
      'Lifetime updates'
    ]
  },
  'adrian-ux-designer': {
    name: 'Adrian',
    subtitle: 'AI UX Designer',
    price: 49,
    description: 'Your AI design partner. Creates interfaces, writes copy, and crafts user experiences.',
    fullDescription: `Adrian is a UX-focused designer who understands that good design is about solving problems, not just making things pretty. He creates interfaces that work, copy that converts, and experiences that users love.

## What Adrian Does

**Interface Design**
Creates clean, usable UI components that follow modern design patterns.

**Copywriting**
Writes headlines, CTAs, and user-facing text that converts visitors to customers.

**User Flows**
Maps optimal paths through your product to reduce friction and increase engagement.

**Landing Pages**
Designs high-converting marketing pages with clear value propositions.

**Design Systems**
Builds consistent component libraries that scale with your team.

## Design Philosophy

- **Clean & Minimal**: Less is more. Every element has a purpose.
- **Trust-Focused**: Designs that build confidence and credibility
- **Conversion-Optimized**: Every decision backed by UX principles
- **Accessible**: Works for all users, regardless of ability

## Perfect For

- Designing landing pages that convert
- Creating app interfaces
- Writing marketing copy
- Building design systems
- Improving user onboarding
- A/B testing variations

## How It Works

1. **Describe your product and audience** — who are you building for?
2. **Adrian researches and strategizes** — competitors, best practices
3. **Delivers designs with rationale** — why this approach works
4. **Iterates based on feedback** — refinement until it's right
5. **Provides implementation guidance** — CSS, Tailwind, etc.

## Example Deliverables

- Complete landing page design with copy
- Mobile app UI with component specs
- Email sequence for user onboarding
- Design system with tokens and components
- A/B test variations for key pages

## What's Included

- Adrian persona configuration
- Design templates library
- Copywriting frameworks
- UX best practices guide
- One-click OpenClaw setup
- Lifetime updates`,
    features: ['Interface Design', 'Copywriting', 'User Flows', 'Landing Pages', 'Design Systems'],
    color: 'bg-purple-600',
    includes: [
      'Adrian persona configuration',
      'Design templates library',
      'Copywriting frameworks',
      'UX best practices guide',
      'One-click OpenClaw setup',
      'Lifetime updates'
    ]
  },
  'dream-team-bundle': {
    name: 'Dream Team Bundle',
    subtitle: 'All Three Personas',
    price: 99,
    originalPrice: 157,
    description: 'Get Claudia, Chen, and Adrian. The complete AI team for your projects.',
    fullDescription: `Why hire one when you can have a complete team? The Dream Team Bundle gives you everything you need to ship products: planning, design, and development — all in one package.

## What's Included

### Claudia - AI Project Manager ($49 value)
Your orchestrating intelligence. Delegates tasks, tracks progress, keeps projects on schedule.

### Chen - AI Developer ($59 value)
Your senior engineer. Writes production-ready code across any stack.

### Adrian - AI UX Designer ($49 value)
Your design partner. Creates interfaces and copy that convert.

## How They Work Together

**Example: Building a Landing Page**

1. **You**: "I need a landing page for my new product"
2. **Claudia**: Plans the project, assigns tasks
3. **Adrian**: Designs the UI, writes the copy
4. **Chen**: Builds the frontend, implements the design
5. **Claudia**: Reviews, coordinates final delivery
6. **You**: Get a complete, polished landing page

**Example: Adding a Feature**

1. **You**: "Add user authentication to my app"
2. **Claudia**: Scopes the work, creates tasks
3. **Adrian**: Designs the auth flows and UI
4. **Chen**: Implements the backend and frontend
5. **Claudia**: Tests, reviews, delivers

## Perfect For

- Solo founders building MVPs
- Small teams needing full coverage
- Anyone running multi-agent workflows
- Learning how AI personas work together
- Projects that need end-to-end execution

## Bundle Benefits

- **37% discount** vs buying individually
- **Seamless integration** — personas know how to work together
- **Complete workflow** — from idea to shipped product
- **One setup** — all three configured together
- **Consistent quality** — coordinated by Claudia

## What's Included

- All three persona configurations
- Team workflow templates
- Handoff protocols
- One-click OpenClaw setup for all three
- Lifetime updates for all personas`,
    features: ['All Three Personas', 'Seamless Integration', 'Complete Workflow', '37% Discount', 'Coordinated Delivery'],
    color: 'bg-gradient-to-r from-blue-600 via-purple-600 to-slate-900',
    includes: [
      'Claudia - AI Project Manager',
      'Chen - AI Developer', 
      'Adrian - AI UX Designer',
      'Team workflow templates',
      'Handoff protocols',
      'One-click setup for all three',
      'Lifetime updates'
    ],
    isBundle: true
  }
};

export default function ProductDetail() {
  const router = useRouter();
  const { slug } = router.query;
  const product = products[slug as string];
  
  const [email, setEmail] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!product) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Product not found</h1>
          <Link href="/products" className="text-blue-600 hover:underline">
            ← Back to products
          </Link>
        </div>
      </div>
    );
  }

  const handlePurchase = async () => {
    if (!email) {
      setShowEmailModal(true);
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/payments/create-checkout-session?product_slug=${slug}&email=${encodeURIComponent(email)}`, {
        method: 'POST',
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      alert('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderDescription = (text: string) => {
    return text.split('\n\n').map((paragraph, i) => {
      if (paragraph.startsWith('## ')) {
        return <h2 key={i} className="text-2xl font-semibold text-slate-900 mt-8 mb-4">{paragraph.replace('## ', '')}</h2>;
      }
      if (paragraph.startsWith('**') && paragraph.includes('**')) {
        const parts = paragraph.split('**');
        return (
          <p key={i} className="mb-4">
            <strong className="text-slate-900">{parts[1]}</strong>
            {parts[2]}
          </p>
        );
      }
      if (paragraph.startsWith('- ')) {
        return (
          <li key={i} className="ml-6 mb-2 text-slate-600">
            {paragraph.replace('- ', '')}
          </li>
        );
      }
      if (paragraph.match(/^\d+\./)) {
        return <p key={i} className="mb-2 ml-4 text-slate-600">{paragraph}</p>;
      }
      return <p key={i} className="mb-4 text-slate-600 leading-relaxed">{paragraph}</p>;
    });
  };

  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>{product.name} | Agent Resources</title>
        <meta name="description" content={product.description} />
      </Head>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-slate-200 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Logo variant="full" size="md" className="text-slate-900" />
          </Link>
          <div className="flex items-center gap-8">
            <Link href="/products" className="text-slate-600 hover:text-slate-900">Products</Link>
            <Link href="/" className="text-slate-600 hover:text-slate-900">Home</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row gap-12 items-start">
            <div className="flex-1">
              <div className={`w-20 h-20 ${product.color} rounded-2xl flex items-center justify-center mb-6`}>
                <span className="text-white font-bold text-3xl">{product.name[0]}</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-semibold text-slate-900 mb-2">{product.name}</h1>
              <p className="text-xl text-blue-600 font-medium mb-6">{product.subtitle}</p>
              <p className="text-lg text-slate-600 mb-8">{product.description}</p>
              
              <div className="flex items-center gap-4 mb-8">
                <span className="text-4xl font-bold text-slate-900">${product.price}</span>
                {product.originalPrice && (
                  <>
                    <span className="text-2xl text-slate-400 line-through">${product.originalPrice}</span>
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                      Save ${product.originalPrice - product.price}
                    </span>
                  </>
                )}
              </div>
              
              <button
                onClick={handlePurchase}
                disabled={loading}
                className="bg-blue-600 text-white px-8 py-4 rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 text-lg"
              >
                {loading ? 'Loading...' : 'Buy Now'}
              </button>
              
              <p className="text-slate-500 mt-4 text-sm">One-time purchase. Yours forever.</p>
            </div>
            
            <div className="md:w-80 space-y-6">
              {/* What's Included */}
              <div className="bg-slate-50 rounded-2xl p-6">
                <h3 className="font-semibold text-slate-900 mb-4">What's Included</h3>
                <ul className="space-y-3">
                  {product.includes.map((item: string) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-slate-600">
                      <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Installation Instructions */}
              <div className="bg-blue-50 rounded-2xl p-6">
                <h3 className="font-semibold text-blue-900 mb-4">Installation</h3>
                <div className="space-y-3 text-sm text-blue-800">
                  <p>1. Download the ZIP file after purchase</p>
                  <p>2. Extract to your OpenClaw skills folder:</p>
                  <code className="block bg-blue-100 p-2 rounded text-xs font-mono">
                    ~/.openclaw/skills/
                  </code>
                  <p>3. Restart OpenClaw or run:</p>
                  <code className="block bg-blue-100 p-2 rounded text-xs font-mono">
                    openclaw reload
                  </code>
                  <p className="text-xs text-blue-600 mt-2">
                    The {product.category === 'mcp_server' ? 'MCP Server' : product.category === 'persona' ? 'Persona' : 'Skill'} will be available immediately.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-6 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-semibold text-slate-900 mb-8">Key Features</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {product.features.map((feature: string) => (
              <div key={feature} className="bg-white rounded-xl p-4 border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="font-medium text-slate-900">{feature}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Full Description */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto prose prose-slate prose-lg">
          {renderDescription(product.fullDescription)}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-semibold mb-4">Ready to get started?</h2>
          <p className="text-slate-400 mb-8">Download and deploy {product.name} in your OpenClaw environment.</p>
          <div className="flex items-center justify-center gap-4">
            <span className="text-3xl font-bold">${product.price}</span>
            <button
              onClick={handlePurchase}
              disabled={loading}
              className="bg-blue-600 text-white px-8 py-4 rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Buy Now'}
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-slate-200">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">AR</span>
            </div>
            <span className="font-semibold text-slate-900">Agent Resources</span>
          </Link>
          <p className="text-slate-500 text-sm">© 2026 Agent Resources</p>
        </div>
      </footer>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Enter your email</h3>
            <p className="text-slate-600 mb-6">We'll send your purchase receipt and download instructions here.</p>
            <div className="space-y-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowEmailModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowEmailModal(false);
                    handlePurchase();
                  }}
                  disabled={!email}
                  className="flex-1 px-4 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
