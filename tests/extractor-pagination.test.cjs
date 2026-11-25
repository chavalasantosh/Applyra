const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

require('../src/extractor-core.js');
const core = globalThis.NowCurryExtractorCore;

function createFakeNode(tag, text, attrs = {}) {
  return {
    tagName: tag.toUpperCase(),
    textContent: text,
    innerText: text,
    className: attrs.className || '',
    getAttribute(name) {
      if (name === 'class') return this.className;
      return attrs[name] ?? null;
    },
    hasAttribute(name) {
      return name in attrs;
    },
    disabled: Boolean(attrs.disabled),
    href: attrs.href || '',
    parentElement: null,
    querySelectorAll() { return []; },
    querySelector() { return null; }
  };
}

function createFakeDoc(nodes) {
  return {
    querySelectorAll(selector) {
      if (selector === 'a, button') return nodes;
      return nodes.filter(n => {
        if (selector.includes('styles_btn-secondary') && n.className.includes('styles_btn-secondary')) return true;
        if (selector.includes('btn-secondary') && n.className.includes('btn-secondary')) return true;
        return false;
      });
    },
    querySelector(selector) {
      const all = this.querySelectorAll(selector);
      return all.length > 0 ? all[0] : null;
    }
  };
}

test('findNextNode picks Next and strictly rejects Previous button', () => {
  const prevBtn = createFakeNode('a', 'Previous', {
    className: 'styles_btn-secondary__2As-H',
    href: 'https://www.naukri.com/jobs-9'
  });
  const nextBtn = createFakeNode('a', 'Next', {
    className: 'styles_btn-secondary__2As-H',
    href: 'https://www.naukri.com/jobs-11'
  });

  // Previous comes FIRST in DOM order
  const doc = createFakeDoc([prevBtn, nextBtn]);
  const found = core.findNextNode(doc);

  assert.equal(found, nextBtn, 'Must pick Next button, not Previous!');
  assert.equal(found.href, 'https://www.naukri.com/jobs-11');
});

test('nextPage returns exists: false when Next button is disabled on last page', () => {
  const prevBtn = createFakeNode('a', 'Previous', {
    className: 'styles_btn-secondary__2As-H',
    href: 'https://www.naukri.com/jobs-9'
  });
  const disabledNextBtn = createFakeNode('a', 'Next', {
    className: 'styles_btn-secondary__2As-H styles_btn-disabled',
    disabled: true
  });

  const doc = createFakeDoc([prevBtn, disabledNextBtn]);
  const res = core.nextPage(doc, 'https://www.naukri.com/jobs-10');

  assert.equal(res.exists, false, 'Must report exists: false when on last page');
});
