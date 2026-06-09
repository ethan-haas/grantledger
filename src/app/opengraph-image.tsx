import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "GrantLedger - AI-Powered Federal Grant Expense Management";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
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
          background: "linear-gradient(135deg, #4f46e5 0%, #3730a3 50%, #312e81 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "16px",
              background: "rgba(255, 255, 255, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "28px",
              fontWeight: 800,
              color: "white",
            }}
          >
            GL
          </div>
          <span
            style={{
              fontSize: "48px",
              fontWeight: 800,
              color: "white",
              letterSpacing: "-0.02em",
            }}
          >
            GrantLedger
          </span>
        </div>
        <p
          style={{
            fontSize: "24px",
            color: "rgba(255, 255, 255, 0.85)",
            maxWidth: "600px",
            textAlign: "center",
            lineHeight: 1.4,
          }}
        >
          AI-Powered Federal Grant Expense Management
        </p>
        <div
          style={{
            display: "flex",
            gap: "24px",
            marginTop: "48px",
          }}
        >
          {["2 CFR 200", "SF-424A", "Audit-Ready"].map((label) => (
            <div
              key={label}
              style={{
                padding: "8px 20px",
                borderRadius: "999px",
                background: "rgba(255, 255, 255, 0.15)",
                color: "rgba(255, 255, 255, 0.9)",
                fontSize: "16px",
                fontWeight: 600,
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
