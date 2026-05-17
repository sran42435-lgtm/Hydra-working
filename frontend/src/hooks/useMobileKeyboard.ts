// frontend/src/hooks/useMobileKeyboard.ts
import { useEffect, useRef, useState } from "react";

interface UseMobileKeyboardOptions {
  /** Offset untuk mengecilkan nilai keyboardHeight (misal agar input tidak terlalu naik) */
  keyboardOffset?: number;
}

export function useMobileKeyboard({
  keyboardOffset = 250,
}: UseMobileKeyboardOptions = {}) {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  const keyboardOpenRef = useRef(false);
  const lockedRawHeightRef = useRef(0);
  const typingLockRef = useRef(false);
  const typingUnlockTimerRef = useRef<number | null>(null);
  const keyboardCloseTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return;

    const viewport = window.visualViewport;

    const resetKeyboardState = () => {
      keyboardOpenRef.current = false;
      lockedRawHeightRef.current = 0;
      typingLockRef.current = false;
      setKeyboardHeight(0);
      setIsKeyboardOpen(false);

      if (keyboardCloseTimerRef.current) {
        clearTimeout(keyboardCloseTimerRef.current);
        keyboardCloseTimerRef.current = null;
      }
      if (typingUnlockTimerRef.current) {
        clearTimeout(typingUnlockTimerRef.current);
        typingUnlockTimerRef.current = null;
      }
    };

    const applyKeyboardHeight = (rawHeight: number) => {
      lockedRawHeightRef.current = rawHeight;
      const adjusted = Math.max(rawHeight - keyboardOffset, 0);
      setKeyboardHeight(adjusted);
      setIsKeyboardOpen(true);
    };

    const handleTyping = () => {
      typingLockRef.current = true;
      if (typingUnlockTimerRef.current) clearTimeout(typingUnlockTimerRef.current);
      typingUnlockTimerRef.current = window.setTimeout(() => {
        typingLockRef.current = false;
      }, 180);
    };

    window.addEventListener("keydown", handleTyping);

    let frame: number | null = null;

    const handleViewportResize = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        // Saat mengetik, jangan ubah keyboardHeight (hindari bounce)
        if (typingLockRef.current && keyboardOpenRef.current) {
          setKeyboardHeight(
            Math.max(lockedRawHeightRef.current - keyboardOffset, 0)
          );
          return;
        }

        const windowHeight = window.innerHeight;
        const viewportHeight = viewport.height;
        const rawKeyboardHeight = windowHeight - viewportHeight;
        const threshold = 140;

        if (rawKeyboardHeight > threshold) {
          keyboardOpenRef.current = true;
          if (keyboardCloseTimerRef.current) {
            clearTimeout(keyboardCloseTimerRef.current);
            keyboardCloseTimerRef.current = null;
          }

          const prev = lockedRawHeightRef.current;
          const delta = Math.abs(rawKeyboardHeight - prev);

          // Update hanya jika perubahan signifikan atau pertama kali
          if (delta > 120 || prev === 0) {
            applyKeyboardHeight(rawKeyboardHeight);
          }
        } else {
          // Keyboard mungkin tertutup
          if (keyboardOpenRef.current) {
            const active = document.activeElement;
            if (active instanceof HTMLTextAreaElement || active instanceof HTMLInputElement) {
              // Fokus masih di input, pertahankan tinggi terakhir
              setKeyboardHeight(
                Math.max(lockedRawHeightRef.current - keyboardOffset, 0)
              );
              return;
            }
            // Delay close untuk hindari false trigger
            if (!keyboardCloseTimerRef.current) {
              keyboardCloseTimerRef.current = window.setTimeout(() => {
                resetKeyboardState();
              }, 220);
            }
          } else {
            resetKeyboardState();
          }
        }
      });
    };

    viewport.addEventListener("resize", handleViewportResize);
    viewport.addEventListener("scroll", handleViewportResize);

    window.addEventListener("pagehide", resetKeyboardState);
    window.addEventListener("blur", resetKeyboardState);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) resetKeyboardState();
    });

    // Inisialisasi
    handleViewportResize();

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("keydown", handleTyping);
      viewport.removeEventListener("resize", handleViewportResize);
      viewport.removeEventListener("scroll", handleViewportResize);
      window.removeEventListener("pagehide", resetKeyboardState);
      window.removeEventListener("blur", resetKeyboardState);
      document.removeEventListener("visibilitychange", () => {});
      if (typingUnlockTimerRef.current) clearTimeout(typingUnlockTimerRef.current);
      if (keyboardCloseTimerRef.current) clearTimeout(keyboardCloseTimerRef.current);
    };
  }, [keyboardOffset]);

  return { keyboardHeight, isKeyboardOpen };
}

