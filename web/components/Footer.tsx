import Link from 'next/link';
import { useLanguage } from '../context/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-slate-50 border-t border-slate-200 py-8">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">AR</span>
            </div>
            <span className="font-semibold text-slate-900">Agent Resources</span>
          </div>

          <div className="flex items-center gap-6 text-sm">
            <Link href="/blog" className="text-slate-600 hover:text-slate-900 transition-colors">
              {t.footer.blog}
            </Link>
            <Link href="/terms" className="text-slate-600 hover:text-slate-900 transition-colors">
              {t.footer.terms}
            </Link>
            <a href="mailto:info@shopagentresources.com" className="text-slate-600 hover:text-slate-900 transition-colors">
              {t.footer.contact}
            </a>
          </div>

          <p className="text-sm text-slate-500">
            © 2026 Agent Resources
          </p>
        </div>
      </div>
    </footer>
  );
}
