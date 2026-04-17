import type { AppProps } from 'next/app';
import '../styles/globals.css';
import { LanguageProvider } from '../context/LanguageContext';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { AdminAuthProvider } from '../context/AdminAuthContext';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <LanguageProvider>
      <AuthProvider>
        <CartProvider>
          <AdminAuthProvider>
            <Component {...pageProps} />
          </AdminAuthProvider>
        </CartProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
