#!/usr/bin/env node

/**
 * Vercel Ignore Build Step
 * ================================================
 * This script tells Vercel whether to proceed with a build or not.
 *
 * Logic:
 * - If the commit message contains "[skip vc]" or DOES NOT contain "[release]",
 *   we tell Vercel to ignore the build.
 * - This ensures Vercel ONLY builds the final, version-bumped commit
 *   pushed by our GitHub Action.
 */

const { execSync } = require("child_process");

try {
  // Get the last commit message
  const commitMessage = execSync("git log -1 --pretty=%B").toString().trim();

  console.log(`Checking commit: "${commitMessage}"`);

  // 1. If it's the version bump commit from our GitHub Action, it MUST be built.
  // We look for our release tag or the bot name.
  if (
    commitMessage.includes("[release]") ||
    commitMessage.includes("chore(release)")
  ) {
    console.log(
      "✅ Versioned commit detected. Proceeding with production build."
    );
    process.exit(1); // Exit 1 tells Vercel: "YES, BUILD THIS"
  }

  // 2. If it's a regular commit from a human, we skip it.
  // The GitHub Action will handle versioning and trigger the correct build anyway.
  console.log(
    "🛑 Standard commit detected. Ignoring build to let GitHub Action handle versioning first."
  );
  process.exit(0); // Exit 0 tells Vercel: "IGNORE THIS BUILD"
} catch (error) {
  console.error("Error in ignore script:", error);
  process.exit(1); // On error, default to building just in case
}
