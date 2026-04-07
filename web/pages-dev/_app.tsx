import type { AppProps } from 'next/app';
import { CartProvider } from '../context/CartContext';
import { AuthProvider } from '../context/AuthContext';
import { AdminAuthProvider } from '../context/AdminAuthContext';
import { LanguageProvider } from '../context/LanguageContext';
import Layout from '../components/Layout';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AdminAuthProvider>
          <CartProvider>
            <Layout>
              <Component {...pageProps} />
            </Layout>
          </CartProvider>
        </AdminAuthProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
