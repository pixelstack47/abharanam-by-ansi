import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_SUBNAME, SITE_TAGLINE } from "@/data/site";

export const alt = `${SITE_NAME} — ${SITE_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// The static export has no server to render this on demand, so bake the card
// once at build time.
export const dynamic = "force-static";

const fontDir = join(process.cwd(), "src/app/_fonts");

export default async function OpengraphImage() {
  const [serif, sans] = await Promise.all([
    readFile(join(fontDir, "CormorantGaramond-SemiBold.ttf")),
    readFile(join(fontDir, "Inter-Regular.ttf")),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#6b1220",
          color: "#faf5ef",
          fontFamily: "Cormorant",
          position: "relative",
        }}
      >
        {/* Hairline frame */}
        <div
          style={{
            position: "absolute",
            top: 40,
            left: 40,
            right: 40,
            bottom: 40,
            border: "1px solid rgba(216,173,87,0.45)",
            display: "flex",
          }}
        />
        <div
          style={{
            fontSize: 28,
            letterSpacing: 16,
            textTransform: "uppercase",
            color: "#d8ad57",
            display: "flex",
          }}
        >
          {SITE_NAME}
        </div>
        <div
          style={{
            marginTop: 14,
            fontFamily: "Inter",
            fontSize: 18,
            letterSpacing: 8,
            textTransform: "uppercase",
            color: "rgba(250,245,239,0.55)",
            display: "flex",
          }}
        >
          {SITE_SUBNAME}
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 92,
            lineHeight: 1.1,
            textAlign: "center",
            maxWidth: 940,
            display: "flex",
          }}
        >
          {SITE_TAGLINE}
        </div>
        <div
          style={{
            marginTop: 36,
            fontFamily: "Inter",
            fontSize: 22,
            color: "rgba(250,245,239,0.62)",
            letterSpacing: 4,
            display: "flex",
          }}
        >
          Hand-finished · Made to be lived in
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Cormorant", data: serif, style: "normal", weight: 600 },
        { name: "Inter", data: sans, style: "normal", weight: 400 },
      ],
    },
  );
}
