export function safeLink(input) {
  if (typeof input !== 'string' || input.length > 2000) return '';
  try {
    const url = new URL(input.trim());
    return ['https:', 'http:', 'mailto:', 'tel:'].includes(url.protocol) ? url.href : '';
  } catch { return ''; }
}
