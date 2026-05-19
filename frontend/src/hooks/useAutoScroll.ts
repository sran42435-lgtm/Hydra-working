// frontend/src/hooks/useAutoScroll.ts

import {
  useEffect,
  useRef,
  useCallback,
  useState,
} from "react";
import { useIsSystemOverlayOpen } from "./useIsSystemOverlayOpen";   // ← proteksi overlay

interface UseAutoScrollOptions {
  /**
   * Threshold (px)
   * untuk mendeteksi user dekat bawah
   */
  nearBottomThreshold?: number;

  /**
   * Apakah streaming / pesan baru aktif
   */
  isLoading?: boolean;

  /**
   * Dependency pemicu autoscroll
   * biasanya messages.length
   */
  dependency: unknown;

  /**
   * Delay reset status scrolling
   */
  scrollEndDelay?: number;
}

export function useAutoScroll({
  nearBottomThreshold = 50,
  isLoading = false,
  dependency,
  scrollEndDelay = 150,
}: UseAutoScrollOptions) {
  const containerRef =
    useRef<HTMLDivElement>(null);

  const bottomRef =
    useRef<HTMLDivElement>(null);

  const tickingRef = useRef(false);

  const scrollEndTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(
      null
    );

  const [isAtBottom, setIsAtBottom] =
    useState(true);

  const [isScrolling, setIsScrolling] =
    useState(false);

  // ✅ Pantau apakah system overlay (share sheet, dll.) sedang terbuka
  const isSystemOverlayOpen = useIsSystemOverlayOpen();

  /**
   * Deteksi posisi scroll
   * throttled via requestAnimationFrame
   */
  const handleScroll = useCallback(() => {
    // 🛡️ Jangan proses scroll jika system overlay terbuka
    if (isSystemOverlayOpen) {
      return;
    }

    if (tickingRef.current) {
      return;
    }

    tickingRef.current = true;

    requestAnimationFrame(() => {
      const container = containerRef.current;

      if (!container) {
        tickingRef.current = false;
        return;
      }

      const distanceFromBottom =
        container.scrollHeight -
        container.scrollTop -
        container.clientHeight;

      const atBottom =
        distanceFromBottom <
        nearBottomThreshold;

      setIsAtBottom(atBottom);

      /**
       * User sedang scrolling
       */
      setIsScrolling(true);

      if (scrollEndTimerRef.current) {
        clearTimeout(scrollEndTimerRef.current);
      }

      scrollEndTimerRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, scrollEndDelay);

      tickingRef.current = false;
    });
  }, [
    nearBottomThreshold,
    scrollEndDelay,
    isSystemOverlayOpen,   // ← tambahkan dependency
  ]);

  /**
   * Attach scroll listener
   */
  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    container.addEventListener(
      "scroll",
      handleScroll,
      { passive: true }
    );

    return () => {
      container.removeEventListener(
        "scroll",
        handleScroll
      );

      if (scrollEndTimerRef.current) {
        clearTimeout(
          scrollEndTimerRef.current
        );
      }
    };
  }, [handleScroll]);

  /**
   * Pengganti scrollIntoView yang lebih stabil
   * Menggunakan container.scrollTo()
   */
  const performScrollToBottom = useCallback(
    (behavior: ScrollBehavior) => {
      const container = containerRef.current;
      if (!container) return;

      container.scrollTo({
        top: container.scrollHeight,
        behavior,
      });
    },
    []
  );

  /**
   * Auto scroll saat:
   * - loading aktif
   * - user masih dekat bawah
   *
   * 🛡️ Kecuali jika system overlay sedang terbuka
   */
  useEffect(() => {
    if (isSystemOverlayOpen) {
      return;
    }

    if (isLoading || isAtBottom) {
      const behavior: ScrollBehavior =
        isLoading ? "auto" : "smooth";

      performScrollToBottom(behavior);
    }
  }, [
    dependency,
    isLoading,
    isAtBottom,
    isSystemOverlayOpen,
    performScrollToBottom,
  ]);

  /**
   * Manual scroll ke bawah
   * 🛡️ Dibatalkan jika system overlay terbuka
   */
  const scrollToBottom = useCallback(() => {
    if (isSystemOverlayOpen) {
      return;
    }

    performScrollToBottom("smooth");
  }, [isSystemOverlayOpen, performScrollToBottom]);

  return {
    containerRef,
    bottomRef,
    isAtBottom,
    isScrolling,
    scrollToBottom,
  };
}
