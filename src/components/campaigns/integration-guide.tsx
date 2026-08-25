"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  buildCampaignEmbedSnippets,
  trimEmbedBase,
} from "@/lib/campaign-embed-snippets";
import {
  Code2Icon,
  SquareCodeIcon,
  ServerIcon,
  ShoppingBagIcon,
  GlobeIcon,
  Share2Icon,
  NetworkIcon,
  CopyIcon,
  CheckIcon,
  ExternalLinkIcon,
  SlidersHorizontalIcon,
  type LucideIcon,
} from "lucide-react";

interface IntegrationGuideProps {
  brandId: string;
  campaignId: number;
  baseUrl: string;
  publicUrl: string;
  /** This campaign's brand domain — used as the `from` for network referrals. */
  brandDomain?: string;
}

type IntegrationDef = {
  id: string;
  label: string;
  icon: LucideIcon;
  tint: string;
  tagline: string;
  recommended?: boolean;
  blurb: ReactNode;
  steps: ReactNode[];
  code?: string;
  codeLabel?: string;
  copyLabel?: string;
  docHref?: string;
};

export function IntegrationGuide({
  brandId,
  campaignId,
  baseUrl,
  publicUrl,
  brandDomain,
}: IntegrationGuideProps) {
  const snippets = useMemo(
    () => buildCampaignEmbedSnippets(baseUrl, campaignId),
    [baseUrl, campaignId],
  );
  const widgetHref = `/brands/${brandId}/campaigns/${campaignId}/widget`;
  const root = trimEmbedBase(baseUrl || "https://referrals.com");
  const fromDomain = (brandDomain || "")
    .trim()
    .toLowerCase()
    .replace(/^www\./, "");
  const networkApi = `${root}/api/domain-refer?from=${fromDomain || "yourdomain.com"}&to=TARGET-DOMAIN.com`;

  const integrations = useMemo<IntegrationDef[]>(
    () => [
      {
        id: "javascript",
        label: "JavaScript",
        icon: Code2Icon,
        tint: "text-amber-500 bg-amber-500/10",
        tagline: "One script tag",
        recommended: true,
        blurb: (
          <>
            The recommended install. One script tag loads your configuration and
            injects the widget (embed, popup, or floating) based on your{" "}
            <Link
              href={widgetHref}
              className="font-medium text-brand underline-offset-2 hover:underline"
            >
              widget settings
            </Link>
            .
          </>
        ),
        steps: [
          "Copy the snippet below.",
          "Paste it into your site where you want the widget to appear (or anywhere in the page for popup / floating placements).",
          "Publish. The widget updates automatically whenever you change your widget settings — no re-embedding needed.",
        ],
        code: snippets.js,
        codeLabel: "HTML",
      },
      {
        id: "network",
        label: "Refer another site",
        icon: NetworkIcon,
        tint: "text-fuchsia-500 bg-fuchsia-500/10",
        tagline: "Earn $5 per lead",
        blurb: (
          <>
            Earn{" "}
            <strong className="font-medium text-foreground">
              $5 in tokens
            </strong>{" "}
            every time you send a visitor to another domain in the network and
            they sign up. Turn any outbound link into an attributed referral
            link — mint one on demand from the API below (<code>from</code> =
            your domain, <code>to</code> = the site you&rsquo;re linking to).
          </>
        ),
        steps: [
          "Call the API below — from is your domain, to is the network domain you want to link to.",
          "It returns a tracking link (/t/…). Use that instead of a plain link to that site.",
          "When a visitor you send there signs up, you earn $5 in tokens — attributed to your domain automatically.",
          "The reward is ledgered now and minted to your wallet later (domain token if minted, else ADAO).",
        ],
        code: networkApi,
        codeLabel: "Referral link API (GET)",
        copyLabel: "Copy URL",
      },
      {
        id: "iframe",
        label: "Embed (iframe)",
        icon: SquareCodeIcon,
        tint: "text-sky-500 bg-sky-500/10",
        tagline: "No JavaScript",
        blurb:
          "Paste anywhere HTML is accepted — landing pages, CMS blocks, and static pages. No JavaScript required.",
        steps: [
          "Copy the iframe snippet below.",
          "Paste it into any HTML block on your page.",
          "Adjust the height attribute if your widget needs more room.",
        ],
        code: snippets.iframe,
        codeLabel: "HTML",
      },
      {
        id: "node",
        label: "Node.js",
        icon: ServerIcon,
        tint: "text-emerald-500 bg-emerald-500/10",
        tagline: "Server-rendered",
        blurb: (
          <>
            Server-rendered apps (Express / Fastify / Koa): serve a page that
            includes the loader script. For Next.js / React, use the{" "}
            <strong className="font-medium text-foreground">JavaScript</strong>{" "}
            snippet inside a client component.
          </>
        ),
        steps: [
          "Add the route below to your Express app.",
          "Run node server.js and open /refer.",
          "The widget renders per your widget settings.",
        ],
        code: snippets.node,
        codeLabel: "server.js",
      },
      {
        id: "shopify",
        label: "Shopify",
        icon: ShoppingBagIcon,
        tint: "text-lime-600 bg-lime-500/10",
        tagline: "Theme editor",
        blurb:
          "Add the referral widget to your storefront using a Custom Liquid section — no theme code editing required.",
        steps: [
          "In Shopify admin, go to Online Store → Themes → Customize.",
          "Choose the page (e.g. your homepage or a dedicated 'Refer a friend' page) and click Add section → Custom Liquid.",
          "Paste the JavaScript snippet below into the Custom Liquid box.",
          "Save. For a popup or floating widget, place the same snippet in Theme settings → theme.liquid before </body>.",
        ],
        code: snippets.js,
        codeLabel: "Custom Liquid",
        docHref:
          "https://help.shopify.com/en/manual/online-store/themes/theme-structure/extend/edit-theme-code",
      },
      {
        id: "wordpress",
        label: "WordPress",
        icon: GlobeIcon,
        tint: "text-blue-600 bg-blue-500/10",
        tagline: "Block or plugin",
        blurb:
          "Drop the widget into any page or post with a Custom HTML block, or load it site-wide with a headers/footers plugin.",
        steps: [
          "Edit the page or post where you want the widget.",
          "Add a Custom HTML block (Gutenberg) or switch the Classic editor to the Text tab.",
          "Paste the JavaScript snippet below and update.",
          "To show it site-wide (popup / floating), use a plugin like 'WPCode' or 'Insert Headers and Footers' and paste the snippet in the footer.",
        ],
        code: snippets.js,
        codeLabel: "Custom HTML",
      },
      {
        id: "facebook",
        label: "Facebook",
        icon: Share2Icon,
        tint: "text-[#1877f2] bg-[#1877f2]/10",
        tagline: "Share the link",
        blurb:
          "Facebook blocks custom scripts on Pages, so promote your public campaign page link instead — it works great as a button, pinned post, or bio link.",
        steps: [
          "Copy your public campaign link below.",
          "On your Facebook Page, click the action button (e.g. 'Sign Up' / 'Learn More') and paste the link.",
          "Create a post announcing your referral program with the link, then pin it to the top of your Page.",
          "Add the link to your Page's About / bio section for lasting visibility.",
        ],
        code: publicUrl,
        codeLabel: "Public campaign link",
        copyLabel: "Copy link",
      },
    ],
    [snippets, widgetHref, publicUrl, networkApi],
  );

  // Starts on the default so server and client markup agree; the hash effect
  // below switches to the deep-linked panel right after mount.
  const [activeId, setActiveId] = useState("javascript");
  const [copied, setCopied] = useState(false);
  const railRef = useRef<HTMLElement>(null);
  const active = integrations.find((i) => i.id === activeId) ?? integrations[0];
  const ActiveIcon = active.icon;
  const knownIds = useMemo(
    () => new Set(integrations.map((i) => i.id)),
    [integrations],
  );

  // #integrations/iframe (or /embed) opens the Embed tab from Install / embed.
  useEffect(() => {
    const apply = () => {
      const raw = window.location.hash.replace(/^#/, "");
      const [tab, sub] = raw.split("/");
      if (tab !== "integrations") return;
      if (!sub) {
        setActiveId("javascript");
        return;
      }
      const id = sub === "embed" ? "iframe" : sub;
      if (knownIds.has(id)) setActiveId(id);
    };
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, [knownIds]);

  // Below lg the rail is a horizontal scroller, so a deep-linked panel can sit
  // off-screen. Bring it into view without moving the page vertically.
  useEffect(() => {
    const rail = railRef.current;
    if (!rail || rail.scrollWidth <= rail.clientWidth) return;
    const item = rail.querySelector<HTMLElement>(
      `[data-rail-id="${activeId}"]`,
    );
    if (!item) return;
    rail.scrollTo({
      left: Math.max(
        0,
        item.offsetLeft - (rail.clientWidth - item.offsetWidth) / 2,
      ),
      behavior: "smooth",
    });
  }, [activeId]);

  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy — select the text manually");
    }
  }, []);

  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,220px)_minmax(0,1fr)]">
      {/* Left rail — integration types. Scrolls inside itself below lg. */}
      <nav
        ref={railRef}
        aria-label="Integration types"
        className="-mx-1 flex min-w-0 max-w-full snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0 [&::-webkit-scrollbar]:hidden"
      >
        {integrations.map((item) => {
          const Icon = item.icon;
          const isActive = item.id === activeId;
          return (
            <button
              key={item.id}
              type="button"
              data-rail-id={item.id}
              onClick={() => {
                setActiveId(item.id);
                setCopied(false);
                history.replaceState(null, "", `#integrations/${item.id}`);
              }}
              aria-pressed={isActive}
              className={cn(
                "group flex shrink-0 snap-start items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all lg:w-full lg:snap-align-none",
                isActive
                  ? "border-brand/40 bg-brand/5 shadow-sm"
                  : "border-[#ebeef0] bg-white hover:border-brand/30 hover:bg-brand/5",
              )}
            >
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-105",
                  item.tint,
                )}
              >
                <Icon className="size-5" />
              </span>
              <span className="min-w-0">
                <span
                  className={cn(
                    "flex items-center gap-1.5 text-sm font-semibold",
                    isActive ? "text-brand" : "text-[#575962]",
                  )}
                >
                  {item.label}
                  {item.recommended && (
                    <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-700">
                      Best
                    </span>
                  )}
                </span>
                <span className="block truncate text-xs text-[#a7abc3]">
                  {item.tagline}
                </span>
              </span>
            </button>
          );
        })}
      </nav>

      {/* Right panel — how-to */}
      <div className="portlet min-w-0 max-w-full">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "flex size-11 items-center justify-center rounded-xl",
                active.tint,
              )}
            >
              <ActiveIcon className="size-5" />
            </span>
            <div>
              <h3 className="flex items-center gap-2 text-lg font-bold text-[#464457]">
                {active.label}
                {active.recommended && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                    Recommended
                  </span>
                )}
              </h3>
              <p className="text-xs text-[#a7abc3]">{active.tagline}</p>
            </div>
          </div>
          <Link
            href={widgetHref}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#ebeef0] px-3 py-1.5 text-xs font-semibold text-[#575962] transition-colors hover:border-brand/30 hover:text-brand"
          >
            <SlidersHorizontalIcon className="size-3.5" />
            Widget settings
          </Link>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-[#6b6e82] [&_a]:text-brand">
          {active.blurb}
        </p>

        {/* Steps */}
        <ol className="mt-5 space-y-3">
          {active.steps.map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">
                {i + 1}
              </span>
              <span className="pt-0.5 text-sm text-[#575962]">{step}</span>
            </li>
          ))}
        </ol>

        {/* Code / link — the label and Copy sit in a header bar so the button
            never covers the snippet once the column narrows. */}
        {active.code && (
          <div className="mt-5 min-w-0 max-w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-950 shadow-inner">
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 px-3 py-2">
              <p className="min-w-0 truncate text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                {active.codeLabel ?? "Snippet"}
              </p>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="h-8 shrink-0 gap-1.5 border border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700"
                onClick={() => copy(active.code!)}
              >
                {copied ? (
                  <CheckIcon className="size-3.5" />
                ) : (
                  <CopyIcon className="size-3.5" />
                )}
                {copied ? "Copied" : (active.copyLabel ?? "Copy")}
              </Button>
            </div>
            <pre className="max-h-[min(60vh,400px)] max-w-full overflow-auto overscroll-x-contain p-4 text-xs leading-relaxed text-slate-100 sm:text-sm">
              <code className="block">{active.code}</code>
            </pre>
          </div>
        )}

        {active.docHref && (
          <a
            href={active.docHref}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand underline-offset-2 hover:underline"
          >
            View official docs
            <ExternalLinkIcon className="size-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}
