import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

const posts = {
  'hello-world': {
    title: 'Hello World: We\'re Live',
    date: 'March 27, 2026',
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
            
          </div>
        </div>
      </footer>
    </div>
  );
}
