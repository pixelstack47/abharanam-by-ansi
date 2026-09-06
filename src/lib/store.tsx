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
import type {
  AccountProfile,
  CartItem,
  CategoryInfo,
  CollectionInfo,
  MaterialInfo,
  Product,
  SessionUser,
} from "@/types";

const CART_KEY = "abharanam:cart";
const WISHLIST_KEY = "abharanam:wishlist";
const RECENT_KEY = "abharanam:recent-searches";

interface StoreContextValue {
  hydrated: boolean;
  /** Full catalog, fetched once from the API on mount. */
  products: Product[];
  productsLoaded: boolean;
  getProduct: (slug: string) => Product | undefined;
  /** DB-managed taxonomy, fetched once from the API on mount. */
  categories: CategoryInfo[];
  collections: CollectionInfo[];
  materials: MaterialInfo[];
  taxonomyLoaded: boolean;
  user: SessionUser | null;
  /** Self-service profile (phone + saved address); null while signed out. */
  profile: AccountProfile | null;
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
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [collections, setCollections] = useState<CollectionInfo[]>([]);
  const [materials, setMaterials] = useState<MaterialInfo[]>([]);
  const [taxonomyLoaded, setTaxonomyLoaded] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [profile, setProfile] = useState<AccountProfile | null>(null);
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

