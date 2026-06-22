export type AgentCapability = {
  name: string;
  description: string;
  endpoint: string;
  method: "GET" | "POST";
};

export const agentCapabilities: AgentCapability[] = [
  {
    name: "List brands",
    description: "List all brands for the authenticated member.",
    endpoint: "/api/v1/brands",
    method: "GET",
  },
  {
    name: "Create brand",
    description: "Create a new brand for the authenticated member.",
    endpoint: "/api/v1/brands",
    method: "POST",
  },
  {
    name: "List campaigns",
    description: "List referral campaigns, optionally filtered by brand.",
    endpoint: "/api/v1/campaigns",
    method: "GET",
  },
  {
    name: "Create campaign",
    description: "Create a new referral campaign under a brand.",
    endpoint: "/api/v1/campaigns",
    method: "POST",
  },
  {
    name: "List participants",
    description: "List participants across campaigns for the authenticated member.",
    endpoint: "/api/v1/participants",
    method: "GET",
  },
  {
    name: "Campaign stats",
    description: "Retrieve performance statistics for a specific campaign.",
    endpoint: "/api/v1/campaigns/:id/stats",
    method: "GET",
  },
  {
    name: "Member profile",
    description: "Retrieve the authenticated member's profile information.",
    endpoint: "/api/v1/members/profile",
    method: "GET",
  },
  {
    name: "Public plans",
    description: "Read available billing plans and pricing metadata.",
    endpoint: "/api/v1/billing/plans",
    method: "GET",
  },
  {
    name: "Developer docs",
    description: "Access developer documentation and integration guidance.",
    endpoint: "/developer/docs",
    method: "GET",
  },
  {
    name: "Create signups",
    description: "Submit signup records to referral campaigns.",
    endpoint: "/api/v1/signups",
    method: "POST",
  },
];

