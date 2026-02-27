#!/usr/bin/env node

/**
 * Conventional Commits Version Bumper
 * =====================================
 * Determines the version bump level by parsing commit messages since the last
 * push to origin/main. Uses the Conventional Commits specification.
 *
 * Rules (evaluated against all commits in the current push batch):
 *   MAJOR  <- any commit with `!` suffix or `BREAKING CHANGE:` footer
 *   MINOR  <- any `feat:` commit (when no breaking change detected)
 *   PATCH  <- any `fix:` / `perf:` / `refactor:` / `style:` commit
 *   NONE   <- only `docs:` / `chore:` / `test:` commits (no code change)
 *
 * The highest severity in the batch wins. MAJOR > MINOR > PATCH > NONE.
 *
 * Invocation modes:
 *   PUSH_MODE=true   -> Bumps version + writes package.json + build-meta.json
 *   CI_VERIFY=true   -> Read-only verify, only refreshes deployedAt timestamp
 *   (neither)        -> DEV BUILD no-op, exits immediately
 *   --major / --minor / --patch -> Force a specific level (overrides detection)
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const PKG_PATH = resolve(ROOT, "package.json");
const META_PATH = resolve(ROOT, "public", "build-meta.json");

// Commit types that carry zero version weight
const NO_BUMP_TYPES = new Set([
  "docs",
  "chore",
  "test",
  "ci",
  "build",
  "revert",
]);

// Commit types that constitute a PATCH
const PATCH_TYPES = new Set(["fix", "perf", "refactor", "style"]);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseVersion(versionStr) {
  const [major, minor, patch] = (versionStr || "1.0.0").split(".").map(Number);
  return { major: major || 0, minor: minor || 0, patch: patch || 0 };
}

function formatVersion({ major, minor, patch }) {
  return `${major}.${minor}.${patch}`;
}

/**
 * Parse a single conventional commit subject line.
 * Returns: "major" | "minor" | "patch" | "none"
 */
function classifyCommit(subject, body = "") {
  // BREAKING CHANGE in body footer always means major
  if (body.includes("BREAKING CHANGE:")) return "major";

  // Conventional commit pattern: type(scope)!: description
  // The `!` before the colon signals a breaking change regardless of type
  const match = subject.match(/^(\w+)(\([^)]*\))?(!)?:/);
  if (!match) return "none"; // Not a conventional commit — treat as no bump

  const type = match[1].toLowerCase();
  const isBreaking = !!match[3]; // `!` present

  if (isBreaking) return "major";
  if (type === "feat") return "minor";
  if (PATCH_TYPES.has(type)) return "patch";
  if (NO_BUMP_TYPES.has(type)) return "none";

  return "none";
}

/**
 * Severity ordering for comparison.
 */
const SEVERITY = { none: 0, patch: 1, minor: 2, major: 3 };

/**
 * Scan all commits between origin/main and local HEAD.
 * Returns the highest-severity bump level required.
 */
function detectBumpLevel() {
  let rawLog;
  try {
    // --format="%s%n%b%n---COMMIT---" gives us subject + body per commit
    rawLog = execSync(
      'git log origin/main..HEAD --format="%s%n%b%n---COMMIT---"',
      { encoding: "utf-8" }
    );
  } catch {
    try {
      // Fallback: no origin/main (fresh clone or first push)
      rawLog = execSync('git log HEAD -1 --format="%s%n%b%n---COMMIT---"', {
        encoding: "utf-8",
      });
    } catch {
      // Cannot determine — default to patch to be safe
      return "patch";
    }
  }

  const commits = rawLog.split("---COMMIT---").filter((c) => c.trim());

  if (commits.length === 0) {
    console.log("  [Versioning] No commits found since origin/main.");
    return "none";
  }

  let highestLevel = "none";

  for (const commit of commits) {
    const lines = commit.trim().split("\n");
    const subject = lines[0] || "";
    const body = lines.slice(1).join("\n");

    const level = classifyCommit(subject, body);

    console.log(
      `  [Versioning] "${subject.slice(0, 60)}" -> ${level.toUpperCase()}`
    );

    if (SEVERITY[level] > SEVERITY[highestLevel]) {
      highestLevel = level;
    }

    // Short-circuit: can't go higher than major
    if (highestLevel === "major") break;
  }

  return highestLevel;
}

