import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

const posts = {
  'hello-world': {
    title: 'Hello World: We\'re Live',
    date: 'March 27, 2026',
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
3. **Personas** — Complete digital workers for non-technical users

### What's Next

- Verification sandbox (automatic testing)
- One-click install flow
- First 100 developer onboarding
- Stripe Connect payouts

Follow along. We're building in public.

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
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Post not found</h1>
          <Link href="/blog" className="text-blue-400 hover:text-blue-300">
            ← Back to blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Head>
        <title>{post.title} | Agent Resources</title>
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

      <article className="max-w-3xl mx-auto px-4 py-16">
        <Link href="/blog" className="text-gray-400 hover:text-white mb-8 block">
          ← Back to blog
        </Link>
        <span className="text-sm text-gray-500">{post.date}</span>
        <h1 className="text-4xl font-bold mt-2 mb-8">{post.title}</h1>
        <div className="prose prose-invert prose-lg max-w-none">
          {post.content.split('\n').map((paragraph, i) => {
            if (paragraph.startsWith('## ')) {
              return <h2 key={i} className="text-2xl font-bold mt-8 mb-4">{paragraph.replace('## ', '')}</h2>;
            }
            if (paragraph.startsWith('### ')) {
              return <h3 key={i} className="text-xl font-semibold mt-6 mb-3">{paragraph.replace('### ', '')}</h3>;
            }
            if (paragraph.startsWith('**') && paragraph.endsWith(':**')) {
              return <h4 key={i} className="text-lg font-semibold mt-4 mb-2">{paragraph.replace(/\*\*/g, '').replace(':', '')}</h4>;
            }
            if (paragraph.startsWith('- ')) {
              return <li key={i} className="ml-6 mb-2">{paragraph.replace('- ', '')}</li>;
            }
            if (paragraph.trim() === '') {
              return null;
            }
            if (paragraph.startsWith('— ')) {
              return <p key={i} className="text-gray-400 mt-8 italic">{paragraph}</p>;
            }
            return <p key={i} className="mb-4 text-gray-300">{paragraph}</p>;
          })}
        </div>
      </article>

      <footer className="border-t border-gray-800 py-12 px-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <span className="font-bold">Agent Resources</span>
            <p className="text-gray-500 text-sm">The marketplace for AI agents</p>
          </div>
          <div className="flex space-x-6 text-gray-400">
            <Link href="/" className="hover:text-white">Home</Link>
            <a href="https://twitter.com" className="hover:text-white">Twitter</a>
            <a href="https://github.com/BerkaySurmeli/agent-resources" className="hover:text-white">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
