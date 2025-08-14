// Open print preview page with given markdown via base64 in URL

const base64EncodeUnicode = (str: string) => {
  const utf8 = encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_m, p) =>
    String.fromCharCode(parseInt(p, 16))
  );
  if (typeof window !== 'undefined' && typeof (window as any).btoa === 'function') {
    return (window as any).btoa(utf8);
  }
  // Fallback: return empty if not in a browser context (should not happen when called from UI)
  return '';
};

export function openPrintPreview(markdown: string) {
  const b64 = base64EncodeUnicode(markdown);
  const url = `/print?data=${encodeURIComponent(b64)}`;
  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener');
  }
}

export default openPrintPreview;
