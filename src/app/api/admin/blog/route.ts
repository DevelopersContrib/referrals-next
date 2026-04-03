import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAllPosts, savePost, deletePost, type BlogPost } from "@/lib/blog";

// GET /api/admin/blog — list all posts
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const posts = getAllPosts();
    return NextResponse.json({ posts, total: posts.length });
  } catch (error) {
    console.error("Blog list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}

// POST /api/admin/blog — create a post manually
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as Partial<BlogPost>;

    if (!body.title || !body.slug || !body.content) {
      return NextResponse.json(
        { error: "title, slug, and content are required" },
        { status: 400 }
      );
    }

    const post: BlogPost = {
      title: body.title,
      slug: body.slug,
      excerpt: body.excerpt || "",
      content: body.content,
      featuredImage:
        body.featuredImage ||
        "https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750",
      author: body.author || "Referrals.com Team",
      date: body.date || new Date().toISOString().split("T")[0],
      tags: body.tags || [],
      readingTime:
        body.readingTime ||
        `${Math.max(1, Math.ceil(body.content.split(/\s+/).length / 200))} min read`,
    };

    savePost(post);

    return NextResponse.json({ success: true, post }, { status: 201 });
  } catch (error) {
    console.error("Blog create error:", error);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/blog?slug=... — delete a post
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json(
        { error: "slug query parameter is required" },
        { status: 400 }
      );
    }

    const deleted = deletePost(slug);
    if (!deleted) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Blog delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    );
  }
}
