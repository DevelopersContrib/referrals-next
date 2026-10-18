import { redirect } from "next/navigation";

/** Old address; the subdomain and custom domain settings live on White label now. */
export default async function SubdomainPage({ params }: { params: Promise<{ brandId: string }> }) {
  const { brandId } = await params;
  redirect(`/brands/${brandId}/white-label`);
}
