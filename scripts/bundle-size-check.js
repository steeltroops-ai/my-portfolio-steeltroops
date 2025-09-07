#!/usr/bin/env node

/**
 * Bundle Size Monitoring Script
 * Analyzes build output and alerts if bundle sizes exceed thresholds
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Bundle size thresholds (in KB)
const THRESHOLDS = {
  // Main application bundle
  index: 500, // 500KB
  // Vendor libraries
  vendor: 800, // 800KB
  // Individual chunks
  chunk: 300, // 300KB per chunk
  // CSS files
  css: 100, // 100KB
  // Total bundle size
  total: 2000, // 2MB total
};

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

function formatSize(bytes) {
  const kb = bytes / 1024;
  const mb = kb / 1024;

  if (mb >= 1) {
    return `${mb.toFixed(2)} MB`;
  }
  return `${kb.toFixed(2)} KB`;
}

function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    return 0;
  }
}

function analyzeBundleSize() {
  const distPath = path.join(__dirname, "../dist");

  if (!fs.existsSync(distPath)) {
    console.error(
      `${colors.red}❌ Build directory not found. Run 'bun run build' first.${colors.reset}`
    );
    return false;
  }

  console.log(`${colors.cyan}📊 Bundle Size Analysis${colors.reset}\n`);

  const files = fs.readdirSync(distPath, { recursive: true });
  const jsFiles = files.filter((file) => file.endsWith(".js"));
  const cssFiles = files.filter((file) => file.endsWith(".css"));

  let totalSize = 0;
  let warnings = [];
  let errors = [];

  // Analyze JavaScript files
  console.log(`${colors.blue}JavaScript Files:${colors.reset}`);
  jsFiles.forEach((file) => {
    const filePath = path.join(distPath, file);
    const size = getFileSize(filePath);
    const sizeKB = size / 1024;
    totalSize += size;

    let status = colors.green + "✓";
    let threshold = THRESHOLDS.chunk;

    // Determine appropriate threshold
    if (file.includes("index")) {
      threshold = THRESHOLDS.index;
    } else if (file.includes("vendor")) {
      threshold = THRESHOLDS.vendor;
    }

    if (sizeKB > threshold) {
      status = colors.red + "❌";
      errors.push(
        `${file}: ${formatSize(size)} (exceeds ${threshold}KB threshold)`
      );
    } else if (sizeKB > threshold * 0.8) {
      status = colors.yellow + "⚠️";
      warnings.push(
        `${file}: ${formatSize(size)} (approaching ${threshold}KB threshold)`
      );
    }

    console.log(`  ${status} ${file}: ${formatSize(size)}${colors.reset}`);
  });

  // Analyze CSS files
  console.log(`\n${colors.blue}CSS Files:${colors.reset}`);
  cssFiles.forEach((file) => {
    const filePath = path.join(distPath, file);
    const size = getFileSize(filePath);
    const sizeKB = size / 1024;
    totalSize += size;

    let status = colors.green + "✓";
    if (sizeKB > THRESHOLDS.css) {
      status = colors.red + "❌";
      errors.push(
        `${file}: ${formatSize(size)} (exceeds ${THRESHOLDS.css}KB threshold)`
      );
    } else if (sizeKB > THRESHOLDS.css * 0.8) {
      status = colors.yellow + "⚠️";
      warnings.push(
        `${file}: ${formatSize(size)} (approaching ${
          THRESHOLDS.css
        }KB threshold)`
      );
    }

    console.log(`  ${status} ${file}: ${formatSize(size)}${colors.reset}`);
  });

  // Total size analysis
  const totalSizeKB = totalSize / 1024;
  console.log(
    `\n${colors.magenta}Total Bundle Size: ${formatSize(totalSize)}${
      colors.reset
    }`
  );

  if (totalSizeKB > THRESHOLDS.total) {
    errors.push(
      `Total bundle size ${formatSize(totalSize)} exceeds ${
        THRESHOLDS.total
      }KB threshold`
    );
  } else if (totalSizeKB > THRESHOLDS.total * 0.8) {
    warnings.push(
      `Total bundle size ${formatSize(totalSize)} approaching ${
        THRESHOLDS.total
      }KB threshold`
    );
  }

  // Display warnings and errors
  if (warnings.length > 0) {
    console.log(`\n${colors.yellow}⚠️  Warnings:${colors.reset}`);
    warnings.forEach((warning) =>
      console.log(`  ${colors.yellow}• ${warning}${colors.reset}`)
    );
  }

  if (errors.length > 0) {
    console.log(`\n${colors.red}❌ Errors:${colors.reset}`);
    errors.forEach((error) =>
      console.log(`  ${colors.red}• ${error}${colors.reset}`)
    );
  }

  // Performance recommendations
  console.log(`\n${colors.cyan}💡 Performance Recommendations:${colors.reset}`);

  if (totalSizeKB > 1000) {
    console.log(
      `  ${colors.yellow}• Consider code splitting for better performance${colors.reset}`
    );
  }

  if (
    jsFiles.some((file) => getFileSize(path.join(distPath, file)) / 1024 > 400)
  ) {
    console.log(
      `  ${colors.yellow}• Large JavaScript chunks detected - consider lazy loading${colors.reset}`
    );
  }

  if (
    cssFiles.some((file) => getFileSize(path.join(distPath, file)) / 1024 > 80)
  ) {
    console.log(
      `  ${colors.yellow}• Large CSS files detected - consider critical CSS extraction${colors.reset}`
    );
  }

  console.log(
    `  ${colors.green}• Use 'npm run analyze' to visualize bundle composition${colors.reset}`
  );
  console.log(
    `  ${colors.green}• Enable gzip compression on your server for better performance${colors.reset}`
  );

  // Return status based on results
  if (errors.length > 0) {
    console.log(
      `\n${colors.red}Bundle size check failed with ${errors.length} error(s).${colors.reset}`
    );
    return false;
  } else if (warnings.length > 0) {
    console.log(
      `\n${colors.yellow}Bundle size check completed with ${warnings.length} warning(s).${colors.reset}`
    );
  } else {
    console.log(`\n${colors.green}✅ Bundle size check passed!${colors.reset}`);
  }
}

// Run the analysis
analyzeBundleSize();
