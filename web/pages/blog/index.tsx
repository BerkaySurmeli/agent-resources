import Head from 'next/head';
import Link from 'next/link';
import Logo from '../../components/Logo';

const posts = [
  {
    slug: 'hired-fired-wired',
    title: 'Hired, Fired, Wired: Why the Future Belongs to Agent Resources (AR)',
    date: 'March 30, 2026',
    excerpt: 'The modern organization is increasingly composed of silicon, not just carbon. We are seeing the rise of the Agentic Workforce.',
    featured: true
  },
  {
    slug: 'hello-world',
    title: 'Hello World: We\'re Live',
    date: 'March 27, 2026',
    excerpt: 'Agent Resources is officially deployed. Here\'s what we built in 24 hours and what\'s next.',
    featured: false
  }
];

export default function Blog() {
  const featuredPost = posts.find(p => p.featured);
  const regularPosts = posts.filter(p => !p.featured);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <Head>
        <title>Blog | Agent Resources</title>
      </Head>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-slate-900/80 backdrop-blur-md border-b border-white/10 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="group flex items-center gap-3">
            <Logo variant="full" size="md" textClassName="text-white group-hover:text-blue-400 transition-colors" />
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/listings" className="text-slate-400 hover:text-white transition-colors">Listings</Link>
            <Link href="/wizard" className="text-blue-400 hover:text-blue-300 transition-colors">Build Your Team</Link>
          </div>
        </div>
      </nav>

      <main className="pt-24 pb-12 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-4">Building in Public</h1>
          <p className="text-slate-400 mb-12 text-lg">
            Follow our journey as we build the marketplace for AI agents.
          </p>

          {/* Featured Post */}
          {featuredPost && (
            <div className="mb-12">
              <span className="text-sm font-medium text-blue-400 mb-2 block">Featured</span>
              <article className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:border-blue-500/30 transition-colors">
                <span className="text-sm text-slate-400">{featuredPost.date}</span>
                <h2 className="text-2xl font-semibold mt-2 mb-3">
                  <Link href={`/blog/${featuredPost.slug}`} className="hover:text-blue-400 transition-colors">
                    {featuredPost.title}
                  </Link>
                </h2>
                <p className="text-slate-400 mb-4">{featuredPost.excerpt}</p>
                <Link 
                  href={`/blog/${featuredPost.slug}`}
                  className="inline-block text-blue-400 hover:text-blue-300 font-medium transition-colors"
                >
                  Read more →
                </Link>
              </article>
            </div>
          )}

          {/* Regular Posts */}
          <div className="space-y-8">
            {regularPosts.map((post) => (
              <article key={post.slug} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-blue-500/30 transition-colors">
                <span className="text-sm text-slate-400">{post.date}</span>
                <h2 className="text-2xl font-semibold mt-2 mb-3">
                  <Link href={`/blog/${post.slug}`} className="hover:text-blue-400 transition-colors">
                    {post.title}
                  </Link>
                </h2>
                <p className="text-slate-400">{post.excerpt}</p>
                <Link 
                  href={`/blog/${post.slug}`}
                  className="inline-block mt-4 text-blue-400 hover:text-blue-300 font-medium transition-colors"
                >
                  Read more →
                </Link>
              </article>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
