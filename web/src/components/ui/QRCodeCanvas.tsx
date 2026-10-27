"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

interface QRCodeCanvasProps {
  text: string;
  size?: number;
  className?: string;
}

export function QRCodeCanvas({ text, size = 160, className = "" }: QRCodeCanvasProps) {
  const [dataUrl, setDataUrl] = useState<string>("");

  useEffect(() => {
    let active = true;
    if (!text) {
      setDataUrl("");
      return;
    }

    QRCode.toDataURL(text, {
      width: size * 2, // 2x for sharp retina rendering
      margin: 2,
      color: {
        dark: "#111111",
        light: "#ffffff",
      },
      errorCorrectionLevel: "M",
    })
      .then((url) => {
        if (active) setDataUrl(url);
      })
      .catch((err) => {
        console.error("Failed to generate QR code:", err);
      });

    return () => {
      active = false;
    };
  }, [text, size]);

  if (!dataUrl) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`grid place-items-center rounded-xl border border-fg/10 bg-white ${className}`}
      >
        <span className="text-[11px] text-zinc-400">Loading QR...</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={dataUrl}
      alt={`QR code for ${text}`}
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className={`rounded-xl border border-fg/10 bg-white p-1.5 shadow-sm ${className}`}
    />
  );
}
