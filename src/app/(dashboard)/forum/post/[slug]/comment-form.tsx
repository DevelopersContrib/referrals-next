"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function CommentForm({ topicId }: { topicId: number }) {
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

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to post comment.");
        setLoading(false);
        return;
      }

      setAnswer("");
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
        {error && (
          <div className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            placeholder="Write your reply..."
            rows={4}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            required
          />
          <Button type="submit" size="sm" disabled={loading}>
            {loading ? "Posting..." : "Post Reply"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
