"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCardIcon, Loader2Icon, LockIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type PayPalButtonsInstance = {
  render: (container: HTMLElement) => Promise<void>;
  close: () => void;
};

type PayPalNamespace = {
  Buttons: (options: Record<string, unknown>) => PayPalButtonsInstance;
};

declare global {
  interface Window {
    paypal?: PayPalNamespace;
  }
}

type CheckoutConfig = {
  attemptId: string;
  clientId: string;
  paypalPlanId: string;
  currency: string;
};

type Props = {
  planId: number;
  brandId?: number | null;
  priceLabel: string;
};

const SDK_SCRIPT_ID = "paypal-subscriptions-sdk";

function loadPayPalSdk(config: CheckoutConfig): Promise<PayPalNamespace> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("PayPal SDK requires a browser"));
  }
  if (window.paypal) return Promise.resolve(window.paypal);

  const params = new URLSearchParams({
    "client-id": config.clientId,
    vault: "true",
    intent: "subscription",
    currency: config.currency || "USD",
    components: "buttons",
    "enable-funding": "card",
    "disable-funding": "paylater,credit",
  });
  const src = `https://www.paypal.com/sdk/js?${params.toString()}`;

  return new Promise((resolve, reject) => {
    const existing = document.getElementById(SDK_SCRIPT_ID) as HTMLScriptElement | null;
    const onReady = () => {
      if (window.paypal) resolve(window.paypal);
      else reject(new Error("PayPal SDK loaded without a paypal namespace"));
    };

    if (existing) {
      existing.addEventListener("load", onReady, { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("PayPal SDK failed to load")),
        { once: true }
      );
      return;
    }

    const script = document.createElement("script");
    script.id = SDK_SCRIPT_ID;
    script.src = src;
    script.async = true;
    script.onload = onReady;
    script.onerror = () => reject(new Error("PayPal SDK failed to load"));
    document.body.appendChild(script);
  });
}