  // Latest-value refs so the debounced wishlist/cart PUTs (and the prune
  // effect below) always read current state instead of a stale closure. These
  // sync effects are defined before every effect that reads the refs, and
  // effects within one commit run in definition order, so readers never see a
  // lagging value.
  const wishlistRef = useRef<string[]>([]);
  const cartRef = useRef<CartItem[]>([]);
  const userRef = useRef<SessionUser | null>(null);
  useEffect(() => {
    wishlistRef.current = wishlist;
  }, [wishlist]);
  useEffect(() => {
    cartRef.current = cart;
  }, [cart]);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Replace the signed-in user's server-side wishlist. Fire-and-forget: the
  // local copy (state + localStorage) is authoritative whenever this fails.
  const pushWishlist = useCallback((slugs: string[]) => {
    fetch("/api/wishlist", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slugs }),
    }).catch(() => {
      /* offline / expired session — the local copy is the fallback */
    });
  }, []);

  // Debounced push so rapid wishlist taps coalesce into a single PUT. The
  // payload is read from wishlistRef at fire time, so whatever array is
  // current ~500ms from now wins — never the one captured when scheduling.
  const wishlistPushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const schedulePushWishlist = useCallback(() => {
    if (wishlistPushTimer.current !== null) {
      clearTimeout(wishlistPushTimer.current);
    }
    wishlistPushTimer.current = setTimeout(() => {
      wishlistPushTimer.current = null;
      if (userRef.current) pushWishlist(wishlistRef.current);
    }, 500);
  }, [pushWishlist]);

  useEffect(
    () => () => {
      if (wishlistPushTimer.current !== null) {
        clearTimeout(wishlistPushTimer.current);
      }
    },
    [],
  );

  // Replace the signed-in user's server-side cart. Fire-and-forget: the
  // local copy (state + localStorage) is authoritative whenever this fails.
  const pushCart = useCallback((items: CartItem[]) => {
    fetch("/api/cart", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    }).catch(() => {
      /* offline / expired session — the local copy is the fallback */
    });
  }, []);

  // Debounced push so rapid cart edits coalesce into a single PUT. Same
  // latest-value pattern as the wishlist above, with its own timer so the
  // two pushes never cancel each other.
  const cartPushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const schedulePushCart = useCallback(() => {
    if (cartPushTimer.current !== null) {
      clearTimeout(cartPushTimer.current);
    }
    cartPushTimer.current = setTimeout(() => {
      cartPushTimer.current = null;
      if (userRef.current) pushCart(cartRef.current);
    }, 500);
  }, [pushCart]);

  useEffect(
    () => () => {
      if (cartPushTimer.current !== null) {
        clearTimeout(cartPushTimer.current);
      }
    },
    [],
  );

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

  // Fetch the DB-managed taxonomy once, in parallel with the catalog.
  // taxonomyLoaded only flips once all three lists have actually arrived so
  // consumers can distinguish "still loading" from "genuinely empty".
  useEffect(() => {
    let cancelled = false;
    const load = async (attempt = 0) => {
      try {
        const [catRes, colRes, matRes] = await Promise.all([
          fetch("/api/categories"),
          fetch("/api/collections"),
          fetch("/api/materials"),
        ]);
        if (!catRes.ok || !colRes.ok || !matRes.ok)
          throw new Error(
            `Taxonomy fetch failed (${catRes.status}/${colRes.status}/${matRes.status})`,
          );
        const catData = (await catRes.json()) as { categories: CategoryInfo[] };
        const colData = (await colRes.json()) as { collections: CollectionInfo[] };
        const matData = (await matRes.json()) as { materials: MaterialInfo[] };
        if (cancelled) return;
        setCategories(catData.categories ?? []);
        setCollections(colData.collections ?? []);
        setMaterials(matData.materials ?? []);
        setTaxonomyLoaded(true);
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
        ? ((await res.json()) as {
            user: SessionUser | null;
            profile?: AccountProfile | null;
          })
        : { user: null, profile: null };
      setUser(data.user ?? null);
      setProfile(data.user ? (data.profile ?? null) : null);
    } catch {
      setUser(null);
      setProfile(null);
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
    setProfile(null);
  }, []);

  // Merge the server wishlist into the local one exactly once per sign-in,
  // keyed by user id and re-armed on sign-out: local order first, then
  // server-only extras appended. Server slugs unknown to an already-loaded
  // catalog are dropped up front; when the catalog arrives later instead, the
  // prune effect below sweeps them and re-syncs. Guests (user === null) never
  // reach the body, so their localStorage-only behavior is untouched.
  const syncedWishlistUser = useRef<string | null>(null);
  useEffect(() => {
    if (!user) {
      syncedWishlistUser.current = null;
      return;
    }
    if (!hydrated || syncedWishlistUser.current === user.id) return;
    syncedWishlistUser.current = user.id;
    const server = profile?.wishlist ?? [];
    const usable = productsLoaded
      ? server.filter((s) => productMap.has(s))
      : server;
    const merged = [...new Set([...wishlistRef.current, ...usable])];
    /* eslint-disable react-hooks/set-state-in-effect */
    setWishlist((prev) => {
      // Union against prev (not the ref) so an update queued in the same
      // batch can never be clobbered by a stale snapshot.
      const next = [...new Set([...prev, ...usable])];
      return next.length === prev.length && next.every((s, i) => s === prev[i])
        ? prev
        : next;
    });
    /* eslint-enable react-hooks/set-state-in-effect */
    const serverSet = new Set(server);
    if (
      merged.length !== serverSet.size ||
      merged.some((s) => !serverSet.has(s))
    ) {
      pushWishlist(merged);
    }
  }, [hydrated, user, profile, productsLoaded, productMap, pushWishlist]);

  // Merge the server cart into the local one exactly once per sign-in, keyed
  // by user id and re-armed on sign-out (mirrors the wishlist merge above):
  // local entries keep their order and their quantity wins on a slug
  // conflict; server-only items are appended after. Server slugs unknown to
  // an already-loaded catalog are dropped up front; when the catalog arrives
  // later instead, the prune effect below sweeps them and re-syncs. Guests
  // (user === null) never reach the body, so their localStorage-only
  // behavior is untouched.
  const syncedCartUser = useRef<string | null>(null);
  useEffect(() => {
    if (!user) {
      syncedCartUser.current = null;
      return;
    }
    if (!hydrated || syncedCartUser.current === user.id) return;
    syncedCartUser.current = user.id;
    const server = profile?.cart ?? [];
    const usable = productsLoaded
      ? server.filter((i) => productMap.has(i.slug))
      : server;
    const mergeCart = (local: CartItem[]) => {
      const localSlugs = new Set(local.map((i) => i.slug));
      return [...local, ...usable.filter((i) => !localSlugs.has(i.slug))];
    };
    const merged = mergeCart(cartRef.current);
    /* eslint-disable react-hooks/set-state-in-effect */
    setCart((prev) => {
      // Merge against prev (not the ref) so an update queued in the same
      // batch can never be clobbered by a stale snapshot. Merging only ever
      // appends server-only entries, so an unchanged length means no change.
      const next = mergeCart(prev);
      return next.length === prev.length ? prev : next;
    });
    /* eslint-enable react-hooks/set-state-in-effect */
    const serverBySlug = new Map(server.map((i) => [i.slug, i.quantity]));
    if (
      merged.length !== serverBySlug.size ||
      merged.some((i) => serverBySlug.get(i.slug) !== i.quantity)
    ) {
      pushCart(merged);
    }
  }, [hydrated, user, profile, productsLoaded, productMap, pushCart]);

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
    // A signed-in user's server copy must not resurrect pruned slugs. The
    // debounced pushes read their refs at fire time, so they send the
    // post-prune arrays even though the setState above has not committed yet.
    if (userRef.current && wishlistRef.current.some((s) => !productMap.has(s))) {
      schedulePushWishlist();
    }
    if (userRef.current && cartRef.current.some((i) => !productMap.has(i.slug))) {
      schedulePushCart();
    }
  }, [hydrated, productsLoaded, productMap, schedulePushWishlist, schedulePushCart]);

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

  const addToCart = useCallback(
    (slug: string, quantity = 1) => {
      setCart((prev) => {
        const existing = prev.find((i) => i.slug === slug);
        if (existing) {
          return prev.map((i) =>
            i.slug === slug ? { ...i, quantity: Math.min(i.quantity + quantity, 10) } : i,
          );
        }
        return [...prev, { slug, quantity }];
      });
      // Signed-in users mirror to the server, debounced so rapid edits
      // coalesce; guests stay localStorage-only.
      if (userRef.current) schedulePushCart();
    },
    [schedulePushCart],
  );

  const setQuantity = useCallback(
    (slug: string, quantity: number) => {
      setCart((prev) =>
        quantity <= 0
          ? prev.filter((i) => i.slug !== slug)
          : prev.map((i) => (i.slug === slug ? { ...i, quantity: Math.min(quantity, 10) } : i)),
      );
      if (userRef.current) schedulePushCart();
    },
    [schedulePushCart],
  );

  const removeFromCart = useCallback(
    (slug: string) => {
      setCart((prev) => prev.filter((i) => i.slug !== slug));
      if (userRef.current) schedulePushCart();
    },
    [schedulePushCart],
  );

  const clearCart = useCallback(() => {
    setCart([]);
    // Checkout calls clearCart, so a completed order also empties the
    // signed-in user's server-side cart.
    if (userRef.current) schedulePushCart();
  }, [schedulePushCart]);

  const toggleWishlist = useCallback(
    (slug: string) => {
      setWishlist((prev) =>
        prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
      );
      // Signed-in users mirror to the server, debounced so rapid taps
      // coalesce; guests stay localStorage-only.
      if (userRef.current) schedulePushWishlist();
    },
    [schedulePushWishlist],
  );

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
      categories,
      collections,
      materials,
      taxonomyLoaded,
      user,
      profile,
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
      categories,
      collections,
      materials,
      taxonomyLoaded,
      user,
      profile,
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
