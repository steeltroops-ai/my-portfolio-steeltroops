#!/usr/bin/env node

/**
 * Vercel Ignore Build Step (Enhanced)
 * ================================================
 * This script tells Vercel whether to proceed with a build or not.
 * It prevents documentation-only changes from consuming build resources.
 *
 * Logic:
 * 1. Always skip if commit message contains "[skip vc]" or "[skip ci]".
 * 2. Always build if commit message contains "[release]" or "chore(release)" (bot-driven).
 * 3. On the 'main' branch, skip non-release commits (let GitHub Actions handle versioning).
 * 4. ALWAYS skip if ONLY documentation or configuration metadata changed.
 */

const { execSync } = require("child_process");

// Patterns to ignore (if ONLY these files changed, we skip the build)
const IGNORE_PATTERNS = [
  /^docs\//,
  /\.md$/,
  /^\.github\//,
  /^\.husky\//,
  /^\.vscode\//,
  /^\.gitignore$/,
  /^\.prettierrc$/,
  /^public\/build-meta\.json$/,
];

try {
  // 1. Get Commit Info
  const commitMessage = execSync("git log -1 --pretty=%B").toString().trim();
  const branch = process.env.VERCEL_GIT_COMMIT_REF || "unknown";

  console.log(`\n--- Vercel Build Gatekeeper ---`);
  console.log(`Branch: ${branch}`);
  console.log(`Commit: "${commitMessage}"`);

  // 2. Forced Skip Check
  if (
    commitMessage.includes("[skip vc]") ||
    commitMessage.includes("[skip ci]")
  ) {
    console.log("🛑 Forced skip detected. Ignoring build.");
    process.exit(0);
  }

  // 3. File-Based Change Analysis
  // Get list of changed files in this commit
  const changedFiles = execSync("git diff --name-only HEAD^ HEAD")
    .toString()
    .trim()
    .split("\n")
    .filter(Boolean);

  console.log(`Changed files: ${changedFiles.length}`);

  const codebaseChanged = changedFiles.some((file) => {
    return !IGNORE_PATTERNS.some((pattern) => pattern.test(file));
  });

  if (!codebaseChanged && changedFiles.length > 0) {
    console.log(
      "🛑 Only documentation or metadata changes detected. Skipping build."
    );
    process.exit(0);
  }

  // 4. Production Branch Logic
  const isProductionBranch = branch === "main";
  const isRelease =
    commitMessage.includes("[release]") ||
    commitMessage.includes("chore(release)");

  if (isProductionBranch) {
    if (isRelease) {
      console.log("✅ Versioned release detected on main. Proceeding.");
      process.exit(1);
    } else {
      console.log(
        "🛑 Standard commit on main. Skipping (Waiting for CI/CD version bump)."
      );
      process.exit(0);
    }
  }

  // 5. Preview / Feature Branch Logic
  // For feature branches, we build if the codebase actually changed.
  if (codebaseChanged) {
    console.log(
      "✅ Codebase changes detected on feature branch. Proceeding with preview."
    );
    process.exit(1);
  }

  console.log("🛑 No meaningful changes detected. Skipping.");
  process.exit(0);
} catch (error) {
  console.error("⚠️ Error in gatekeeper script:", error.message);
  // On error, we default to building to avoid blocking legitimate deployments
  process.exit(1);
}
