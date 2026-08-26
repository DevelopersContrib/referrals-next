/**
 * Brand slug collision smoke (J4).
 *
 * Offline — normalization + validation rules only, no database:
 *   npx tsx scripts/smoke-brand-slug.ts
 *
 * Database — report duplicate slugs and index state (read-only):
 *   npx tsx scripts/smoke-brand-slug.ts --db
 *
 * Live — prove two brands on the same domain get different slugs, then clean up:
 *   npx tsx scripts/smoke-brand-slug.ts --live --member-id 123
 */
import { config as loadEnv } from "dotenv";
import {
  normalizeSlug,
  normalizeSlugInput,
  slugFromWebsite,
  slugIssue,
  SLUG_MIN_LENGTH,
} from "../src/lib/brand-slug";

loadEnv({ path: ".env.local", quiet: true });
loadEnv({ quiet: true });

function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

function arg(name: string, fallback = ""): string {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

let failures = 0;

function pass(msg: string) {
  console.log(`OK: ${msg}`);
}

function check(condition: boolean, msg: string) {
  if (condition) {
    pass(msg);
  } else {
    failures += 1;
    console.error(`FAIL: ${msg}`);
  }
}

function offline() {
  console.log("\n— Normalization —");
  check(
    slugFromWebsite("https://www.BlackSesamePH.com/about") ===
      "blacksesameph-com",
    "website → slug strips scheme, www and path",
  );
  check(
    normalizeSlug("  My Brand!!  ") === "my-brand",
    "free-form input collapses to a clean slug",
  );
  check(
    normalizeSlug("acme---co--") === "acme-co",
    "repeated and trailing separators collapse",
  );
  check(
    normalizeSlugInput("my-") === "my-",
    "typing a dash mid-slug is not eaten by the normalizer",
  );

  console.log("\n— Validation —");
  check(slugIssue("") === "empty", "empty slug rejected");
  check(
    slugIssue("a".repeat(SLUG_MIN_LENGTH - 1)) === "too-short",
    `slugs under ${SLUG_MIN_LENGTH} characters rejected`,
  );
  check(
    slugIssue("12345") === "numeric",
    "numbers-only rejected (/p/<digits> resolves by brand id)",
  );
  check(slugIssue("admin") === "reserved", "reserved words rejected");
  check(slugIssue("blacksesameph-com") === null, "a normal brand slug passes");
}

async function database(live: boolean, memberId: number) {
  const { prisma } = await import("../src/lib/prisma");
  const { claimBrandSlug, checkBrandSlug } =
    await import("../src/lib/brand-access");

  console.log("\n— Index state —");
  const indexes = await prisma.$queryRawUnsafe<{ Key_name: string }[]>(
    "SHOW INDEX FROM member_urls WHERE Column_name = 'slug'",
  );
  console.log(
    indexes.length === 0
      ? "No index on member_urls.slug — uniqueness is enforced in the application (claimBrandSlug)."
      : `Indexes on slug: ${indexes.map((i) => i.Key_name).join(", ")}`,
  );

  console.log("\n— Existing duplicates —");
  const duplicates = await prisma.$queryRawUnsafe<
    { slug: string; n: bigint }[]
  >(
    "SELECT slug, COUNT(*) AS n FROM member_urls WHERE slug IS NOT NULL AND slug <> '' GROUP BY slug HAVING n > 1 ORDER BY n DESC LIMIT 20",
  );
  if (duplicates.length === 0) {
    pass("no duplicate slugs in member_urls");
  } else {
    for (const row of duplicates) {
      console.log(`  ${row.slug} × ${Number(row.n)}`);
    }
    console.log(
      `${duplicates.length} duplicate slug(s) predate this fix — new brands can no longer collide.`,
    );
  }

  console.log("\n— Suggestions against real data —");
  const sample = await prisma.member_urls.findFirst({
    where: { slug: { not: null } },
    orderBy: { id: "desc" },
    select: { slug: true },
  });
  if (sample?.slug) {
    const result = await checkBrandSlug({ slug: sample.slug });
    console.log(`  ${sample.slug} → ${result.message}`);
    console.log(`  next free: ${result.suggestion}`);
    check(
      !result.available && Boolean(result.suggestion),
      "an in-use slug reports taken and offers the next free one",
    );

    const free = await checkBrandSlug({ slug: result.suggestion ?? "" });
    check(free.available, "the suggested slug is actually free");
  } else {
    console.log("  no slugs in member_urls to sample");
  }

  if (!live) {
    await prisma.$disconnect();
    return;
  }

  if (!Number.isFinite(memberId) || memberId <= 0) {
    console.error("FAIL: --live requires --member-id <id>");
    failures += 1;
    await prisma.$disconnect();
    return;
  }

  console.log("\n— Live collision —");
  const domain = `smoke-${Date.now()}.example`;
  const created: number[] = [];
  try {
    for (let i = 0; i < 2; i += 1) {
      const brand = await prisma.member_urls.create({
        data: { url: `https://${domain}`, domain, member_id: memberId },
      });
      created.push(brand.id);
      const slug = await claimBrandSlug(brand.id, null, domain);
      console.log(`  brand ${brand.id} → ${slug}`);
    }

    const rows = await prisma.member_urls.findMany({
      where: { id: { in: created } },
      select: { slug: true },
    });
    const slugs = rows.map((r) => r.slug);
    check(
      new Set(slugs).size === slugs.length,
      `two brands on ${domain} got different slugs`,
    );

    const conflict = await checkBrandSlug({ slug: slugs[0] ?? "" });
    check(
      !conflict.available && conflict.suggestion !== null,
      "checkBrandSlug reports the taken slug and offers the next free one",
    );
  } finally {
    if (created.length > 0) {
      await prisma.member_urls.deleteMany({ where: { id: { in: created } } });
      console.log(`  cleaned up ${created.length} smoke brand(s)`);
    }
    await prisma.$disconnect();
  }
}

async function main() {
  offline();

  const live = hasFlag("live");
  if (live || hasFlag("db")) {
    await database(live, parseInt(arg("member-id", "0"), 10));
  } else {
    console.log("\nRun with --db for the database report, --live to create.");
  }

  console.log(
    failures === 0 ? "\nAll checks passed." : `\n${failures} failed.`,
  );
  process.exit(failures === 0 ? 0 : 1);
}

main();
