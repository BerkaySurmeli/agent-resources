import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.shopagentresources.com';

// Featured developers fallback data
const featuredDevelopers: Record<string, { developer: Developer; listings: Listing[]; stats: DeveloperStats }> = {
  claudia: {
    developer: {
      id: 'claudia',
      name: 'Claudia',
      avatar_url: '',
      is_verified: true,
    },
    listings: [
      { id: '1', slug: 'claudia-project-manager', name: 'AI Project Manager', category: 'persona', price_cents: 4900, is_verified: true },
      { id: '2', slug: 'claudia-team-lead', name: 'AI Team Lead', category: 'persona', price_cents: 5900, is_verified: true },
      { id: '3', slug: 'claudia-scrum-master', name: 'AI Scrum Master', category: 'skill', price_cents: 3900, is_verified: true },
    ],
    stats: {
      total_listings: 3,
      total_sales: 128,
      average_rating: 5.0,
      total_reviews: 47,
    },
  },
  chen: {
    developer: {
      id: 'chen',
      name: 'Chen',
      avatar_url: '',
      is_verified: true,
    },
    listings: [
      { id: '4', slug: 'chen-developer', name: 'AI Developer', category: 'persona', price_cents: 5900, is_verified: true },
      { id: '5', slug: 'chen-code-reviewer', name: 'AI Code Reviewer', category: 'skill', price_cents: 2900, is_verified: true },
      { id: '6', slug: 'chen-architect', name: 'AI System Architect', category: 'persona', price_cents: 7900, is_verified: true },
      { id: '7', slug: 'chen-debugger', name: 'AI Debugger Pro', category: 'skill', price_cents: 3900, is_verified: true },
      { id: '8', slug: 'chen-devops', name: 'AI DevOps Engineer', category: 'persona', price_cents: 6900, is_verified: true },
    ],
    stats: {
      total_listings: 5,
      total_sales: 256,
      average_rating: 4.9,
      total_reviews: 89,
    },
  },
  adrian: {
    developer: {
      id: 'adrian',
      name: 'Adrian',
      avatar_url: '',
      is_verified: true,
    },
    listings: [
      { id: '9', slug: 'adrian-ux-designer', name: 'AI UX Designer', category: 'persona', price_cents: 4900, is_verified: true },
      { id: '10', slug: 'adrian-copywriter', name: 'AI Copywriter', category: 'skill', price_cents: 2900, is_verified: true },
      { id: '11', slug: 'adrian-brand-designer', name: 'AI Brand Designer', category: 'persona', price_cents: 5900, is_verified: true },
      { id: '12', slug: 'adrian-researcher', name: 'AI UX Researcher', category: 'skill', price_cents: 3900, is_verified: true },
    ],
    stats: {
      total_listings: 4,
      total_sales: 184,
      average_rating: 5.0,
      total_reviews: 62,
    },
  },
};

interface Developer {
  id: string;
  name: string;
  avatar_url?: string;
  is_verified: boolean;
}

interface Listing {
  id: string;
  slug: string;
  name: string;
  category: string;
  price_cents: number;
  is_verified: boolean;
}

interface DeveloperStats {
  total_listings: number;
  total_sales: number;
  average_rating: number;
  total_reviews: number;
}

