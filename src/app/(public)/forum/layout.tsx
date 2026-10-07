export default function PublicForumLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">{children}</div>
  );
}
