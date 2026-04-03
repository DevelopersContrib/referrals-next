import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function ReviewsToolPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  const memberId = parseInt(session.user.id, 10);

  const reviews = await prisma.reviews.findMany({
    where: { member_id: memberId },
    orderBy: { date_updated: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reviews</h1>
        <p className="mt-1 text-muted-foreground">
          View and manage customer reviews for your brand.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Reviews</CardTitle>
          <CardDescription>
            Reviews submitted by you. Pending reviews are awaiting admin
            approval.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No reviews yet.
            </p>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="flex items-start gap-4 rounded-lg border p-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {"*".repeat(review.rating)}{" "}
                        <span className="text-muted-foreground">
                          ({review.rating}/5)
                        </span>
                      </span>
                      <Badge
                        variant={review.approved ? "default" : "secondary"}
                      >
                        {review.approved ? "Approved" : "Pending"}
                      </Badge>
                    </div>
                    {review.message && (
                      <p className="mt-2 text-sm text-gray-600">
                        {review.message}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(review.date_updated).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
