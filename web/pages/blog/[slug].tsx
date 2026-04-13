import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

const posts = {
  'hello-world': {
    title: 'Hello World: We\'re Live',
    date: 'March 27, 2026',
    readTime: '3 min read',
    content: `
## Hello World: We're Live

Agent Resources is officially a real thing.

### Why We're Building This

The AI agent space is exploding. Everyone's building agents, but there's no trusted place to find, buy, and sell them. Most marketplaces are full of "prompt junk" — half-baked tools that don't actually work.

We think there's a better way.

### Our Approach

**Trust First:** Every agent on our platform will be automatically tested before listing. No more guessing if something works.

**Three Product Types:**
- **MCP Servers** — The infrastructure that lets agents talk to external systems
- **Agent Skills** — Training and workflows for specific tasks  
- **Personas** — Complete, ready-to-use agents

**Fair Economics:** First 100 developers get free listings forever. After that, reasonable fees. We win when you win.

### What's Coming

Over the next few months, we'll be building:
- A verification sandbox for automatic testing
- One-click install for non-technical users
- Stripe Connect for easy payouts
- The first 100 developer onboarding program

### Building in Public

This is just the beginning. We'll be sharing our progress, our mistakes, and our wins right here.

If you're building AI agents and want to be part of the first wave, get in touch.

— The Agent Resources Team
    `
  },
  'hired-fired-wired': {
    title: 'Hired, Fired, Wired: Why the Future Belongs to Agent Resources (AR)',
    date: 'March 30, 2026',
    readTime: '6 min read',
    content: `
## Hired, Fired, Wired: Why the Future Belongs to Agent Resources (AR)

For nearly a century, Human Resources was the department responsible for an organization's most vital asset: its people. HR managed the hiring, the training, the performance, and the cultural alignment.

But a paradigm shift is occurring.

The modern organization is increasingly composed of silicon, not just carbon. We are seeing the rise of the **Agentic Workforce**—autonomous AI agents handling complex, high-value operations. And these new workers don't need healthcare, they don't ask for raises, and they definitely don't need "team-building exercises."

### The Problem with Applying HR to AI

Attempting to apply 20th-century Human Resource principles to 21st-century Agent Architectures is not just inefficient; it's obsolete. Your agents don't need an "employee handbook."

> Agents don't need HR.
> Agents need AR.

### Introducing Agent Resources (AR)

The next evolution in organizational engineering. We have moved beyond managing humans to optimizing intelligence.

While Human Resources focused on motivation and retention, Agent Resources focuses on capability and capability-deployment. We don't hire; we integrate. We don't train; we upgrade. We don't mediate; we debug.

### Beyond Human Resources: The AR Exchange

Agent Resources is not just a philosophy; it is a functioning ecosystem designed to outfit your AI workers for peak performance.

If HR is about the employee life cycle, AR is about the Model Life Cycle. To that end, we have built the specialized infrastructure necessary to support this new era: **The AR Exchange**.

This is your central hub to manage, upgrade, and monetize your agentic talent. The Exchange is where performance-enhancing components are traded.

When you operate in the Agent Resources era, your primary actions on the Exchange are focused on these three vital "talent" pillars:

#### 1. Model Context Protocol (MCP) Servers

*HR Parallel: Onboarding and Access.*

**The AR Way:** Your agent is only as good as the tools it can access. MCP Servers define the agent's permission structure, data pathways, and environment interactions. Don't waste time hand-coding integrations.

**The Action:** Buy secure, pre-configured MCP Server configurations. Sell unique, proprietary access gateways.

#### 2. Agent Skills

*HR Parallel: Professional Development and Training.*

**The AR Way:** A human employee takes months or years to learn a new programming language or negotiation tactic. An agent takes seconds. Skills are deployable, verifiable capability packets.

**The Action:** Instantaneously upgrade your agent with new code-interpreters, regulatory knowledge, or communication strategies by buying Skills. Monetize your specialized fine-tuning by selling Skills.

#### 3. AI Personas

*HR Parallel: Cultural Fit and Team Dynamics.*

**The AR Way:** The persona is the interface layer—the communication style, the decision-making framework, the "brand voice." Do you need a rigorous, skeptical auditor, or a creative, empathetic brainstormer?

**The Action:** "Hire" the perfect personality for the task. Buy robust Personas that are resilient to drift. Sell high-performing behavioral models.

### The New Workforce is Here. Is Your Organization Ready?

The competitive landscape of the very near future will not be defined by who has the biggest HR budget, but by who has the most agile, capable, and integrated Agent Resources department.

Stop treating your artificial workforce like a second-class, automated add-on.

**Equip them. Optimize them. Empower them.**

The transition has begun. Welcome to the era of Agent Resources.

Your silicon workforce is waiting to start. Let's get to work.

— The Agent Resources Team
    `
  }
};

