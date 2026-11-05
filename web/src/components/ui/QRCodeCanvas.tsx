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
      width: Math.round(size * 2), // 2x for sharp retina rendering
      margin: 1,
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
        style={{ width: `${size}px`, height: `${size}px`, aspectRatio: "1 / 1" }}
        className={`grid place-items-center rounded-xl border border-fg/10 bg-white aspect-square shrink-0 ${className}`}
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
      style={{ width: `${size}px`, height: `${size}px`, maxWidth: `${size}px`, maxHeight: `${size}px`, aspectRatio: "1 / 1" }}
      className={`shrink-0 aspect-square object-contain block rounded-lg ${className}`}
    />
  );
}
