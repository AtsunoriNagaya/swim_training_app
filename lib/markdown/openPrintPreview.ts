// Open print preview page with given markdown via base64 in URL

const encodeBase64Unicode = (str: string) => {
  // encodeURIComponent to handle unicode safely
  return btoa(unescape(encodeURIComponent(str)));
};

export function openPrintPreview(markdown: string) {
  const b64 = encodeBase64Unicode(markdown);
  const url = `/print?data=${encodeURIComponent(b64)}`;
  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener');
  }
}

export default openPrintPreview;

