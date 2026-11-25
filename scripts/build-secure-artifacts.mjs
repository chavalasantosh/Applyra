import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ROOT_DIR = process.cwd();
const SRC_DIR = path.join(ROOT_DIR, 'src');
const BACKUP_DIR = SRC_DIR;

console.log('=== Applyra Single-Bundle Zero-Exposure Security Pipeline ===');

// 1. Ensure source directory exists
if (!fs.existsSync(SRC_DIR)) {
  fs.mkdirSync(SRC_DIR, { recursive: true });
}
if (!fs.existsSync(path.join(SRC_DIR, 'assets'))) {
  fs.mkdirSync(path.join(SRC_DIR, 'assets'), { recursive: true });
}

// 2. Discover and backup any missing originals
const rootJsFiles = fs.readdirSync(ROOT_DIR).filter(f => f.endsWith('.js') && !f.startsWith('.'));
for (const f of rootJsFiles) {
  const src = path.join(ROOT_DIR, f);
  const dst = path.join(BACKUP_DIR, f);
  if (fs.existsSync(src) && !fs.existsSync(dst)) {
    fs.copyFileSync(src, dst);
  }
}

// Helper to assemble monolithic bundles from .src-backup
function assembleBundle(outputFilename, parts, prefix = '') {
  console.log(`[Bundle] Assembling ${outputFilename}...`);
  let content = prefix ? prefix + '\n' : '';
  for (const part of parts) {
    const srcPath = path.join(BACKUP_DIR, part);
    if (fs.existsSync(srcPath)) {
      content += `\n// --- ${part} ---\n` + fs.readFileSync(srcPath, 'utf8') + '\n';
    } else {
      console.warn(`[Bundle] Warning: Part ${part} not found in ${BACKUP_DIR}!`);
    }
  }
  fs.writeFileSync(path.join(ROOT_DIR, outputFilename), content, 'utf8');
  console.log(`[Bundle] Assembled ${outputFilename} (${content.length} bytes).`);
}

// 3. Assemble background.js
console.log('[Bundle] Assembling monolithic background.js...');
const bgCoreScripts = [
  'storage-vault.js',
  'message-safe.js',
  'storage-registry.js',
  'migration-core.js',
  'job-radar-core.js',
  'universal-career-core.js',
  'question-intelligence-core.js',
  'candidate-memory-core.js',
  'team-core.js',
  'portal-adapters.js',
  'multi-portal-core.js',
  'diagnostics-core.js',
  'naukri-auto-apply-core.js',
  'business-core.js',
  'security-core.js',
  'auth-core.js',
  'admin-core.js',
  'cloud-sync-core.js',
  'production-readiness-core.js'
];
let unifiedBgContent = '/* Applyra Unified Production Background Worker */\n';
for (const s of bgCoreScripts) {
  const p = path.join(BACKUP_DIR, s);
  if (fs.existsSync(p)) {
    unifiedBgContent += fs.readFileSync(p, 'utf8') + '\n';
  }
}
const origBgContent = fs.readFileSync(path.join(BACKUP_DIR, 'background.js'), 'utf8');
const bgLogic = origBgContent.replace(/importScripts\s*\([^)]*\);?/s, '');
unifiedBgContent += bgLogic;
unifiedBgContent += '\n/* Applyra Clean Injected Tab Bridges */\n' + fs.readFileSync(path.join(SRC_DIR, 'injected-bridges.js'), 'utf8');
fs.writeFileSync(path.join(ROOT_DIR, 'background.js'), unifiedBgContent, 'utf8');
console.log(`[Bundle] Assembled background.js (${unifiedBgContent.length} bytes).`);

// 4. Assemble content.js
assembleBundle('content.js', [
  'message-safe.js',
  'extractor-core.js',
  'content.js'
], '/* Applyra Unified Production Content Script */');

// 5. Assemble popup.js
assembleBundle('popup.js', [
  'storage-vault.js',
  'access-control.js',
  'message-safe.js',
  'download-toast.js',
  'popup.js'
], '/* Applyra Unified Production Popup Script */');

