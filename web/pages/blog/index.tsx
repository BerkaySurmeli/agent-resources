import Head from 'next/head';
import Link from 'next/link';

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
    <div className="min-h-screen bg-white">
      <Head>
        <title>Blog | Agent Resources</title>
      </Head>

      <main className="pt-24 pb-12 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Building in Public</h1>
          <p className="text-slate-600 mb-12 text-lg">
            Follow our journey as we build the marketplace for AI agents.
          </p>

          {/* Featured Post */}
          {featuredPost && (
            <div className="mb-12">
              <span className="text-sm font-medium text-blue-600 mb-2 block">Featured</span>
              <article className="bg-slate-50 border border-slate-200 rounded-2xl p-8 hover:border-blue-500/30 transition-colors">
                <span className="text-sm text-slate-500">{featuredPost.date}</span>
                <h2 className="text-2xl font-semibold mt-2 mb-3">
                  <Link href={`/blog/${featuredPost.slug}`} className="hover:text-blue-600 transition-colors">
                    {featuredPost.title}
                  </Link>
                </h2>
                <p className="text-slate-600 mb-4">{featuredPost.excerpt}</p>
                <Link 
                  href={`/blog/${featuredPost.slug}`}
                  className="inline-block text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  Read more →
                </Link>
              </article>
            </div>
          )}

          {/* Regular Posts */}
          <div className="space-y-8">
            {regularPosts.map((post) => (
              <article key={post.slug} className="bg-white border border-slate-200 rounded-2xl p-6 hover:border-blue-500/30 transition-colors">
                <span className="text-sm text-slate-500">{post.date}</span>
                <h2 className="text-2xl font-semibold mt-2 mb-3">
                  <Link href={`/blog/${post.slug}`} className="hover:text-blue-600 transition-colors">
                    {post.title}
                  </Link>
                </h2>
                <p className="text-slate-600">{post.excerpt}</p>
                <Link 
                  href={`/blog/${post.slug}`}
                  className="inline-block mt-4 text-blue-600 hover:text-blue-700 font-medium transition-colors"
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
