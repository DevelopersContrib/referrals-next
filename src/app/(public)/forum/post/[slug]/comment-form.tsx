"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function CommentForm({
  topicId,
  signedIn,
  callbackPath,
}: {
  topicId: number;
  signedIn: boolean;
  callbackPath: string;
}) {
  const router = useRouter();
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/forum/posts/${topicId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to post comment.");
        setLoading(false);
        return;
      }

      setAnswer("");
      if (data.pending) {
        setError(
          data.message ||
            "Your first post is waiting for approval and will not appear publicly yet.",
        );
      }
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Leave a Reply</CardTitle>
      </CardHeader>
      <CardContent>
        {!signedIn ? (
          <p className="text-sm text-muted-foreground">
            <Link
              href={`/signin?callbackUrl=${encodeURIComponent(callbackPath)}`}
              className="font-medium text-blue-600 hover:underline"
            >
              Sign in
            </Link>{" "}
            to reply. Reading the forum does not require an account.
          </p>
        ) : null}
        {signedIn && error && (
          <div className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}
        {signedIn ? (
          <form onSubmit={handleSubmit} className="space-y-3">
            <label
              htmlFor="forum-reply"
              className="block text-sm font-medium text-gray-900"
            >
              Your reply
            </label>
            <Textarea
              id="forum-reply"
              aria-describedby="forum-reply-help"
              placeholder="Write your reply..."
              rows={4}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              required
            />
            <p id="forum-reply-help" className="text-sm text-muted-foreground">
              A new member&apos;s first post is reviewed before it appears.
            </p>
            <Button type="submit" size="sm" className="min-h-11" disabled={loading}>
              {loading ? "Posting..." : "Post Reply"}
            </Button>
          </form>
        ) : null}
      </CardContent>
    </Card>
  );
}
