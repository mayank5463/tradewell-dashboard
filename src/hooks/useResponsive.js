import { useState, useEffect } from "react";

export const BREAKPOINTS = {
  mobile: 480,
  tablet: 768,
  laptop: 1200,
};

function getBreakpoint(width) {
  if (width < BREAKPOINTS.mobile) return "mobile";
  if (width < BREAKPOINTS.tablet) return "tablet";
  if (width < BREAKPOINTS.laptop) return "laptop";
  return "desktop";
}

export function useResponsive() {
  const [width, setWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : BREAKPOINTS.laptop
  );

  useEffect(() => {
    let timeoutId;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => setWidth(window.innerWidth), 100);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  const breakpoint = getBreakpoint(width);

  return {
    width,
    breakpoint,
    isMobile: breakpoint === "mobile",
    isTablet: breakpoint === "tablet",
    isLaptop: breakpoint === "laptop",
    isDesktop: breakpoint === "desktop",
    isMobileOrTablet: breakpoint === "mobile" || breakpoint === "tablet",
  };
}