// 6. Assemble assets/dashboard-runtime.js
const dashboardComponents = [
  'message-safe.js',
  'storage-vault.js',
  'access-control.js',
  'download-toast.js',
  'user-profile-widget.js',
  'dashboard-radar.js',
  'extractor-universal.js',
  'dashboard-overview.js'
];
let dashboardContent = `/* Applyra Unified Production Runtime - Proprietary & Confidential */\n`;
for (const comp of dashboardComponents) {
  const p = path.join(BACKUP_DIR, comp);
  if (fs.existsSync(p)) {
    dashboardContent += `\n// --- ${comp} ---\ntry {\n${fs.readFileSync(p, 'utf8')}\n} catch(e) { console.error('[Applyra] ${comp} init error:', e); }\n`;
  }
}
fs.writeFileSync(path.join(ROOT_DIR, 'assets', 'dashboard-runtime.js'), dashboardContent, 'utf8');
console.log(`[Bundle] Assembled assets/dashboard-runtime.js (${dashboardContent.length} bytes).`);

// 7. Assemble all Standalone HTML Page Monolithic Bundles
assembleBundle('apply-engine.js', [
  'message-safe.js',
  'storage-vault.js',
  'access-control.js',
  'storage-registry.js',
  'portal-adapters.js',
  'candidate-memory-core.js',
  'team-core.js',
  'multi-portal-core.js',
  'apply-engine-core.js',
  'business-core.js',
  'cloud-sync-core.js',
  'production-readiness-core.js',
  'download-toast.js',
  'applyra-toolkit-bridge.js',
  'apply-engine.js'
], '/* Applyra Automation Center Monolithic Bundle */');

assembleBundle('career-suite.js', [
  'message-safe.js',
  'storage-vault.js',
  'access-control.js',
  'storage-registry.js',
  'candidate-memory-core.js',
  'team-core.js',
  'career-suite-core.js',
  'download-toast.js',
  'career-suite.js'
], '/* Applyra Career Suite Monolithic Bundle */');

assembleBundle('company-intel.js', [
  'message-safe.js',
  'storage-vault.js',
  'access-control.js',
  'download-toast.js',
  'company-intel-core.js',
  'company-intel.js'
], '/* Applyra Company & Comp Intel Monolithic Bundle */');

assembleBundle('naukri-profile.js', [
  'message-safe.js',
  'storage-vault.js',
  'access-control.js',
  'download-toast.js',
  'naukri-profile.js'
], '/* Applyra Naukri Profile Monolithic Bundle */');

assembleBundle('admin.js', [
  'message-safe.js',
  'storage-vault.js',
  'access-control.js',
  'auth-core.js',
  'admin-core.js',
  'billing-core.js',
  'download-toast.js',
  'user-profile-widget.js',
  'admin.js'
], '/* Applyra Admin Console Monolithic Bundle */');

assembleBundle('billing.js', [
  'message-safe.js',
  'storage-vault.js',
  'access-control.js',
  'auth-core.js',
  'billing-core.js',
  'payment-providers-core.js',
  'billing.js'
], '/* Applyra Billing Monolithic Bundle */');

assembleBundle('auth.js', [
  'message-safe.js',
  'storage-vault.js',
  'access-control.js',
  'auth-core.js',
  'auth.js'
], '/* Applyra Authentication Monolithic Bundle */');

assembleBundle('onboarding.js', [
  'message-safe.js',
  'storage-vault.js',
  'access-control.js',
  'onboarding.js'
], '/* Applyra Onboarding Monolithic Bundle */');

assembleBundle('test-lab.js', [
  'message-safe.js',
  'storage-vault.js',
  'access-control.js',
  'portal-adapters.js',
  'question-intelligence-core.js',
  'extractor-core.js',
  'test-lab.js'
], '/* Applyra Test Lab Monolithic Bundle */');

// Copy offscreen.js and safety fallback scripts from backup
const FALLBACK_FILES = ['offscreen.js', 'extractor-core.js', 'message-safe.js', 'applyra-toolkit-bridge.js', 'theme-controls.js'];
for (const f of FALLBACK_FILES) {
  if (fs.existsSync(path.join(BACKUP_DIR, f))) {
    fs.copyFileSync(path.join(BACKUP_DIR, f), path.join(ROOT_DIR, f));
    console.log(`[Bundle] Preserved fallback ${f}.`);
  }
}

