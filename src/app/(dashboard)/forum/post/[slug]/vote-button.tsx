"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function TopicVoteButton({
  topicId,
  voteCount,
}: {
  topicId: number;
  voteCount: number;
}) {
  const [count, setCount] = useState(voteCount);
  const [voted, setVoted] = useState(false);

  async function handleVote() {
    try {
      const res = await fetch(`/api/forum/posts/${topicId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vote: 1 }),
      });

      if (res.ok) {
        const data = await res.json();
        setCount(data.voteCount ?? count + 1);
        setVoted(true);
      }
    } catch {
      // silently fail
    }
  }

  return (
    <Button
      variant={voted ? "default" : "outline"}
      size="sm"
      onClick={handleVote}
      disabled={voted}
    >
      Upvote ({count})
    </Button>
  );
}
