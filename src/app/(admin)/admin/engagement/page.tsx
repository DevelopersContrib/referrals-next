import { auth } from "@/lib/auth";
import { emailConfigured } from "@/lib/mail-send";
import {
  getRfEngagementBrowse,
  getRfEngagementStatus,
} from "@/lib/engagement";
import { listSegments } from "@/lib/engagement-segments";
import EngagementClient from "@/components/engagement/EngagementClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Emails & AI | Admin" };

export default async function AdminEngagementPage() {
  const session = await auth();
  const [engagement, browse, segments] = await Promise.all([
    getRfEngagementStatus(),
    getRfEngagementBrowse(),
    listSegments().catch(() => []),
  ]);

  const user = session?.user as { email?: string | null } | undefined;

  return (
    <EngagementClient
      status={{
        hasAwsKeys: emailConfigured(),
        autoresponderEnabled: process.env.SUPPORT_AUTORESPONDER === "1",
      }}
      engagement={engagement}
      browse={browse}
      initialSegments={segments}
      defaultEmail={user?.email?.trim() || ""}
    />
  );
}
