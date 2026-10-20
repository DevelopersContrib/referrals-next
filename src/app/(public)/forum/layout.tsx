export const dynamic = "force-dynamic";

export default function PublicForumLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Wide enough for the topic list and the sidebar to sit side by side; at
    // max-w-5xl the list was squeezed to 632px once the sidebar landed.
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">{children}</div>
  );
}
