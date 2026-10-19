"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function FollowButton({
  topicId,
  following: initial,
}: {
  topicId: number;
  following: boolean;
}) {
  const router = useRouter();
  const [following, setFollowing] = useState(initial);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    try {
      const res = await fetch(`/api/forum/posts/${topicId}/follow`, {
        method: following ? "DELETE" : "POST",
      });
      if (res.ok) {
        setFollowing(!following);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant={following ? "outline" : "default"}
      size="sm"
      className="min-h-11"
      onClick={toggle}
      disabled={loading}
    >
      {following ? "Following" : "Follow"}
    </Button>
  );
}
