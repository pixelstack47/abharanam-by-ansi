import { Counter } from "@/components/ui/counter";
import { Reveal } from "@/components/ui/reveal";

const STATS = [
  { value: 10, suffix: "K+", label: "Happy Customers" },
  { value: 500, suffix: "+", label: "Unique Designs" },
  { value: 100, suffix: "%", label: "Quality Checked" },
  { value: 48, suffix: "h", label: "Express Dispatch" },
];

export function Stats() {
  return (
    <section className="border-y border-line bg-cream">
      <div className="mx-auto grid max-w-[1440px] grid-cols-2 divide-x divide-line lg:grid-cols-4">
        {STATS.map((stat, i) => (
          <Reveal
            key={stat.label}
            delay={i * 0.08}
            className={i >= 2 ? "border-t border-line lg:border-t-0" : ""}
          >
            <div className="flex flex-col items-center gap-2 px-4 py-12 text-center lg:py-16">
              <p className="font-serif text-5xl font-light text-ink lg:text-6xl">
                <Counter to={stat.value} suffix={stat.suffix} />
              </p>
              <p className="text-[11px] uppercase tracking-luxe text-stone">
                {stat.label}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
