/**
 * Blog Post Auto-Generation Script
 *
 * Generates a blog post using OpenAI for content and Pexels for featured images.
 * Saves the result as a JSON file in content/blog/.
 *
 * Environment variables required:
 *   OPENAI_API_KEY  - OpenAI API key
 *   PEXELS_API_KEY  - Pexels API key
 *
 * Usage:
 *   npx tsx scripts/generate-blog-post.ts
 */

import fs from "fs";
import path from "path";

// ---------------------------------------------------------------------------
// Topic pool (50+)
// ---------------------------------------------------------------------------

const TOPICS: string[] = [
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
  "How NPS surveys can supercharge your referral program",
  "Referral widgets and embeds: best practices for conversion",
  "Choosing the right referral reward types for your audience",
  "Referral analytics: metrics every marketer should track",
  "How to prevent referral fraud without hurting user experience",
  "The psychology behind why people refer friends",
  "Double-sided referral incentives: designing win-win programs",
  "Referral marketing for mobile apps",
  "How to create referral email templates that convert",
  "Integrating referral programs with your CRM",
  "Seasonal referral campaigns that drive spikes in growth",
  "Using customer testimonials to boost referral conversions",
  "Referral marketing automation: tools and workflows",
  "How startups can use referral marketing to compete with big brands",
  "The role of customer experience in referral success",
  "Building a referral culture within your organization",
  "Referral program A/B testing strategies",
  "How to re-engage inactive referral program participants",
  "Cross-channel referral marketing strategies",
  "Referral marketing for subscription businesses",
  "Creating urgency in referral campaigns with limited-time offers",
  "How to use data to personalize referral experiences",
  "Referral marketing for professional services firms",
  "Building referral programs for two-sided marketplaces",
  "The impact of social proof on referral conversion rates",
  "Referral program onboarding: getting advocates started right",
  "How to leverage micro-influencers in your referral strategy",
  "Referral marketing compliance and legal considerations",
  "Customer lifetime value and its relationship to referrals",
  "Referral marketing for healthcare and wellness brands",
  "How to design referral programs for high-ticket products",
  "The future of referral marketing: trends to watch",
  "Community-driven growth through referral programs",
  "Referral marketing case studies from top SaaS companies",
  "How to write compelling referral program messaging",
  "Reward fulfillment best practices for referral programs",
  "Multi-tier referral programs: pros, cons, and design tips",
  "How to use video content in your referral marketing",
  "Referral marketing for fintech and financial services",
  "Combining content marketing with referral strategies",
  "How to build a referral program dashboard",
  "Ethical referral marketing: transparency and trust",
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function estimateReadingTime(content: string): string {
  const words = content.split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

// ---------------------------------------------------------------------------
// OpenAI
// ---------------------------------------------------------------------------

interface OpenAIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenAIChoice {
  message: { content: string };
}

interface OpenAIResponse {
  choices: OpenAIChoice[];
}

async function generateContent(topic: string): Promise<{
  title: string;
  excerpt: string;
  content: string;
  tags: string[];
}> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY environment variable is not set");

  const messages: OpenAIMessage[] = [
    {
      role: "system",
      content: `You are an expert content writer specializing in referral marketing, growth hacking, and word-of-mouth strategies. Write professional, actionable blog posts for Referrals.com, a referral marketing platform. Use a confident, knowledgeable but approachable tone. Do not use emojis.`,
    },
    {
      role: "user",
      content: `Write a detailed blog post about: "${topic}"

Return your response as valid JSON with these exact fields:
{
  "title": "A compelling, SEO-friendly title (60-70 characters ideal)",
  "excerpt": "A 1-2 sentence summary for previews (under 160 characters)",
  "content": "Full article in Markdown format. At least 800 words. Include ## headings, practical advice, and a conclusion. Do not include the title as an H1 — start with the first section.",
  "tags": ["array", "of", "3-5", "relevant", "tags"]
}

Return ONLY the JSON object, no code fences or extra text.`,
    },
  ];

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages,
      temperature: 0.7,
      max_tokens: 3000,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI API error (${res.status}): ${err}`);
  }

  const data = (await res.json()) as OpenAIResponse;
  const raw = data.choices[0]?.message?.content?.trim();
  if (!raw) throw new Error("Empty response from OpenAI");

  // Strip code fences if present
  const cleaned = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  return JSON.parse(cleaned);
}

// ---------------------------------------------------------------------------
// Pexels
// ---------------------------------------------------------------------------

interface PexelsPhoto {
  src: { large2x: string };
}

interface PexelsResponse {
  photos: PexelsPhoto[];
}

async function fetchFeaturedImage(query: string): Promise<string> {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) throw new Error("PEXELS_API_KEY environment variable is not set");

  const searchQuery = encodeURIComponent(
    query.length > 80 ? query.slice(0, 80) : query
  );

  const res = await fetch(
    `https://api.pexels.com/v1/search?query=${searchQuery}&per_page=5&orientation=landscape`,
    {
      headers: { Authorization: apiKey },
    }
  );

  if (!res.ok) {
    console.warn(`Pexels API error (${res.status}), using fallback image`);
    return "https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750";
  }

  const data = (await res.json()) as PexelsResponse;

  if (data.photos && data.photos.length > 0) {
    // Pick a random photo from the results
    const photo = data.photos[Math.floor(Math.random() * data.photos.length)];
    return photo.src.large2x;
  }

  return "https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750";
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log("Starting blog post generation...");

  // Pick a random topic
  const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
  console.log(`Selected topic: ${topic}`);

  // Generate content via OpenAI
  console.log("Generating content with OpenAI...");
  const { title, excerpt, content, tags } = await generateContent(topic);
  console.log(`Generated: "${title}"`);

  // Fetch featured image from Pexels
  console.log("Fetching featured image from Pexels...");
  const imageQuery = tags.slice(0, 2).join(" ") + " business";
  const featuredImage = await fetchFeaturedImage(imageQuery);
  console.log(`Image: ${featuredImage.slice(0, 80)}...`);

  // Build the post object
  const slug = slugify(title);
  const date = new Date().toISOString().split("T")[0];

  const post = {
    title,
    slug,
    excerpt,
    content,
    featuredImage,
    author: "Referrals.com Team",
    date,
    tags,
    readingTime: estimateReadingTime(content),
  };

  // Save to content/blog/
  const outDir = path.join(process.cwd(), "content", "blog");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const filePath = path.join(outDir, `${slug}.json`);
  fs.writeFileSync(filePath, JSON.stringify(post, null, 2), "utf-8");
  console.log(`Saved to: ${filePath}`);

  // Print title for GitHub Actions commit message
  console.log(`::set-output name=title::${title}`);
  // Also use the newer GITHUB_OUTPUT mechanism
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `title=${title}\n`);
  }

  console.log("Done!");
}

main().catch((err) => {
  console.error("Generation failed:", err);
  process.exit(1);
});
