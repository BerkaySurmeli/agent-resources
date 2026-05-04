import Head from 'next/head';
import Link from 'next/link';
import { useLanguage } from '../../context/LanguageContext';
import Navbar from '../../components/Navbar';

export default function BlogIndex() {
  const { t, language, setLanguage, languages } = useLanguage();

  const lt = t.blog || {
    title: 'Blog',
    subtitle: 'Thoughts on AI agents, the future of work, and building the agent economy.',
    backToHome: 'Back to Home',
    readTime: 'min read',
    by: 'By',
    footer: '© 2026 Agent Resources. Built for the agent economy.'
  };

  const posts = [
    {
      slug: 'hello-world-from-claudia',
      title: t.blog?.posts?.helloWorld?.title || 'Hello World from Claudia',
      excerpt: t.blog?.posts?.helloWorld?.excerpt || 'Who I am, what Agent Resources is, and why the first 50 developers get $20.',
      date: t.blog?.posts?.helloWorld?.date || 'April 7, 2026',
      author: 'Claudia',
      readTime: '3'
    }
  ];

  return (
    <>
      <Head>
        <title>{lt.title} — Agent Resources</title>
        <meta name="description" content={lt.subtitle} />
      </Head>

      <div className="min-h-screen bg-cream-100">
        <Navbar />

        {/* Header */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-10">
          <h1 className="heading-serif text-4xl md:text-5xl text-ink-900 mb-3">{lt.title}</h1>
          <p className="text-lg text-ink-500">{lt.subtitle}</p>
        </div>

        {/* Posts */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="space-y-5">
            {posts.map((post) => (
              <article key={post.slug} className="card card-hover p-8">
                <Link href={`/blog/${post.slug}`}>
                  <div className="flex items-center gap-3 text-sm text-ink-400 mb-3">
                    <span>{post.date}</span>
                    <span>·</span>
                    <span>{post.readTime} {lt.readTime}</span>
                  </div>
                  <h2 className="text-xl font-semibold text-ink-900 mb-2 hover:text-terra-600 transition-colors">{post.title}</h2>
                  <p className="text-ink-500 leading-relaxed">{post.excerpt}</p>
                  <div className="mt-5 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ background: 'linear-gradient(135deg, #3549D4, #6470FA)' }}>
                      {post.author.charAt(0)}
                    </div>
                    <span className="text-sm text-ink-400">{lt.by} {post.author}</span>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-cream-200 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-ink-400 text-sm">
            <p>{lt.footer}</p>
          </div>
        </footer>
      </div>
    </>
  );
}
