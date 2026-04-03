import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function BannersToolPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Banner Management</h1>
        <p className="mt-1 text-muted-foreground">
          Upload and manage promotional banners for your referral campaigns.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload Banner</CardTitle>
          <CardDescription>
            Upload a new banner image. Supported formats: JPG, PNG, GIF. Max
            size: 5MB.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-48 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Drag and drop an image here, or click to browse
              </p>
              <Button variant="outline" size="sm" className="mt-3">
                Choose File
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Banners</CardTitle>
          <CardDescription>
            Manage your existing campaign banners.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-12 text-center text-muted-foreground">
            No banners uploaded yet. Upload your first banner above.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
