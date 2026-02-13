#!/usr/bin/env node

/**
 * Smart Version Bumper for Portfolio Deployments (Enhanced)
 * ================================================
 * This script increments the project version (package.json) based on time
 * and historical data, but ONLY if codebase changes are detected.
 *
 * Rules:
 *   - If only docs/metadata changed -> No version bump (Keep current)
 *   - If last deploy was < 7 days ago  -> patch bump (e.g. 1.2.3 -> 1.2.4)
 *   - If last deploy was >= 7 days ago -> minor bump (e.g. 1.2.3 -> 1.3.0)
 *
 * Usage:
 *   node scripts/version-bump.js          # auto-detect based on time + logic
 *   node scripts/version-bump.js --major  # force major bump
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const PKG_PATH = resolve(ROOT, "package.json");
const META_PATH = resolve(ROOT, "public", "build-meta.json");

// --- Patterns to Ignore ---
const IGNORE_PATTERNS = [
  /^docs\//,
  /\.md$/,
  /^\.github\//,
  /^\.husky\//,
  /^\.vscode\//,
  /^\.gitignore$/,
  /^\.prettierrc$/,
  /^public\/build-meta\.json$/,
  /^package\.json$/, // Ignore the version bump itself from previous runs
  /^bun\.lock$/,
];

// --- Helpers ---

function parseVersion(versionStr) {
  const [major, minor, patch] = versionStr.split(".").map(Number);
  return { major: major || 0, minor: minor || 0, patch: patch || 0 };
}

function formatVersion({ major, minor, patch }) {
  return `${major}.${minor}.${patch}`;
}

function daysSince(isoDate) {
  if (!isoDate) return Infinity;
  const then = new Date(isoDate);
  const now = new Date();
  return (now - then) / (1000 * 60 * 60 * 24);
}

function hasCodebaseChanges() {
  try {
    // Get list of files changed since the last commit (or in the current push)
    const changedFiles = execSync("git diff --name-only HEAD^ HEAD")
      .toString()
      .trim()
      .split("\n")
      .filter(Boolean);

    if (changedFiles.length === 0) return false;

    return changedFiles.some((file) => {
      return !IGNORE_PATTERNS.some((pattern) => pattern.test(file));
    });
  } catch (error) {
    // If we can't determine (e.g. fresh repo), assume changed to be safe
    return true;
  }
}

// --- Main Logic ---

function main() {
  const pkg = JSON.parse(readFileSync(PKG_PATH, "utf-8"));
  const currentVersion = parseVersion(pkg.version || "1.0.0");

  // Read previous build meta if it exists
  let lastDeployDate = null;
  if (existsSync(META_PATH)) {
    try {
      const meta = JSON.parse(readFileSync(META_PATH, "utf-8"));
      lastDeployDate = meta.deployedAt;
    } catch {
      // corrupted meta, ignore
    }
  }

  const gap = daysSince(lastDeployDate);
  const forceArg = process.argv[2]; // --major, --minor, --patch

  // Determine if this is a "valid" environment for bumping
  const isCI = process.env.FORCE_VERSION_BUMP === "true";
  const isProduction = process.env.VERCEL_ENV === "production" || isCI;

  // 1. CHANGE DETECTION: If not forced, check if we actually need a bump
  const codebaseChanged = hasCodebaseChanges();

  if (!forceArg && !codebaseChanged && isProduction) {
    console.log(
      "\n  [SKIP BUMP] Only documentation or metadata changed. Maintaining current version."
    );

    // Still update meta for build ID tracking
    const buildMeta = {
      version: formatVersion(currentVersion),
      buildId: `meta-${Date.now().toString(36)}`,
      deployedAt: new Date().toISOString(),
      previousVersion: formatVersion(currentVersion),
      env: "production",
      reason: "doc-only update",
    };
    writeFileSync(
      META_PATH,
      JSON.stringify(buildMeta, null, 2) + "\n",
      "utf-8"
    );
    return;
  }

  // 2. DEV MODE Check
  if (!isProduction && !forceArg) {
    console.log("\n  [DEV MODE] Skipping Version Bump (Local Build)");
    const buildMeta = {
      version: formatVersion(currentVersion),
      buildId: `dev-${Date.now().toString(36)}`,
      deployedAt: new Date().toISOString(),
      previousVersion: formatVersion(currentVersion),
      env: "development",
    };
    writeFileSync(
      META_PATH,
      JSON.stringify(buildMeta, null, 2) + "\n",
      "utf-8"
    );
    return;
  }

  // 3. Increment Logic
  let newVersion;

  if (forceArg === "--major") {
    newVersion = { major: currentVersion.major + 1, minor: 0, patch: 0 };
  } else if (forceArg === "--minor") {
    newVersion = {
      major: currentVersion.major,
      minor: currentVersion.minor + 1,
      patch: 0,
    };
  } else if (forceArg === "--patch") {
    newVersion = {
      major: currentVersion.major,
      minor: currentVersion.minor,
      patch: currentVersion.patch + 1,
    };
  } else if (gap >= 7) {
    // More than a week -> minor bump
    newVersion = {
      major: currentVersion.major,
      minor: currentVersion.minor + 1,
      patch: 0,
    };
  } else {
    // Less than a week -> patch bump
    newVersion = {
      major: currentVersion.major,
      minor: currentVersion.minor,
      patch: currentVersion.patch + 1,
    };
  }

  const versionString = formatVersion(newVersion);

  // Update package.json
  pkg.version = versionString;
  writeFileSync(PKG_PATH, JSON.stringify(pkg, null, 2) + "\n", "utf-8");

  // Generate build-meta.json
  const buildMeta = {
    version: versionString,
    buildId: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    deployedAt: new Date().toISOString(),
    previousVersion: formatVersion(currentVersion),
    daysSinceLastDeploy: gap === Infinity ? "first-deploy" : Math.round(gap),
    env: "production",
  };

  writeFileSync(META_PATH, JSON.stringify(buildMeta, null, 2) + "\n", "utf-8");

  console.log(
    `\n  Version Bump: ${formatVersion(currentVersion)} -> ${versionString}`
  );
  console.log(
    `  Strategy:    ${gap >= 7 ? "MINOR (>= 7 days)" : "PATCH (< 7 days)"}\n`
  );
}

main();
