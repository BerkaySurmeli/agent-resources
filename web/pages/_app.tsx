import type { AppProps } from 'next/app';
import '../styles/globals.css';
import { LanguageProvider } from '../context/LanguageContext';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <LanguageProvider>
      <Component {...pageProps} />
    </LanguageProvider>
  );
}
