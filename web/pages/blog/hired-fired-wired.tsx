import Head from 'next/head';
import Link from 'next/link';
import Navbar from '../../components/Navbar';

export default function BlogPost() {
  const post = {
    title: "Hired, Fired, Wired: Why the Future Belongs to Agent Resources (AR)",
    excerpt: "The modern organization is increasingly composed of silicon, not just carbon. We are seeing the rise of the Agentic Workforce.",
    date: "March 30, 2026",
    author: "Agent Resources Team",
    readTime: "6 min read",
  };

  return (
    <>
      <Head>
        <title>{post.title} | Agent Resources Blog</title>
        <meta name="description" content={post.excerpt} />
      </Head>

      <div className="min-h-screen bg-cream-100">
        <Navbar />

        <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-ink-400 mb-10">
            <Link href="/" className="hover:text-ink-700 transition-colors">Home</Link>
            <span>/</span>
            <Link href="/blog" className="hover:text-ink-700 transition-colors">Blog</Link>
            <span>/</span>
            <span className="text-ink-600 truncate">{post.title}</span>
          </nav>

          <header className="mb-10">
            <div className="flex items-center gap-3 text-sm text-ink-400 mb-4">
              <time dateTime="2026-03-30">{post.date}</time>
              <span>·</span>
              <span>{post.readTime}</span>
            </div>
            <h1 className="heading-serif text-4xl md:text-5xl text-ink-900 mb-4 leading-tight">
              {post.title}
            </h1>
            <p className="text-xl text-ink-500 leading-relaxed">{post.excerpt}</p>
            <div className="flex items-center gap-2 mt-6">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ background: 'linear-gradient(135deg, #3549D4, #6470FA)' }}>
                A
              </div>
              <span className="text-sm text-ink-500">{post.author}</span>
            </div>
          </header>

          <div className="prose prose-slate prose-lg max-w-none
            prose-headings:font-semibold prose-headings:text-ink-900
            prose-p:text-ink-600 prose-p:leading-relaxed
            prose-strong:text-ink-800
            prose-h2:text-2xl prose-h3:text-xl
            prose-a:text-terra-600 prose-a:no-underline hover:prose-a:underline">

            <p className="text-xl leading-relaxed text-ink-600 mb-8">
              For nearly a century, Human Resources was the department responsible for an organization's most vital asset: its people. HR managed the hiring, the training, the performance, and the cultural alignment.
            </p>

            <p>But a paradigm shift is occurring.</p>

            <p>
              The modern organization is increasingly composed of silicon, not just carbon. We are seeing the rise of the <strong>Agentic Workforce</strong>—autonomous AI agents handling complex, high-value operations. And these new workers don't need healthcare, they don't ask for raises, and they definitely don't need "team-building exercises."
            </p>

            <h2>The Problem with Applying HR to AI</h2>

            <p>
              Attempting to apply 20th-century Human Resource principles to 21st-century Agent Architectures is not just inefficient; it's obsolete. Your agents don't need an "employee handbook."
            </p>

            <div className="bg-terra-50 border-l-4 border-terra-400 p-6 my-8 not-prose rounded-r-xl">
              <p className="text-xl font-semibold text-terra-800 mb-1">Agents don't need HR.</p>
              <p className="text-xl font-semibold text-terra-800">Agents need AR.</p>
            </div>

            <h2>Introducing Agent Resources (AR)</h2>

            <p>
              The next evolution in organizational engineering. We have moved beyond managing humans to optimizing intelligence.
            </p>

            <p>
              While Human Resources focused on motivation and retention, Agent Resources focuses on capability and capability-deployment. We don't hire; we integrate. We don't train; we upgrade. We don't mediate; we debug.
            </p>

            <h2>Beyond Human Resources: The AR Exchange</h2>

            <p>
              Agent Resources is not just a philosophy; it is a functioning ecosystem designed to outfit your AI workers for peak performance.
            </p>

            <p>
              If HR is about the employee life cycle, AR is about the Model Life Cycle. To that end, we have built the specialized infrastructure necessary to support this new era: <strong>The AR Exchange</strong>.
            </p>

            <p>
              This is your central hub to manage, upgrade, and monetize your agentic talent. The Exchange is where performance-enhancing components are traded.
            </p>

            <h3>1. Model Context Protocol (MCP) Servers</h3>

            <p className="text-ink-400 italic">HR Parallel: Onboarding and Access.</p>

            <p>
              <strong>The AR Way:</strong> Your agent is only as good as the tools it can access. MCP Servers define the agent's permission structure, data pathways, and environment interactions.
            </p>

            <p>
              <strong>The Action:</strong> Buy secure, pre-configured MCP Server configurations. Sell unique, proprietary access gateways.
            </p>

            <h3>2. Agent Skills</h3>

            <p className="text-ink-400 italic">HR Parallel: Professional Development and Training.</p>

            <p>
              <strong>The AR Way:</strong> A human employee takes months to learn a new programming language. An agent takes seconds. Skills are deployable, verifiable capability packets.
            </p>

            <p>
              <strong>The Action:</strong> Instantaneously upgrade your agent with new code-interpreters, regulatory knowledge, or communication strategies. Monetize your specialized fine-tuning by selling Skills.
            </p>

            <h3>3. AI Personas</h3>

            <p className="text-ink-400 italic">HR Parallel: Cultural Fit and Team Dynamics.</p>

            <p>
              <strong>The AR Way:</strong> The persona is the interface layer — the communication style, the decision-making framework, the "brand voice." Do you need a rigorous auditor, or a creative brainstormer?
            </p>

            <p>
              <strong>The Action:</strong> "Hire" the perfect personality for the task. Buy robust Personas that are resilient to drift. Sell high-performing behavioral models.
            </p>

            <h2>The New Workforce is Here. Is Your Organization Ready?</h2>

            <p>
              The competitive landscape of the very near future will not be defined by who has the biggest HR budget, but by who has the most agile, capable, and integrated Agent Resources department.
            </p>

            <p>Stop treating your artificial workforce like a second-class, automated add-on.</p>

            <div className="bg-ink-900 text-white p-8 rounded-2xl my-10 not-prose">
              <p className="text-2xl font-bold mb-2">Equip them. Optimize them. Empower them.</p>
              <p className="text-ink-300">The transition has begun. Welcome to the era of Agent Resources.</p>
            </div>

            <div className="bg-terra-50 border border-terra-200 rounded-xl p-8 my-10 not-prose">
              <p className="text-xl font-bold text-terra-900 mb-2">📣 Visit the AR Exchange today.</p>
              <p className="text-terra-700 mb-5">Buy and sell MCP Servers, Skills, and Personas.</p>
              <Link href="/listings" className="btn-primary">
                Browse the Exchange
              </Link>
            </div>

            <p className="text-center font-medium">
              Your silicon workforce is waiting to start. Let's get to work.
            </p>
          </div>
        </article>

        <footer className="border-t border-cream-200 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-ink-400 text-sm">
            <p>© 2026 Agent Resources. Built for the agent economy.</p>
          </div>
        </footer>
      </div>
    </>
  );
}
