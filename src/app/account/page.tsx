"use client";

import {
  useEffect,
  useMemo,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  KeyRound,
  LayoutDashboard,
  LogOut,
  MapPin,
  Package,
  Pencil,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { useStore } from "@/lib/store";
import { cn, formatINR } from "@/lib/utils";
import type { OrderStatus, SerializedOrder } from "@/types";

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  confirmed: "border-blue-200 bg-blue-50 text-blue-700",
  shipped: "border-violet-200 bg-violet-50 text-violet-700",
  delivered: "border-green-200 bg-green-50 text-green-700",
  cancelled: "border-red-200 bg-red-50 text-red-700",
};

function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center border px-2.5 py-1 text-[10px] font-medium uppercase tracking-luxe-sm",
        STATUS_STYLES[status],
      )}
    >
      {status}
    </span>
  );
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ———————————————————————————————————————————————————————————————————————————
// Saved Address card — same fields and validation style as checkout.
// ———————————————————————————————————————————————————————————————————————————

interface AddressForm {
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
}

const EMPTY_ADDRESS_FORM: AddressForm = {
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
};

/** 10-digit Indian mobile after stripping spaces, dashes and a +91 prefix. */
function normalizePhone(value: string): string {
  let p = value.replace(/[\s-]/g, "");
  if (p.startsWith("+91")) p = p.slice(3);
  else if (p.startsWith("91") && p.length === 12) p = p.slice(2);
  return p;
}