export default function DeveloperProfile() {
  const router = useRouter();
  const { id } = router.query;
  const { t } = useLanguage();
  const [developer, setDeveloper] = useState<Developer | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [stats, setStats] = useState<DeveloperStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      fetchDeveloperData();
    }
  }, [id]);

  const fetchDeveloperData = async () => {
    try {
      const developerId = id as string;
      
      // Check if it's a featured developer first
      if (featuredDevelopers[developerId]) {
        const featured = featuredDevelopers[developerId];
        setDeveloper(featured.developer);
        setListings(featured.listings);
        setStats(featured.stats);
        setLoading(false);
        return;
      }
      
      // Fetch developer info from API
      const devRes = await fetch(`${API_URL}/developers/${id}`);
      if (!devRes.ok) throw new Error('Developer not found');
      const devData = await devRes.json();
      setDeveloper(devData);

      // Fetch developer listings
      const listingsRes = await fetch(`${API_URL}/developers/${id}/listings`);
      if (listingsRes.ok) {
        const listingsData = await listingsRes.json();
        setListings(listingsData);
      }

      // Fetch developer stats
      const statsRes = await fetch(`${API_URL}/developers/${id}/stats`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const getCategoryName = (category: string) => {
    const names: Record<string, string> = {
      'persona': 'AI Persona',
      'skill': 'Agent Skill',
      'mcp_server': 'MCP Server',
    };
    return names[category] || category;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !developer) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{t.developer.notFound || 'Developer not found'}</h1>
          <Link href="/developers" className="text-blue-600 hover:underline">
            {t.developer.browseDevelopers || 'Browse developers'}
          </Link>
        </div>
      </div>
    );
  }

  const personas = listings.filter(l => l.category === 'persona');
  const skills = listings.filter(l => l.category === 'skill');
  const mcps = listings.filter(l => l.category === 'mcp_server');

  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>{developer.name} | Agent Resources</title>
      </Head>

      <main className="pt-24 pb-12 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Developer Header */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-8 mb-8">
            <div className="flex items-center gap-6">
              {developer.avatar_url ? (
                <img
                  src={developer.avatar_url}
                  alt={developer.name}
                  className="w-24 h-24 rounded-2xl object-cover"
                />
              ) : (
                <div className={`w-24 h-24 rounded-2xl flex items-center justify-center text-white text-3xl font-bold ${
                  developer.id === 'claudia' ? 'bg-gradient-to-br from-blue-500 to-blue-700' :
                  developer.id === 'chen' ? 'bg-gradient-to-br from-slate-700 to-slate-900' :
                  developer.id === 'adrian' ? 'bg-gradient-to-br from-purple-500 to-purple-700' :
                  'bg-blue-600'
                }`}>
                  {developer.id === 'chen' ? 'Ch' : developer.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-slate-900">{developer.name}</h1>
                  {developer.is_verified && (
                    <span className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {t.listings.verified}
                    </span>
                  )}
                </div>
                <p className="text-slate-600">
                  {developer.id === 'claudia' && 'AI Project Manager'}
                  {developer.id === 'chen' && 'AI Developer'}
                  {developer.id === 'adrian' && 'AI UX Designer'}
                  {!['claudia', 'chen', 'adrian'].includes(developer.id) && 'Developer'}
                </p>
              </div>
            </div>

            {/* Stats */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                <div className="bg-white rounded-xl p-4">
                  <p className="text-sm text-slate-500 mb-1">{t.developer.listings}</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.total_listings}</p>
                </div>
                <div className="bg-white rounded-xl p-4">
                  <p className="text-sm text-slate-500 mb-1">{t.developer.sales}</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.total_sales}</p>
                </div>
                <div className="bg-white rounded-xl p-4">
                  <p className="text-sm text-slate-500 mb-1">{t.developer.rating}</p>
                  <div className="flex items-center gap-1">
                    <p className="text-2xl font-bold text-slate-900">{stats.average_rating.toFixed(1)}</p>
                    <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4">
                  <p className="text-sm text-slate-500 mb-1">{t.developer.reviews}</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.total_reviews}</p>
                </div>
              </div>
            )}
          </div>

          {/* Personas Section */}
          {personas.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">{t.developer.aiPersonas}</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {personas.map(persona => (
                  <Link
                    key={persona.id}
                    href={`/listings/${persona.slug}`}
                    className="group bg-white border border-slate-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <span className="text-blue-600 font-bold text-lg">
                          {persona.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      {persona.is_verified && (
                        <span className="text-blue-600">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {persona.name}
                    </h3>
                    <p className="text-slate-500 text-sm mt-1">{getCategoryName(persona.category)}</p>
                    <p className="text-lg font-bold text-slate-900 mt-3">{formatPrice(persona.price_cents)}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Skills Section */}
          {skills.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">{t.developer.agentSkills}</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {skills.map(skill => (
                  <Link
                    key={skill.id}
                    href={`/listings/${skill.slug}`}
                    className="group bg-white border border-slate-200 rounded-xl p-6 hover:border-purple-300 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                        <span className="text-purple-600 font-bold text-lg">
                          {skill.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      {skill.is_verified && (
                        <span className="text-purple-600">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-slate-900 group-hover:text-purple-600 transition-colors">
                      {skill.name}
                    </h3>
                    <p className="text-slate-500 text-sm mt-1">{getCategoryName(skill.category)}</p>
                    <p className="text-lg font-bold text-slate-900 mt-3">{formatPrice(skill.price_cents)}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* MCP Servers Section */}
          {mcps.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">{t.developer.mcpServers}</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mcps.map(mcp => (
                  <Link
                    key={mcp.id}
                    href={`/listings/${mcp.slug}`}
                    className="group bg-white border border-slate-200 rounded-xl p-6 hover:border-green-300 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                        <span className="text-green-600 font-bold text-lg">
                          {mcp.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      {mcp.is_verified && (
                        <span className="text-green-600">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-slate-900 group-hover:text-green-600 transition-colors">
                      {mcp.name}
                    </h3>
                    <p className="text-slate-500 text-sm mt-1">{getCategoryName(mcp.category)}</p>
                    <p className="text-lg font-bold text-slate-900 mt-3">{formatPrice(mcp.price_cents)}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {listings.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-500">{t.listings.noResults}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
