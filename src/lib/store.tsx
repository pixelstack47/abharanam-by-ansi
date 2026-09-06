"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { CartItem } from "@/types";
import { getProduct } from "@/data/products";

const CART_KEY = "abharanam:cart";
const WISHLIST_KEY = "abharanam:wishlist";
const RECENT_KEY = "abharanam:recent-searches";

interface StoreContextValue {
  hydrated: boolean;
  cart: CartItem[];
  wishlist: string[];
  recentSearches: string[];
  cartCount: number;
  cartSubtotal: number;
  cartOpen: boolean;
  searchOpen: boolean;
  menuOpen: boolean;
  quickViewSlug: string | null;
  addToCart: (slug: string, quantity?: number) => void;
  setQuantity: (slug: string, quantity: number) => void;
  removeFromCart: (slug: string) => void;
  clearCart: () => void;
  toggleWishlist: (slug: string) => void;
  isWishlisted: (slug: string) => boolean;
  addRecentSearch: (term: string) => void;
  setCartOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  setMenuOpen: (open: boolean) => void;
  setQuickViewSlug: (slug: string | null) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable — carry on in-memory */
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [quickViewSlug, setQuickViewSlug] = useState<string | null>(null);

  useEffect(() => {
    /* One-time post-mount hydration from localStorage. Reading storage in
       useState initializers would run during the hydration render and
       mismatch the server HTML, so it must happen in an effect. */
    /* eslint-disable react-hooks/set-state-in-effect */
    setCart(readJSON<CartItem[]>(CART_KEY, []).filter((i) => getProduct(i.slug)));
    setWishlist(readJSON<string[]>(WISHLIST_KEY, []).filter((s) => getProduct(s)));
    setRecentSearches(readJSON<string[]>(RECENT_KEY, []));
    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const persisted = useRef(false);
  useEffect(() => {
    // Skip the very first pass so the initial empty state never clobbers storage.
    if (!hydrated) return;
    if (!persisted.current) {
      persisted.current = true;
      return;
    }
    writeJSON(CART_KEY, cart);
    writeJSON(WISHLIST_KEY, wishlist);
    writeJSON(RECENT_KEY, recentSearches);
  }, [hydrated, cart, wishlist, recentSearches]);

  // Escape closes the topmost overlay. The search overlay owns its own handler
  // because it also has to clear the query.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (quickViewSlug !== null) setQuickViewSlug(null);
      else if (cartOpen) setCartOpen(false);
      else if (menuOpen) setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [quickViewSlug, cartOpen, menuOpen]);

  // Lock body scroll while any overlay is open.
  useEffect(() => {
    const locked = cartOpen || searchOpen || menuOpen || quickViewSlug !== null;
    document.body.style.overflow = locked ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [cartOpen, searchOpen, menuOpen, quickViewSlug]);

  const addToCart = useCallback((slug: string, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.slug === slug);
      if (existing) {
        return prev.map((i) =>
          i.slug === slug ? { ...i, quantity: Math.min(i.quantity + quantity, 10) } : i,
        );
      }
      return [...prev, { slug, quantity }];
    });
  }, []);

  const setQuantity = useCallback((slug: string, quantity: number) => {
    setCart((prev) =>
      quantity <= 0
        ? prev.filter((i) => i.slug !== slug)
        : prev.map((i) => (i.slug === slug ? { ...i, quantity: Math.min(quantity, 10) } : i)),
    );
  }, []);

  const removeFromCart = useCallback((slug: string) => {
    setCart((prev) => prev.filter((i) => i.slug !== slug));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const toggleWishlist = useCallback((slug: string) => {
    setWishlist((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  }, []);

  const isWishlisted = useCallback(
    (slug: string) => wishlist.includes(slug),
    [wishlist],
  );

  const addRecentSearch = useCallback((term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    setRecentSearches((prev) =>
      [trimmed, ...prev.filter((t) => t.toLowerCase() !== trimmed.toLowerCase())].slice(0, 6),
    );
  }, []);

  const { cartCount, cartSubtotal } = useMemo(() => {
    let count = 0;
    let subtotal = 0;
    for (const item of cart) {
      const product = getProduct(item.slug);
      if (!product) continue;
      count += item.quantity;
      subtotal += product.price * item.quantity;
    }
    return { cartCount: count, cartSubtotal: subtotal };
  }, [cart]);

  const value = useMemo<StoreContextValue>(
    () => ({
      hydrated,
      cart,
      wishlist,
      recentSearches,
      cartCount,
      cartSubtotal,
      cartOpen,
      searchOpen,
      menuOpen,
      quickViewSlug,
      addToCart,
      setQuantity,
      removeFromCart,
      clearCart,
      toggleWishlist,
      isWishlisted,
      addRecentSearch,
      setCartOpen,
      setSearchOpen,
      setMenuOpen,
      setQuickViewSlug,
    }),
    [
      hydrated,
      cart,
      wishlist,
      recentSearches,
      cartCount,
      cartSubtotal,
      cartOpen,
      searchOpen,
      menuOpen,
      quickViewSlug,
      addToCart,
      setQuantity,
      removeFromCart,
      clearCart,
      toggleWishlist,
      isWishlisted,
      addRecentSearch,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
