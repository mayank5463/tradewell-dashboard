
import NavBar from "./NavBar";
import MarqueeStrip from "./MarqueeStrip";
import SearchBar from "./SearchBar";
import MarketIndicesTicker from "./MarketIndicesTicker";
import "./TopBar.css";

// Rendered once above the switched dashboard content - see INTEGRATION.md for exactly
// where this hooks into the existing Home.jsx.
//
// Three stacked rows, all sticky together as one unit:
//   1. NavBar       - dark brand strip: logo (left), page links, theme + profile (right)
//   2. MarqueeStrip - thin, continuously scrolling stock strip
//   3. Search row   - tagline (left) + search (center) + Sensex/Nifty ticker (right)
//
// FIXED — this used to destructure a `user` prop that was never actually
// forwarded to <NavBar /> below (dead code even before Home.jsx stopped
// passing it). ProfileMenu.jsx already reads the logged-in user straight
// from Redux, so there's nothing to thread through here.
export default function TopBar() {
  return (
    <header className="topbar-shell">
      <NavBar />
      <MarqueeStrip />

      <div className="topbar-shell__search-row">
        <span className="topbar-shell__tagline">AI based Trading system</span>

        <div className="topbar-shell__search-slot">
          <SearchBar />
        </div>

        <MarketIndicesTicker />

        {/* REPLACED — "Ask niveshAI" CTA swapped for a live Sensex/Nifty
           ticker per request. Keeping the old button here in case you
           want the AI CTA back somewhere else (e.g. inside StockDetailPanel).
        <Button
          variant="contained"
          disableElevation
          startIcon={<AutoAwesomeIcon fontSize="small" />}
          className="topbar-shell__ai-cta"
        >
          Ask niveshAi for Recommendation and Trade research
        </Button>
        */}
      </div>
    </header>
  );
}