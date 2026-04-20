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
  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Restore cart if user navigated back from payment page
  useEffect(() => {
    const pendingCart = sessionStorage.getItem('ar-pending-cart');
    if (pendingCart) {
      try {
        const parsedItems = JSON.parse(pendingCart);
        // Restore items that aren't already in the cart
        parsedItems.forEach((item: any) => {
          const exists = items.some(i => i.id === item.id || i.slug === item.slug);
          if (!exists) {
            addToCart(item);
          }
        });
        // Clear the pending cart after restoration
        sessionStorage.removeItem('ar-pending-cart');
      } catch (e) {
        console.error('Failed to restore pending cart:', e);
      }
    }
  }, [addToCart, items]);

  const handleCheckout = async () => {
    if (!email || items.length === 0) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Convert cart items to API format
      const cartItems = items.map(item => ({
        listing_id: item.id, // Note: items need to have 'id' from listings
        quantity: 1
      }));
      
      const response = await fetch(`${API_URL}/payments/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          items: cartItems,
          email: email,
          success_url: `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${window.location.origin}/cart`
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Checkout failed');
      }
      
      if (data.url) {
        // DON'T clear cart here - only clear after successful payment confirmation
        // The cart will be cleared on the success page after verification
        // Store cart items temporarily in case user navigates back
        sessionStorage.setItem('ar-pending-cart', JSON.stringify(items));
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message || 'Failed to create checkout session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <Head>
        <title>Cart | Agent Resources</title>
      </Head>

      <Navbar />

      <main className="pt-20 pb-12 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-semibold text-white mb-8">Shopping Cart</h1>

          {items.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-gray-400 mb-4">Your cart is empty</p>
              <Link href="/listings" className="text-blue-400 hover:text-blue-300">
                Browse listings →
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              {/* Cart items */}
              <div className="md:col-span-2 space-y-4">
                {items.map(item => (
                  <div key={item.id || item.slug} className="flex items-center gap-4 bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-md">
                      <span className="text-white font-bold text-xl">
                        {item.name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white">{item.name}</h3>
                      <p className="text-sm text-gray-400 capitalize">{item.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-white">${Number(item.price).toFixed(2)}</p>
                      <button
                        onClick={() => removeFromCart(item.slug)}
                        className="text-sm text-red-400 hover:text-red-300"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                
                <button
                  onClick={clearCart}
                  className="text-gray-400 hover:text-gray-300 text-sm"
                >
                  Clear cart
                </button>
              </div>

              {/* Summary */}
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 h-fit">
                <h2 className="font-semibold text-white mb-4">Order Summary</h2>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-gray-400">
                    <span>Subtotal ({items.length} items)</span>
                    <span>${Number(total).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Platform Fee (10%)</span>
                    <span>${(total * 0.10).toFixed(2)}</span>
                  </div>
                </div>

                <div className="border-t border-gray-700 pt-4 mb-6">
                  <div className="flex justify-between font-semibold text-white">
                    <span>Total</span>
                    <span>${Number(total).toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Includes 10% platform fee
                  </p>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <div className="space-y-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full px-4 py-3 rounded-lg bg-gray-900/50 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                  <button
                    onClick={handleCheckout}
                    disabled={!email || loading}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Processing...' : 'Checkout'}
                  </button>
                </div>
                
                <p className="text-xs text-gray-500 mt-4 text-center">
                  One-time purchase. Yours forever.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}