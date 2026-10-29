/**
 * @file lint.js
 * @description Deterministic static quality and security linter.
 * Enforces syntax correctness and lightweight security rules without bulky dependencies.
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
  'src/ui-accessibility.js',
  'src/budget.js',
  'src/milestones.js',
  'src/vendors.js',
  'src/risks.js',
  'src/inventory.js',
  'src/ai.js',
  'src/storage.js',
  'scripts/lint.js'
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

    // The security helper is the sole reviewed template parsing boundary.
    const isLinterSource = file === 'scripts/lint.js';
    const isReviewedTemplateBoundary = file === 'src/security.js' && line.includes('template.innerHTML =');
    if (!isLinterSource && line.includes('.innerHTML =') && !isReviewedTemplateBoundary) {
      console.error(`❌ Security Violation in ${file}:${lineNum} — Direct DOM .innerHTML assignment detected.`);
      console.error(`   Line: ${line.trim()}`);
      console.error(`   Mitigation: Use setSanitizedHTML() or replaceChildren().`);
      issuesFound++;
    }

    // Check for eval()
    if (!isLinterSource && /\beval\s*\(/.test(line)) {
      console.error(`❌ Security Violation in ${file}:${lineNum} — Use of eval() is strictly prohibited.`);
      issuesFound++;
    }

    // Check for document.write
    if (!isLinterSource && line.includes('document.write')) {
      console.error(`❌ Security Violation in ${file}:${lineNum} — document.write is prohibited.`);
      issuesFound++;
    }
  });

  console.log(`  ✔ Verified: ${file}`);
}

// 3. UI Contract Check: every statically referenced controller ID must exist in the HTML shell.
const appSource = fs.readFileSync(path.resolve('app.js'), 'utf8');
const htmlShell = fs.readFileSync(path.resolve('index.html'), 'utf8');
const referencedIds = [...appSource.matchAll(/getElementById\('([^']+)'\)/g)]
  .map((match) => match[1])
  .filter((id) => id !== 'temp-thinking');
const missingIds = [...new Set(referencedIds)].filter((id) => !htmlShell.includes(`id="${id}"`));

if (missingIds.length > 0) {
  console.error(`❌ UI Contract Violation — app.js references missing HTML IDs: ${missingIds.join(', ')}`);
  issuesFound++;
} else {
  console.log('  ✔ Verified: app.js DOM references resolve in index.html');
}

// 4. Credential boundary: optional Gemini API keys must never be persisted.
if (/sessionStorage\.setItem\(\s*['"]planflow_session_gemini_key['"]/.test(appSource)) {
  console.error('❌ Credential Boundary Violation — Gemini API key must not be written to sessionStorage.');
  issuesFound++;
} else {
  console.log('  ✔ Verified: Gemini API key is not persisted in sessionStorage');
}

// 5. Accessibility disclosure contract: every aria-controls target must exist.
const controlledIds = [...htmlShell.matchAll(/aria-controls="([^"]+)"/g)].map((match) => match[1]);
const missingControlledIds = [...new Set(controlledIds)].filter((id) => !htmlShell.includes(`id="${id}"`));
if (missingControlledIds.length > 0) {
  console.error(`❌ Accessibility Contract Violation — aria-controls references missing IDs: ${missingControlledIds.join(', ')}`);
  issuesFound++;
} else {
  console.log('  ✔ Verified: aria-controls targets resolve in index.html');
}

console.log('\n============================================================');
if (issuesFound > 0) {
  console.error(`❌ LINT FAILED: ${issuesFound} quality/security issues detected.\n`);
  process.exit(1);
} else {
  console.log(`✨ LINT PASSED: All ${targetFiles.length} files conform to quality and security standards.\n`);
  process.exit(0);
}
