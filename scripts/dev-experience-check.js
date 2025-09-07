#!/usr/bin/env node

/**
 * Development Experience Optimization Check
 * Validates and optimizes the development environment for Bun + Vite
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

console.log(`${colors.cyan}${colors.bright}🚀 Development Experience Optimization Check${colors.reset}\n`);

// Check functions
const checks = {
  viteConfig: () => {
    const viteConfigPath = path.join(projectRoot, 'vite.config.js');
    if (!fs.existsSync(viteConfigPath)) {
      return { status: 'error', message: 'vite.config.js not found' };
    }

    const config = fs.readFileSync(viteConfigPath, 'utf8');
    const optimizations = [
      { check: config.includes('hmr:'), name: 'HMR Configuration' },
      { check: config.includes('sourcemap:'), name: 'Source Maps' },
      { check: config.includes('host: true'), name: 'Network Access' },
      { check: config.includes('optimizeDeps:'), name: 'Dependency Optimization' },
    ];

    const passed = optimizations.filter(opt => opt.check).length;
    const total = optimizations.length;

    return {
      status: passed === total ? 'success' : 'warning',
      message: `${passed}/${total} optimizations configured`,
      details: optimizations
    };
  },

  bunConfig: () => {
    const bunConfigPath = path.join(projectRoot, 'bunfig.toml');
    if (!fs.existsSync(bunConfigPath)) {
      return { status: 'warning', message: 'bunfig.toml not found - using defaults' };
    }

    const config = fs.readFileSync(bunConfigPath, 'utf8');
    const optimizations = [
      { check: config.includes('[install]'), name: 'Install Configuration' },
      { check: config.includes('cache = true'), name: 'Caching Enabled' },
      { check: config.includes('[run]'), name: 'Runtime Configuration' },
      { check: config.includes('hot = true'), name: 'Hot Reload' },
    ];

    const passed = optimizations.filter(opt => opt.check).length;
    const total = optimizations.length;

    return {
      status: passed >= 2 ? 'success' : 'warning',
      message: `${passed}/${total} Bun optimizations configured`,
      details: optimizations
    };
  },

  packageScripts: () => {
    const packagePath = path.join(projectRoot, 'package.json');
    if (!fs.existsSync(packagePath)) {
      return { status: 'error', message: 'package.json not found' };
    }

    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const scripts = pkg.scripts || {};
    
    const requiredScripts = [
      { name: 'dev', check: scripts.dev && scripts.dev.includes('vite') },
      { name: 'build', check: scripts.build && scripts.build.includes('vite build') },
      { name: 'preview', check: scripts.preview && scripts.preview.includes('vite preview') },
      { name: 'lint', check: scripts.lint && scripts.lint.includes('eslint') },
    ];

    const passed = requiredScripts.filter(script => script.check).length;
    const total = requiredScripts.length;

    return {
      status: passed === total ? 'success' : 'warning',
      message: `${passed}/${total} essential scripts configured`,
      details: requiredScripts
    };
  },

  eslintConfig: () => {
    const eslintConfigPath = path.join(projectRoot, '.eslintrc.cjs');
    if (!fs.existsSync(eslintConfigPath)) {
      return { status: 'warning', message: 'ESLint config not found' };
    }

    const config = fs.readFileSync(eslintConfigPath, 'utf8');
    const optimizations = [
      { check: config.includes('react/jsx-runtime'), name: 'Modern JSX Runtime' },
      { check: config.includes('react-refresh'), name: 'React Refresh Plugin' },
      { check: config.includes('no-unused-vars'), name: 'Unused Variables Check' },
      { check: config.includes('globals:'), name: 'Global Variables Defined' },
    ];

    const passed = optimizations.filter(opt => opt.check).length;
    const total = optimizations.length;

    return {
      status: passed >= 3 ? 'success' : 'warning',
      message: `${passed}/${total} ESLint optimizations configured`,
      details: optimizations
    };
  },

  tsConfig: () => {
    const tsConfigPath = path.join(projectRoot, 'tsconfig.json');
    if (!fs.existsSync(tsConfigPath)) {
      return { status: 'warning', message: 'TypeScript config not found - JavaScript only' };
    }

    const config = fs.readFileSync(tsConfigPath, 'utf8');
    const optimizations = [
      { check: config.includes('"jsx": "react-jsx"'), name: 'Modern JSX Transform' },
      { check: config.includes('"moduleResolution": "bundler"'), name: 'Bundler Module Resolution' },
      { check: config.includes('"paths":'), name: 'Path Mapping' },
      { check: config.includes('"skipLibCheck": true'), name: 'Skip Lib Check' },
    ];

    const passed = optimizations.filter(opt => opt.check).length;
    const total = optimizations.length;

    return {
      status: passed >= 3 ? 'success' : 'warning',
      message: `${passed}/${total} TypeScript optimizations configured`,
      details: optimizations
    };
  }
};

// Run all checks
const results = {};
let totalScore = 0;
let maxScore = 0;

console.log(`${colors.bright}Running Development Experience Checks...${colors.reset}\n`);

for (const [checkName, checkFn] of Object.entries(checks)) {
  try {
    const result = checkFn();
    results[checkName] = result;
    
    const icon = result.status === 'success' ? '✅' : 
                 result.status === 'warning' ? '⚠️' : '❌';
    
    const color = result.status === 'success' ? colors.green : 
                  result.status === 'warning' ? colors.yellow : colors.red;
    
    console.log(`${icon} ${color}${checkName}${colors.reset}: ${result.message}`);
    
    if (result.details) {
      result.details.forEach(detail => {
        const detailIcon = detail.check ? '  ✓' : '  ✗';
        const detailColor = detail.check ? colors.green : colors.red;
        console.log(`${detailIcon} ${detailColor}${detail.name}${colors.reset}`);
      });
    }
    
    if (result.status === 'success') totalScore += 2;
    else if (result.status === 'warning') totalScore += 1;
    maxScore += 2;
    
    console.log();
  } catch (error) {
    console.log(`❌ ${colors.red}${checkName}${colors.reset}: Error - ${error.message}\n`);
    results[checkName] = { status: 'error', message: error.message };
    maxScore += 2;
  }
}

// Summary
const percentage = Math.round((totalScore / maxScore) * 100);
const grade = percentage >= 90 ? 'A' : percentage >= 80 ? 'B' : percentage >= 70 ? 'C' : 'D';
const gradeColor = percentage >= 90 ? colors.green : percentage >= 80 ? colors.yellow : colors.red;

console.log(`${colors.bright}📊 Development Experience Score: ${gradeColor}${percentage}% (Grade ${grade})${colors.reset}\n`);

// Recommendations
console.log(`${colors.bright}💡 Recommendations:${colors.reset}`);
if (percentage >= 90) {
  console.log(`${colors.green}✨ Excellent! Your development environment is optimally configured.${colors.reset}`);
} else {
  console.log(`${colors.yellow}🔧 Consider addressing the warnings above to improve your development experience.${colors.reset}`);
}

console.log(`\n${colors.cyan}🚀 Development environment check complete!${colors.reset}`);
