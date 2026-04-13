export type AgentCapability = {
  name: string;
  description: string;
  endpoint: string;
  method: "GET" | "POST";
};

export const agentCapabilities: AgentCapability[] = [
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

