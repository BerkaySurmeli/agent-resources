import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Navbar from '../components/Navbar';
import { API_URL } from '../lib/api';

export default function Cart() {
  const { items, removeFromCart, total, clearCart, addToCart } = useCart();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [bundleDiscount, setBundleDiscount] = useState<{ discountCents: number; itemCount: number } | null>(null);

  // Pick up bundle discount set by the wizard
  useEffect(() => {
    const raw = sessionStorage.getItem('ar-bundle-discount');
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      setBundleDiscount(parsed);
    } catch {
      // ignore malformed entry
    }
  }, []);

  // Restore cart if user navigated back from payment page
  useEffect(() => {
    const pendingCart = sessionStorage.getItem('ar-pending-cart');
    if (!pendingCart) return;
    try {
      const parsedItems = JSON.parse(pendingCart);
      // Build a Set for O(1) existence checks
      const existingIds = new Set(items.flatMap(i => [i.id, i.slug].filter(Boolean)));
      parsedItems.forEach((item: any) => {
        if (!existingIds.has(item.id) && !existingIds.has(item.slug)) {
          addToCart(item);
        }
      });
      sessionStorage.removeItem('ar-pending-cart');
    } catch {
      // silently skip malformed pending cart
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount only — addToCart is stable

  const handleCheckout = async () => {
    if (!user && !guestEmail.trim()) {
      setError('Please enter your email address to continue.');
      return;
    }
    if (items.length === 0) return;

    setLoading(true);
    setError('');

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('ar-token') : null;
      const cartItems = items.map(item => ({
        listing_id: item.id,
        quantity: 1
      }));

      const response = await fetch(`${API_URL}/payments/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          items: cartItems,
          success_url: `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${window.location.origin}/cart`,
          ...(!user && { customer_email: guestEmail.trim() }),
          ...(bundleDiscount ? { bundle_discount_cents: bundleDiscount.discountCents } : {}),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Checkout failed');
      }

      if (data.url) {
        sessionStorage.setItem('ar-pending-cart', JSON.stringify(items));
        sessionStorage.removeItem('ar-bundle-discount');
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create checkout session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-100">
      <Head>
        <title>Cart | Agent Resources</title>
      </Head>

      <Navbar />

      <main className="pt-20 pb-12 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="heading-serif text-3xl text-ink-900 mb-8">Shopping Cart</h1>

          {items.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-ink-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-ink-400 mb-4">Your cart is empty</p>
              <Link href="/listings" className="text-terra-600 hover:text-terra-700 font-medium">
                Browse listings →
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              {/* Cart items */}
              <div className="md:col-span-2 space-y-4">
                {items.map(item => (
                  <div key={item.id || item.slug} className="card flex items-center gap-4 p-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #3549D4, #6470FA)' }}>
                      <span className="text-white font-bold text-lg">
                        {item.name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-ink-900 truncate">{item.name}</h3>
                      <p className="text-sm text-ink-400 capitalize">{item.category}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-semibold text-ink-900">${Number(item.price).toFixed(2)}</p>
                      <button
                        onClick={() => removeFromCart(item.slug)}
                        className="text-sm text-red-500 hover:text-red-600"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  onClick={clearCart}
                  className="text-ink-400 hover:text-ink-600 text-sm"
                >
                  Clear cart
                </button>
              </div>

              {/* Summary */}
              <div className="card p-6 h-fit">
                <h2 className="font-semibold text-ink-900 mb-4">Order Summary</h2>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-ink-500">
                    <span>Subtotal ({items.length} items)</span>
                    <span>${Number(total).toFixed(2)}</span>
                  </div>
                  {bundleDiscount && (
                    <div className="flex justify-between text-green-700 text-sm font-medium">
                      <span>Bundle discount (15% off)</span>
                      <span>−${(bundleDiscount.discountCents / 100).toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-cream-200 pt-4 mb-6">
                  <div className="flex justify-between font-semibold text-ink-900">
                    <span>Total</span>
                    <span>
                      {bundleDiscount
                        ? `$${Math.max(0, total - bundleDiscount.discountCents / 100).toFixed(2)}`
                        : `$${Number(total).toFixed(2)}`
                      }
                    </span>
                  </div>
                  {bundleDiscount && (
                    <p className="text-xs text-green-700 mt-1">AI team bundle — discount applied at checkout</p>
                  )}
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                  </div>
                )}

                {!user && (
                  <div className="mb-4 space-y-2">
                    <label htmlFor="guest-email" className="block text-sm font-medium text-ink-700">
                      Your email
                    </label>
                    <input
                      id="guest-email"
                      type="email"
                      placeholder="you@example.com"
                      value={guestEmail}
                      onChange={e => setGuestEmail(e.target.value)}
                      className="input w-full"
                      autoComplete="email"
                    />
                    <p className="text-xs text-ink-400">
                      Download link sent here. <Link href="/login" className="underline hover:text-ink-600">Log in</Link> to use your account.
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  <button
                    onClick={handleCheckout}
                    disabled={loading}
                    className="btn-primary w-full justify-center disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Processing...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Pay securely with Stripe
                      </>
                    )}
                  </button>
                </div>

                <p className="text-xs text-ink-400 mt-4 text-center">One-time purchase · Yours forever</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
