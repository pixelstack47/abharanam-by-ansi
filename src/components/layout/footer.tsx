import Image from "next/image";
import Link from "next/link";
import {
  FacebookIcon,
  InstagramIcon,
  YoutubeIcon,
} from "@/components/ui/social-icons";
import { SITE_NAME, SITE_SUBNAME, SITE_TAGLINE } from "@/data/site";

const shopLinks = [
  { label: "New Arrivals", href: "/shop?sort=newest" },
  { label: "Necklaces", href: "/shop?category=Necklaces" },
  { label: "Earrings", href: "/shop?category=Earrings" },
  { label: "Bridal", href: "/shop?category=Bridal" },
  { label: "Anti-Tarnish", href: "/shop?category=Anti-Tarnish" },
];

const companyLinks = [
  { label: "Our Story", href: "/about" },
  { label: "Collections", href: "/collections" },
  { label: "Wishlist", href: "/wishlist" },
  { label: "Account", href: "/account" },
];

const careLinks = [
  { label: "Shipping & Delivery", href: "/about#care" },
  { label: "Returns & Exchanges", href: "/about#care" },
  { label: "Jewellery Care", href: "/about#care" },
  { label: "Contact Us", href: "/about#contact" },
];

export function Footer() {
  return (
    <footer className="bg-maroon-deep text-ivory">
      <div className="mx-auto max-w-[1440px] px-6 pb-28 pt-20 lg:px-10 lg:pb-16">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="flex items-center gap-5">
              <Image
                src="/logo.jpeg"
                alt=""
                width={88}
                height={88}
                aria-hidden
                className="size-[72px] shrink-0 rounded-full object-cover ring-1 ring-gold/40 lg:size-[88px]"
              />
              <div>
                <p className="font-serif text-3xl uppercase tracking-[0.28em]">
                  {SITE_NAME}
                </p>
                <p className="mt-2 flex items-center gap-2 text-[10px] uppercase tracking-luxe text-gold-light">
                  <span className="h-px w-5 bg-current opacity-60" aria-hidden />
                  {SITE_SUBNAME}
                </p>
              </div>
            </div>
            <p className="mt-6 max-w-sm font-serif text-lg italic text-ivory/60">
              {SITE_TAGLINE}.
            </p>
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-ivory/50">
              A modern luxury jewellery house. Every piece is designed in our studio,
              quality-checked by hand and delivered in signature packaging worth keeping.
            </p>
            <div className="mt-8 flex gap-3">
              {[
                { Icon: InstagramIcon, label: "Instagram" },
                { Icon: FacebookIcon, label: "Facebook" },
                { Icon: YoutubeIcon, label: "YouTube" },
              ].map(({ Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="inline-flex size-10 items-center justify-center rounded-full border border-ivory/20 text-ivory/70 transition-colors hover:border-gold hover:text-gold-light"
                >
                  <Icon size={17} />
                </a>
              ))}
            </div>
          </div>

          {[
            { title: "Shop", links: shopLinks },
            { title: "Company", links: companyLinks },
            { title: "Care", links: careLinks },
          ].map((column) => (
            <div key={column.title} className="lg:col-span-2">
              <p className="text-[11px] font-semibold uppercase tracking-luxe text-gold-light">
                {column.title}
              </p>
              <ul className="mt-5 space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-ivory/60 transition-colors hover:text-ivory"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="lg:col-span-1" />
        </div>

        <div className="mt-16 border-t border-ivory/10 pt-8 text-center sm:flex sm:items-center sm:justify-between sm:text-left">
          <p className="text-xs text-ivory/55">
            © {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
          </p>
          <p className="mt-2 text-xs text-ivory/55 sm:mt-0">
            Free shipping above ₹1,999 · COD available · 7-day easy returns
          </p>
        </div>
      </div>
    </footer>
  );
}
