import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCart } from '../../context/CartContext';

const listings: Record<string, any> = {
  'claudia-project-manager': {
    name: 'Claudia',
    subtitle: 'AI Project Manager',
    price: 49,
    description: 'Your AI project orchestrator. Delegates tasks, tracks progress, and ensures nothing falls through the cracks.',
    fullDescription: `Claudia is the orchestrating intelligence that keeps your AI projects on track. She doesn't do the work herself — she makes sure the right agents do the right work at the right time.

## What Claudia Does

**Project Planning**: Breaks down complex projects into actionable tasks
**Agent Delegation**: Assigns work to specialized agents
**Progress Tracking**: Monitors status and identifies blockers
**Quality Assurance**: Reviews deliverables before completion

## Perfect For
- Managing multi-agent workflows
- Coordinating complex projects
- Keeping distributed work organized`,
    developer: { name: 'Claudia', initials: 'C' },
    category: 'personas',
    rating: 4.9,
    reviews: 234,
  },
  'chen-developer': {
    name: 'Chen',
    subtitle: 'AI Developer',
    price: 59,
    description: 'Your AI software engineer. Writes clean, efficient code across any stack.',
    fullDescription: `Chen is a senior-level AI developer who writes production-ready code.

## What Chen Does

**Full-Stack Development**: Frontend, backend, APIs, databases
**Code Review**: Analyzes code for bugs and improvements
**Architecture**: Designs scalable system structures
**Debugging**: Finds and fixes issues`,
    developer: { name: 'Chen', initials: 'C' },
    category: 'personas',
    rating: 4.8,
    reviews: 189,
  },
  'adrian-ux-designer': {
    name: 'Adrian',
    subtitle: 'AI UX Designer',
    price: 49,
    description: 'Your AI design partner. Creates interfaces, writes copy, and crafts user experiences.',
    fullDescription: `Adrian is a UX-focused designer who understands that good design solves problems.

## What Adrian Does

**Interface Design**: Clean, usable UI components
**Copywriting**: Headlines, CTAs, user-facing text
**User Flows**: Optimal paths through your product
**Landing Pages**: High-converting marketing pages`,
    developer: { name: 'Adrian', initials: 'A' },
    category: 'personas',
    rating: 4.7,
    reviews: 156,
  },
  'dream-team-bundle': {
    name: 'Dream Team Bundle',
    subtitle: 'All Three Personas',
    price: 99,
    originalPrice: 157,
    description: 'Get Claudia, Chen, and Adrian. The complete AI team for your projects.',
    fullDescription: `Why hire one when you can have a complete team? The Dream Team Bundle gives you everything you need.

## What's Included

- Claudia - AI Project Manager ($49)
- Chen - AI Developer ($59)
- Adrian - AI UX Designer ($49)

## Bundle Benefits
- 37% discount vs buying individually
- Seamless integration
- Complete workflow from idea to shipped product`,
    developer: { name: 'Agent Resources', initials: 'AR' },
    category: 'bundle',
    rating: 4.9,
    reviews: 89,
  },
};

export default function ListingDetail() {
  const router = useRouter();
  const { slug } = router.query;
  const { addToCart } = useCart();
  
  const listing = listings[slug as string];

  if (!listing) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Listing not found</h1>
          <Link href="/listings" className="text-blue-600 hover:underline">
            Browse all listings
          </Link>
        </div>
      </div>
    );
  }

  const handleBuyNow = () => {
    addToCart({
      slug: slug as string,
      name: `${listing.name} - ${listing.subtitle}`,
      price: listing.price,
      category: listing.category
    });
    window.location.href = '/cart';
  };

  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>{listing.name} | Agent Resources</title>
      </Head>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-slate-200 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">AR</span>
            </div>
            <span className="font-semibold text-slate-900">Agent Resources</span>
          </Link>
          <Link href="/listings" className="text-slate-600 hover:text-slate-900">← Back to listings</Link>
        </div>
      </nav>

      <main className="pt-24 pb-12 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Left Column */}
            <div>
              <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mb-6">
                <span className="text-white font-bold text-3xl">{listing.developer.initials}</span>
              </div>
              
              <h1 className="text-4xl font-semibold text-slate-900 mb-2">{listing.name}</h1>
              <p className="text-xl text-blue-600 mb-4">{listing.subtitle}</p>
              <p className="text-slate-600 mb-6">{listing.description}</p>
              
              <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-sm font-bold">
                  {listing.developer.initials}
                </div>
                <span className="text-slate-700">by {listing.developer.name}</span>
              </div>

              <div className="flex items-center gap-4 text-slate-500 mb-8">
                <span className="flex items-center gap-1">
                  <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  {listing.rating} ({listing.reviews} reviews)
                </span>
              </div>

              <div className="prose prose-slate">
                {listing.fullDescription.split('\n\n').map((paragraph: string, i: number) => {
                  if (paragraph.startsWith('## ')) {
                    return <h2 key={i} className="text-xl font-semibold mt-6 mb-3">{paragraph.replace('## ', '')}</h2>;
                  }
                  if (paragraph.startsWith('- ')) {
                    return <li key={i} className="ml-4">{paragraph.replace('- ', '')}</li>;
                  }
                  return <p key={i} className="mb-4">{paragraph}</p>;
                })}
              </div>
            </div>

            {/* Right Column - Pricing */}
            <div className="md:sticky md:top-24 h-fit">
              <div className="bg-slate-50 rounded-2xl p-8">
                <div className="flex items-baseline gap-3 mb-6">
                  <span className="text-4xl font-bold text-slate-900">${listing.price}</span>
                  {listing.originalPrice && (
                    <span className="text-xl text-slate-400 line-through">${listing.originalPrice}</span>
                  )}
                </div>

                <button
                  onClick={handleBuyNow}
                  className="w-full bg-blue-600 text-white py-4 rounded-xl font-medium hover:bg-blue-700 transition-colors mb-4"
                >
                  Buy Now
                </button>

                <p className="text-sm text-slate-500 text-center">
                  One-time purchase. Yours forever.
                </p>

                <div className="mt-6 pt-6 border-t border-slate-200">
                  <h3 className="font-semibold text-slate-900 mb-3">What's included:</h3>
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Persona configuration
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      One-click OpenClaw setup
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Lifetime updates
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
