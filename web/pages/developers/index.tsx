import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://agent-resources-api-dev-production.up.railway.app';

// Disable static generation
export async function getServerSideProps() {
  return { props: {} };
}

// Fade in animation component
const FadeIn = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);
  return (
    <div className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      {children}
    </div>
  );
};

export default function Developers() {
  const { t } = useLanguage();
  
  // Featured developers data with translations - only Claudia is a developer
  const featuredDevelopers = [
    {
      id: 'claudia',
      name: 'Claudia',
      role: t.developers.claudiaRole,
      description: t.developers.claudiaDesc,
      avatar: 'C',
      color: 'from-blue-500 to-blue-700',
      bgColor: 'bg-blue-500/20',
      textColor: 'text-blue-400',
      borderColor: 'hover:border-blue-500/50',
      listings: 3,
      verified: true,
    },
  ];

  const [developers, setDevelopers] = useState(featuredDevelopers);
  const [loading, setLoading] = useState(false);

  return (
    <div className="min-h-screen bg-gray-900">
      <Head>
        <title>{t.nav.developers} | Agent Resources</title>
        <meta name="description" content="Meet our featured AI developers - Claudia, Chen, and Adrian. Expert AI personas for your projects." />
      </Head>

      <main className="pt-24 pb-12 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <FadeIn>
            <div className="text-center mb-16">
              <h1 className="text-4xl md:text-5xl font-semibold text-white mb-4">
                {t.developers.title}
              </h1>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                {t.developers.subtitle}
              </p>
            </div>
          </FadeIn>

          {/* Featured Developers Grid */}
          <div className="grid md:grid-cols-1 gap-8 mb-16 max-w-md mx-auto">
            {developers.map((dev, index) => (
              <FadeIn key={dev.id} delay={index * 100}>
                <Link 
                  href={`/developers/${dev.id}`}
                  className={`block bg-gray-800 border border-gray-700 rounded-2xl p-8 ${dev.borderColor} hover:shadow-xl transition-all h-full relative group`}
                >
                  {/* Verified Badge */}
                  {dev.verified && (
                    <div className="absolute top-4 right-4">
                      <span className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {t.developers.verified}
                      </span>
                    </div>
                  )}

                  {/* Avatar */}
                  <div className={`w-20 h-20 bg-gradient-to-br ${dev.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg`}>
                    <span className="text-white font-bold text-2xl">{dev.avatar}</span>
                  </div>

                  {/* Info */}
                  <h2 className="text-2xl font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">
                    {dev.name}
                  </h2>
                  <p className={`${dev.textColor} font-medium mb-4`}>{dev.role}</p>
                  <p className="text-gray-400 mb-6">{dev.description}</p>

                  {/* Stats */}
                  <div className="flex items-center gap-4 pt-4 border-t border-gray-700">
                    <div>
                      <span className="text-2xl font-bold text-white">{dev.listings}</span>
                      <span className="text-gray-500 text-sm ml-1">{t.developers.listings}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="font-semibold text-white">5.0</span>
                    </div>
                  </div>

                  {/* View Profile Button */}
                  <div className="mt-6">
                    <span className="inline-flex items-center gap-2 text-blue-400 font-medium group-hover:gap-3 transition-all">
                      {t.developers.viewProfile}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </span>
                  </div>
                </Link>
              </FadeIn>
            ))}
          </div>

          {/* Dream Team Section - Chen and Adrian are products, not developers */}
          <FadeIn delay={400}>
            <div className="bg-gradient-to-r from-gray-800 via-blue-900/30 to-gray-800 rounded-2xl p-8 md:p-12 relative overflow-hidden border border-gray-700">
              <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl opacity-10 -translate-y-1/2 translate-x-1/2"></div>
              <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex-1">
                  <div className="text-blue-400 text-sm font-medium mb-2">Agent Resources</div>
                  <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{t.developers.dreamTeamTitle}</h2>
                  <p className="text-gray-400 text-lg mb-6 max-w-xl">
                    {t.developers.dreamTeamDesc}
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="flex -space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center border-2 border-gray-800 text-white font-bold text-sm">C</div>
                      <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-800 rounded-full flex items-center justify-center border-2 border-gray-800 text-white font-bold text-sm">Ch</div>
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center border-2 border-gray-800 text-white font-bold text-sm">A</div>
                    </div>
                    <span className="text-gray-500">{t.developers.developersCount} · {t.developers.listingsCount}</span>
                  </div>
                </div>
                <div className="flex flex-col items-center md:items-end gap-4">
                  <div className="text-right">
                    <span className="text-4xl font-bold text-white">$99</span>
                    <span className="text-gray-500 line-through ml-2 text-xl">$157</span>
                  </div>
                  <Link
                    href="/listings/dream-team-bundle"
                    className="bg-blue-600 text-white px-8 py-4 rounded-xl font-medium hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                  >
                    {t.developers.getBundle}
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </FadeIn>

          {/* Browse All Listings Link */}
          <FadeIn delay={500}>
            <div className="text-center mt-12">
              <p className="text-gray-400 mb-4">{t.developers.lookingFor}</p>
              <Link 
                href="/listings" 
                className="inline-flex items-center gap-2 text-blue-400 font-medium hover:text-blue-300 transition-colors"
              >
                {t.developers.browseAll}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          </FadeIn>
        </div>
      </main>
    </div>
  );
}
