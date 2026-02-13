#!/usr/bin/env node

/**
 * Smart Version Bumper for Portfolio Deployments
 * ================================================
 * Rules:
 *   - If last deploy was < 7 days ago  -> patch bump (e.g. 1.2.3 -> 1.2.4)
 *   - If last deploy was >= 7 days ago -> minor bump (e.g. 1.2.3 -> 1.3.0)
 *   - Writes to package.json AND generates a build-meta.json for cache busting
 *
 * Usage:
 *   node scripts/version-bump.js          # auto-detect based on time
 *   node scripts/version-bump.js --major  # force major bump
 *   node scripts/version-bump.js --minor  # force minor bump
 *   node scripts/version-bump.js --patch  # force patch bump
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const PKG_PATH = resolve(ROOT, "package.json");
const META_PATH = resolve(ROOT, "public", "build-meta.json");

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

  let newVersion;

  if (forceArg === "--major") {
    newVersion = {
      major: currentVersion.major + 1,
      minor: 0,
      patch: 0,
    };
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

  // Generate build-meta.json (deployed to public/ so it's accessible at /build-meta.json)
  const buildMeta = {
    version: versionString,
    buildId: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    deployedAt: new Date().toISOString(),
    previousVersion: formatVersion(currentVersion),
    daysSinceLastDeploy: gap === Infinity ? "first-deploy" : Math.round(gap),
  };

  writeFileSync(META_PATH, JSON.stringify(buildMeta, null, 2) + "\n", "utf-8");

  console.log(
    `\n  Version Bump: ${formatVersion(currentVersion)} -> ${versionString}`
  );
  console.log(`  Build ID:    ${buildMeta.buildId}`);
  console.log(
    `  Gap:         ${buildMeta.daysSinceLastDeploy} days since last deploy`
  );
  console.log(
    `  Strategy:    ${gap >= 7 ? "MINOR (>= 7 days)" : "PATCH (< 7 days)"}`
  );
  console.log(`  Meta file:   public/build-meta.json\n`);
}

main();