function validateAddress(
  form: AddressForm,
): Partial<Record<keyof AddressForm, string>> {
  const errors: Partial<Record<keyof AddressForm, string>> = {};
  if (!/^\d{10}$/.test(normalizePhone(form.phone)))
    errors.phone = "Enter a valid 10-digit mobile number.";
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

function Notice({
  kind,
  children,
}: {
  kind: "success" | "error";
  children: ReactNode;
}) {
  return (
    <p
      role={kind === "error" ? "alert" : "status"}
      className={cn(
        "mt-4 border px-4 py-3 text-sm",
        kind === "error"
          ? "border-maroon/30 bg-maroon-soft text-maroon"
          : "border-green-200 bg-green-50 text-green-700",
      )}
    >
      {children}
    </p>
  );
}

function SavedAddressCard() {
  const { profile, refreshUser } = useStore();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<AddressForm>(EMPTY_ADDRESS_FORM);
  const [touched, setTouched] = useState<Partial<Record<keyof AddressForm, boolean>>>({});
  const [attempted, setAttempted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const errors = useMemo(() => validateAddress(form), [form]);
  const showError = (field: keyof AddressForm) =>
    touched[field] || attempted ? errors[field] : undefined;

  const set = (field: keyof AddressForm) => (value: string) =>
    setForm((f) => ({ ...f, [field]: value }));
  const blur = (field: keyof AddressForm) => () =>
    setTouched((t) => ({ ...t, [field]: true }));

  function startEditing() {
    setForm({
      phone: profile?.phone ?? "",
      line1: profile?.address?.line1 ?? "",
      line2: profile?.address?.line2 ?? "",
      city: profile?.address?.city ?? "",
      state: profile?.address?.state ?? "",
      pincode: profile?.address?.pincode ?? "",
    });
    setTouched({});
    setAttempted(false);
    setServerError(null);
    setEditing(true);
  }

  async function save() {
    setAttempted(true);
    setServerError(null);
    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: normalizePhone(form.phone),
          address: {
            line1: form.line1.trim(),
            ...(form.line2.trim() ? { line2: form.line2.trim() } : {}),
            city: form.city.trim(),
            state: form.state.trim(),
            pincode: form.pincode.trim(),
          },
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setServerError(
          body?.error ?? "We couldn’t save your address. Please try again.",
        );
        return;
      }
      await refreshUser();
      setEditing(false);
    } catch {
      setServerError("We couldn’t reach the store. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  const address = profile?.address;

  return (
    <div className="mt-6 border border-line bg-cream px-6 py-6 sm:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-champagne/50 text-gold-dark">
            <MapPin size={22} strokeWidth={1.25} />
          </span>
          <div>
            <p className="font-serif text-2xl leading-tight">Saved Address</p>
            <p className="mt-0.5 text-sm text-stone">
              Used to prefill your details at checkout.
            </p>
          </div>
        </div>
        {!editing && (
          <Button variant="outline" size="sm" onClick={startEditing}>
            <Pencil size={13} strokeWidth={1.5} />
            {address ? "Edit" : "Add Address"}
          </Button>
        )}
      </div>

      {editing ? (
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
          className="mt-5 border-t border-line pt-5"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field
                id="addr-phone"
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
            </div>
            <div className="sm:col-span-2">
              <Field
                id="addr-line1"
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
                id="addr-line2"
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
              id="addr-city"
              label="City"
              autoComplete="address-level2"
              placeholder="Kochi"
              value={form.city}
              onChange={(e) => set("city")(e.target.value)}
              onBlur={blur("city")}
              error={showError("city")}
            />
            <Field
              id="addr-state"
              label="State"
              autoComplete="address-level1"
              placeholder="Kerala"
              value={form.state}
              onChange={(e) => set("state")(e.target.value)}
              onBlur={blur("state")}
              error={showError("state")}
            />
            <Field
              id="addr-pincode"
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

          {serverError && (
            <p
              role="alert"
              className="mt-4 border border-maroon/30 bg-maroon-soft px-4 py-3 text-sm text-maroon"
            >
              {serverError}
            </p>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button type="submit" variant="gold" size="sm" disabled={saving}>
              {saving ? "Saving…" : "Save Address"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditing(false)}
              disabled={saving}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : address ? (
        <div className="mt-5 border-t border-line pt-4 text-sm">
          <address className="not-italic leading-relaxed text-espresso">
            {address.line1}
            {address.line2 && (
              <>
                <br />
                {address.line2}
              </>
            )}
            <br />
            {address.city}, {address.state} — {address.pincode}
          </address>
          {profile?.phone && (
            <p className="mt-2 text-stone">WhatsApp: {profile.phone}</p>
          )}
        </div>
      ) : (
        <p className="mt-5 border-t border-line pt-4 text-sm leading-relaxed text-stone">
          No saved address yet — add one and we’ll prefill it at checkout.
        </p>
      )}
    </div>
  );
}

// ———————————————————————————————————————————————————————————————————————————
// Change Password card — same validation style as the address card above.
// ———————————————————————————————————————————————————————————————————————————

interface PasswordForm {
  current: string;
  next: string;
  confirm: string;
}

const EMPTY_PASSWORD_FORM: PasswordForm = {
  current: "",
  next: "",
  confirm: "",
};

function validatePassword(
  form: PasswordForm,
): Partial<Record<keyof PasswordForm, string>> {
  const errors: Partial<Record<keyof PasswordForm, string>> = {};
  if (!form.current) errors.current = "Enter your current password.";
  if (!form.next) errors.next = "Enter a new password.";
  else if (form.next.length < 8)
    errors.next = "New password must be at least 8 characters.";
  if (!form.confirm) errors.confirm = "Confirm your new password.";
  else if (form.confirm !== form.next)
    errors.confirm = "Passwords don’t match.";
  return errors;
}

function ChangePasswordCard() {
  const [form, setForm] = useState<PasswordForm>(EMPTY_PASSWORD_FORM);
  const [touched, setTouched] = useState<Partial<Record<keyof PasswordForm, boolean>>>({});
  const [attempted, setAttempted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{
    kind: "success" | "error";
    text: string;
  } | null>(null);

  const errors = useMemo(() => validatePassword(form), [form]);
  const showError = (field: keyof PasswordForm) =>
    touched[field] || attempted ? errors[field] : undefined;

  const set = (field: keyof PasswordForm) => (value: string) =>
    setForm((f) => ({ ...f, [field]: value }));
  const blur = (field: keyof PasswordForm) => () =>
    setTouched((t) => ({ ...t, [field]: true }));

  async function save() {
    setAttempted(true);
    setNotice(null);
    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    try {
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: form.current,
          newPassword: form.next,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setNotice({
          kind: "error",
          text: body?.error ?? "We couldn’t update your password. Please try again.",
        });
        return;
      }
      setForm(EMPTY_PASSWORD_FORM);
      setTouched({});
      setAttempted(false);
      setNotice({ kind: "success", text: "Password updated." });
    } catch {
      setNotice({
        kind: "error",
        text: "We couldn’t reach the store. Check your connection and try again.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-6 border border-line bg-cream px-6 py-6 sm:px-8">
      <div className="flex items-center gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-champagne/50 text-gold-dark">
          <KeyRound size={22} strokeWidth={1.25} />
        </span>
        <div>
          <p className="font-serif text-2xl leading-tight">Change Password</p>
          <p className="mt-0.5 text-sm text-stone">
            Choose a new password of at least 8 characters.
          </p>
        </div>
      </div>

      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
        className="mt-5 border-t border-line pt-5"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field
              id="pw-current"
              label="Current password"
              type="password"
              autoComplete="current-password"
              value={form.current}
              onChange={(e) => set("current")(e.target.value)}
              onBlur={blur("current")}
              error={showError("current")}
            />
          </div>
          <Field
            id="pw-new"
            label="New password"
            type="password"
            autoComplete="new-password"
            value={form.next}
            onChange={(e) => set("next")(e.target.value)}
            onBlur={blur("next")}
            error={showError("next")}
          />
          <Field
            id="pw-confirm"
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            value={form.confirm}
            onChange={(e) => set("confirm")(e.target.value)}
            onBlur={blur("confirm")}
            error={showError("confirm")}
          />
        </div>

        {notice && <Notice kind={notice.kind}>{notice.text}</Notice>}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button type="submit" variant="gold" size="sm" disabled={saving}>
            {saving ? "Saving…" : "Update Password"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function OrderRow({ order }: { order: SerializedOrder }) {
  const itemCount = order.items.reduce((n, item) => n + item.quantity, 0);
  const thumbs = order.items.slice(0, 3);
  const extra = order.items.length - thumbs.length;

  return (
    <li className="border border-line bg-cream">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div>
          <p className="text-sm font-medium tracking-wide">{order.orderNumber}</p>
          <p className="mt-0.5 text-xs text-stone">{formatDate(order.createdAt)}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="flex items-center justify-between gap-4 px-5 py-4">
        <div className="flex items-center gap-2">
          {thumbs.map((item, i) => (
            <span
              key={`${item.productId}-${i}`}
              className="relative block h-16 w-13 shrink-0 overflow-hidden bg-champagne/30"
            >
              {item.image && (
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  sizes="52px"
                  className="object-cover"
                />
              )}
            </span>
          ))}
          {extra > 0 && (
            <span className="flex h-16 w-13 shrink-0 items-center justify-center bg-champagne/30 text-xs text-espresso">
              +{extra}
            </span>
          )}
        </div>
        <div className="text-right">
          <p className="text-xs text-stone">
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </p>
          <p className="mt-0.5 font-serif text-xl">{formatINR(order.total)}</p>
        </div>
      </div>

      <Link
        href={`/order-confirmation/${order.id}`}
        className="flex items-center justify-between border-t border-line px-5 py-3 text-[11px] uppercase tracking-luxe-sm text-espresso transition-colors hover:bg-maroon-soft hover:text-ink"
      >
        View Order
        <ChevronRight size={14} strokeWidth={1.5} />
      </Link>
    </li>
  );
}

export default function AccountPage() {
  const router = useRouter();
  const { user, userLoaded, logout, refreshUser } = useStore();

  const [orders, setOrders] = useState<SerializedOrder[] | null>(null);
  const [ordersError, setOrdersError] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [nameAttempted, setNameAttempted] = useState(false);
  const [nameSaving, setNameSaving] = useState(false);
  const [nameNotice, setNameNotice] = useState<{
    kind: "success" | "error";
    text: string;
  } | null>(null);

  const nameError =
    nameDraft.trim().length < 2 ? "Name must be at least 2 characters." : undefined;

  function startEditingName() {
    setNameDraft(user?.name ?? "");
    setNameAttempted(false);
    setNameNotice(null);
    setEditingName(true);
  }

  async function saveName() {
    setNameAttempted(true);
    setNameNotice(null);
    if (nameError) return;

    setNameSaving(true);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameDraft.trim() }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setNameNotice({
          kind: "error",
          text: body?.error ?? "We couldn’t save your name. Please try again.",
        });
        return;
      }
      await refreshUser();
      setEditingName(false);
      setNameNotice({ kind: "success", text: "Name updated." });
    } catch {
      setNameNotice({
        kind: "error",
        text: "We couldn’t reach the store. Check your connection and try again.",
      });
    } finally {
      setNameSaving(false);
    }
  }

  // Client-side guard — the backend API remains the real security boundary.
  // Skipped while signing out so logout lands on the home page, not /login.
  useEffect(() => {
    if (userLoaded && !user && !signingOut) router.replace("/login?next=/account");
  }, [userLoaded, user, signingOut, router]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetch("/api/orders")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("failed"))))
      .then((data: { orders: SerializedOrder[] }) => {
        if (!cancelled) setOrders(data.orders ?? []);
      })
      .catch(() => {
        if (!cancelled) setOrdersError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  async function onLogout() {
    setSigningOut(true);
    try {
      await logout();
      router.push("/");
    } catch {
      setSigningOut(false);
    }
  }

  if (!userLoaded || !user) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <p className="animate-pulse text-[11px] uppercase tracking-luxe text-stone">
          Loading your account
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-5 pb-24 pt-28 sm:px-6 lg:pt-36">
      <Reveal>
        <p className="text-[11px] uppercase tracking-luxe text-gold-dark">Your Space</p>
        <h1 className="mt-3 font-serif text-4xl font-light sm:text-5xl">
          My <em className="italic">Account</em>
        </h1>
      </Reveal>

      {/* Profile card */}
      <Reveal delay={0.1}>
        <div className="mt-10 border border-line bg-cream px-6 py-6 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 flex-1 items-center gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-champagne/50 text-gold-dark">
                <UserRound size={22} strokeWidth={1.25} />
              </span>
              {editingName ? (
                <form
                  noValidate
                  onSubmit={(e) => {
                    e.preventDefault();
                    saveName();
                  }}
                  className="min-w-0 max-w-sm flex-1"
                >
                  <Field
                    id="profile-name"
                    label="Name"
                    autoComplete="name"
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    error={nameAttempted ? nameError : undefined}
                  />
                  <p className="mt-2 text-sm text-stone">{user.email}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <Button
                      type="submit"
                      variant="gold"
                      size="sm"
                      disabled={nameSaving}
                    >
                      {nameSaving ? "Saving…" : "Save"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingName(false)}
                      disabled={nameSaving}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="min-w-0">
                  <p className="truncate font-serif text-2xl leading-tight">
                    {user.name}
                  </p>
                  <p className="mt-0.5 truncate text-sm text-stone">{user.email}</p>
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {!editingName && (
                <Button variant="outline" size="sm" onClick={startEditingName}>
                  <Pencil size={13} strokeWidth={1.5} />
                  Edit
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={onLogout}
                disabled={signingOut}
              >
                <LogOut size={13} strokeWidth={1.5} />
                {signingOut ? "Signing Out…" : "Sign Out"}
              </Button>
            </div>
          </div>

          {nameNotice && <Notice kind={nameNotice.kind}>{nameNotice.text}</Notice>}

          {user.role === "admin" && (
            <Link
              href="/admin"
              className="mt-5 flex items-center justify-between border-t border-line pt-4 text-[11px] uppercase tracking-luxe-sm text-espresso transition-colors hover:text-ink"
            >
              <span className="inline-flex items-center gap-2">
                <LayoutDashboard size={14} strokeWidth={1.5} />
                Admin Dashboard
              </span>
              <ChevronRight size={14} strokeWidth={1.5} />
            </Link>
          )}
        </div>
      </Reveal>

      {/* Saved address */}
      <Reveal delay={0.14}>
        <SavedAddressCard />
      </Reveal>

      {/* Change password */}
      <Reveal delay={0.16}>
        <ChangePasswordCard />
      </Reveal>

      {/* Order history */}
      <Reveal delay={0.18}>
        <div className="mt-14 flex items-baseline justify-between">
          <h2 className="font-serif text-2xl font-light">
            Order <em className="italic">History</em>
          </h2>
          {orders && orders.length > 0 && (
            <p className="text-xs text-stone">
              {orders.length} {orders.length === 1 ? "order" : "orders"}
            </p>
          )}
        </div>
        <div className="hairline mt-4" />

        {ordersError ? (
          <p className="mt-8 text-sm text-stone">
            We couldn’t load your orders just now. Please refresh the page to try
            again.
          </p>
        ) : orders === null ? (
          <div className="mt-8 space-y-4">
            {[0, 1].map((i) => (
              <div key={i} className="h-36 animate-pulse border border-line bg-cream" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="mt-10 flex flex-col items-center gap-5 border border-line bg-cream px-8 py-14 text-center">
            <span className="flex size-16 items-center justify-center rounded-full bg-champagne/50 text-gold-dark">
              <Package size={26} strokeWidth={1.25} />
            </span>
            <div>
              <p className="font-serif text-2xl">No orders yet</p>
              <p className="mt-2 text-sm text-stone">
                When you place an order, it will appear here.
              </p>
            </div>
            <Link href="/shop">
              <Button variant="outline">Shop Collection</Button>
            </Link>
          </div>
        ) : (
          <ul className="mt-8 space-y-4">
            {orders.map((order) => (
              <OrderRow key={order.id} order={order} />
            ))}
          </ul>
        )}
      </Reveal>
    </div>
  );
}
