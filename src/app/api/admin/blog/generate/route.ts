import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { savePost } from "@/lib/blog";

// POST /api/admin/blog/generate — trigger on-demand blog post generation
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const openaiKey = process.env.OPENAI_API_KEY;
    const pexelsKey = process.env.PEXELS_API_KEY;

    if (!openaiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY not configured" },
        { status: 500 }
      );
    }

    // --- Pick a random topic ---
    const topics = [
      "How to launch a successful referral program from scratch",
      "Best referral incentive structures for SaaS companies",
      "Word-of-mouth marketing strategies for e-commerce",
      "Building viral referral loops that scale",
      "Customer advocacy programs: a complete guide",
      "Referral program gamification tactics that boost engagement",
      "B2B referral marketing best practices",
      "How to measure referral program ROI effectively",
      "Referral landing page optimization tips",
      "Ambassador programs vs affiliate programs: key differences",
      "Loyalty program design for maximum customer retention",
      "Social sharing strategies that drive referral traffic",
      "Referral analytics: metrics every marketer should track",
      "Referral marketing for mobile apps",
      "The psychology behind why people refer friends",
      "How startups can use referral marketing to compete with big brands",
      "Referral marketing automation: tools and workflows",
      "Creating urgency in referral campaigns with limited-time offers",
      "The future of referral marketing: trends to watch",
      "Combining content marketing with referral strategies",
    ];
    const topic = topics[Math.floor(Math.random() * topics.length)];

    // --- Generate content via OpenAI ---
    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You are an expert content writer specializing in referral marketing. Write professional, actionable blog posts for Referrals.com. Do not use emojis.",
          },
          {
            role: "user",
            content: `Write a detailed blog post about: "${topic}"

Return valid JSON:
{
  "title": "SEO-friendly title",
  "excerpt": "1-2 sentence summary under 160 chars",
  "content": "Full article in Markdown, 800+ words, with ## headings",
  "tags": ["3-5","relevant","tags"]
}

Return ONLY the JSON object.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 3000,
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      return NextResponse.json(
        { error: `OpenAI error: ${errText}` },
        { status: 502 }
      );
    }

    const aiData = await aiRes.json();
    const raw = aiData.choices?.[0]?.message?.content?.trim() || "";
    const cleaned = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    const generated = JSON.parse(cleaned);

    // --- Fetch Pexels image ---
    let featuredImage =
      "https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750";

    if (pexelsKey) {
      try {
        const imgQuery = encodeURIComponent(
          (generated.tags?.slice(0, 2)?.join(" ") || "business") + " business"
        );
        const pxRes = await fetch(
          `https://api.pexels.com/v1/search?query=${imgQuery}&per_page=5&orientation=landscape`,
          { headers: { Authorization: pexelsKey } }
        );
        if (pxRes.ok) {
          const pxData = await pxRes.json();
          if (pxData.photos?.length) {
            featuredImage =
              pxData.photos[
                Math.floor(Math.random() * pxData.photos.length)
              ].src.large2x;
          }
        }
      } catch {
        // Use fallback image
      }
    }

    // --- Build and save ---
    const slug = generated.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const words = (generated.content || "").split(/\s+/).length;
    const readingTime = `${Math.max(1, Math.ceil(words / 200))} min read`;

    const post = {
      title: generated.title,
      slug,
      excerpt: generated.excerpt || "",
      content: generated.content || "",
      featuredImage,
      author: "Referrals.com Team",
      date: new Date().toISOString().split("T")[0],
      tags: generated.tags || [],
      readingTime,
    };

    savePost(post);

    return NextResponse.json({ success: true, post }, { status: 201 });
  } catch (error) {
    console.error("Blog generate error:", error);
    return NextResponse.json(
      { error: "Failed to generate post" },
      { status: 500 }
    );
  }
}