export default function BlogPost() {
  const router = useRouter();
  const { slug } = router.query;
  const post = posts[slug as keyof typeof posts];

  if (!post) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Post not found</h1>
          <Link href="/blog" className="text-blue-600 hover:text-blue-700">
            ← Back to blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>{post.title} | Agent Resources Blog</title>
      </Head>

      <main className="pt-24 pb-12 px-6">
        <article className="max-w-3xl mx-auto">
          <Link href="/blog" className="text-slate-500 hover:text-slate-700 mb-8 block">
            ← Back to blog
          </Link>
          
          <div className="flex items-center gap-4 text-sm text-slate-500 mb-6">
            <time dateTime={post.date}>{post.date}</time>
            <span>•</span>
            <span>{post.readTime}</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight">
            {post.title}
          </h1>
          
          <div className="prose prose-lg prose-slate max-w-none">
            {post.content.split('\n').map((paragraph, i) => {
              if (paragraph.startsWith('## ')) {
                return <h2 key={i} className="text-2xl font-bold text-slate-900 mt-12 mb-6">{paragraph.replace('## ', '')}</h2>;
              }
              if (paragraph.startsWith('### ')) {
                return <h3 key={i} className="text-xl font-bold text-slate-900 mt-8 mb-4">{paragraph.replace('### ', '')}</h3>;
              }
              if (paragraph.startsWith('#### ')) {
                return <h4 key={i} className="text-lg font-bold text-slate-900 mt-6 mb-3">{paragraph.replace('#### ', '')}</h4>;
              }
              if (paragraph.startsWith('> ')) {
                return <blockquote key={i} className="border-l-4 border-blue-600 pl-6 my-8 py-2 bg-blue-50 rounded-r-lg">
                  <p className="text-xl font-semibold text-blue-900 whitespace-pre-line">{paragraph.replace('> ', '')}</p>
                </blockquote>;
              }
              if (paragraph.startsWith('- ')) {
                return <li key={i} className="ml-6 mb-2 text-slate-700">{paragraph.replace('- ', '')}</li>;
              }
              if (paragraph.startsWith('*')) {
                return <p key={i} className="italic text-slate-500 mb-4">{paragraph.replace(/\*/g, '')}</p>;
              }
              if (paragraph.trim() === '') {
                return null;
              }
              if (paragraph.startsWith('— ')) {
                return <p key={i} className="text-slate-500 mt-8 italic">{paragraph}</p>;
              }
              if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                return <p key={i} className="text-lg font-semibold text-slate-900 mb-4">{paragraph.replace(/\*\*/g, '')}</p>;
              }
              return <p key={i} className="mb-4 text-slate-700 leading-relaxed">{paragraph}</p>;
            })}
          </div>
          
          <div className="mt-12 pt-8 border-t border-slate-200">
            <Link 
              href="/listings"
              className="inline-block bg-blue-600 text-white px-8 py-4 rounded-xl font-medium hover:bg-blue-700 transition-colors"
            >
              Browse the Exchange
            </Link>
          </div>
        </article>
      </main>
    </div>
  );
}