// 8. Purge ALL loose/redundant core files AND legacy auth-guard from root distribution
const UNUSED_LOOSE_FILES = [
  'admin-core.js',
  'apply-engine-core.js',
  'auth-core.js',
  'auth-effects.js',
  'auth-guard.js',
  'billing-core.js',
  'business-core.js',
  'candidate-memory-core.js',
  'career-suite-core.js',
  'cloud-sync-core.js',
  'company-intel-core.js',
  'diagnostics-core.js',
  'extractor-universal.js',
  'job-radar-core.js',
  'migration-core.js',
  'multi-portal-core.js',
  'naukri-auto-apply-core.js',
  'payment-providers-core.js',
  'portal-adapters.js',
  'production-readiness-core.js',
  'question-intelligence-core.js',
  'security-core.js',
  'storage-registry.js',
  'storage-vault.js',
  'team-core.js',
  'universal-career-core.js',
  'access-control.js',
  'dashboard-overview.js',
  'dashboard-radar.js',
  'download-toast.js',
  'frame-buster.js',
  'user-profile-widget.js',
  'theme-controls.js',
  'app-sidebar.js'
];

let purgedCount = 0;
for (const uf of UNUSED_LOOSE_FILES) {
  const target = path.join(ROOT_DIR, uf);
  if (fs.existsSync(target)) {
    fs.unlinkSync(target);
    purgedCount++;
  }
}
console.log(`[Clean] Purged ${purgedCount} unneeded loose files from root distribution.`);

// 9. Obfuscate ALL production target bundles (excluding browser runtime assets to prevent memory limits)
const PRODUCTION_BUNDLES = [
  'background.js',
  'content.js',
  'popup.js',
  'apply-engine.js',
  'career-suite.js',
  'company-intel.js',
  'naukri-profile.js',
  'admin.js',
  'billing.js',
  'auth.js',
  'onboarding.js',
  'test-lab.js',
  'offscreen.js'
];

for (const b of PRODUCTION_BUNDLES) {
  const p = path.join(ROOT_DIR, b);
  if (fs.existsSync(p)) {
    console.log(`[Obfuscate] Hardening ${b}...`);
    const cmd = `npx javascript-obfuscator "${p}" -o "${p}" --target browser-no-eval --compact true --control-flow-flattening false --dead-code-injection false --string-array true --string-array-encoding base64 --string-array-threshold 0.5 --rename-globals false --self-defending false --debug-protection false --disable-console-output false`;
    execSync(cmd, { cwd: ROOT_DIR, stdio: 'inherit' });
    if (b === 'background.js') {
      const bridgePath = path.join(SRC_DIR, 'injected-bridges.js');
      if (fs.existsSync(bridgePath)) {
        const bridgeContent = fs.readFileSync(bridgePath, 'utf8');
        fs.appendFileSync(p, '\n\n/* Applyra Clean Injected Tab Bridges */\n' + bridgeContent, 'utf8');
        fs.copyFileSync(bridgePath, path.join(ROOT_DIR, 'injected-bridges.js'));
        console.log(`[Bridge] Appended pristine tab-injected bridges to ${b}.`);
      }
    }
  }
}

// Sync React dashboard bundle assets/main-5HBZNLr_.js
const mainPath = path.join(ROOT_DIR, 'assets', 'main-5HBZNLr_.js');
const origMain = path.join(BACKUP_DIR, 'assets', 'main-5HBZNLr_.js');
if (fs.existsSync(origMain)) {
  fs.copyFileSync(origMain, mainPath);
  console.log(`[Bundle] Preserved React bundle assets/main-5HBZNLr_.js.`);
}

console.log('=== All files assembled into monolithic zero-exposure bundles! ===');

// Publish scheduled opportunity modules alongside the existing production bundles.
fs.mkdirSync(path.join(ROOT_DIR, 'assets', 'opportunities'), {recursive:true});
for (const name of ['core','worker','ui']) {
  fs.copyFileSync(path.join(SRC_DIR, `opportunity-${name}.js`), path.join(ROOT_DIR, 'assets', 'opportunities', `opportunity-${name}.js`));
}
