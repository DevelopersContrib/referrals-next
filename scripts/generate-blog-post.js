#!/usr/bin/env node

/**
 * Wrapper that runs the TypeScript generation script via tsx.
 * Usage: node scripts/generate-blog-post.js
 *
 * Requires: npx tsx (included with the project devDependencies)
 */

const { execSync } = require("child_process");
const path = require("path");

const scriptPath = path.join(__dirname, "generate-blog-post.ts");

try {
  execSync(`npx tsx "${scriptPath}"`, {
    stdio: "inherit",
    env: process.env,
    cwd: path.join(__dirname, ".."),
  });
} catch (err) {
  process.exit(1);
}
