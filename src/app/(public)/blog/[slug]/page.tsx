import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllPosts, getPostBySlug, getRelatedPosts } from "@/lib/blog";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "Post Not Found" };

  return {
    title: `${post.title} | Referrals.com Blog`,
    description: post.excerpt,
    openGraph: {
      title: `${post.title} | Referrals.com Blog`,
      description: post.excerpt,
      url: `https://referrals.com/blog/${slug}`,
      siteName: "Referrals.com",
      images: [{ url: post.featuredImage }],
      type: "article",
      publishedTime: post.date,
      authors: [post.author],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: [post.featuredImage],
    },
  };
}

/**
 * Very simple markdown-to-HTML renderer for blog content.
 * Handles: headings, paragraphs, bold, italic, links, lists.
 */
function renderMarkdown(md: string): string {
  const lines = md.split("\n");
  const html: string[] = [];
  let inList = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
      continue;
    }

    if (trimmed.startsWith("### ")) {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
      html.push(`<h3>${inline(trimmed.slice(4))}</h3>`);
      continue;
    }
    if (trimmed.startsWith("## ")) {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
      html.push(`<h2>${inline(trimmed.slice(3))}</h2>`);
      continue;
    }
    if (trimmed.startsWith("# ")) {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
      html.push(`<h1>${inline(trimmed.slice(2))}</h1>`);
      continue;
    }

    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      if (!inList) {
        html.push("<ul>");
        inList = true;
      }
      html.push(`<li>${inline(trimmed.slice(2))}</li>`);
      continue;
    }

    if (inList) {
      html.push("</ul>");
      inList = false;
    }
    html.push(`<p>${inline(trimmed)}</p>`);
  }

  if (inList) html.push("</ul>");
  return html.join("\n");
}

function inline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const related = getRelatedPosts(slug, 3);
  const shareUrl = encodeURIComponent(`https://referrals.com/blog/${slug}`);
  const shareTitle = encodeURIComponent(post.title);

  return (
    <div className="bg-[#fafafa] pb-20 pt-6 sm:pt-10">
      <article className="mx-auto max-w-[680px] px-5 sm:px-6">
        <nav className="mb-10 font-sans text-sm text-gray-500">
          <Link
            href="/blog"
            className="transition-colors hover:text-[#1a8917]"
          >
            Blog
          </Link>
          <span className="mx-2 text-gray-300">/</span>
          <span className="text-gray-600 line-clamp-1">{post.title}</span>
        </nav>

        <header className="mb-10 sm:mb-12">
          <div className="mb-6 flex flex-wrap gap-2 font-sans">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600"
              >
                {tag}
              </span>
            ))}
          </div>
          <h1 className="font-serif text-[clamp(2rem,5vw,2.75rem)] font-bold leading-[1.15] tracking-tight text-[#242424]">
            {post.title}
          </h1>
          <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 font-sans text-base text-gray-500">
            <span className="text-[#292929]">{post.author}</span>
            <span className="hidden sm:inline" aria-hidden="true">
              ·
            </span>
            <time dateTime={post.date}>
              {new Date(post.date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
            <span className="hidden sm:inline" aria-hidden="true">
              ·
            </span>
            <span>{post.readingTime}</span>
          </div>
        </header>

        <div className="mb-12 overflow-hidden rounded-sm sm:rounded-md">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.featuredImage}
            alt={post.title}
            className="aspect-[2/1] w-full object-cover"
          />
        </div>

        <div
          className="blog-article-body font-serif text-[#292929]
            [&_h1]:mt-12 [&_h1]:mb-6 [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:leading-tight [&_h1]:tracking-tight [&_h1]:text-[#242424]
            [&_h2]:mt-14 [&_h2]:mb-5 [&_h2]:text-[1.65rem] [&_h2]:font-bold [&_h2]:leading-snug [&_h2]:tracking-tight [&_h2]:text-[#242424]
            [&_h3]:mt-12 [&_h3]:mb-4 [&_h3]:text-[1.35rem] [&_h3]:font-bold [&_h3]:leading-snug [&_h3]:text-[#242424]
            [&_p]:mb-8 [&_p]:mt-0 [&_p]:text-[1.3125rem] [&_p]:leading-[1.75] [&_p]:text-[#292929]
            [&_ul]:my-8 [&_ul]:mb-10 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6
            [&_li]:text-[1.3125rem] [&_li]:leading-[1.75]
            [&_strong]:font-semibold [&_strong]:text-[#242424]
            [&_a]:text-[#1a8917] [&_a]:underline [&_a]:decoration-[#1a8917]/40 [&_a]:underline-offset-[3px] hover:[&_a]:decoration-[#1a8917]"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }}
        />

        <footer className="mt-16 border-t border-gray-200 pt-12 font-sans">
          <p className="mb-5 text-xs font-semibold uppercase tracking-widest text-gray-400">
            Share
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href={`https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareTitle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 shadow-sm transition-colors hover:border-gray-300 hover:bg-gray-50"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              X
            </a>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 shadow-sm transition-colors hover:border-gray-300 hover:bg-gray-50"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
              LinkedIn
            </a>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 shadow-sm transition-colors hover:border-gray-300 hover:bg-gray-50"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Facebook
            </a>
          </div>
        </footer>

        {related.length > 0 && (
          <section className="mt-16 border-t border-gray-200 pt-14 font-sans">
            <h2 className="mb-8 font-serif text-2xl font-bold tracking-tight text-[#242424]">
              More from the blog
            </h2>
            <div className="space-y-10">
              {related.map((rp) => (
                <Link
                  key={rp.slug}
                  href={`/blog/${rp.slug}`}
                  className="group flex gap-5 border-b border-gray-100 pb-10 last:border-0 last:pb-0"
                >
                  <div className="relative hidden h-24 w-36 shrink-0 overflow-hidden rounded-sm bg-gray-100 sm:block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={rp.featuredImage}
                      alt={rp.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-serif text-lg font-semibold leading-snug text-[#242424] transition-colors group-hover:text-[#1a8917] sm:text-xl">
                      {rp.title}
                    </h3>
                    <p className="mt-2 text-sm text-gray-500">
                      {new Date(rp.date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </div>
  );
}
