import { ApiError, Client, Environment, OrdersController, LogLevel } from "@paypal/paypal-server-sdk";

const client = new Client({
  clientCredentialsAuthCredentials: {
    oAuthClientId: process.env.PAYPAL_CLIENT_ID!,
    oAuthClientSecret: process.env.PAYPAL_CLIENT_SECRET!,
  },
  environment:
    process.env.PAYPAL_MODE === "live"
      ? Environment.Production
      : Environment.Sandbox,
  logging: {
    logLevel: LogLevel.Info,
    logRequest: { logBody: true },
    logResponse: { logHeaders: true },
  },
});

const ordersController = new OrdersController(client);

export { client, ordersController, ApiError };

export async function createSubscriptionPlan(planName: string, amount: string, interval: "MONTH" | "YEAR" = "MONTH") {
  // PayPal Subscriptions API - create billing plan
  const response = await fetch(
    `${getPayPalApiBaseUrl()}/v1/billing/plans`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${await getAccessToken()}`,
      },
      body: JSON.stringify({
        product_id: await getOrCreateProduct(),
        name: planName,
        billing_cycles: [
          {
            frequency: { interval_unit: interval, interval_count: 1 },
            tenure_type: "REGULAR",
            sequence: 1,
            total_cycles: 0,
            pricing_scheme: {
              fixed_price: { value: amount, currency_code: "USD" },
            },
          },
        ],
        payment_preferences: {
          auto_bill_outstanding: true,
          payment_failure_threshold: 3,
        },
      }),
    }
  );

  return response.json();
}

export async function createSubscription(
  planId: string,
  returnUrl: string,
  cancelUrl: string,
  customId?: string
) {
  const response = await fetch(
    `${getPayPalApiBaseUrl()}/v1/billing/subscriptions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${await getAccessToken()}`,
      },
      body: JSON.stringify({
        plan_id: planId,
        ...(customId ? { custom_id: customId } : {}),
        application_context: {
          brand_name: "Referrals.com",
          return_url: returnUrl,
          cancel_url: cancelUrl,
          user_action: "SUBSCRIBE_NOW",
        },
      }),
    }
  );

  return response.json();
}

export async function cancelSubscription(subscriptionId: string, reason: string = "Customer requested cancellation") {
  const response = await fetch(
    `${getPayPalApiBaseUrl()}/v1/billing/subscriptions/${subscriptionId}/cancel`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${await getAccessToken()}`,
      },
      body: JSON.stringify({ reason }),
    }
  );

  if (response.status === 204) return { success: true };
  return response.json();
}

export async function getSubscription(subscriptionId: string) {
  const response = await fetch(
    `${getPayPalApiBaseUrl()}/v1/billing/subscriptions/${subscriptionId}`,
    {
      headers: {
        Authorization: `Bearer ${await getAccessToken()}`,
      },
    }
  );

  return response.json();
}

function getPayPalApiBaseUrl(): string {
  return process.env.PAYPAL_MODE === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

export interface PayPalWebhookHeaders {
  transmissionId: string;
  transmissionTime: string;
  transmissionSig: string;
  certUrl: string;
  authAlgo: string;
}

export async function verifyWebhookSignature(
  headers: PayPalWebhookHeaders,
  webhookEvent: unknown
): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) {
    console.error("PAYPAL_WEBHOOK_ID is not configured");
    return false;
  }

  const response = await fetch(
    `${getPayPalApiBaseUrl()}/v1/notifications/verify-webhook-signature`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${await getAccessToken()}`,
      },
      body: JSON.stringify({
        auth_algo: headers.authAlgo,
        cert_url: headers.certUrl,
        transmission_id: headers.transmissionId,
        transmission_sig: headers.transmissionSig,
        transmission_time: headers.transmissionTime,
        webhook_id: webhookId,
        webhook_event: webhookEvent,
      }),
    }
  );

  if (!response.ok) {
    console.error(
      "PayPal webhook verification request failed:",
      response.status,
      await response.text()
    );
    return false;
  }

  const data = (await response.json()) as { verification_status?: string };
  return data.verification_status === "SUCCESS";
}

async function getAccessToken(): Promise<string> {
  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString("base64");

  const response = await fetch(
    `${getPayPalApiBaseUrl()}/v1/oauth2/token`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    }
  );

  const data = await response.json();
  return data.access_token;
}

async function getOrCreateProduct(): Promise<string> {
  // In production, store this product ID in env or database
  const productId = process.env.PAYPAL_PRODUCT_ID;
  if (productId) return productId;

  const response = await fetch(
    `${getPayPalApiBaseUrl()}/v1/catalogs/products`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${await getAccessToken()}`,
      },
      body: JSON.stringify({
        name: "Referrals.com Subscription",
        type: "SERVICE",
        category: "SOFTWARE",
      }),
    }
  );

  const data = await response.json();
  return data.id;
}
