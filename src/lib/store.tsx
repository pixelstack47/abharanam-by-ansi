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
import type { CartItem, Product, SessionUser } from "@/types";

const CART_KEY = "abharanam:cart";
const WISHLIST_KEY = "abharanam:wishlist";
const RECENT_KEY = "abharanam:recent-searches";

interface StoreContextValue {
  hydrated: boolean;
  /** Full catalog, fetched once from the API on mount. */
  products: Product[];
  productsLoaded: boolean;
  getProduct: (slug: string) => Product | undefined;
  user: SessionUser | null;
  userLoaded: boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
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
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoaded, setProductsLoaded] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [userLoaded, setUserLoaded] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [quickViewSlug, setQuickViewSlug] = useState<string | null>(null);

  const productMap = useMemo(
    () => new Map(products.map((p) => [p.slug, p])),
    [products],
  );

  const getProduct = useCallback(
    (slug: string) => productMap.get(slug),
    [productMap],
  );

  useEffect(() => {
    /* One-time post-mount hydration from localStorage. Reading storage in
       useState initializers would run during the hydration render and
       mismatch the server HTML, so it must happen in an effect. Entries are
       loaded verbatim here — unknown slugs are pruned only once the catalog
       has actually arrived (see the productsLoaded effect below). */
    /* eslint-disable react-hooks/set-state-in-effect */
    setCart(readJSON<CartItem[]>(CART_KEY, []));
    setWishlist(readJSON<string[]>(WISHLIST_KEY, []));
    setRecentSearches(readJSON<string[]>(RECENT_KEY, []));
    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // Fetch the catalog once. productsLoaded only flips on success so a flaky
  // backend can never cause the prune below to wipe a saved cart.
  useEffect(() => {
    let cancelled = false;
    const load = async (attempt = 0) => {
      try {
        const res = await fetch("/api/products?limit=500");
        if (!res.ok) throw new Error(`Catalog fetch failed (${res.status})`);
        const data = (await res.json()) as { products: Product[] };
        if (cancelled) return;
        setProducts(data.products ?? []);
        setProductsLoaded(true);
      } catch {
        if (cancelled || attempt >= 2) return;
        setTimeout(() => {
          if (!cancelled) load(attempt + 1);
        }, 1500);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = res.ok
        ? ((await res.json()) as { user: SessionUser | null })
        : { user: null };
      setUser(data.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setUserLoaded(true);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      /* clearing local state is what matters — cookie expiry catches up */
    }
    setUser(null);
  }, []);

  // Prune cart/wishlist entries whose slug no longer exists in the catalog —
  // only after both storage hydration AND a successful catalog fetch.
  useEffect(() => {
    if (!hydrated || !productsLoaded) return;
    /* eslint-disable react-hooks/set-state-in-effect */
    setCart((prev) => {
      const next = prev.filter((i) => productMap.has(i.slug));
      return next.length === prev.length ? prev : next;
    });
    setWishlist((prev) => {
      const next = prev.filter((s) => productMap.has(s));
      return next.length === prev.length ? prev : next;
    });
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [hydrated, productsLoaded, productMap]);

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
      const product = productMap.get(item.slug);
      if (!product) continue;
      count += item.quantity;
      subtotal += product.price * item.quantity;
    }
    return { cartCount: count, cartSubtotal: subtotal };
  }, [cart, productMap]);

  const value = useMemo<StoreContextValue>(
    () => ({
      hydrated,
      products,
      productsLoaded,
      getProduct,
      user,
      userLoaded,
      refreshUser,
      logout,
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
      products,
      productsLoaded,
      getProduct,
      user,
      userLoaded,
      refreshUser,
      logout,
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
