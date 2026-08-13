import type { VnocLeadmailStep } from "./types";

type MysqlPoolLike = {
  query: (sql: string, params?: unknown[]) => Promise<[unknown[], unknown]>;
  end?: () => Promise<void>;
};

/**
 * Readonly fetch of VNOC leadmail autoresponder steps for a campaign,
 * optionally filtered to a domain_id (CSV in leadmail.domains).
 */
export async function fetchVnocLeadmailSteps(
  pool: MysqlPoolLike,
  campaignId: number,
  domainId: number
): Promise<VnocLeadmailStep[]> {
  const [rows] = await pool.query(
    `SELECT mail_id, subject, message_content, num_day, day_type, enable, domains, is_auto_responder
     FROM leadmail
     WHERE campaign_id = ?
       AND is_auto_responder = 1
     ORDER BY COALESCE(num_day, 0) ASC, mail_id ASC`,
    [campaignId]
  );

  const list = rows as {
    mail_id: number;
    subject: string;
    message_content: string | null;
    num_day: number | null;
    enable: number | null;
    domains: string | null;
    is_auto_responder: number | boolean | null;
  }[];

  const domainStr = String(domainId);
  return list
    .filter((r) => {
      const domains = (r.domains || "").trim();
      if (!domains) return true; // network-wide step
      return domains
        .split(",")
        .map((d) => d.trim())
        .includes(domainStr);
    })
    .map((r, idx) => ({
      mailId: Number(r.mail_id),
      subject: r.subject || "",
      bodyHtml: r.message_content,
      delayDays: Number(r.num_day ?? idx),
      enabled: Number(r.enable ?? 1) === 1,
      domains: r.domains,
    }));
}

/**
 * Create a short-lived mysql2 connection from VNOC_DATABASE_URL only.
 * Never pass or set process.env.DATABASE_URL here — that overrides Next/.env
 * and points Prisma at domaindi_managedomain (no homeowners table).
 */
export async function createVnocConnection(databaseUrl: string): Promise<{
  query: (sql: string, params?: unknown[]) => Promise<[unknown[], unknown]>;
  end: () => Promise<void>;
}> {
  if (!databaseUrl || /handyman_handyman/i.test(databaseUrl)) {
    throw new Error("VNOC_DATABASE_URL must point at the VNOC manage DB, not Handyman.");
  }
  const mysql = await import("mysql2/promise");
  const m = databaseUrl.match(/^mysql:\/\/([^:]+):([^@]+)@([^:\/]+)(?::(\d+))?\/([^?]+)/);
  if (!m) throw new Error("Invalid VNOC_DATABASE_URL");
  if (m[5] === "handyman_handyman") {
    throw new Error("Refusing VNOC connection to handyman_handyman — use VNOC_DATABASE_URL.");
  }
  const conn = await mysql.createConnection({
    host: m[3],
    port: Number(m[4] || 3306),
    user: m[1],
    password: decodeURIComponent(m[2]),
    database: m[5],
    ssl: { rejectUnauthorized: false },
    connectTimeout: 20000,
  });
  return {
    query: (sql, params) => conn.query(sql, params) as Promise<[unknown[], unknown]>,
    end: () => conn.end(),
  };
}
