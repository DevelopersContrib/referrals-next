// Dedupe admin route boilerplate:
//  1. Replace the 6-line requirePlatformAdminApi gate block with a 2-line
//     `adminApiGuard()` call.
//  2. Remove the now-redundant `auth()` session check (the gate already enforces
//     auth) — ONLY when `session` isn't referenced elsewhere in the file.
//  3. Fix imports (requirePlatformAdminApi -> adminApiGuard; drop unused auth).
// Idempotent; safe to re-run. tsc is the backstop for any file that genuinely
// used `session` later (left untouched there).
import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

const files = execSync("find src/app/api/admin -name route.ts", { encoding: "utf8" })
  .split("\n").map((s) => s.trim()).filter(Boolean);

const GATE_RE =
  /  const __adminGate = await requirePlatformAdminApi\(\);\n  if \(!__adminGate\.ok\)\n    return NextResponse\.json\(\n      \{ error: __adminGate\.status === 401 \? "Unauthorized" : "Forbidden" \},\n      \{ status: __adminGate\.status \}\n    \);\n/g;

const AUTH_RE =
  /    const session = await auth\(\);\n    if \(!session\?\.user\?\.id\)\n      return NextResponse\.json\(\{ error: "Unauthorized" \}, \{ status: 401 \}\);\n\n?/g;

let changed = 0;
const kept = [];

for (const file of files) {
  let src = readFileSync(file, "utf8");
  const before = src;

  // 1. gate block -> adminApiGuard()
  src = src.replace(
    GATE_RE,
    "  const denied = await adminApiGuard();\n  if (denied) return denied;\n"
  );

  // 2. redundant auth block — only if `session` is used nowhere else.
  //    Each auth block references `session` twice; if total references equal
  //    2 * (number of auth blocks), every use is inside a block -> safe.
  const authBlocks = (src.match(AUTH_RE) || []).length;
  const sessionRefs = (src.match(/\bsession\b/g) || []).length;
  if (authBlocks > 0 && sessionRefs === authBlocks * 2) {
    src = src.replace(AUTH_RE, "");
  } else if (authBlocks > 0) {
    kept.push(`${file} (session used elsewhere — kept auth block)`);
  }

  // 3. imports
  src = src.replace(
    /import \{ requirePlatformAdminApi \} from "@\/lib\/require-platform-admin";/,
    'import { adminApiGuard } from "@/lib/require-platform-admin";'
  );
  // drop the auth import if auth() no longer appears
  if (!/\bauth\(/.test(src)) {
    src = src.replace(/import \{ auth \} from "@\/lib\/auth";\n/, "");
  }

  if (src !== before) {
    writeFileSync(file, src);
    changed++;
  }
}

console.log(`rewrote ${changed} files`);
if (kept.length) console.log("kept auth block in:\n  " + kept.join("\n  "));
