"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { getProduct } from "@/data/products";
import { FREE_SHIPPING_THRESHOLD } from "@/data/site";
import { useStore } from "@/lib/store";
import { useFocusTrap } from "@/lib/use-focus-trap";
import { formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function CartDrawer() {
  const { cart, cartOpen, cartSubtotal, setCartOpen, setQuantity, removeFromCart } =
    useStore();
  const trapRef = useFocusTrap<HTMLElement>(cartOpen);

  const remaining = FREE_SHIPPING_THRESHOLD - cartSubtotal;
  const progress = Math.min(cartSubtotal / FREE_SHIPPING_THRESHOLD, 1);

  return (
    <AnimatePresence>
      {cartOpen && (
        <>
          <motion.button
            aria-label="Close cart"
            className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCartOpen(false)}
          />
          <motion.aside
            ref={trapRef}
            tabIndex={-1}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-cream shadow-2xl outline-none"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            role="dialog"
            aria-modal="true"
            aria-label="Shopping bag"
          >
            <div className="flex items-center justify-between border-b border-line px-6 py-5">
              <p className="font-serif text-xl">
                Shopping Bag{" "}
                <span className="text-sm text-stone">
                  ({cart.length} {cart.length === 1 ? "item" : "items"})
                </span>
              </p>
              <button
                onClick={() => setCartOpen(false)}
                className="inline-flex size-9 items-center justify-center rounded-full text-ink hover:bg-ink/5"
                aria-label="Close cart"
              >
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-5 px-8 text-center">
                <span className="flex size-16 items-center justify-center rounded-full bg-champagne/50 text-gold-dark">
                  <ShoppingBag size={26} strokeWidth={1.25} />
                </span>
                <div>
                  <p className="font-serif text-2xl">Your bag is empty</p>
                  <p className="mt-2 text-sm text-stone">
                    Beautiful things are waiting. Start with our bestsellers.
                  </p>
                </div>
                <Link href="/shop" onClick={() => setCartOpen(false)}>
                  <Button variant="outline">Shop Collection</Button>
                </Link>
              </div>
            ) : (
              <>
                <div className="border-b border-line px-6 py-4">
                  <p className="text-xs text-stone">
                    {remaining > 0 ? (
                      <>
                        You are <span className="font-semibold text-ink">{formatINR(remaining)}</span>{" "}
                        away from free shipping
                      </>
                    ) : (
                      <span className="font-medium text-gold-dark">
                        ✦ You’ve unlocked free shipping
                      </span>
                    )}
                  </p>
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-line">
                    <motion.div
                      className="h-full bg-gold"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress * 100}%` }}
                      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                </div>

                <ul className="flex-1 divide-y divide-line overflow-y-auto px-6">
                  {cart.map((item) => {
                    const product = getProduct(item.slug);
                    if (!product) return null;
                    return (
                      <motion.li
                        key={item.slug}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex gap-4 py-5"
                      >
                        <Link
                          href={`/product/${product.slug}`}
                          onClick={() => setCartOpen(false)}
                          className="relative block h-24 w-20 shrink-0 overflow-hidden bg-champagne/30"
                        >
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        </Link>
                        <div className="flex flex-1 flex-col">
                          <div className="flex items-start justify-between gap-3">
                            <Link
                              href={`/product/${product.slug}`}
                              onClick={() => setCartOpen(false)}
                              className="font-serif text-[15px] leading-snug hover:text-gold-dark"
                            >
                              {product.name}
                            </Link>
                            <button
                              onClick={() => removeFromCart(item.slug)}
                              className="text-stone transition-colors hover:text-ink"
                              aria-label={`Remove ${product.name}`}
                            >
                              <Trash2 size={15} strokeWidth={1.5} />
                            </button>
                          </div>
                          <p className="mt-0.5 text-xs text-stone">{product.material}</p>
                          <div className="mt-auto flex items-center justify-between pt-3">
                            <div className="flex items-center border border-line">
                              <button
                                onClick={() => setQuantity(item.slug, item.quantity - 1)}
                                className="flex size-7 items-center justify-center text-stone hover:text-ink"
                                aria-label="Decrease quantity"
                              >
                                <Minus size={13} />
                              </button>
                              <span className="w-7 text-center text-xs font-medium">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => setQuantity(item.slug, item.quantity + 1)}
                                className="flex size-7 items-center justify-center text-stone hover:text-ink"
                                aria-label="Increase quantity"
                              >
                                <Plus size={13} />
                              </button>
                            </div>
                            <p className="text-sm font-medium">
                              {formatINR(product.price * item.quantity)}
                            </p>
                          </div>
                        </div>
                      </motion.li>
                    );
                  })}
                </ul>

                <div className="border-t border-line px-6 py-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm uppercase tracking-luxe-sm text-stone">Subtotal</p>
                    <p className="font-serif text-2xl">{formatINR(cartSubtotal)}</p>
                  </div>
                  <p className="mt-1 text-xs text-stone">
                    Taxes included. Shipping calculated at checkout.
                  </p>
                  <Button className="mt-4 w-full" size="lg">
                    Proceed to Checkout
                  </Button>
                  <button
                    onClick={() => setCartOpen(false)}
                    className="mt-3 w-full text-center text-xs uppercase tracking-luxe-sm text-stone underline-offset-4 hover:text-ink hover:underline"
                  >
                    Continue Shopping
                  </button>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
