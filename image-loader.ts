/**
 * Custom image loader for the static export (`output: "export"`).
 *
 * A static build has no server, so next/image's default optimizer is
 * unavailable. Product imagery is served from Unsplash, which already accepts
 * width/quality parameters on the URL — so rather than giving up optimization
 * with `unoptimized: true`, we rewrite those params ourselves and keep
 * responsive srcset sizing intact.
 *
 * Local files under /public (the logo) have no such service behind them and are
 * returned untouched.
 */
type LoaderArgs = {
  src: string;
  width: number;
  quality?: number;
};

export default function imageLoader({ src, width, quality }: LoaderArgs): string {
  // Local assets ship as-is; there is nothing to resize them at request time.
  if (src.startsWith("/")) return src;

  try {
    const url = new URL(src);

    if (url.hostname === "images.unsplash.com") {
      url.searchParams.set("w", String(width));
      url.searchParams.set("q", String(quality ?? 75));
      url.searchParams.set("auto", "format");
      url.searchParams.set("fit", "crop");
      return url.toString();
    }

    return url.toString();
  } catch {
    // Not a parseable absolute URL — hand it back untouched.
    return src;
  }
}
