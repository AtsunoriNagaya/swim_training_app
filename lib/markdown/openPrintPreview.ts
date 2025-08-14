// Open print preview page with given markdown.
// Prefer localStorage to avoid long URLs and to allow cross-tab access.

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

export function openPrintPreview(markdown: string, target: '_blank' | '_self' = '_blank') {
  if (typeof window !== 'undefined') {
    try {
      const key = `print_md_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      window.localStorage.setItem(key, markdown);
      const url = `/print#${encodeURIComponent(key)}`;
      if (target === '_self') {
        window.location.assign(url);
      } else {
        window.open(url, '_blank', 'noopener');
      }
      return;
    } catch {}
    // Fallback to base64-in-query if sessionStorage is not available
    const b64 = base64EncodeUnicode(markdown);
    const url = `/print?data=${encodeURIComponent(b64)}`;
    if (target === '_self') {
      window.location.assign(url);
    } else {
      window.open(url, '_blank', 'noopener');
    }
  }
}

export default openPrintPreview;
