/**
 * B16 Win-back email template.
 * Draft copy from docs/sprint-oct-19-23.md — Maida approves before sending.
 */

const LOGO_URL = "https://d1p6j71028fbjm.cloudfront.net/logos/logo-new-referral-1.png";

export interface WinbackEmailData {
  firstName: string;
  brandDomain: string;
  checkoutUrl: string;
}

export function winbackEmailSubject(brandDomain: string): string {
  return `${brandDomain} is ready, it just isn't live yet`;
}

export function winbackEmailHtml(data: WinbackEmailData): string {
  const { firstName, brandDomain, checkoutUrl } = data;

  return `
<div style="margin:0;padding:0;background:#f5f5f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e7e5e4;border-radius:16px;overflow:hidden;">
    <div style="text-align:center;padding:28px 24px 20px;background:#fff5f5;border-bottom:3px solid #ff646c;">
      <a href="https://www.referrals.com"><img src="${LOGO_URL}" alt="Referrals.com" width="180" height="auto" style="width:180px;max-width:70%;height:auto;border:0;" /></a>
    </div>
    <div style="padding:28px;">
      <p style="margin:0 0 14px;font-size:16px;line-height:1.65;color:#44403c;">
        Hi ${escapeHtml(firstName)},
      </p>
      <p style="margin:0 0 14px;font-size:16px;line-height:1.65;color:#44403c;">
        You set up <strong>${escapeHtml(brandDomain)}</strong> on Referrals.com, but it\u2019s still private, so nobody can join your referral program yet.
      </p>
      <p style="margin:0 0 14px;font-size:16px;line-height:1.65;color:#44403c;">
        This week only: publish <strong>${escapeHtml(brandDomain)}</strong> for <strong>$1 for your first month</strong>, then $9/mo. Cancel anytime.
      </p>
      <p style="margin:24px 0 0;text-align:center;">
        <a href="${escapeHtml(checkoutUrl)}" style="display:inline-block;background:#ff646c;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:700;font-size:15px;">
          Publish ${escapeHtml(brandDomain)} \u2192
        </a>
      </p>
      <p style="margin:28px 0 0;font-size:14px;line-height:1.5;color:#78716c;">
        Maida B.
      </p>
    </div>
    <div style="padding:16px 28px;background:#1c1917;color:#a8a29e;font-size:12px;line-height:1.5;">
      <p style="margin:0;">
        <a href="https://www.referrals.com" style="color:#fafaf9;text-decoration:none;font-weight:700;">Referrals.com</a>
        \u00b7 Referral marketing that grows with you
      </p>
      <p style="margin:8px 0 0;">
        <a href="https://www.referrals.com/dashboard" style="color:#fda4af;text-decoration:none;">Dashboard</a>
        \u00b7
        <a href="https://www.referrals.com/account" style="color:#a8a29e;text-decoration:none;">Account</a>
      </p>
    </div>
  </div>
</div>
`.trim();
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
