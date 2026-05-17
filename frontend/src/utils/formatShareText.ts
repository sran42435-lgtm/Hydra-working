// utils/formatShareText.ts

/**
 * Konversi konten AI (Markdown) menjadi teks biasa untuk share.
 * Tambahkan branding kecil di akhir.
 */

export function formatShareText(
  aiContent: string,
  userPrompt?: string
): string {
  // Hapus karakter Markdown sederhana (bold, italic, link, heading)
  let plainText = aiContent
    .replace(/\*\*(.+?)\*\*/g, '$1')      // bold
    .replace(/\*(.+?)\*/g, '$1')          // italic
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // link
    .replace(/^#{1,6}\s+/gm, '')          // heading
    .replace(/`{1,3}[^`]*`{1,3}/g, '')   // inline code / code block
    .replace(/\n{2,}/g, '\n\n')           // compact multiple newlines
    .trim();

  // Susun teks yang akan dishare
  let result = '';
  if (userPrompt) {
    result += `User:\n${userPrompt}\n\n`;
  }
  result += `Hydra:\n${plainText}\n\n`;
  result += '— Shared from Hydra AI';

  return result;
}

/**
 * Konversi konten AI langsung menjadi teks biasa tanpa metadata.
 */
export function plainAiContent(aiContent: string): string {
  return aiContent
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/`{1,3}[^`]*`{1,3}/g, '')
    .replace(/\n{2,}/g, '\n\n')
    .trim();
}
