/* Applyra 3.0 — Milestone M9 Company Intelligence Transparency Strip */
function mountTransparencyBar() {
  const shell = document.querySelector('main.shell');
  const strip = shell?.querySelector('.command-strip');
  if (!shell || !strip || document.getElementById('apCompanyTransparency')) return;

  const bar = document.createElement('section');
  bar.id = 'apCompanyTransparency';
  bar.className = 'ap-opp-toolbar';
  bar.setAttribute('aria-label', 'Data provenance and scope');

  const left = document.createElement('div');
  left.className = 'ap-cc-meta';
  left.textContent = 'Evidence-backed compensation & leveling: missing employer/role data remains empty rather than estimated.';

  const right = document.createElement('div');
  right.className = 'ap-cc-meta';
  const cur = document.getElementById('currencySelect')?.value || 'INR';
  right.textContent = `Active currency: ${cur}`;

  const sel = document.getElementById('currencySelect');
  if (sel) {
    sel.addEventListener('change', () => {
      right.textContent = `Active currency: ${sel.value || 'INR'}`;
    });
  }

  bar.append(left, right);
  strip.insertAdjacentElement('afterend', bar);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountTransparencyBar);
} else {
  mountTransparencyBar();
}
