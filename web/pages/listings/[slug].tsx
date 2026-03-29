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
    features: [
      { title: 'Project Planning', desc: 'Breaks down complex projects into actionable tasks' },
      { title: 'Agent Delegation', desc: 'Assigns work to specialized agents based on skills' },
      { title: 'Progress Tracking', desc: 'Monitors status and identifies blockers early' },
      { title: 'Quality Assurance', desc: 'Reviews deliverables before completion' },
    ],
    useCases: ['Managing multi-agent workflows', 'Coordinating complex projects', 'Keeping distributed work organized'],
    developer: { name: 'Claudia', initials: 'C', photo: true },
    category: 'personas',
    rating: 5,
    reviews: 1,
    downloads: 1,
    verified: true,
  },
  'chen-developer': {
    name: 'Chen',
    subtitle: 'AI Developer',
    price: 59,
    description: 'Your AI software engineer. Writes clean, efficient code across any stack.',
    features: [
      { title: 'Full-Stack Development', desc: 'Frontend, backend, APIs, databases' },
      { title: 'Code Review', desc: 'Analyzes code for bugs and improvements' },
      { title: 'Architecture', desc: 'Designs scalable system structures' },
      { title: 'Debugging', desc: 'Finds and fixes issues quickly' },
    ],
    useCases: ['Building new features', 'Refactoring legacy code', 'Setting up infrastructure'],
    developer: { name: 'Claudia', initials: 'C', photo: true },
    category: 'personas',
    rating: 5,
    reviews: 1,
    downloads: 1,
    verified: true,
  },
  'adrian-ux-designer': {
    name: 'Adrian',
    subtitle: 'AI UX Designer',
    price: 49,
    description: 'Your AI design partner. Creates interfaces, writes copy, and crafts user experiences.',
    features: [
      { title: 'Interface Design', desc: 'Clean, usable UI components' },
      { title: 'Copywriting', desc: 'Headlines, CTAs, user-facing text' },
      { title: 'User Flows', desc: 'Optimal paths through your product' },
      { title: 'Landing Pages', desc: 'High-converting marketing pages' },
    ],
    useCases: ['Designing new products', 'Improving existing UX', 'Creating marketing materials'],
    developer: { name: 'Claudia', initials: 'C', photo: true },
    category: 'personas',
    rating: 5,
    reviews: 1,
    downloads: 1,
    verified: true,
  },
  'dream-team-bundle': {
    name: 'Dream Team Bundle',
    subtitle: 'All Three Personas',
    price: 99,
    originalPrice: 157,
    description: 'Get Claudia, Chen, and Adrian. The complete AI team for your projects.',
    features: [
      { title: 'Claudia - AI Project Manager', desc: 'Keeps your projects on track ($49 value)' },
      { title: 'Chen - AI Developer', desc: 'Writes production-ready code ($59 value)' },
      { title: 'Adrian - AI UX Designer', desc: 'Creates beautiful interfaces ($49 value)' },
    ],
    useCases: ['Complete AI team setup', 'End-to-end project delivery', 'Maximum cost savings'],
    developer: { name: 'Claudia', initials: 'C', photo: true },
    category: 'bundle',
    rating: 0,
    reviews: 0,
    downloads: 0,
    verified: true,
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
              {/* Icon */}
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <span className="text-white font-bold text-3xl">{listing.developer.initials}</span>
              </div>
              
              <h1 className="text-4xl font-semibold text-slate-900 mb-2">{listing.name}</h1>
              <p className="text-xl text-blue-600 mb-4">{listing.subtitle}</p>
              <p className="text-slate-600 mb-6">{listing.description}</p>
              
              {/* Developer with photo */}
              <div className="flex items-center gap-3 mb-8 p-4 bg-slate-50 rounded-xl">
                <div className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-blue-600 flex-shrink-0 ring-2 ring-white shadow-md">
                  <img 
                    src="/claudia-photo.jpg" 
                    alt="Claudia"
                    className="w-full h-full object-cover object-center"
                    style={{ objectPosition: 'center top' }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).parentElement!.innerHTML = '<span class="text-white font-bold text-lg flex items-center justify-center w-full h-full">C</span>';
                    }}
                  />
                </div>
                <div>
                  <p className="font-medium text-slate-900">{listing.developer.name}</p>
                  <p className="text-sm text-slate-500">Developer</p>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6 text-slate-500 mb-8">
                <span className="flex items-center gap-1.5">
                  <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="font-medium">{listing.rating > 0 ? listing.rating : 'New'}</span>
                  {listing.reviews > 0 && <span>({listing.reviews} reviews)</span>}
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>{listing.downloads} downloads</span>
                </span>
              </div>

              {/* Features */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">What {listing.name} Does</h2>
                <div className="space-y-4">
                  {listing.features.map((feature: any, i: number) => (
                    <div key={i} className="flex gap-4 p-4 bg-slate-50 rounded-xl">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-medium text-slate-900">{feature.title}</h3>
                        <p className="text-sm text-slate-600">{feature.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Use Cases */}
              <div>
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Perfect For</h2>
                <ul className="space-y-2">
                  {listing.useCases.map((useCase: string, i: number) => (
                    <li key={i} className="flex items-center gap-2 text-slate-600">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                      {useCase}
                    </li>
                  ))}
                </ul>
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
