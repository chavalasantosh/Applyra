import fs from 'node:fs';

let code = fs.readFileSync('src/apply-engine.js', 'utf8');

code = code.replace(
  'function renderProviders(){',
  "function renderProviders(){\n    if(!$('discoveryProviders')) return;"
);

code = code.replace(
  'function renderDiagnostics(){',
  "function renderDiagnostics(){\n    if(!$('diagSummary')) return;"
);

code = code.replace(
  "$('diagRefreshBtn').addEventListener('click',refreshDiagnostics); $('diagCopyBtn').addEventListener('click',copyDiagnostics); $('testLabBtn').addEventListener('click',openTestLab);",
  "$('diagRefreshBtn')?.addEventListener('click',refreshDiagnostics); $('diagCopyBtn')?.addEventListener('click',copyDiagnostics); $('testLabBtn')?.addEventListener('click',openTestLab);"
);

fs.writeFileSync('src/apply-engine.js', code, 'utf8');
console.log('src/apply-engine.js safely updated.');
