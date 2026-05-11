import Link from 'next/link';

/**
 * BridgeSection: Connects API-first developers with browse-and-buy users
 *
 * Insert between "How it works" and "What's in the catalog" sections
 * on the homepage. Progressive disclosure strategy.
 */
export default function BridgeSection() {

  return (
    <section className="border-t border-cream-200 bg-gradient-to-b from-cream-50 to-cream-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">

        {/* Eyebrow badge */}
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-2 text-sm font-medium text-brand bg-brand/5 border border-brand/20 rounded-full px-4 py-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            New to agentic AI? Start here.
          </span>
        </div>

        {/* Main content grid */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-12">

          {/* Left: Copy */}
          <div>
            <h2 className="heading-serif text-3xl md:text-4xl text-ink-900 mb-6 leading-tight">
              Build your AI team<br />
              <span className="italic text-brand">without writing code</span>
            </h2>

            <p className="text-lg text-ink-600 mb-8 leading-relaxed">
              Browse pre-built personas, skills, and MCP servers. Buy what you need,
              download, and install in minutes — no OAuth tokens or API calls required.
            </p>

            {/* Two paths */}
            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              <div className="card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center">
                    <svg className="w-4 h-4 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-semibold text-ink-900">For Developers</h3>
                </div>
                <p className="text-xs text-ink-500 leading-relaxed mb-3">
                  Full API access with OAuth 2.1 + MCP transport. Your agents shop autonomously.
                </p>
                <Link href="/docs" className="text-xs text-brand hover:underline font-medium">
                  API documentation →
                </Link>
              </div>

              <div className="card p-5 ring-2 ring-brand/20">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-terra-500/10 flex items-center justify-center">
                    <svg className="w-4 h-4 text-terra-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-semibold text-ink-900">For Everyone Else</h3>
                </div>
                <p className="text-xs text-ink-500 leading-relaxed mb-3">
                  Browse like an app store, buy with one click, follow simple install instructions.
                </p>
                <Link href="/listings" className="text-xs text-brand hover:underline font-medium">
                  Start shopping →
                </Link>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/listings" className="btn-primary text-base px-7 py-3.5 text-center">
                Browse catalog →
              </Link>
              <Link href="/docs" className="btn-secondary text-base px-7 py-3.5 text-center">
                View documentation
              </Link>
            </div>
          </div>

          {/* Right: Visual (Screenshot or Illustration) */}
          <div className="hidden lg:block">
            <div className="rounded-2xl border border-cream-300 bg-white shadow-2xl overflow-hidden">
              {/* Mock browser chrome */}
              <div className="bg-cream-200 px-4 py-3 flex items-center gap-2 border-b border-cream-300">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-terra-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 bg-cream-100 rounded px-3 py-1 text-xs text-ink-400 font-mono">
                  shopagentresources.com/listings
                </div>
              </div>

              {/* Mock listings grid */}
              <div className="p-6 space-y-4">
                {[
                  { title: 'GitHub MCP Server', price: '$15', rating: '4.8★', downloads: '12.5k', badge: 'Verified' },
                  { title: 'Research Persona v2', price: '$8', rating: '4.9★', downloads: '8.2k', badge: 'Trending' },
                  { title: 'Slack Integration', price: '$12', rating: '4.7★', downloads: '6.8k', badge: 'Verified' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-cream-50 rounded-xl border border-cream-200">
                    <div className="w-12 h-12 bg-gradient-to-br from-brand to-terra-500 rounded-lg flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-semibold text-ink-900 truncate">{item.title}</h4>
                        <span className="text-xs px-2 py-0.5 bg-brand/10 text-brand rounded-full">
                          {item.badge}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-ink-500">
                        <span>{item.rating}</span>
                        <span>·</span>
                        <span>{item.downloads} downloads</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-ink-900 mb-1">{item.price}</div>
                      <button className="text-xs px-3 py-1.5 bg-brand text-white rounded-lg hover:bg-brand/90 transition-colors">
                        Buy now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Caption */}
            <p className="text-xs text-ink-400 text-center mt-4">
              Quality-checked tools with trust scores, ratings, and instant download.
            </p>
          </div>

        </div>

        {/* Trust signals row */}
        <div className="border-t border-cream-200 pt-8">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-center">
            {[
              {
                icon: '🛡️',
                label: 'VirusTotal-scanned',
                detail: 'Every upload checked for malware',
              },
              {
                icon: '🔒',
                label: 'Stripe-secured',
                detail: 'Your payment data never touches our servers',
              },
              {
                icon: '📦',
                label: 'Instant download',
                detail: 'Get install manifests in seconds',
              },
            ].map(({ icon, label, detail }) => (
              <div key={label} className="group">
                <div className="text-3xl mb-2">{icon}</div>
                <div className="text-sm font-medium text-ink-900 mb-1">{label}</div>
                <div className="text-xs text-ink-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  {detail}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
