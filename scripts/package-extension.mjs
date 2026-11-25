import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
const version = manifest.version || '3.0.0';

const IGNORED = new Set([
  'scripts',
  'zipz',
  'node_modules',
  'modules',
  'docs',
  'releases',
  'dist',
  'supabase',
  'src',
  'web-src',
  'tests',
  'package.json',
  'package-lock.json',
  'tsconfig.json',
  'vite.config.ts',
  '.src-backup',
  '.git',
  '.gitignore'
]);

const entries = fs.readdirSync('.').filter(e => {
  if (e.startsWith('.')) return false;
  if (IGNORED.has(e)) return false;
  if (e.endsWith('.zip')) return false;
  if (e.endsWith('.md')) return false;
  if (e.endsWith('.sql')) return false;
  return true;
});

if (!fs.existsSync('releases')) {
  fs.mkdirSync('releases', { recursive: true });
}

const targetZip = path.join('releases', `Applyra-v${version}.zip`);
if (fs.existsSync(targetZip)) fs.unlinkSync(targetZip);

if (process.platform === 'win32') {
  const psScript = `Compress-Archive -Path ${entries.map(e => `"${e}"`).join(',')} -DestinationPath "${targetZip}" -Force`;
  fs.writeFileSync('scripts/_tmp_pack.ps1', psScript);
  try {
    execSync('powershell -ExecutionPolicy Bypass -File scripts/_tmp_pack.ps1', { stdio: 'inherit' });
  } finally {
    if (fs.existsSync('scripts/_tmp_pack.ps1')) fs.unlinkSync('scripts/_tmp_pack.ps1');
  }
} else {
  execSync(`zip -rq "${targetZip}" ${entries.map(e => `"${e}"`).join(' ')}`, { stdio: 'inherit' });
}

const size = fs.statSync(targetZip).size;
console.log(`[Success] Created ${targetZip} (${(size / (1024 * 1024)).toFixed(2)} MB)`);
