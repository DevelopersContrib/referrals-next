export const metadata = {
  title: "Blog - Referrals.com",
  description:
    "Expert insights on referral marketing, growth hacking, and word-of-mouth strategies to help you grow your business.",
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-w-0">{children}</div>;
}
