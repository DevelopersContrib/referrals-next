// One-off codemod: enforce platform-admin on every src/app/api/admin route.
// Inserts a requirePlatformAdminApi() gate as the first statement of each
// exported HTTP handler, and adds the import. Idempotent.
import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

const files = execSync("find src/app/api/admin -name route.ts", {
  encoding: "utf8",
})
  .split("\n")
  .map((s) => s.trim())
  .filter(Boolean);

const IMPORT = `import { requirePlatformAdminApi } from "@/lib/require-platform-admin";`;
const MARKER = "__adminGate"; // idempotency marker
const GATE = `
  const ${MARKER} = await requirePlatformAdminApi();
  if (!${MARKER}.ok)
    return NextResponse.json(
      { error: ${MARKER}.status === 401 ? "Unauthorized" : "Forbidden" },
      { status: ${MARKER}.status }
    );`;

const handlerRe =
  /export async function (GET|POST|PUT|PATCH|DELETE)\s*\([^)]*\)\s*(:[^{]+)?\{/g;

let changed = 0;
const skipped = [];

for (const file of files) {
  let src = readFileSync(file, "utf8");
  if (src.includes(MARKER)) {
    skipped.push(`${file} (already gated)`);
    continue;
  }
  if (!src.includes("NextResponse")) {
    skipped.push(`${file} (no NextResponse import — handle manually)`);
    continue;
  }

  // Insert the gate right after each handler's opening brace.
  src = src.replace(handlerRe, (m) => `${m}${GATE}`);

  // Add the import once (after the first import line for tidy ordering).
  if (!src.includes(IMPORT)) {
    const firstImportEnd = src.indexOf("\n", src.indexOf("import "));
    src =
      src.slice(0, firstImportEnd + 1) +
      IMPORT +
      "\n" +
      src.slice(firstImportEnd + 1);
  }

  writeFileSync(file, src);
  changed++;
}

console.log(`gated ${changed} files`);
if (skipped.length) console.log("skipped:\n  " + skipped.join("\n  "));
