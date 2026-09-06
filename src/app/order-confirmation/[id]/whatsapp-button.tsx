"use client";

import { MessageCircle } from "lucide-react";

/** Gold CTA that re-opens the pre-filled WhatsApp order message. */
export function WhatsAppButton({ url }: { url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex h-13 items-center justify-center gap-2 border border-gold-dark bg-gold-dark px-9 text-xs font-medium uppercase tracking-luxe-sm text-ivory transition-all duration-300 hover:border-espresso hover:bg-espresso"
    >
      <MessageCircle size={15} strokeWidth={1.5} />
      Send order on WhatsApp
    </a>
  );
}
