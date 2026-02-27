#!/usr/bin/env node

/**
 * Smart Version Bumper for Portfolio
 * ===================================
 * Invoked in two contexts:
 *
 *   1. [LOCAL PRE-PUSH] via Husky pre-push hook (PUSH_MODE=true)
 *      -> Performs the actual bump, writes package.json + build-meta.json
 *      -> The resulting files are committed locally BEFORE the push hits GitHub
 *
 *   2. [CI VERIFY] via GitHub Actions (CI_VERIFY=true)
 *      -> Reads the version already in package.json and only refreshes build-meta.json
 *      -> Never bumps the version number (it was already bumped by step 1)
 *      -> Never pushes a commit back to origin (eliminates the "ahead by 1" problem)
 *
 *   3. [DEV BUILD] via `bun run build` locally without env flags
 *      -> No-op. Does NOT modify any files.
 *
 * Bump rules (applied in PUSH_MODE only):
 *   - Only docs/metadata changed    -> No bump
 *   - Last deploy < 7 days ago      -> patch bump  (1.2.3 -> 1.2.4)
 *   - Last deploy >= 7 days ago     -> minor bump  (1.2.3 -> 1.3.0)
 *   - --major / --minor / --patch   -> force specific level
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const PKG_PATH = resolve(ROOT, "package.json");
const META_PATH = resolve(ROOT, "public", "build-meta.json");

// Files that alone do NOT warrant a version bump
const IGNORE_PATTERNS = [
  /^docs\//,
  /\.md$/,
  /^\.github\//,
  /^\.husky\//,
  /^\.vscode\//,
  /^\.gitignore$/,
  /^\.prettierrc$/,
  /^public\/build-meta\.json$/,
  /^package\.json$/,
  /^bun\.lock$/,
  /^README\.md$/,
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseVersion(versionStr) {
  const [major, minor, patch] = versionStr.split(".").map(Number);
  return { major: major || 0, minor: minor || 0, patch: patch || 0 };
}

function formatVersion({ major, minor, patch }) {
  return `${major}.${minor}.${patch}`;
}

function daysSince(isoDate) {
  if (!isoDate) return Infinity;
  return (Date.now() - new Date(isoDate).getTime()) / (1000 * 60 * 60 * 24);
}

function hasCodebaseChanges() {
  try {
    const changedFiles = execSync("git diff --name-only HEAD^ HEAD")
      .toString()
      .trim()
      .split("\n")
      .filter(Boolean);

    if (changedFiles.length === 0) return false;

    return changedFiles.some(
      (file) => !IGNORE_PATTERNS.some((pattern) => pattern.test(file))
    );
  } catch {
    // Fresh repo or no parent commit — assume code changed
    return true;
  }
}

// ─── Modes ────────────────────────────────────────────────────────────────────

const isPushMode = process.env.PUSH_MODE === "true";
const isCIVerify = process.env.CI_VERIFY === "true";
const forceArg = process.argv[2]; // --major | --minor | --patch

// ─── DEV BUILD: no-op ─────────────────────────────────────────────────────────

if (!isPushMode && !isCIVerify && !forceArg) {
  console.log(
    "\n  [DEV MODE] Skipping Version Bump. Not modifying build-meta.json to prevent git conflicts."
  );
  process.exit(0);
}

// ─── CI VERIFY: refresh build-meta only, no version change ───────────────────

if (isCIVerify) {
  const pkg = JSON.parse(readFileSync(PKG_PATH, "utf-8"));
  const versionString = pkg.version;

  let existingMeta = {};
  if (existsSync(META_PATH)) {
    try {
      existingMeta = JSON.parse(readFileSync(META_PATH, "utf-8"));
    } catch {}
  }

  const buildMeta = {
    ...existingMeta,
    version: versionString,
    buildId: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    deployedAt: new Date().toISOString(),
    env: "production",
  };

  writeFileSync(META_PATH, JSON.stringify(buildMeta, null, 2) + "\n", "utf-8");

  console.log(`\n  [CI VERIFY] Version confirmed: ${versionString}`);
  console.log("  build-meta.json refreshed (no version change).\n");
  process.exit(0);
}

// ─── PUSH MODE: bump version locally before the push lands on GitHub ──────────

const pkg = JSON.parse(readFileSync(PKG_PATH, "utf-8"));
const currentVersion = parseVersion(pkg.version || "1.0.0");

let lastDeployDate = null;
if (existsSync(META_PATH)) {
  try {
    const meta = JSON.parse(readFileSync(META_PATH, "utf-8"));
    lastDeployDate = meta.deployedAt;
  } catch {}
}

const gap = daysSince(lastDeployDate);
const codebaseChanged = hasCodebaseChanges();

// If only docs/metadata changed, skip the bump entirely
if (!forceArg && !codebaseChanged) {
  console.log(
    "\n  [PUSH MODE] Only documentation/metadata changed. Maintaining current version."
  );

  const buildMeta = {
    version: formatVersion(currentVersion),
    buildId: `meta-${Date.now().toString(36)}`,
    deployedAt: new Date().toISOString(),
    previousVersion: formatVersion(currentVersion),
    env: "production",
    reason: "doc-only update",
  };
  writeFileSync(META_PATH, JSON.stringify(buildMeta, null, 2) + "\n", "utf-8");
  process.exit(0);
}

// Determine new version
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
  newVersion = {
    major: currentVersion.major,
    minor: currentVersion.minor + 1,
    patch: 0,
  };
} else {
  newVersion = {
    major: currentVersion.major,
    minor: currentVersion.minor,
    patch: currentVersion.patch + 1,
  };
}

const versionString = formatVersion(newVersion);

// Write package.json
pkg.version = versionString;
writeFileSync(PKG_PATH, JSON.stringify(pkg, null, 2) + "\n", "utf-8");

// Write build-meta.json
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
  `\n  [PUSH MODE] Version Bump: ${formatVersion(currentVersion)} -> ${versionString}`
);
console.log(
  `  Strategy: ${gap >= 7 ? "MINOR (>= 7 days)" : "PATCH (< 7 days)"}\n`
);
