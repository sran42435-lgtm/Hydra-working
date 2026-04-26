/**
 * Auto Scroll Controller - Phase 1
 * Otomatis meng-scroll kontainer chat ke bawah saat pesan baru muncul,
 * kecuali user sedang membaca riwayat di atas.
 */

import React, { useEffect, useRef, useCallback } from "react";

export interface AutoScrollControllerProps {
  /** Dependensi yang memicu scroll (biasanya jumlah pesan) */
  dependency: unknown;
  /** Threshold jarak dari bawah untuk menentukan apakah user "di bawah" */
  threshold?: number;
  children: React.ReactNode;
}

export const AutoScrollController: React.FC<AutoScrollControllerProps> = ({
  dependency,
  threshold = 100,
  children,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const userScrolledUpRef = useRef(false);

  /** Cek apakah user berada di dekat bawah kontainer */
  const isNearBottom = useCallback((): boolean => {
    const container = containerRef.current;
    if (!container) return true;
    const { scrollTop, scrollHeight, clientHeight } = container;
    return scrollHeight - scrollTop - clientHeight <= threshold;
  }, [threshold]);

  /** Handler scroll untuk melacak posisi user */
  const handleScroll = useCallback((): void => {
    userScrolledUpRef.current = !isNearBottom();
  }, [isNearBottom]);

  /** Auto-scroll ke bawah saat dependency berubah, kecuali user scroll ke atas */
  useEffect(() => {
    if (!userScrolledUpRef.current) {
      const container = containerRef.current;
      if (container) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: "smooth",
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dependency]);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{
        flex: 1,
        overflowY: "auto",
        scrollBehavior: "smooth",
      }}
    >
      {children}
    </div>
  );
};
