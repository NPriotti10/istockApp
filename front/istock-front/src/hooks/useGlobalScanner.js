import { useEffect, useRef } from "react";

export function useGlobalScanner(onScan, { enabled = true } = {}) {
  const bufferRef = useRef("");
  const lastKeyTimeRef = useRef(0);
  const finalizeTimerRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;

    const isTypingInInput = () => {
      const el = document.activeElement;
      if (!el) return false;
      const tag = el.tagName;
      const editable = el.getAttribute && el.getAttribute("contenteditable");
      return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || editable === "true";
    };

    const normalize = (s) => String(s ?? "").replace(/\s+/g, "").toUpperCase();
    const isCodeChar = (key) => /^[0-9A-Za-z\-_.]$/.test(key);

    const finalize = () => {
      const raw = normalize(bufferRef.current);
      bufferRef.current = "";
      if (!raw || raw.length < 3) return;
      onScan?.(raw);
    };

    const onKeyDown = (e) => {
      if (isTypingInInput()) return; // no interferir con inputs

      const now = Date.now();
      if (now - lastKeyTimeRef.current > 120) bufferRef.current = "";
      lastKeyTimeRef.current = now;

      if (e.key === "Enter") {
        if (finalizeTimerRef.current) clearTimeout(finalizeTimerRef.current);
        finalize();
        return;
      }
      if (!isCodeChar(e.key)) return;

      bufferRef.current += e.key;
      if (finalizeTimerRef.current) clearTimeout(finalizeTimerRef.current);
      finalizeTimerRef.current = setTimeout(finalize, 140);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      if (finalizeTimerRef.current) clearTimeout(finalizeTimerRef.current);
    };
  }, [enabled, onScan]);
}
