import Head from 'next/head';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Head>
        <title>Agent Resources | The Marketplace for AI Agents</title>
        <meta name="description" content="Buy and sell MCP Servers, Agent Skills, and AI Personas. Verified, tested, and ready to deploy." />
      </Head>

      {/* Navigation */}
      <nav className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <span className="text-xl font-bold">Agent Resources</span>
            </div>
            <div className="flex space-x-8">
              <Link href="/blog" className="text-gray-300 hover:text-white">Blog</Link>
              <a href="https://api.shopagentresources.com/health" className="text-gray-300 hover:text-white">API Status</a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-20 pb-16 text-center px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            The Marketplace for
            <span className="text-blue-400"> AI Agents</span>
          </h1>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Buy and sell MCP Servers, Agent Skills, and AI Personas. 
            Verified, tested, and ready to deploy with one-click installation.
          </p>
          <div className="flex justify-center gap-4">
            <button className="bg-blue-500 hover:bg-blue-600 px-8 py-3 rounded-lg font-semibold">
              Browse Agents
            </button>
            <button className="border border-gray-600 hover:border-gray-500 px-8 py-3 rounded-lg font-semibold">
              Sell Your Agent
            </button>
          </div>
        </div>
      </section>

      {/* Coming Soon Banner */}
      <section className="bg-blue-900/30 border-y border-blue-800">
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <span className="bg-blue-500 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
            Coming Soon
          </span>
          <h2 className="text-3xl font-bold mt-4 mb-4">We're Building in Public</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Follow our journey as we build the most trusted marketplace for AI agents. 
            First 100 developers get free listings forever.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">What We're Building</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-800 p-6 rounded-lg">
              <div className="text-3xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold mb-2">Verified & Tested</h3>
              <p className="text-gray-400">
                Every agent is automatically tested in our sandbox before listing. 
                No more prompt junk — only working, reliable agents.
              </p>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg">
              <div className="text-3xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold mb-2">One-Click Install</h3>
              <p className="text-gray-400">
                Zero technical knowledge required. Copy, paste, and your agent is live. 
                Built for the "No-Tech" crowd.
              </p>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg">
              <div className="text-3xl mb-4">🧪</div>
              <h3 className="text-xl font-semibold mb-2">Try Before You Buy</h3>
              <p className="text-gray-400">
                Test any agent in our sandbox before purchasing. 
                See exactly what you're getting.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* For Developers */}
      <section className="py-20 px-4 bg-gray-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-4">For Developers</h2>
              <p className="text-gray-400 mb-6">
                Build MCP Servers, Agent Skills, and Personas. Sell them to thousands of users.
              </p>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-center">
                  <span className="text-green-400 mr-2">✓</span>
                  First 100 developers: <strong>Free listing forever</strong>
                </li>
                <li className="flex items-center">
                  <span className="text-green-400 mr-2">✓</span>
                  Only 15% commission on sales (free items = 0%)
                </li>
                <li className="flex items-center">
                  <span className="text-green-400 mr-2">✓</span>
                  Automatic testing & verification
                </li>
                <li className="flex items-center">
                  <span className="text-green-400 mr-2">✓</span>
                  Stripe Connect for easy payouts
                </li>
              </ul>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">What You Can Sell</h3>
              <div className="space-y-4">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-semibold">MCP Servers</h4>
                  <p className="text-sm text-gray-400">Infrastructure for agents to talk to Google Sheets, Slack, databases</p>
                </div>
                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-semibold">Agent Skills</h4>
                  <p className="text-sm text-gray-400">Training manuals and workflows for specific tasks</p>
                </div>
                <div className="border-l-4 border-purple-500 pl-4">
                  <h4 className="font-semibold">Personas</h4>
                  <p className="text-sm text-gray-400">Complete digital workers ready to deploy</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Blog Preview */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Building in Public</h2>
            <Link href="/blog" className="text-blue-400 hover:text-blue-300">
              View all posts →
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <article className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="p-6">
                <span className="text-xs text-gray-500">March 27, 2026</span>
                <h3 className="text-lg font-semibold mt-2 mb-2">Hello World: We're Live</h3>
                <p className="text-gray-400 text-sm">
                  Agent Resources is officially deployed. Here's what we built in 24 hours and what's next.
                </p>
              </div>
            </article>
            <article className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="p-6">
                <span className="text-xs text-gray-500">Coming Soon</span>
                <h3 className="text-lg font-semibold mt-2 mb-2">The Verification Sandbox</h3>
                <p className="text-gray-400 text-sm">
                  How we're building automatic testing for every agent before it hits the marketplace.
                </p>
              </div>
            </article>
            <article className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="p-6">
                <span className="text-xs text-gray-500">Coming Soon</span>
                <h3 className="text-lg font-semibold mt-2 mb-2">First 100 Developers</h3>
                <p className="text-gray-400 text-sm">
                  Why free listings forever? Our strategy for bootstrapping the supply side.
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-20 px-4 bg-blue-900/20">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Follow Our Journey</h2>
          <p className="text-gray-400 mb-6">
            Get updates on new features, behind-the-scenes builds, and early access.
          </p>
          <form className="flex gap-2">
            <input 
              type="email" 
              placeholder="Enter your email"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
            />
            <button className="bg-blue-500 hover:bg-blue-600 px-6 py-3 rounded-lg font-semibold">
              Subscribe
            </button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-12 px-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <span className="font-bold">Agent Resources</span>
            <p className="text-gray-500 text-sm">The marketplace for AI agents</p>
          </div>
          <div className="flex space-x-6 text-gray-400">
            <Link href="/blog" className="hover:text-white">Blog</Link>
            <a href="https://twitter.com" className="hover:text-white">Twitter</a>
            <a href="https://github.com/BerkaySurmeli/agent-resources" className="hover:text-white">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
