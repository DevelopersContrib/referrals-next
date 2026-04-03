import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateApiKey, apiSuccess, apiError, handleCors } from "@/lib/api/helpers";

export async function OPTIONS() {
  return handleCors();
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ brandId: string }> }
) {
  try {
    const memberId = await authenticateApiKey(req);
    if (!memberId) {
      return apiError("Invalid or missing API key", 401);
    }

    const { brandId } = await params;
    const id = parseInt(brandId, 10);

    const brand = await prisma.member_urls.findFirst({
      where: { id, member_id: memberId },
    });

    if (!brand) {
      return apiError("Brand not found", 404);
    }

    return apiSuccess(brand);
  } catch (error) {
    console.error("Get brand error:", error);
    return apiError("Internal server error", 500);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ brandId: string }> }
) {
  try {
    const memberId = await authenticateApiKey(req);
    if (!memberId) {
      return apiError("Invalid or missing API key", 401);
    }

    const { brandId } = await params;
    const id = parseInt(brandId, 10);

    const existing = await prisma.member_urls.findFirst({
      where: { id, member_id: memberId },
    });

    if (!existing) {
      return apiError("Brand not found", 404);
    }

    const body = await req.json();
    const { url, description, logo_url, background_image, slug } = body;

    const updated = await prisma.member_urls.update({
      where: { id },
      data: {
        ...(url !== undefined && { url }),
        ...(description !== undefined && { description }),
        ...(logo_url !== undefined && { logo_url }),
        ...(background_image !== undefined && { background_image }),
        ...(slug !== undefined && { slug }),
        ...(url !== undefined && {
          domain: (() => {
            try {
              return new URL(url).hostname;
            } catch {
              return url.replace(/^https?:\/\//, "").split("/")[0];
            }
          })(),
        }),
      },
    });

    return apiSuccess(updated);
  } catch (error) {
    console.error("Update brand error:", error);
    return apiError("Internal server error", 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ brandId: string }> }
) {
  try {
    const memberId = await authenticateApiKey(req);
    if (!memberId) {
      return apiError("Invalid or missing API key", 401);
    }

    const { brandId } = await params;
    const id = parseInt(brandId, 10);

    const existing = await prisma.member_urls.findFirst({
      where: { id, member_id: memberId },
    });

    if (!existing) {
      return apiError("Brand not found", 404);
    }

    await prisma.member_urls.delete({ where: { id } });

    return apiSuccess({ message: "Brand deleted successfully" });
  } catch (error) {
    console.error("Delete brand error:", error);
    return apiError("Internal server error", 500);
  }
}
