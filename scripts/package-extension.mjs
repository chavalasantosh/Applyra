import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

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

const targetZip = path.join('releases', 'Applyra-v2.8.0.zip');
const psScript = `Compress-Archive -Path ${entries.map(e => `"${e}"`).join(',')} -DestinationPath "${targetZip}" -Force`;
fs.writeFileSync('scripts/_tmp_pack.ps1', psScript);

try {
  execSync('powershell -ExecutionPolicy Bypass -File scripts/_tmp_pack.ps1', { stdio: 'inherit' });
  const size = fs.statSync(targetZip).size;
  console.log(`[Success] Created ${targetZip} (${(size / (1024 * 1024)).toFixed(2)} MB)`);
} finally {
  if (fs.existsSync('scripts/_tmp_pack.ps1')) {
    fs.unlinkSync('scripts/_tmp_pack.ps1');
  }
}

