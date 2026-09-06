"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import type { SerializedOrder } from "@/types";
import { FREE_SHIPPING_THRESHOLD } from "@/data/site";
import { useStore } from "@/lib/store";
import { cn, formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const SHIPPING_FEE = 99;

interface CheckoutForm {
  name: string;
  phone: string;
  email: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  note: string;
}

const EMPTY_FORM: CheckoutForm = {
  name: "",
  phone: "",
  email: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
  note: "",
};

/** 10-digit Indian mobile after stripping spaces, dashes and a +91 prefix. */
function normalizePhone(value: string): string {
  let p = value.replace(/[\s-]/g, "");
  if (p.startsWith("+91")) p = p.slice(3);
  else if (p.startsWith("91") && p.length === 12) p = p.slice(2);
  return p;
}

function validate(form: CheckoutForm): Partial<Record<keyof CheckoutForm, string>> {
  const errors: Partial<Record<keyof CheckoutForm, string>> = {};
  if (form.name.trim().length < 2) errors.name = "Please enter your full name.";
  if (!/^\d{10}$/.test(normalizePhone(form.phone)))
    errors.phone = "Enter a valid 10-digit mobile number.";
  if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim()))
    errors.email = "That email doesn’t look right.";
  if (!form.line1.trim()) errors.line1 = "Address is required.";
  if (!form.city.trim()) errors.city = "City is required.";
  if (!form.state.trim()) errors.state = "State is required.";
  if (!/^\d{6}$/.test(form.pincode.trim()))
    errors.pincode = "Enter a valid 6-digit pincode.";
  return errors;
}

const inputClass = (invalid: boolean) =>
  cn(
    "h-12 w-full border bg-transparent px-4 text-sm outline-none transition-colors placeholder:text-stone/50",
    invalid ? "border-maroon focus:border-maroon" : "border-ink/25 focus:border-ink",
  );

function Field({
  label,
  error,
  optional,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  optional?: boolean;
}) {
  return (
    <div>
      <label
        htmlFor={props.id}
        className="mb-1.5 block text-[11px] uppercase tracking-luxe-sm text-stone"
      >
        {label}
        {optional && <span className="ml-1 normal-case text-stone/70">(optional)</span>}
      </label>
      <input className={inputClass(Boolean(error))} {...props} />
      {error && <p className="mt-1.5 text-xs text-maroon">{error}</p>}
    </div>
  );
}

