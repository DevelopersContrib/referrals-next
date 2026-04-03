import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function TestimonialsToolPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  const memberId = parseInt(session.user.id, 10);

  const testimonials = await prisma.testimonials.findMany({
    where: { member_id: memberId },
    orderBy: { date_updated: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Testimonials</h1>
        <p className="mt-1 text-muted-foreground">
          Manage testimonials to build trust and social proof.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Testimonials</CardTitle>
          <CardDescription>
            Testimonials you have submitted. Pending ones await admin approval.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {testimonials.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No testimonials yet.
            </p>
          ) : (
            <div className="space-y-4">
              {testimonials.map((testimonial) => (
                <div
                  key={testimonial.id}
                  className="rounded-lg border p-4"
                >
                  <div className="flex items-center justify-between">
                    <Badge
                      variant={testimonial.approved ? "default" : "secondary"}
                    >
                      {testimonial.approved ? "Approved" : "Pending"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(
                        testimonial.date_updated
                      ).toLocaleDateString()}
                    </span>
                  </div>
                  {testimonial.message && (
                    <p className="mt-3 text-sm text-gray-600">
                      &ldquo;{testimonial.message}&rdquo;
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
