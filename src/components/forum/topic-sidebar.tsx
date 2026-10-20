import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

export type RelatedTopic = {
  id: number;
  slug: string | null;
  title: string;
  replyCount: number;
};

export function AboutThisTopic({
  askedOn,
  lastActivity,
  viewCount,
  replyCount,
  categoryName,
  categoryHref,
}: {
  askedOn: Date;
  lastActivity: Date;
  viewCount: number;
  replyCount: number;
  categoryName: string | null;
  categoryHref: string | null;
}) {
  const rows: [string, React.ReactNode][] = [
    ["Asked", askedOn.toLocaleDateString()],
    ["Last activity", lastActivity.toLocaleDateString()],
    ["Views", viewCount],
    ["Replies", replyCount],
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">About this topic</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="space-y-2 text-sm">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-3">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="font-medium text-gray-900">{value}</dd>
            </div>
          ))}
          {categoryName ? (
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">Category</dt>
              <dd className="min-w-0">
                {categoryHref ? (
                  <Link
                    href={categoryHref}
                    className="inline-flex min-h-11 max-w-full items-center"
                  >
                    <Badge
                      variant="secondary"
                      className="max-w-full truncate text-xs"
                    >
                      {categoryName}
                    </Badge>
                  </Link>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    {categoryName}
                  </Badge>
                )}
              </dd>
            </div>
          ) : null}
        </dl>
      </CardContent>
    </Card>
  );
}

export function RelatedTopics({ topics }: { topics: RelatedTopic[] }) {
  if (topics.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Related topics</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1">
          {topics.map((t) => (
            <li key={t.id}>
              <Link
                href={`/forum/post/${t.slug || t.id}`}
                className="flex min-h-11 flex-col justify-center text-sm text-gray-900 hover:text-blue-600"
              >
                <span className="wrap-break-word font-medium">{t.title}</span>
                <span className="text-xs text-muted-foreground">
                  {t.replyCount} {t.replyCount === 1 ? "reply" : "replies"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

/**
 * Upsell for a reader who already has a brand sitting unpublished. Gated by
 * `shouldShowBrandPublishCta`, which hides it once the brand is live, so a
 * paying customer is never asked to pay again while reading the forum.
 *
 * Links to /billing only — publishing itself stays in the billing flow.
 */
export function ReadyToGoLive({ brandName }: { brandName: string | null }) {
  return (
    <Card className="border-[#7C3AED]/30 bg-violet-50">
      <CardHeader>
        <CardTitle className="text-base">Ready to go live?</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-gray-700">
          {brandName ? (
            <>
              <span className="font-medium">{brandName}</span> is set up but not
              taking signups yet. Publish it for $9/mo to start getting
              referrals.
            </>
          ) : (
            <>
              Your brand is set up but not taking signups yet. Publish it for
              $9/mo to start getting referrals.
            </>
          )}
        </p>
        <Link
          href="/billing"
          className={cn(buttonVariants({ size: "sm" }), "min-h-11 w-full")}
        >
          Go to billing
        </Link>
      </CardContent>
    </Card>
  );
}

/** Guests get the same slot, pointed at sign-in rather than billing. */
export function SignInCta({ callbackPath }: { callbackPath: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Join the discussion</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Sign in to reply, follow topics and upvote answers. Reading the forum
          does not require an account.
        </p>
        <Link
          href={`/signin?callbackUrl=${encodeURIComponent(callbackPath)}`}
          className={cn(buttonVariants({ size: "sm" }), "min-h-11 w-full")}
        >
          Sign in
        </Link>
        <Link
          href="/signup"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "min-h-11 w-full",
          )}
        >
          Create an account
        </Link>
      </CardContent>
    </Card>
  );
}
