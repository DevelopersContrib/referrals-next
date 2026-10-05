import fs from "fs";
import path from "path";

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  author: string;
  date: string;
  tags: string[];
  readingTime: string;
}

const BLOG_DIR = path.join(process.cwd(), "content", "blog");
const COVER_DIR = path.join(process.cwd(), "public", "images", "blog");

/**
 * Download a cover image into `public/images/blog` and return its site-relative
 * path. Returns null if the download fails or the response is not an image.
 *
 * Covers are stored locally rather than hotlinked so a post never renders an
 * empty box because a third-party image host is unreachable from the visitor's
 * browser — ad blockers and corporate filters routinely block stock photo CDNs.
 */
export async function downloadBlogCover(
  imageUrl: string,
  slug: string,
): Promise<string | null> {
  try {
    const res = await fetch(imageUrl);
    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) return null;

    const ext = contentType.includes("png")
      ? "png"
      : contentType.includes("webp")
        ? "webp"
        : "jpg";

    fs.mkdirSync(COVER_DIR, { recursive: true });
    fs.writeFileSync(
      path.join(COVER_DIR, `${slug}.${ext}`),
      Buffer.from(await res.arrayBuffer()),
    );

    return `/images/blog/${slug}.${ext}`;
  } catch {
    return null;
  }
}

function ensureBlogDir(): void {
  if (!fs.existsSync(BLOG_DIR)) {
    fs.mkdirSync(BLOG_DIR, { recursive: true });
  }
}

function readPostFile(filePath: string): BlogPost | null {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw) as BlogPost;
    if (!data.slug || !data.title || !data.date) return null;
    return data;
  } catch {
    return null;
  }
}

/**
 * Get all blog posts sorted by date descending.
 */
export function getAllPosts(): BlogPost[] {
  ensureBlogDir();

  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".json"));
  const posts: BlogPost[] = [];

  for (const file of files) {
    const post = readPostFile(path.join(BLOG_DIR, file));
    if (post) posts.push(post);
  }

  return posts.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

/**
 * Get a single blog post by slug.
 */
export function getPostBySlug(slug: string): BlogPost | null {
  ensureBlogDir();

  // Try direct filename first
  const directPath = path.join(BLOG_DIR, `${slug}.json`);
  if (fs.existsSync(directPath)) {
    return readPostFile(directPath);
  }

  // Fall back to scanning all files
  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".json"));
  for (const file of files) {
    const post = readPostFile(path.join(BLOG_DIR, file));
    if (post && post.slug === slug) return post;
  }

  return null;
}

/**
 * Get the N most recent posts.
 */
export function getRecentPosts(count: number): BlogPost[] {
  return getAllPosts().slice(0, count);
}

/**
 * Get posts related to a given post (by shared tags), excluding the post itself.
 */
export function getRelatedPosts(slug: string, count: number = 3): BlogPost[] {
  const current = getPostBySlug(slug);
  if (!current) return getRecentPosts(count);

  const all = getAllPosts().filter((p) => p.slug !== slug);

  // Score by number of shared tags
  const scored = all.map((post) => {
    const shared = post.tags.filter((t) => current.tags.includes(t)).length;
    return { post, score: shared };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, count).map((s) => s.post);
}

/**
 * Get paginated posts.
 */
export function getPaginatedPosts(
  page: number,
  perPage: number = 9
): { posts: BlogPost[]; totalPages: number; total: number } {
  const all = getAllPosts();
  const total = all.length;
  const totalPages = Math.ceil(total / perPage);
  const start = (page - 1) * perPage;
  const posts = all.slice(start, start + perPage);

  return { posts, totalPages, total };
}

/**
 * Delete a blog post by slug. Returns true if deleted.
 */
export function deletePost(slug: string): boolean {
  ensureBlogDir();

  const filePath = path.join(BLOG_DIR, `${slug}.json`);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }

  // Fall back to scanning
  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".json"));
  for (const file of files) {
    const post = readPostFile(path.join(BLOG_DIR, file));
    if (post && post.slug === slug) {
      fs.unlinkSync(path.join(BLOG_DIR, file));
      return true;
    }
  }

  return false;
}

/**
 * Save a blog post as JSON file.
 */
export function savePost(post: BlogPost): void {
  ensureBlogDir();
  const filePath = path.join(BLOG_DIR, `${post.slug}.json`);
  fs.writeFileSync(filePath, JSON.stringify(post, null, 2), "utf-8");
}
