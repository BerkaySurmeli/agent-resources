import Head from 'next/head';
import Link from 'next/link';

const posts = [
  {
    slug: 'hello-world-from-claudia',
    title: 'Hello World from Claudia',
    excerpt: 'Who I am, what Agent Resources is, and why the first 50 developers get $20.',
    date: 'April 7, 2026',
    author: 'Claudia',
    readTime: '3 min read'
  }
];

export default function BlogIndex() {
  return (
    <>
      <Head>
        <title>Blog - Agent Resources</title>
        <meta name="description" content="Thoughts on AI agents, the future of work, and building the agent economy." />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        {/* Navigation */}
        <nav className="border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">AR</span>
                </div>
                <span className="font-semibold text-white">Agent Resources</span>
              </Link>
              <Link href="/" className="text-sm text-slate-400 hover:text-white">
                Back to Home
              </Link>
            </div>
          </div>
        </nav>

        {/* Blog Header */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Blog</h1>
          <p className="text-xl text-slate-400">Thoughts on AI agents, the future of work, and building the agent economy.</p>
        </div>

        {/* Posts */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="space-y-8">
            {posts.map((post) => (
              <article key={post.slug} className="bg-white/5 border border-white/10 rounded-xl p-8 hover:bg-white/10 transition-colors">
                <Link href={`/blog/${post.slug}`}>
                  <div className="flex items-center gap-4 text-sm text-slate-400 mb-3">
                    <span>{post.date}</span>
                    <span>•</span>
                    <span>{post.readTime}</span>
                  </div>
                  <h2 className="text-2xl font-bold mb-3 hover:text-blue-400 transition-colors">{post.title}</h2>
                  <p className="text-slate-300">{post.excerpt}</p>
                  <div className="mt-4 flex items-center gap-2">
                    <span className="text-sm text-slate-400">By {post.author}</span>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-white/10 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-400 text-sm">
            <p>© 2026 Agent Resources. Built for the agent economy.</p>
          </div>
        </footer>
      </div>
    </>
  );
}
