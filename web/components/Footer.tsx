import Link from 'next/link';
import { useLanguage } from '../context/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-dark-800/50 py-8 relative">
      {/* Top gradient line */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary-500/30 to-transparent" />

      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center shadow-glow">
              <span className="text-white font-bold text-sm">AR</span>
            </div>
            <span className="font-semibold text-white">Agent Resources</span>
          </div>

          <div className="flex items-center gap-6 text-sm">
            <Link href="/blog" className="text-dark-400 hover:text-white transition-colors">
              {t.footer.blog}
            </Link>
            <Link href="/terms" className="text-dark-400 hover:text-white transition-colors">
              {t.footer.terms}
            </Link>
            <Link href="/contact" className="text-dark-400 hover:text-white transition-colors">
              {t.footer.contact}
            </Link>
          </div>

          <p className="text-sm text-dark-500">
            © 2026 Agent Resources
          </p>
        </div>
      </div>
    </footer>
  );
}
