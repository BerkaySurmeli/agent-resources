import Link from 'next/link';
import { useLanguage } from '../context/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-gray-900 border-t border-gray-800 py-8">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">AR</span>
            </div>
            <span className="font-semibold text-white">Agent Resources</span>
          </div>

          <div className="flex items-center gap-6 text-sm">
            <Link href="/blog" className="text-gray-400 hover:text-white transition-colors">
              {t.footer.blog}
            </Link>
            <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
              {t.footer.terms}
            </Link>
            <Link href="/contact" className="text-gray-400 hover:text-white transition-colors">
              {t.footer.contact}
            </Link>
          </div>

          <p className="text-sm text-gray-500">
            © 2026 Agent Resources
          </p>
        </div>
      </div>
    </footer>
  );
}
