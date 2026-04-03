import type { Integration, IntegrationResult } from "./base";

interface MailchimpList {
  id: string;
  name: string;
  member_count: number;
}

interface MailchimpSubscriber {
  email_address: string;
  status: string;
  merge_fields: Record<string, string>;
}

/**
 * MailChimp API wrapper for the Referrals.com integration.
 * Uses MailChimp Marketing API v3.
 */
export class MailchimpIntegration implements Integration {
  name = "MailChimp";
  private apiKey: string;
  private server: string; // datacenter prefix, e.g. "us1"

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    // MailChimp API keys end with "-usX" where X is the datacenter
    const parts = apiKey.split("-");
    this.server = parts[parts.length - 1] || "us1";
  }

  private get baseUrl() {
    return `https://${this.server}.api.mailchimp.com/3.0`;
  }

  private get headers() {
    return {
      Authorization: `apikey ${this.apiKey}`,
      "Content-Type": "application/json",
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      const resp = await fetch(`${this.baseUrl}/ping`, {
        headers: this.headers,
      });
      return resp.ok;
    } catch {
      return false;
    }
  }

  async disconnect(): Promise<void> {
    // MailChimp doesn't have a disconnect endpoint.
    // The API key should be removed from the database by the caller.
  }

  /**
   * Get all audience lists
   */
  async getLists(): Promise<IntegrationResult<MailchimpList[]>> {
    try {
      const resp = await fetch(`${this.baseUrl}/lists?count=100`, {
        headers: this.headers,
      });

      if (!resp.ok) {
        const err = await resp.json();
        return { success: false, error: err.detail || "Failed to fetch lists" };
      }

      const data = await resp.json();
      const lists: MailchimpList[] = data.lists.map(
        (list: { id: string; name: string; stats: { member_count: number } }) => ({
          id: list.id,
          name: list.name,
          member_count: list.stats.member_count,
        })
      );

      return { success: true, data: lists };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Add a subscriber to a list
   */
  async addSubscriber(
    listId: string,
    email: string,
    firstName?: string,
    lastName?: string
  ): Promise<IntegrationResult<MailchimpSubscriber>> {
    try {
      const body: Record<string, unknown> = {
        email_address: email,
        status: "subscribed",
        merge_fields: {},
      };

      if (firstName) {
        (body.merge_fields as Record<string, string>).FNAME = firstName;
      }
      if (lastName) {
        (body.merge_fields as Record<string, string>).LNAME = lastName;
      }

      const resp = await fetch(`${this.baseUrl}/lists/${listId}/members`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify(body),
      });

      if (!resp.ok) {
        const err = await resp.json();
        // Member already exists is not a hard error
        if (err.title === "Member Exists") {
          return {
            success: true,
            data: {
              email_address: email,
              status: "subscribed",
              merge_fields: body.merge_fields as Record<string, string>,
            },
          };
        }
        return { success: false, error: err.detail || "Failed to add subscriber" };
      }

      const data = await resp.json();
      return {
        success: true,
        data: {
          email_address: data.email_address,
          status: data.status,
          merge_fields: data.merge_fields,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get members of a list
   */
  async getListMembers(
    listId: string,
    count = 100,
    offset = 0
  ): Promise<IntegrationResult<MailchimpSubscriber[]>> {
    try {
      const resp = await fetch(
        `${this.baseUrl}/lists/${listId}/members?count=${count}&offset=${offset}`,
        { headers: this.headers }
      );

      if (!resp.ok) {
        const err = await resp.json();
        return { success: false, error: err.detail || "Failed to fetch members" };
      }

      const data = await resp.json();
      const members: MailchimpSubscriber[] = data.members.map(
        (m: { email_address: string; status: string; merge_fields: Record<string, string> }) => ({
          email_address: m.email_address,
          status: m.status,
          merge_fields: m.merge_fields,
        })
      );

      return { success: true, data: members };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
