import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { DigestToggle } from "@/components/forum/digest-toggle";

export type SidebarCategory = {
  id: number;
  name: string | null;
  slug: string | null;
  description: string | null;
};

/**
 * Categories have no colour of their own in the database, so each one gets a
 * stable swatch from its slug. Hashing the slug rather than using the row order
 * keeps a category the same colour after another is added or re-sorted.
 */
const SWATCHES = [
  "#D63A40",
  "#7C3AED",
  "#0F766E",
  "#B45309",
  "#1D4ED8",
  "#BE185D",
];

function swatchFor(category: SidebarCategory) {
  const key = category.slug || category.name || String(category.id);
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) % 997;
  }
  return SWATCHES[hash % SWATCHES.length];
}

function NewHereCard() {
  const links = [
    { href: "/support", label: "Help Center" },
    { href: "/forum/getting-started", label: "Getting started" },
    { href: "/pricing", label: "Pricing" },
  ];

  return (
    <Card className="border-gray-800 bg-gray-900 text-white">
      <CardHeader>
        <CardTitle className="text-base text-white">New here?</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-gray-300">
          Ask anything about referral programs, campaigns and rewards. The team
          reads every thread.
        </p>
        <ul className="space-y-1">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="flex min-h-11 items-center text-sm text-gray-200 underline-offset-4 hover:text-white hover:underline"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
        <Link
          href="/forum/new"
          className={cn(buttonVariants({ size: "sm" }), "min-h-11 w-full")}
        >
          Ask a question
        </Link>
      </CardContent>
    </Card>
  );
}

function CategoriesCard({
  categories,
  activeSlug,
  hrefFor,
}: {
  categories: SidebarCategory[];
  activeSlug: string | null;
  hrefFor: (slug: string | null) => string;
}) {
  if (categories.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Categories</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1">
          {categories.map((category) => {
            const active = activeSlug === category.slug;
            return (
              <li key={category.id}>
                <Link
                  href={hrefFor(category.slug)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-11 items-start gap-3 rounded-md px-2 py-2",
                    active ? "bg-muted" : "hover:bg-muted",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className="mt-0.5 size-3 shrink-0 rounded-sm"
                    style={{ backgroundColor: swatchFor(category) }}
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-gray-900">
                      {category.name || "Untitled"}
                    </span>
                    {category.description ? (
                      <span className="block text-xs text-muted-foreground">
                        {category.description}
                      </span>
                    ) : null}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}

function ShowYourCampaignCard({ href }: { href: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Show your campaign</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Launched something you are proud of? Post it and get feedback from
          other members.
        </p>
        <Link
          href={href}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "min-h-11 w-full",
          )}
        >
          Share your campaign
        </Link>
      </CardContent>
    </Card>
  );
}

function DigestCard({ enabled }: { enabled: boolean }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Weekly digest</CardTitle>
      </CardHeader>
      <CardContent>
        <DigestToggle enabled={enabled} />
      </CardContent>
    </Card>
  );
}

export function ForumSidebar({
  categories,
  activeSlug,
  hrefFor,
  showCampaignHref,
  digest,
}: {
  categories: SidebarCategory[];
  activeSlug: string | null;
  hrefFor: (slug: string | null) => string;
  showCampaignHref: string | null;
  digest: { signedIn: boolean; enabled: boolean };
}) {
  return (
    <div className="space-y-6">
      <NewHereCard />
      <CategoriesCard
        categories={categories}
        activeSlug={activeSlug}
        hrefFor={hrefFor}
      />
      {showCampaignHref ? (
        <ShowYourCampaignCard href={showCampaignHref} />
      ) : null}
      {digest.signedIn ? <DigestCard enabled={digest.enabled} /> : null}
    </div>
  );
}
