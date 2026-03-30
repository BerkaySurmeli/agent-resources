import Head from 'next/head';
import Link from 'next/link';

const posts = [
  {
    slug: 'hello-world',
    title: 'Hello World: We\'re Live',
    date: 'March 27, 2026',
    excerpt: 'Agent Resources is officially deployed. Here\'s what we built in 24 hours and what\'s next.',
    content: `
## We Built a Marketplace in 24 Hours

Yesterday, we had an idea. Today, we have a deployed marketplace.

### What We Built

**Backend:**
- FastAPI with SQLModel
- PostgreSQL database with 6 tables
- Stripe Connect integration ready
- Deployed on Railway

**Frontend:**
- Next.js with Tailwind CSS
- Responsive, dark-mode design
- Deployed on Vercel

**Infrastructure:**
- Domain: shopagentresources.com
- API: api.shopagentresources.com
- SSL certificates via Cloudflare

### The Vision

We're building the most trusted marketplace for AI agents. Not prompt junk. Not half-baked tools. Real, tested, verified agents that work.

**Three Tiers:**
1. **MCP Servers** — Infrastructure for agents (QuickBooks, Slack, Sheets)
2. **Agent Skills** — Training manuals and workflows
3. **Personas** — Complete digital workers

### What's Next

- Verification sandbox (automatic testing)
- One-click install flow
- First 100 developer onboarding
- Stripe Connect payouts

Follow along. We're building in public.

— The Agent Resources Team
    `
  }
];

export default function Blog() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Head>
        <title>Blog | Agent Resources</title>
      </Head>

      <nav className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/" className="text-xl font-bold">Agent Resources</Link>
            <div className="flex space-x-8">
              <Link href="/blog" className="text-white">Blog</Link>
              <a href="https://api.shopagentresources.com/health" className="text-gray-300 hover:text-white">API Status</a>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold mb-8">Building in Public</h1>
        <p className="text-gray-400 mb-12 text-lg">
          Follow our journey as we build the marketplace for AI agents.
        </p>

        <div className="space-y-8">
          {posts.map((post) => (
            <article key={post.slug} className="bg-gray-800 rounded-lg p-6">
              <span className="text-sm text-gray-500">{post.date}</span>
              <h2 className="text-2xl font-semibold mt-2 mb-3">
                <Link href={`/blog/${post.slug}`} className="hover:text-blue-400">
                  {post.title}
                </Link>
              </h2>
              <p className="text-gray-400">{post.excerpt}</p>
              <Link 
                href={`/blog/${post.slug}`}
                className="inline-block mt-4 text-blue-400 hover:text-blue-300"
              >
                Read more →
              </Link>
            </article>
          ))}
        </div>
      </main>

      <footer className="border-t border-gray-800 py-12 px-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <span className="font-bold">Agent Resources</span>
            <p className="text-gray-500 text-sm">The marketplace for AI agents</p>
          </div>
          <div className="flex space-x-6 text-gray-400">
            <Link href="/" className="hover:text-white">Home</Link>
            <a href="https://twitter.com" className="hover:text-white">Twitter</a>
            
          </div>
        </div>
      </footer>
    </div>
  );
}
