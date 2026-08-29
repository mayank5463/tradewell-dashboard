import { useEffect, useRef, useState } from "react";


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