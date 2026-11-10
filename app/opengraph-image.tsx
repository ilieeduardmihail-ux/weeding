import { ImageResponse } from "next/og";
import { formatEventDate } from "@/lib/event-settings";
import { getEventSettings } from "@/lib/public-data";

export const alt = "Invitație de nuntă";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const settings = await getEventSettings();

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
          background: "linear-gradient(135deg, #718054 0%, #6b7a4e 55%, #5a6840 100%)",
          color: "#f6efe1",
          fontFamily: "Georgia, serif",
          textAlign: "center",
          padding: "64px",
        }}
      >
        <div style={{ display: "flex", fontSize: 26, letterSpacing: 8, textTransform: "uppercase", color: "#e5cd96" }}>
          Vă invităm la nuntă
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 28, marginTop: 28 }}>
          <span style={{ fontSize: 104, lineHeight: 1 }}>{settings.partner_1}</span>
          <span style={{ fontSize: 88, color: "#dfb3ba", fontStyle: "italic" }}>&amp;</span>
          <span style={{ fontSize: 104, lineHeight: 1 }}>{settings.partner_2}</span>
        </div>
        <div style={{ display: "flex", width: 180, height: 2, background: "#e5cd96", marginTop: 40 }} />
        <div style={{ display: "flex", marginTop: 32, fontSize: 40 }}>
          {formatEventDate(settings)}, {settings.city}
        </div>
      </div>
    ),
    { ...size }
  );
}
