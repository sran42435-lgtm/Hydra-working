// hooks/useShare.ts

import { useCallback } from "react";
import { formatShareText } from "../utils/formatShareText";
import { setSystemOverlayOpen } from "../utils/systemOverlayState";   // ← proteksi overlay

export function useShare() {
  /**
   * Share ke aplikasi eksternal
   */
  const shareExternally = useCallback(
    async (
      aiContent: string,
      userPrompt?: string
    ) => {
      const text = formatShareText(
        aiContent,
        userPrompt
      );

      /**
       * Debug environment
       */
      console.log("Share environment:", {
        shareSupported:
          typeof navigator !== "undefined" &&
          typeof navigator.share === "function",

        isSecureContext:
          window.isSecureContext,

        userAgent: navigator.userAgent,
      });

      // 🛡️ Beri tahu sistem: overlay akan terbuka
      setSystemOverlayOpen(true);

      try {
        /**
         * Cek dukungan Web Share API
         */
        if (
          typeof navigator !== "undefined" &&
          typeof navigator.share === "function" &&
          window.isSecureContext
        ) {
          await navigator.share({
            title: "Hydra AI",
            text,
          });

          /**
           * Share sukses
           */
          return;
        } else {
          console.log(
            "Web Share API tidak tersedia atau bukan secure context"
          );
        }
      } catch (err) {
        console.error(
          "navigator.share error:",
          err
        );

        /**
         * User cancel share
         */
        if (
          err instanceof DOMException &&
          err.name === "AbortError"
        ) {
          return;
        }

        /**
         * Error lain – lanjut fallback copy
         */
      } finally {
        // 🛡️ Kembalikan state overlay ke normal
        setSystemOverlayOpen(false);
      }

      /**
       * Fallback copy clipboard
       */
      const copied = await fallbackCopy(text);

      if (copied) {
        alert(
          "Teks berhasil disalin ke clipboard"
        );
      } else {
        alert(
          "Gagal menyalin teks. Silakan coba lagi."
        );
      }
    },
    []
  );

  /**
   * Copy manual
   */
  const copyShareText = useCallback(
    async (
      aiContent: string,
      userPrompt?: string
    ) => {
      const text = formatShareText(
        aiContent,
        userPrompt
      );

      await fallbackCopy(text);
    },
    []
  );

  /**
   * Export markdown
   */
  const exportMarkdown = useCallback(
    (
      aiContent: string,
      userPrompt?: string
    ) => {
      const mdContent = userPrompt
        ? `**User:**\n${userPrompt}\n\n**Hydra:**\n${aiContent}`
        : aiContent;

      const blob = new Blob(
        [mdContent],
        {
          type: "text/markdown",
        }
      );

      const url =
        URL.createObjectURL(blob);

      const a =
        document.createElement("a");

      a.href = url;
      a.download = "hydra-response.md";

      a.click();

      URL.revokeObjectURL(url);
    },
    []
  );

  return {
    shareExternally,
    copyShareText,
    exportMarkdown,
  };
}

/**
 * Clipboard fallback
 */
async function fallbackCopy(
  text: string
): Promise<boolean> {
  /**
   * Clipboard API modern
   */
  try {
    if (
      navigator.clipboard &&
      window.isSecureContext
    ) {
      await navigator.clipboard.writeText(
        text
      );

      return true;
    }
  } catch {
    /**
     * lanjut ke execCommand fallback
     */
  }

  /**
   * Legacy execCommand fallback
   */
  const textArea =
    document.createElement("textarea");

  textArea.value = text;

  textArea.style.position = "fixed";
  textArea.style.opacity = "0";

  document.body.appendChild(textArea);

  textArea.focus();
  textArea.select();

  try {
    document.execCommand("copy");
    return true;
  } catch {
    return false;
  } finally {
    document.body.removeChild(textArea);
  }
}
