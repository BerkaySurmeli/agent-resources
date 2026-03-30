import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface CartItem {
  slug: string;
  name: string;
  price: number;
  category: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (slug: string) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('ar-cart');
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch {}
    }
  }, []);

  // Save to localStorage when items change
  useEffect(() => {
    localStorage.setItem('ar-cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (item: CartItem) => {
    setItems(prev => {
      if (prev.find(i => i.slug === item.slug)) return prev;
      return [...prev, item];
    });
  };

  const removeFromCart = (slug: string) => {
    setItems(prev => prev.filter(i => i.slug !== slug));
  };

  const clearCart = () => {
    setItems([]);
  };

  const total = Math.round(items.reduce((sum, item) => sum + item.price, 0) * 100) / 100;
  const itemCount = items.length;

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, clearCart, total, itemCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}