function NoteField({
  label,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <div>
      <label
        htmlFor={props.id}
        className="mb-1.5 block text-[11px] uppercase tracking-luxe-sm text-stone"
      >
        {label} <span className="ml-1 normal-case text-stone/70">(optional)</span>
      </label>
      <textarea
        className="min-h-24 w-full resize-y border border-ink/25 bg-transparent px-4 py-3 text-sm outline-none transition-colors placeholder:text-stone/50 focus:border-ink"
        {...props}
      />
    </div>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const {
    hydrated,
    productsLoaded,
    cart,
    cartSubtotal,
    getProduct,
    setQuantity,
    removeFromCart,
    clearCart,
    user,
    profile,
  } = useStore();

  const [form, setForm] = useState<CheckoutForm>(EMPTY_FORM);
  const [touched, setTouched] = useState<Partial<Record<keyof CheckoutForm, boolean>>>({});
  const [attempted, setAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [placed, setPlaced] = useState(false);
  // GST rate comes from the backend (env-configurable) so the included-tax
  // breakout matches the server's math exactly; null until (unless) it loads.
  const [gstRate, setGstRate] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/config")
      .then((res) => (res.ok ? res.json() : null))
      .then((cfg: { gstRatePercent?: number } | null) => {
        if (!cancelled && typeof cfg?.gstRatePercent === "number") {
          setGstRate(cfg.gstRatePercent);
        }
      })
      .catch(() => {
        /* keep the plain "Prices include GST." note */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Prefill contact details and the saved address for signed-in customers
  // without clobbering anything already typed.
  useEffect(() => {
    if (!user) return;
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    setForm((f) => ({
      ...f,
      name: f.name || user.name,
      email: f.email || user.email,
      phone: f.phone || profile?.phone || "",
      line1: f.line1 || profile?.address?.line1 || "",
      line2: f.line2 || profile?.address?.line2 || "",
      city: f.city || profile?.address?.city || "",
      state: f.state || profile?.address?.state || "",
      pincode: f.pincode || profile?.address?.pincode || "",
    }));
  }, [user, profile]);

  const errors = useMemo(() => validate(form), [form]);
  const showError = (field: keyof CheckoutForm) =>
    touched[field] || attempted ? errors[field] : undefined;

  const shippingFee =
    cartSubtotal >= FREE_SHIPPING_THRESHOLD || cart.length === 0 ? 0 : SHIPPING_FEE;
  const total = cartSubtotal + shippingFee;
  // Same inclusive-GST formula the backend applies when the order is created.
  const gstAmount =
    gstRate && gstRate > 0
      ? Math.round((cartSubtotal * gstRate) / (100 + gstRate))
      : 0;

  const set = (field: keyof CheckoutForm) => (value: string) =>
    setForm((f) => ({ ...f, [field]: value }));
  const blur = (field: keyof CheckoutForm) => () =>
    setTouched((t) => ({ ...t, [field]: true }));

  const submit = async () => {
    setAttempted(true);
    setServerError(null);
    if (Object.keys(errors).length > 0 || cart.length === 0) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((i) => ({ slug: i.slug, quantity: i.quantity })),
          customer: {
            name: form.name.trim(),
            phone: normalizePhone(form.phone),
            ...(form.email.trim() ? { email: form.email.trim() } : {}),
            address: {
              line1: form.line1.trim(),
              ...(form.line2.trim() ? { line2: form.line2.trim() } : {}),
              city: form.city.trim(),
              state: form.state.trim(),
              pincode: form.pincode.trim(),
            },
          },
          ...(form.note.trim() ? { note: form.note.trim() } : {}),
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setServerError(
          body?.error ?? "Something went wrong placing your order. Please try again.",
        );
        setSubmitting(false);
        return;
      }
      const { order, whatsappUrl } = (await res.json()) as {
        order: SerializedOrder;
        whatsappUrl: string;
      };
      setPlaced(true);
      clearCart();
      window.open(whatsappUrl, "_blank");
      router.push(`/order-confirmation/${order.id}`);
    } catch {
      setServerError("We couldn’t reach the store. Check your connection and try again.");
      setSubmitting(false);
    }
  };

  // ——— Loading skeleton ———
  if (!hydrated || !productsLoaded) {
    return (
      <div className="mx-auto max-w-[1200px] px-4 pb-24 pt-24 sm:px-6 lg:px-10 lg:pt-32">
        <div className="h-4 w-24 animate-pulse bg-champagne/40" />
        <div className="mt-4 h-12 w-72 animate-pulse bg-champagne/40" />
        <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_420px]">
          <div className="h-96 animate-pulse bg-champagne/30" />
          <div className="h-96 animate-pulse bg-champagne/30" />
        </div>
      </div>
    );
  }

  // ——— Empty bag (unless we just placed an order and are redirecting) ———
  if (cart.length === 0 && !placed) {
    return (
      <div className="mx-auto max-w-[1200px] px-4 pb-24 pt-24 sm:px-6 lg:px-10 lg:pt-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center py-24 text-center"
        >
          <span className="flex size-20 items-center justify-center rounded-full bg-champagne/40 text-gold-dark">
            <ShoppingBag size={30} strokeWidth={1.25} />
          </span>
          <h1 className="mt-7 font-serif text-3xl font-light sm:text-4xl">
            Your bag is <em className="italic">empty</em>
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-stone">
            Add a piece you love and return here to complete your order.
          </p>
          <Link href="/shop" className="mt-9">
            <Button size="lg">Discover Jewellery</Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  if (placed) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-[1200px] items-center justify-center px-6 pt-24">
        <p className="font-serif text-2xl text-stone">Taking you to your order…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] px-4 pb-24 pt-24 sm:px-6 lg:px-10 lg:pt-32">
      <header className="pb-8 lg:pb-12">
        <p className="text-[11px] uppercase tracking-luxe text-gold-dark">Checkout</p>
        <h1 className="mt-3 font-serif text-4xl font-light sm:text-5xl">
          Complete your <em className="italic">order</em>
        </h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-stone">
          No online payment — your order is confirmed on WhatsApp.
        </p>
      </header>

      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="grid items-start gap-10 lg:grid-cols-[1fr_420px] lg:gap-14"
      >
        {/* ——— Details ——— */}
        <div className="space-y-10">
          <section aria-label="Contact details">
            <h2 className="font-serif text-2xl">Contact</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field
                id="name"
                label="Full name"
                autoComplete="name"
                placeholder="Ananya Krishnan"
                value={form.name}
                onChange={(e) => set("name")(e.target.value)}
                onBlur={blur("name")}
                error={showError("name")}
              />
              <Field
                id="phone"
                label="WhatsApp number"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                placeholder="98765 43210"
                value={form.phone}
                onChange={(e) => set("phone")(e.target.value)}
                onBlur={blur("phone")}
                error={showError("phone")}
              />
              <div className="sm:col-span-2">
                <Field
                  id="email"
                  label="Email"
                  type="email"
                  autoComplete="email"
                  optional
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => set("email")(e.target.value)}
                  onBlur={blur("email")}
                  error={showError("email")}
                />
              </div>
            </div>
          </section>

          <section aria-label="Delivery address">
            <h2 className="font-serif text-2xl">Delivery Address</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field
                  id="line1"
                  label="Address line 1"
                  autoComplete="address-line1"
                  placeholder="House / flat, street"
                  value={form.line1}
                  onChange={(e) => set("line1")(e.target.value)}
                  onBlur={blur("line1")}
                  error={showError("line1")}
                />
              </div>
              <div className="sm:col-span-2">
                <Field
                  id="line2"
                  label="Address line 2"
                  autoComplete="address-line2"
                  optional
                  placeholder="Landmark, locality"
                  value={form.line2}
                  onChange={(e) => set("line2")(e.target.value)}
                  onBlur={blur("line2")}
                />
              </div>
              <Field
                id="city"
                label="City"
                autoComplete="address-level2"
                placeholder="Kochi"
                value={form.city}
                onChange={(e) => set("city")(e.target.value)}
                onBlur={blur("city")}
                error={showError("city")}
              />
              <Field
                id="state"
                label="State"
                autoComplete="address-level1"
                placeholder="Kerala"
                value={form.state}
                onChange={(e) => set("state")(e.target.value)}
                onBlur={blur("state")}
                error={showError("state")}
              />
              <Field
                id="pincode"
                label="Pincode"
                inputMode="numeric"
                autoComplete="postal-code"
                maxLength={6}
                placeholder="682001"
                value={form.pincode}
                onChange={(e) => set("pincode")(e.target.value)}
                onBlur={blur("pincode")}
                error={showError("pincode")}
              />
            </div>
          </section>

          <section aria-label="Order note">
            <NoteField
              id="note"
              label="Order note"
              placeholder="Gift wrap, delivery instructions…"
              value={form.note}
              onChange={(e) => set("note")(e.target.value)}
            />
          </section>
        </div>

        {/* ——— Summary ——— */}
        <aside className="border border-line bg-cream p-6 sm:p-8 lg:sticky lg:top-28">
          <h2 className="font-serif text-2xl">
            Your Bag{" "}
            <span className="text-sm text-stone">
              ({cart.length} {cart.length === 1 ? "item" : "items"})
            </span>
          </h2>

          <ul className="mt-4 divide-y divide-line">
            {cart.map((item) => {
              const product = getProduct(item.slug);
              if (!product) return null;
              return (
                <li key={item.slug} className="flex gap-4 py-4">
                  <Link
                    href={`/product/${product.slug}`}
                    className="relative block h-20 w-16 shrink-0 overflow-hidden bg-champagne/30"
                  >
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </Link>
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <Link
                        href={`/product/${product.slug}`}
                        className="font-serif text-[15px] leading-snug hover:text-gold-dark"
                      >
                        {product.name}
                      </Link>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.slug)}
                        className="text-stone transition-colors hover:text-ink"
                        aria-label={`Remove ${product.name}`}
                      >
                        <Trash2 size={14} strokeWidth={1.5} />
                      </button>
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex items-center border border-line">
                        <button
                          type="button"
                          onClick={() => setQuantity(item.slug, item.quantity - 1)}
                          className="flex size-7 items-center justify-center text-stone hover:text-ink"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-7 text-center text-xs font-medium">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQuantity(item.slug, item.quantity + 1)}
                          className="flex size-7 items-center justify-center text-stone hover:text-ink"
                          aria-label="Increase quantity"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <p className="text-sm font-medium">
                        {formatINR(product.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <dl className="mt-2 space-y-2.5 border-t border-line pt-5 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-stone">Subtotal</dt>
              <dd className="font-medium">{formatINR(cartSubtotal)}</dd>
            </div>
            {gstAmount > 0 && (
              <div className="flex items-center justify-between text-stone/90">
                <dt>Includes GST ({gstRate}%)</dt>
                <dd>{formatINR(gstAmount)}</dd>
              </div>
            )}
            <div className="flex items-center justify-between">
              <dt className="text-stone">Shipping</dt>
              <dd
                className={cn("font-medium", shippingFee === 0 && "text-gold-dark")}
              >
                {shippingFee === 0 ? "Free" : formatINR(shippingFee)}
              </dd>
            </div>
            {shippingFee > 0 && (
              <p className="text-xs text-stone">
                Free shipping on orders above {formatINR(FREE_SHIPPING_THRESHOLD)}.
              </p>
            )}
            <div className="hairline my-2" aria-hidden />
            <div className="flex items-baseline justify-between">
              <dt className="text-xs uppercase tracking-luxe-sm text-stone">Total</dt>
              <dd className="font-serif text-3xl">{formatINR(total)}</dd>
            </div>
            <p className="text-xs text-stone/80">Prices include GST.</p>
          </dl>

          {serverError && (
            <p
              role="alert"
              className="mt-5 border border-maroon/30 bg-maroon-soft px-4 py-3 text-sm text-maroon"
            >
              {serverError}
            </p>
          )}

          <Button
            type="submit"
            variant="gold"
            size="lg"
            className="mt-5 w-full"
            disabled={submitting}
          >
            {submitting ? "Placing Order…" : "Place Order on WhatsApp"}
          </Button>
          <p className="mt-3 text-center text-xs leading-relaxed text-stone">
            No online payment — your order is confirmed on WhatsApp.
          </p>
          <Link
            href="/shop"
            className="mt-4 block text-center text-xs uppercase tracking-luxe-sm text-stone underline-offset-4 hover:text-ink hover:underline"
          >
            Continue Shopping
          </Link>
        </aside>
      </form>
    </div>
  );
}
