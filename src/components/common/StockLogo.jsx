// // export default function StockLogo({ symbol, logoUrl, size = 32 }) {
// //   return (
// //     <span
// //       style={{
// //         position: "relative",
// //         display: "inline-flex",
// //         flexShrink: 0,
// //         width: size,
// //         height: size,
// //       }}
// //     >
// //       <img
// //         src={logoUrl || undefined}
// //         alt={symbol}
// //         width={size}
// //         height={size}
// //         style={{
// //           // width/height as real CSS properties here — not just HTML
// //           // attributes — is the actual fix. global.css has a blanket
// //           // `img { max-width: 100%; height: auto; }` rule (needed for
// //           // normal content images elsewhere in the app). A real
// //           // stylesheet rule always beats a bare HTML width/height
// //           // attribute, so without these two lines `height: auto` wins,
// //           // the image has no locked pixel size, and — critically — when
// //           // `logoUrl` is undefined (src is entirely absent, so there's no
// //           // failed network request to trigger onError) the browser falls
// //           // back to a large default placeholder box for the src-less
// //           // <img>. With border-radius:50% on that oversized box, the
// //           // result is exactly the elongated blue oval hiding the rest of
// //           // the row that shows up in the watchlist. Inline `style` has
// //           // higher specificity than any external stylesheet selector, so
// //           // setting width/height here locks the box to size×size no
// //           // matter what src does or doesn't load.
// //           width: size,
// //           height: size,
// //           borderRadius: "50%",
// //           objectFit: "contain",
// //           background: "var(--surface-secondary)",
// //           border: "1px solid var(--border-primary)",
// //         }}
// //         onError={(e) => {
// //           e.currentTarget.style.display = "none";
// //           e.currentTarget.nextSibling.style.display = "flex";
// //         }}
// //       />
// //       <span
// //         style={{
// //           display: "none",
// //           alignItems: "center",
// //           justifyContent: "center",
// //           width: size,
// //           height: size,
// //           borderRadius: "50%",
// //           background: "var(--surface-tertiary)",
// //           fontSize: size * 0.38,
// //           fontWeight: 700,
// //           color: "var(--text-secondary)",
// //           position: "absolute",
// //           top: 0,
// //           left: 0,
// //         }}
// //       >
// //         {symbol?.slice(0, 2)}
// //       </span>
// //     </span>
// //   );
// // }




// import logoMap from "../../data/logoMap.json";

// // Local-first logo resolution. logoMap.json is a slim symbol -> path lookup
// // generated from your TradingView-scraped logo metadata (3,155 tickers),
// // pointing at static files served from /public/logos/... — see the README
// // note at the bottom of this file for exactly where those SVGs need to
// // live on disk.
// //
// // Fallback order, each step only tried if the previous one 404s/errors:
// //   1. Local bundled SVG (logoMap[symbol]) — instant, no network call,
// //      works even if the logo API is down.
// //   2. logoUrl prop (whatever your backend/Upstox/IndianAPI pipeline
// //      currently supplies) — kept as a fallback for any symbol not in
// //      the local 3,155-ticker set (SME/newly-listed stocks, etc).
// //   3. Initials avatar — unchanged from before.
// function resolveLocalLogo(symbol) {
//   if (!symbol) return null;
//   return logoMap[symbol.toUpperCase()] ?? null;
// }

// export default function StockLogo({ symbol, logoUrl, size = 32 }) {
//   const localSrc = resolveLocalLogo(symbol);
//   const primarySrc = localSrc || logoUrl || undefined;

//   return (
//     <span
//       style={{
//         position: "relative",
//         display: "inline-flex",
//         flexShrink: 0,
//         width: size,
//         height: size,
//       }}
//     >
//       <img
//         src={primarySrc}
//         alt={symbol}
//         width={size}
//         height={size}
//         style={{
//           // width/height as real CSS properties here — not just HTML
//           // attributes — is the actual fix. global.css has a blanket
//           // `img { max-width: 100%; height: auto; }` rule (needed for
//           // normal content images elsewhere in the app). A real
//           // stylesheet rule always beats a bare HTML width/height
//           // attribute, so without these two lines `height: auto` wins,
//           // the image has no locked pixel size, and — critically — when
//           // `logoUrl` is undefined (src is entirely absent, so there's no
//           // failed network request to trigger onError) the browser falls
//           // back to a large default placeholder box for the src-less
//           // <img>. With border-radius:50% on that oversized box, the
//           // result is exactly the elongated blue oval hiding the rest of
//           // the row that shows up in the watchlist. Inline `style` has
//           // higher specificity than any external stylesheet selector, so
//           // setting width/height here locks the box to size×size no
//           // matter what src does or doesn't load.
//           width: size,
//           height: size,
//           borderRadius: "50%",
//           objectFit: "contain",
//           background: "var(--surface-secondary)",
//           border: "1px solid var(--border-primary)",
//         }}
//         onError={(e) => {
//           // If the LOCAL logo was the one that just failed (shouldn't
//           // happen if the files are actually in /public/logos, but covers
//           // a missing-file/typo'd-path case), retry once with the API
//           // logoUrl before giving up and showing initials. Guarded by a
//           // data attribute so this only ever retries once, never loops.
//           const img = e.currentTarget;
//           const triedLocalFallback = img.dataset.triedFallback === "1";

//           if (!triedLocalFallback && localSrc && logoUrl && img.src.includes(localSrc)) {
//             img.dataset.triedFallback = "1";
//             img.src = logoUrl;
//             return;
//           }

//           img.style.display = "none";
//           img.nextSibling.style.display = "flex";
//         }}
//       />
//       <span
//         style={{
//           display: "none",
//           alignItems: "center",
//           justifyContent: "center",
//           width: size,
//           height: size,
//           borderRadius: "50%",
//           background: "var(--surface-tertiary)",
//           fontSize: size * 0.38,
//           fontWeight: 700,
//           color: "var(--text-secondary)",
//           position: "absolute",
//           top: 0,
//           left: 0,
//         }}
//       >
//         {symbol?.slice(0, 2)}
//       </span>
//     </span>
//   );
// }

// // ── SETUP — do this once ────────────────────────────────────────────────
// // 1. Copy your local logo files into /public/logos/ so the folder
// //    structure matches the `file` paths already baked into logoMap.json:
// //      public/logos/nse/NSE_RELIANCE.svg
// //      public/logos/bse/BSE_XXXXX.svg
// //    (create the nse/ and bse/ subfolders — that's exactly what "file" in
// //    your original logos.json metadata already pointed at, just rooted
// //    under /public instead of wherever they sit locally now.)
// // 2. Drop logoMap.json into src/data/logoMap.json (adjust the relative
// //    import path above — "../../data/logoMap.json" — if StockLogo.jsx
// //    lives somewhere other than src/components/common/).
// // 3. CRA/Vite both serve everything under /public/ at the site root
// //    automatically — no import, no webpack config, no code change needed
// //    beyond this file. /public/logos/nse/NSE_RELIANCE.svg becomes
// //    reachable at yourapp.com/logos/nse/NSE_RELIANCE.svg immediately.

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