import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

type EmptyAction = { href: string; label: string };

/**
 * What the forum shows when a list comes back with nothing in it.
 *
 * Every case gets a way out. A bare "nothing here" leaves the reader unable to
 * tell a dead forum from a filter they set themselves two clicks ago, and with
 * no idea which of the two to fix.
 *
 * `/forum/new` is safe to offer to signed-out readers: it redirects to
 * /signin with a callbackUrl back to the composer.
 */
export function ForumEmptyState({
  title,
  description,
  action,
  secondaryAction,
}: {
  title: string;
  description: string;
  action?: EmptyAction;
  secondaryAction?: EmptyAction;
}) {
  return (
    <div className="px-4 py-12 text-center">
      <p className="font-heading text-base font-semibold text-gray-900">
        {title}
      </p>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
        {description}
      </p>
      {action || secondaryAction ? (
        <div className="mt-5 flex flex-col items-center justify-center gap-2 sm:flex-row">
          {action ? (
            <Link
              href={action.href}
              className={cn(buttonVariants(), "min-h-11 w-full px-4 sm:w-auto")}
            >
              {action.label}
            </Link>
          ) : null}
          {secondaryAction ? (
            <Link
              href={secondaryAction.href}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "min-h-11 w-full px-4 sm:w-auto",
              )}
            >
              {secondaryAction.label}
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
