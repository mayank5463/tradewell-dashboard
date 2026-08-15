import { useEffect, useRef, useState } from "react";

// Returns "flash-up" | "flash-down" | "" for a brief moment whenever
// `value` changes — drop the returned class onto any price element to get
// a live scorecard-style flash without any loading state or re-render jank.
export function usePriceFlash(value, duration = 600) {
  const prevRef = useRef(value);
  const [flashClass, setFlashClass] = useState("");

  useEffect(() => {
    if (prevRef.current !== undefined && value !== prevRef.current) {
      setFlashClass(value > prevRef.current ? "flash-up" : "flash-down");
      const t = setTimeout(() => setFlashClass(""), duration);
      prevRef.current = value;
      return () => clearTimeout(t);
    }
    prevRef.current = value;
  }, [value, duration]);

  return flashClass;
}