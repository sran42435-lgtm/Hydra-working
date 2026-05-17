// frontend/src/hooks/useAutoScroll.ts
import { useEffect, useRef, useCallback, useState } from "react";

interface UseAutoScrollOptions {
  /** Threshold (px) untuk mendeteksi user dekat bawah */
  nearBottomThreshold?: number;
  /** Apakah streaming/pesan baru sedang aktif? */
  isLoading?: boolean;
  /** Ketergantungan yang memicu autoscroll (biasanya jumlah/length pesan) */
  dependency: unknown;
  /** Delay (ms) untuk mereset status scrolling */
  scrollEndDelay?: number;
}

export function useAutoScroll({
  nearBottomThreshold = 50,
  isLoading = false,
  dependency,
  scrollEndDelay = 150,
}: UseAutoScrollOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const tickingRef = useRef(false);
  const scrollEndTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isAtBottom, setIsAtBottom] = useState(true);
  const [isScrolling, setIsScrolling] = useState(false);

  // Deteksi posisi scroll – throttled via rAF
  const handleScroll = useCallback(() => {
    if (tickingRef.current) return;
    tickingRef.current = true;
    requestAnimationFrame(() => {
      const container = containerRef.current;
      if (!container) {
        tickingRef.current = false;
        return;
      }
      const atBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight < nearBottomThreshold;
      setIsAtBottom(atBottom);

      setIsScrolling(true);
      if (scrollEndTimerRef.current) clearTimeout(scrollEndTimerRef.current);
      scrollEndTimerRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, scrollEndDelay);

      tickingRef.current = false;
    });
  }, [nearBottomThreshold, scrollEndDelay]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", handleScroll);
      if (scrollEndTimerRef.current) clearTimeout(scrollEndTimerRef.current);
    };
  }, [handleScroll]);

  // Autoscroll saat dependency berubah, jika user di bawah (atau loading baru)
  useEffect(() => {
    if (isLoading || isAtBottom) {
      const behavior: ScrollBehavior = isLoading ? "auto" : "smooth";
      bottomRef.current?.scrollIntoView({ behavior });
    }
  }, [dependency, isLoading, isAtBottom]);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  return {
    containerRef,
    bottomRef,
    isAtBottom,
    isScrolling,
    scrollToBottom,
  };
}
