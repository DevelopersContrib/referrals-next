"use client";

import { sanitizeWidgetHtml } from "@/lib/sanitize-widget-html";

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export interface WizardPreviewProps {
  name: string;
  description: string;
  buttonText: string;
  colorHex: string;
  buttonColorHex: string;
  bannerImageUrl: string;
  bodyHtml: string;
}

/** Live-ish widget preview (iframe) — matches embed widget layout without API calls. */
export function CampaignWizardPreview({
  name,
  description,
  buttonText,
  colorHex,
  buttonColorHex,
  bannerImageUrl,
  bodyHtml,
}: WizardPreviewProps) {
  const accent = colorHex.startsWith("#") ? colorHex : `#${colorHex}`;
  const btn = buttonColorHex.startsWith("#") ? buttonColorHex : `#${buttonColorHex}`;
  const title = name.trim() || "Your campaign";
  const desc = description.trim() || "Tell people why they should join.";
  const btnLabel = buttonText.trim() || "Join Now";

  const safeUrl = bannerImageUrl.trim();
  const bannerOk =
    (/^https:\/\/.+/i.test(safeUrl) || /^data:image\/[a-z0-9+]+;base64,/i.test(safeUrl)) &&
    !/["'<>]/.test(safeUrl);
  const bannerBlock = bannerOk
    ? `<div style='width:100%;height:120px;background:url(${JSON.stringify(
        safeUrl
      )}) center/cover no-repeat'></div>`
    : "";

  const safeBody = bodyHtml.trim() ? sanitizeWidgetHtml(bodyHtml) : "";
  const bodyBlock = safeBody
    ? `<div style="margin:0 0 16px;font-size:14px;color:#1f2937;line-height:1.55">${safeBody}</div>`
    : "";

  const doc = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; font-family: ui-sans-serif, system-ui, sans-serif; background: #f1f5f9; padding: 16px; }
  .shell { max-width: 380px; margin: 0 auto; background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 12px 40px rgba(15,23,42,.12); }
  .pad { padding: 20px 20px 24px; }
  h2 { margin: 0 0 8px; font-size: 20px; font-weight: 700; color: #0f172a; text-align: center; line-height: 1.25; }
  .sub { margin: 0 0 16px; font-size: 14px; color: #64748b; text-align: center; line-height: 1.5; }
  .fake-input { width: 100%; padding: 10px 12px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 14px; color: #94a3b8; margin-bottom: 10px; background: #f8fafc; }
  .fake-btn { width: 100%; padding: 12px; border-radius: 8px; border: none; font-size: 15px; font-weight: 600; color: #fff; cursor: default; }
  .hint { margin-top: 12px; font-size: 11px; color: #94a3b8; text-align: center; }
</style></head><body>
<div class="shell">
  ${bannerBlock}
  <div class="pad">
    <h2>${esc(title)}</h2>
    <p class="sub">${esc(desc)}</p>
    ${bodyBlock}
    <div class="fake-input">Your name</div>
    <div class="fake-input">you@example.com</div>
    <button type="button" class="fake-btn" style="background:${esc(btn)}">${esc(btnLabel)}</button>
    <p class="hint">Preview only — form does not submit</p>
  </div>
</div>
<p style="text-align:center;margin:12px 0 0;font-size:11px;color:#64748b">Accent ${esc(accent)} · This is how your embed can look</p>
</body></html>`;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-inner">
      <div className="border-b border-slate-200 bg-white px-3 py-2">
        <p className="text-center text-xs font-medium text-slate-500">Widget preview</p>
      </div>
      <iframe
        title="Campaign widget preview"
        className="h-[min(520px,70vh)] w-full bg-slate-100"
        sandbox=""
        srcDoc={doc}
      />
    </div>
  );
}
