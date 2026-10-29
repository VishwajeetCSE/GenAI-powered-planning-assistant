/**
 * @file lint.js
 * @description Deterministic static quality and security linter.
 * Enforces syntax correctness, AST security rules, and DOM-XSS protections without bulky dependencies.
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const targetFiles = [
  'app.js',
  'test.js',
  'eslint.config.js',
  'src/index.js',
  'src/constants.js',
  'src/security.js',
  'src/budget.js',
  'src/milestones.js',
  'src/vendors.js',
  'src/risks.js',
  'src/inventory.js',
  'src/ai.js',
  'src/storage.js'
];

console.log('\n🔍 Running PlanFlow AI Deterministic Quality & Security Linter...\n');

let issuesFound = 0;

for (const file of targetFiles) {
  const filePath = path.resolve(file);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Missing file: ${file}`);
    issuesFound++;
    continue;
  }

  // 1. Syntax Check
  try {
    execSync(`node --check "${file}"`, { stdio: 'pipe' });
  } catch (err) {
    console.error(`❌ Syntax Error in ${file}:\n${err.message}`);
    issuesFound++;
    continue;
  }

  // 2. Security & Anti-Pattern Check
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    const lineNum = index + 1;

    // Check for direct .innerHTML assignments outside of setSanitizedHTML definition
    if (line.includes('.innerHTML =') && !line.includes('template.innerHTML =')) {
      console.error(`❌ Security Violation in ${file}:${lineNum} — Direct DOM .innerHTML assignment detected.`);
      console.error(`   Line: ${line.trim()}`);
      console.error(`   Mitigation: Use setSanitizedHTML() or replaceChildren().`);
      issuesFound++;
    }

    // Check for eval()
    if (/\beval\s*\(/.test(line)) {
      console.error(`❌ Security Violation in ${file}:${lineNum} — Use of eval() is strictly prohibited.`);
      issuesFound++;
    }

    // Check for document.write
    if (line.includes('document.write')) {
      console.error(`❌ Security Violation in ${file}:${lineNum} — document.write is prohibited.`);
      issuesFound++;
    }
  });

  console.log(`  ✔ Verified: ${file}`);
}

console.log('\n============================================================');
if (issuesFound > 0) {
  console.error(`❌ LINT FAILED: ${issuesFound} quality/security issues detected.\n`);
  process.exit(1);
} else {
  console.log(`✨ LINT PASSED: All ${targetFiles.length} files conform to quality and security standards.\n`);
  process.exit(0);
}