export function PayPalCheckout({ planId, brandId, priceLabel }: Props) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonsRef = useRef<PayPalButtonsInstance | null>(null);
  const attemptIdRef = useRef<string | null>(null);
  const terminalRef = useRef(false);
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">("loading");
  const [activating, setActivating] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const logClientEvent = useCallback(
    (
      eventName:
        | "sdk_ready"
        | "checkout_started"
        | "paypal_opened"
        | "approved"
        | "cancelled"
        | "abandoned"
        | "client_error",
      details?: {
        paypalSubscriptionId?: string;
        errorCode?: string;
        errorMessage?: string;
        metadata?: Record<string, string | number | boolean | null>;
      },
      beacon = false
    ) => {
      const attemptId = attemptIdRef.current;
      if (!attemptId) return;

      const body = JSON.stringify({
        attemptId,
        planId,
        eventName,
        ...details,
      });

      if (beacon && navigator.sendBeacon) {
        navigator.sendBeacon(
          "/api/billing/checkout-event",
          new Blob([body], { type: "application/json" })
        );
        return;
      }

      void fetch("/api/billing/checkout-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => {
        // Best effort only; checkout itself must continue.
      });
    },
    [planId]
  );

  const confirmSubscription = useCallback(
    async (subscriptionId: string) => {
      setActivating(true);
      try {
        const res = await fetch("/api/billing/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subscriptionId,
            planId,
            attemptId: attemptIdRef.current,
            ...(brandId ? { brandId } : {}),
          }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          redirectUrl?: string;
          error?: string;
        };

        if (!res.ok) {
          toast.error(data.error || "We could not activate your subscription.");
          terminalRef.current = false;
          setActivating(false);
          return;
        }

        terminalRef.current = true;
        toast.success("Subscription active — welcome to Growth.");
        router.push(data.redirectUrl || "/billing/success");
      } catch {
        toast.error("Network error while activating your subscription.");
        logClientEvent("client_error", {
          paypalSubscriptionId: subscriptionId,
          errorCode: "CONFIRM_NETWORK_ERROR",
          errorMessage: "Network error while confirming subscription",
        });
        terminalRef.current = true;
        setActivating(false);
      }
    },
    [brandId, logClientEvent, planId, router]
  );

  useEffect(() => {
    let cancelled = false;

    async function setup() {
      try {
        const query = new URLSearchParams({ planId: String(planId) });
        if (brandId) query.set("brandId", String(brandId));
        const res = await fetch(`/api/billing/checkout-config?${query.toString()}`);
        const data = (await res.json().catch(() => ({}))) as CheckoutConfig & {
          error?: string;
        };
        if (!res.ok || !data.clientId || !data.paypalPlanId) {
          if (!cancelled) setStatus("unavailable");
          return;
        }
        attemptIdRef.current = data.attemptId;

        const paypal = await loadPayPalSdk(data);
        if (cancelled || !containerRef.current) return;

        const buttons = paypal.Buttons({
          style: {
            layout: "vertical",
            shape: "rect",
            color: "gold",
            label: "subscribe",
            height: 48,
          },
          onClick: () => {
            logClientEvent("checkout_started", {
              metadata: { fundingOptions: "paypal_card" },
            });
          },
          createSubscription: (
            _data: unknown,
            actions: {
              subscription: { create: (o: Record<string, unknown>) => Promise<string> };
            }
          ) => {
            logClientEvent("paypal_opened");
            return actions.subscription.create({
              plan_id: data.paypalPlanId,
              custom_id: [
                `attempt:${data.attemptId}`,
                ...(brandId ? [`brand:${brandId}`] : []),
              ].join("|"),
            });
          },
          onApprove: (approval: { subscriptionID?: string }) => {
            if (approval.subscriptionID) {
              terminalRef.current = true;
              logClientEvent("approved", {
                paypalSubscriptionId: approval.subscriptionID,
              });
              void confirmSubscription(approval.subscriptionID);
            }
          },
          onCancel: () => {
            terminalRef.current = true;
            logClientEvent("cancelled");
            toast.info("Checkout cancelled — you have not been charged.");
          },
          onError: (err: unknown) => {
            console.error("[billing] PayPal buttons error:", err);
            terminalRef.current = true;
            logClientEvent("client_error", {
              errorCode: "PAYPAL_BUTTON_ERROR",
              errorMessage: err instanceof Error ? err.message : String(err),
            });
            toast.error("PayPal could not complete checkout. Please try again.");
          },
        });

        buttonsRef.current = buttons;
        await buttons.render(containerRef.current);
        logClientEvent("sdk_ready");
        if (!cancelled) setStatus("ready");
      } catch (error) {
        console.error("[billing] PayPal checkout setup failed:", error);
        logClientEvent("client_error", {
          errorCode: "PAYPAL_SDK_SETUP_ERROR",
          errorMessage: error instanceof Error ? error.message : String(error),
        });
        if (!cancelled) setStatus("unavailable");
      }
    }

    void setup();

    return () => {
      cancelled = true;
      try {
        buttonsRef.current?.close();
      } catch {
        /* buttons already torn down */
      }
      buttonsRef.current = null;
    };
  }, [brandId, confirmSubscription, logClientEvent, planId]);

  useEffect(() => {
    const markAbandoned = () => {
      if (!terminalRef.current && attemptIdRef.current) {
        terminalRef.current = true;
        logClientEvent(
          "abandoned",
          { metadata: { reason: "page_hidden_before_completion" } },
          true
        );
      }
    };
    window.addEventListener("pagehide", markAbandoned);
    return () => window.removeEventListener("pagehide", markAbandoned);
  }, [logClientEvent]);

  async function handleRedirectCheckout() {
    setRedirecting(true);
    logClientEvent("checkout_started", {
      metadata: { fundingOptions: "paypal_hosted_fallback" },
    });
    try {
      const res = await fetch("/api/billing/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          attemptId: attemptIdRef.current,
          ...(brandId ? { brandId } : {}),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        approvalUrl?: string;
        error?: string;
      };
      if (data.approvalUrl) {
        terminalRef.current = true;
        window.location.href = data.approvalUrl;
        return;
      }
      logClientEvent("client_error", {
        errorCode: "REDIRECT_CHECKOUT_FAILED",
        errorMessage: data.error || "Could not start PayPal checkout",
      });
      toast.error(data.error || "Could not start PayPal checkout.");
    } catch {
      logClientEvent("client_error", {
        errorCode: "REDIRECT_NETWORK_ERROR",
        errorMessage: "Network error starting redirect checkout",
      });
      toast.error("Could not start PayPal checkout.");
    }
    setRedirecting(false);
  }

  return (
    <div className="w-full">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-[#575962]">
        <CreditCardIcon className="size-4 shrink-0 text-brand" />
        <span>Pay with card or your PayPal account</span>
      </div>

      <div className="relative">
        <div
          ref={containerRef}
          className={`w-full ${status === "ready" ? "" : "min-h-[112px]"}`}
        />

        {status === "loading" && (
          <div className="absolute inset-0 flex flex-col gap-2" aria-hidden>
            <div className="h-12 w-full animate-pulse rounded-md bg-gray-100" />
            <div className="h-12 w-full animate-pulse rounded-md bg-gray-100" />
          </div>
        )}
      </div>

      {status === "unavailable" && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Secure checkout opens on PayPal, where you can pay with a card or your
            PayPal balance.
          </p>
          <Button
            type="button"
            onClick={handleRedirectCheckout}
            disabled={redirecting}
            className="min-h-12 w-full bg-brand text-base font-semibold hover:bg-brand-hover"
          >
            {redirecting && <Loader2Icon className="size-4 animate-spin" />}
            {redirecting ? "Opening PayPal…" : `Continue to PayPal — ${priceLabel}`}
          </Button>
        </div>
      )}

      {activating && (
        <p className="mt-3 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2Icon className="size-4 animate-spin" />
          Activating your subscription…
        </p>
      )}

      <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
        <LockIcon className="mt-0.5 size-3.5 shrink-0" />
        <span>
          Payments are processed by PayPal. Card details never touch our servers.
          Cancel anytime from Billing.
        </span>
      </p>
    </div>
  );
}
