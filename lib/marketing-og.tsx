import { ImageResponse } from "next/og";
import { BRAND, HERO } from "./marketing";

export const alt = `${BRAND} — invitații digitale pentru nuntă`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Link preview for the presentation page. Static: no database, no settings. */
export function marketingOgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "linear-gradient(135deg, #faf5e9 0%, #f0e5d1 55%, #f7ecec 100%)",
          color: "#2c3325",
          fontFamily: "Georgia, serif",
          padding: "72px 80px",
        }}
      >
        <div style={{ display: "flex", fontSize: 22, letterSpacing: 10, textTransform: "uppercase", color: "#a9853f" }}>
          {BRAND}
        </div>
        <div style={{ display: "flex", marginTop: 28, fontSize: 74, lineHeight: 1.08, maxWidth: 900 }}>
          {HERO.title}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 40 }}>
          <div style={{ display: "flex", width: 120, height: 2, background: "#a9853f" }} />
          <div style={{ display: "flex", fontSize: 32, color: "#4a5340" }}>
            Confirmări · Mese · Buget · Mesaje
          </div>
        </div>
        <div
          style={{
            display: "flex",
            position: "absolute",
            right: -120,
            bottom: -160,
            width: 520,
            height: 520,
            borderRadius: 999,
            background: "rgba(185,138,147,0.28)",
          }}
        />
      </div>
    ),
    size
  );
}
