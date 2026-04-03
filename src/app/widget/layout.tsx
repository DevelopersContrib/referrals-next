import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Referral Widget",
};

/**
 * Minimal layout for widget pages.
 * No dashboard shell, no header/footer — just renders children.
 * This allows widget pages to be embedded in iframes cleanly.
 */
export default function WidgetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