/**
 * Apply the bump level to a version object.
 * Returns a new version object — does NOT mutate the input.
 */
function applyBump(current, level) {
  switch (level) {
    case "major":
      return { major: current.major + 1, minor: 0, patch: 0 };
    case "minor":
      return { major: current.major, minor: current.minor + 1, patch: 0 };
    case "patch":
      return {
        major: current.major,
        minor: current.minor,
        patch: current.patch + 1,
      };
    default:
      return { ...current }; // "none" — no change
  }
}

// ─── Mode Resolution ──────────────────────────────────────────────────────────

const isPushMode = process.env.PUSH_MODE === "true";
const isCIVerify = process.env.CI_VERIFY === "true";
const forceArg = process.argv[2]; // --major | --minor | --patch

// ─── DEV BUILD: complete no-op ────────────────────────────────────────────────

if (!isPushMode && !isCIVerify && !forceArg) {
  console.log(
    "\n  [DEV MODE] Skipping version bump. build-meta.json unchanged.\n"
  );
  process.exit(0);
}

// ─── CI VERIFY: refresh deployedAt, confirm version, never bump ───────────────

if (isCIVerify) {
  const pkg = JSON.parse(readFileSync(PKG_PATH, "utf-8"));

  let existingMeta = {};
  if (existsSync(META_PATH)) {
    try {
      existingMeta = JSON.parse(readFileSync(META_PATH, "utf-8"));
    } catch {}
  }

  const buildMeta = {
    ...existingMeta,
    version: pkg.version,
    buildId: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    deployedAt: new Date().toISOString(),
    env: "production",
  };

  writeFileSync(META_PATH, JSON.stringify(buildMeta, null, 2) + "\n", "utf-8");
  console.log(`\n  [CI VERIFY] Confirmed: v${pkg.version}\n`);
  process.exit(0);
}

// ─── PUSH MODE: Conventional Commits detection + actual bump ──────────────────

const pkg = JSON.parse(readFileSync(PKG_PATH, "utf-8"));
const currentVersion = parseVersion(pkg.version);

// Determine bump level: force arg overrides auto-detection
const bumpLevel = forceArg
  ? forceArg.replace("--", "") // "--major" -> "major"
  : detectBumpLevel();

if (bumpLevel === "none") {
  console.log(
    "\n  [PUSH MODE] No version bump required (docs/chore/test commits only).\n"
  );

  // Still refresh build-meta so deployedAt stays accurate
  const existingMeta = existsSync(META_PATH)
    ? JSON.parse(readFileSync(META_PATH, "utf-8") || "{}")
    : {};

  writeFileSync(
    META_PATH,
    JSON.stringify(
      {
        ...existingMeta,
        version: formatVersion(currentVersion),
        buildId: `meta-${Date.now().toString(36)}`,
        deployedAt: new Date().toISOString(),
        env: "production",
        reason: "no-code-change",
      },
      null,
      2
    ) + "\n",
    "utf-8"
  );
  process.exit(0);
}

const newVersion = applyBump(currentVersion, bumpLevel);
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
  bumpLevel,
  env: "production",
};
writeFileSync(META_PATH, JSON.stringify(buildMeta, null, 2) + "\n", "utf-8");

console.log(
  `\n  [PUSH MODE] ${formatVersion(currentVersion)} -> ${versionString} (${bumpLevel.toUpperCase()} bump)`
);
console.log(`  Reason: Conventional Commits analysis of push batch\n`);