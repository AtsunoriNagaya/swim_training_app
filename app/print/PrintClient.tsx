"use client";

import { useEffect, useMemo } from "react";
import mdToHtml from "@/lib/markdown/miniMarkdown";

const base64DecodeUnicode = (b64: string) => {
  try {
    if (typeof window === 'undefined' || typeof (window as any).atob !== 'function') return '';
    const binary = (window as any).atob(b64);
    const percent = Array.from(binary)
      .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
      .join('');
    return decodeURIComponent(percent);
  } catch {
    return '';
  }
};

export default function PrintClient() {
  const data = useMemo(() => {
    if (typeof window === 'undefined') return null;
    try {
      const sp = new URLSearchParams(window.location.search);
      return sp.get('data');
    } catch {
      return null;
    }
  }, []);

  const markdown = useMemo(() => {
    if (!data) return "# 印刷プレビュー\nデータが見つかりません。";
    return base64DecodeUnicode(data);
  }, [data]);

  const html = useMemo(() => mdToHtml(markdown), [markdown]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (typeof window !== 'undefined') window.print();
    }, 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="print-container">
      <div className="no-print toolbar">
        <button onClick={() => window.print()} className="btn">印刷</button>
      </div>
      <article className="content" dangerouslySetInnerHTML={{ __html: html }} />
      <style jsx global>{`
        @page { size: A4; margin: 16mm; }
        html, body { height: 100%; }
        body { font-family: 'Noto Sans JP', 'Hiragino Kaku Gothic ProN', Meiryo, sans-serif; font-size: 12pt; color: #111; }
        .toolbar { position: sticky; top: 0; padding: 8px 0; background: white; border-bottom: 1px solid #eee; margin-bottom: 12px; }
        .btn { border: 1px solid #ccc; padding: 6px 12px; border-radius: 6px; background: #fff; cursor: pointer; }
        .content { max-width: 180mm; margin: 0 auto; }
        h1, h2, h3 { margin: 12px 0 8px; }
        p { margin: 6px 0; line-height: 1.5; }
        code { background: #f4f4f4; padding: 0 4px; border-radius: 3px; }
        table { width: 100%; border-collapse: collapse; table-layout: fixed; margin: 10px 0; }
        th, td { border: 1px solid #ccc; padding: 6px; vertical-align: middle; word-break: break-word; overflow-wrap: anywhere; }
        th { background: #f7f7f7; font-weight: 600; }
        @media print { .no-print { display: none !important; } }
      `}</style>
    </div>
  );
}

