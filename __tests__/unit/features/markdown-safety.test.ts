import mdToHtml, { escapeHtml } from '@/lib/markdown/miniMarkdown';

// 保存データ経由の XSS 対策（印刷ポップアップは document.write で HTML を組み立てる）
describe('Markdown 変換の安全性', () => {
  it('javascript: スキームのリンクはアンカーにせずテキストとして出力する', () => {
    const html = mdToHtml('備考: [印刷する](javascript:alert%281%29)');
    expect(html).not.toContain('href="javascript:');
    expect(html).toContain('印刷する');
  });

  it('http(s) のリンクは noopener 付きのアンカーとして出力する', () => {
    const html = mdToHtml('[公式](https://example.com/a)');
    expect(html).toContain('href="https://example.com/a"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it('escapeHtml はタグ文字を無害化する', () => {
    expect(escapeHtml('</title><script>')).toBe('&lt;/title&gt;&lt;script&gt;');
  });
});
