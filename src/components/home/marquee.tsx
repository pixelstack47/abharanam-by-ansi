const ITEMS = [
  "Free shipping above ₹1,999",
  "Anti-tarnish guarantee",
  "7-day easy returns",
  "Cash on delivery",
  "Quality checked by hand",
  "Signature gift packaging",
];

export function Marquee() {
  const row = [...ITEMS, ...ITEMS];
  return (
    <div className="overflow-hidden bg-maroon py-3.5 text-ivory">
      <div className="animate-marquee flex w-max items-center">
        {row.map((item, i) => (
          <span
            key={i}
            className="flex items-center gap-8 pr-8 text-[11px] uppercase tracking-luxe text-ivory/85"
          >
            {item}
            <span className="text-gold-light">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
