

import { useState, useEffect } from "react";
import logoMap from "../../data/logoMap.json";

function resolveLocalLogo(symbol) {
  if (!symbol) return null;
  return logoMap[symbol.toUpperCase()] ?? null;
}

export default function StockLogo({ symbol, logoUrl, size = 32 }) {
  const localSrc = resolveLocalLogo(symbol);
  const primarySrc = localSrc || logoUrl || undefined;
  
  const [imgError, setImgError] = useState(false);
  const [useFallback, setUseFallback] = useState(false);

  // Reset states when src changes
  useEffect(() => {
    setImgError(false);
    setUseFallback(false);
  }, [primarySrc]);

  const handleImageError = () => {
    // If we haven't tried the API fallback yet and we have a logoUrl
    if (!useFallback && localSrc && logoUrl) {
      setUseFallback(true);
      return;
    }
    // Otherwise show initials
    setImgError(true);
  };

  // Determine what to show
  const showImage = !imgError && primarySrc;
  const showInitials = imgError || (!primarySrc);

  return (
    <span
      style={{
        position: "relative",
        display: "inline-flex",
        flexShrink: 0,
        width: size,
        height: size,
      }}
    >
      {showImage && (
        <img
          src={useFallback ? logoUrl : primarySrc}
          alt={symbol}
          width={size}
          height={size}
          style={{
            width: size,
            height: size,
            borderRadius: "50%",
            objectFit: "contain",
            background: "var(--surface-secondary)",
            border: "1px solid var(--border-primary)",
          }}
          onError={handleImageError}
        />
      )}
      
      {showInitials && (
        <span
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: size,
            height: size,
            borderRadius: "50%",
            background: "var(--surface-tertiary)",
            fontSize: size * 0.38,
            fontWeight: 700,
            color: "var(--text-secondary)",
            border: "1px solid var(--border-primary)",
            flexShrink: 0,
          }}
        >
          {symbol?.slice(0, 2).toUpperCase()}
        </span>
      )}
    </span>
  );
}