import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const code = readFileSync(resolve(root, 'github-search-assistant.user.js'), 'utf8');

function makeDom() {
  const html = `<!doctype html><html data-color-mode="light"><head></head><body>
    <header class="AppHeader"><div role="search"><button class="header-search-button" aria-label="Search GitHub">Search</button></div></header>
    <main id="main"><input name="q" id="search-input"><input name="q2" id="in-page-search"></main>
  </body></html>`;
  const dom = new JSDOM(html, { runScripts: 'outside-only', pretendToBeVisual: true, url: 'https://github.com/' });
  const w = dom.window;
  w.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
  return dom;
}

function openViaHeader(window) {
  const shadow = window.document.getElementById('ghsa-host').shadowRoot;
  window.document.querySelector('.header-search-button')
    .dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
  return shadow;
}

test('userscript mounts, launcher + modal open on header search click', () => {
  const dom = makeDom();
  const { window } = dom;
  window.eval(code);
  const host = window.document.getElementById('ghsa-host');
  assert.ok(host, 'host element created');
  const shadow = host.shadowRoot;
  assert.ok(shadow, 'shadow root attached');
  assert.ok(shadow.querySelector('.ghsa-launcher'), 'floating launcher exists');
  const overlay = openViaHeader(window).querySelector('.ghsa-overlay');
  assert.equal(overlay.style.display, 'flex', 'overlay opens');
  assert.ok(shadow.querySelectorAll('.ghsa-tab').length >= 8, 'tabs rendered');
  assert.ok(shadow.querySelector('.ghsa-preview-code'), 'preview rendered');
  assert.ok(shadow.querySelector('.ghsa-kw-input'), 'keyword input rendered');
});

test('keyword input updates live preview', () => {
  const dom = makeDom();
  const { window } = dom;
  window.eval(code);
  const shadow = openViaHeader(window);
  const kw = shadow.querySelector('.ghsa-kw-input');
  kw.value = 'machine learning';
  kw.dispatchEvent(new window.Event('input', { bubbles: true }));
  assert.match(shadow.querySelector('.ghsa-preview-code').textContent, /machine learning/);
});

test('repository in: chips add qualifier to preview', () => {
  const dom = makeDom();
  const { window } = dom;
  window.eval(code);
  const shadow = openViaHeader(window);
  const nameChip = [...shadow.querySelectorAll('.ghsa-chip')].find((c) => c.textContent === '名称');
  assert.ok(nameChip, 'name chip exists');
  nameChip.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
  assert.match(shadow.querySelector('.ghsa-preview-code').textContent, /in:name/);
});

test('switching to code tab renders path/symbol fields', () => {
  const dom = makeDom();
  const { window } = dom;
  window.eval(code);
  const shadow = openViaHeader(window);
  const codeTab = [...shadow.querySelectorAll('.ghsa-tab')].find((t) => /代码/.test(t.textContent));
  assert.ok(codeTab, 'code tab exists');
  codeTab.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
  const labels = [...shadow.querySelectorAll('.ghsa-field-label')].map((n) => n.textContent).join('|');
  assert.match(labels, /path:/);
  assert.match(labels, /symbol:/);
});

test('pressing / opens the modal when not editing', () => {
  const dom = makeDom();
  const { window } = dom;
  window.eval(code);
  const shadow = window.document.getElementById('ghsa-host').shadowRoot;
  window.document.body.dispatchEvent(new window.KeyboardEvent('keydown', { key: '/', bubbles: true, cancelable: true }));
  assert.equal(shadow.querySelector('.ghsa-overlay').style.display, 'flex');
});

test('clicks on in-page search inputs (incl. #search-input) are NOT hijacked', () => {
  const dom = makeDom();
  const { window } = dom;
  window.eval(code);
  const shadow = window.document.getElementById('ghsa-host').shadowRoot;
  // The real GitHub in-page field historically uses id="search-input"; it lives
  // in <main>, NOT the header, so it must keep native behaviour.
  const targets = [
    window.document.getElementById('search-input'),
    window.document.getElementById('in-page-search'),
  ];
  for (const t of targets) {
    const ev = new window.MouseEvent('click', { bubbles: true, cancelable: true });
    t.dispatchEvent(ev);
    const ov = shadow.querySelector('.ghsa-overlay');
    assert.ok(!ov || ov.style.display !== 'flex', 'in-page input must not open the modal');
    assert.equal(ev.defaultPrevented, false, 'in-page input click must not be prevented');
  }
});

test('a #search-input that IS inside the header is still hijacked', () => {
  const dom = makeDom();
  const { window } = dom;
  // add a header-scoped input with the classic id
  const hdr = window.document.querySelector('.AppHeader');
  const input = window.document.createElement('input');
  input.id = 'search-input';
  hdr.appendChild(input);
  window.eval(code);
  const shadow = window.document.getElementById('ghsa-host').shadowRoot;
  const ev = new window.MouseEvent('click', { bubbles: true, cancelable: true });
  input.dispatchEvent(ev);
  assert.equal(ev.defaultPrevented, true, 'header search input should be intercepted');
  assert.equal(shadow.querySelector('.ghsa-overlay').style.display, 'flex');
});

test('footer: copy button has a text label and docs link points to official syntax', () => {
  const dom = makeDom();
  const { window } = dom;
  window.eval(code);
  const shadow = openViaHeader(window);

  // 1) the copy button must have visible text (not icon-only)
  const copyBtn = [...shadow.querySelectorAll('.ghsa-toggle-raw')].find((b) => /复制/.test(b.textContent));
  assert.ok(copyBtn, 'copy button shows 复制 text');

  // 2) docs link is a real hyperlink to the official syntax page
  const link = shadow.querySelector('.ghsa-docs-link');
  assert.ok(link, 'docs link exists');
  assert.equal(link.getAttribute('href'),
    'https://docs.github.com/zh/search-github/getting-started-with-searching-on-github/understanding-the-search-syntax');

  // 3) on the code tab it points to the code-search syntax page
  const codeTab = [...shadow.querySelectorAll('.ghsa-tab')].find((t) => /代码/.test(t.textContent));
  codeTab.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
  assert.equal(link.getAttribute('href'),
    'https://docs.github.com/zh/search-github/github-code-search/understanding-github-code-search-syntax');
});

test('手改 raw editor: typing (incl "/") keeps it open and keeps focus', () => {
  const dom = makeDom();
  const { window } = dom;
  window.eval(code);
  const shadow = openViaHeader(window);
  const hand = [...shadow.querySelectorAll('.ghsa-toggle-raw')].find((b) => b.textContent === '手改');
  hand.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
  const rawWrap = shadow.querySelector('.ghsa-raw-wrap');
  const raw = shadow.querySelector('.ghsa-raw');
  assert.ok(rawWrap.classList.contains('show'), 'raw editor opened');
  raw.focus();
  for (const ch of ['a', 'b', '/', 'c']) {
    raw.value += ch;
    raw.dispatchEvent(new window.Event('input', { bubbles: true }));
    raw.dispatchEvent(new window.KeyboardEvent('keydown', { key: ch, bubbles: true, cancelable: true, composed: true }));
  }
  assert.ok(rawWrap.classList.contains('show'), 'raw editor still open after typing');
  assert.equal(shadow.querySelector('.ghsa-overlay').style.display, 'flex', 'modal still open');
  assert.equal(shadow.activeElement, raw, 'focus stays inside the raw editor');
  assert.match(shadow.querySelector('.ghsa-preview-code').textContent, /ab\/c/);
});

test('re-open while already open must not clear manual edit / close raw editor', () => {
  const dom = makeDom();
  const { window } = dom;
  window.eval(code);
  const shadow = openViaHeader(window);
  const hand = [...shadow.querySelectorAll('.ghsa-toggle-raw')].find((b) => b.textContent === '手改');
  hand.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
  const raw = shadow.querySelector('.ghsa-raw');
  raw.value = 'my query';
  raw.dispatchEvent(new window.Event('input', { bubbles: true }));
  // simulate a stray/duplicate open while the panel is already open
  window.__GHSA__.open();
  assert.ok(shadow.querySelector('.ghsa-raw-wrap').classList.contains('show'), 'raw editor stays open');
  assert.match(shadow.querySelector('.ghsa-preview-code').textContent, /my query/);
  assert.equal(shadow.querySelector('.ghsa-overlay').style.display, 'flex', 'still open');
});

test('keystrokes inside the panel do not leak to document-level shortcuts (GitHub "s"/"t"/"g")', () => {
  const dom = makeDom();
  const { window } = dom;
  window.eval(code);
  const shadow = openViaHeader(window);
  let leaked = 0;
  // GitHub-style global shortcut listener (bubble phase on document)
  window.document.addEventListener('keydown', () => { leaked += 1; }, false);
  const kw = shadow.querySelector('.ghsa-kw-input');
  kw.focus();
  kw.dispatchEvent(new window.KeyboardEvent('keydown', { key: 's', bubbles: true, cancelable: true, composed: true }));
  assert.equal(leaked, 0, 'keydown inside the panel must not reach document (would let GitHub eat the letter)');
});

test('Escape still closes the panel from inside a field', () => {
  const dom = makeDom();
  const { window } = dom;
  window.eval(code);
  const shadow = openViaHeader(window);
  const kw = shadow.querySelector('.ghsa-kw-input');
  kw.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true, composed: true }));
  assert.equal(shadow.querySelector('.ghsa-overlay').style.display, 'none', 'Escape closes');
});

test('clicking the search box on /search?q=... refills the panel fields', () => {
  const dom = makeDom();
  const { window } = dom;
  window.history.replaceState({}, '',
    '/search?q=' + encodeURIComponent('"machine learning" stars:>1000 language:Python -license:gpl-3.0 in:name,description')
    + '&type=repositories&s=stars&o=desc');
  window.eval(code);
  const shadow = openViaHeader(window);
  const preview = shadow.querySelector('.ghsa-preview-code').textContent;
  assert.match(preview, /machine learning/);
  assert.match(preview, /stars:>1000/);
  assert.match(preview, /language:Python/);
  assert.match(preview, /-license:gpl-3\.0/);
  // structured fields really are populated (not just raw text)
  assert.equal(shadow.querySelector('.ghsa-kw-input').value, 'machine learning');
  const lang = [...shadow.querySelectorAll('.ghsa-field')]
    .find((f) => /language:/.test(f.querySelector('.ghsa-field-label').textContent));
  assert.equal(lang.querySelector('input').value, 'Python');
  assert.ok(shadow.querySelector('.ghsa-negate.on'), 'negation restored');
  assert.equal(shadow.querySelector('.ghsa-sort-row select').value, 'stars');
});

test('refill switches to the right tab from ?type=', () => {
  const dom = makeDom();
  const { window } = dom;
  window.history.replaceState({}, '', '/search?q=' + encodeURIComponent('useEffect repo:facebook/react') + '&type=code');
  window.eval(code);
  const shadow = openViaHeader(window);
  assert.match(shadow.querySelector('.ghsa-tab.active').textContent, /代码/);
  assert.match(shadow.querySelector('.ghsa-preview-code').textContent, /repo:facebook\/react/);
});

test('opening on a plain page (no ?q=) still starts empty', () => {
  const dom = makeDom();
  const { window } = dom;
  window.eval(code);
  const shadow = openViaHeader(window);
  assert.equal(shadow.querySelector('.ghsa-kw-input').value, '');
  assert.match(shadow.querySelector('.ghsa-preview-code').textContent, /在下方选择规则/);
});

test('after refill, editing a field keeps the parsed values and updates the query', () => {
  const dom = makeDom();
  const { window } = dom;
  window.history.replaceState({}, '', '/search?q=' + encodeURIComponent('cats stars:>100') + '&type=repositories');
  window.eval(code);
  const shadow = openViaHeader(window);
  const stars = [...shadow.querySelectorAll('.ghsa-field')]
    .find((f) => /stars:/.test(f.querySelector('.ghsa-field-label').textContent));
  const num = stars.querySelector('input[type="number"]');
  assert.equal(num.value, '100');
  num.value = '500';
  num.dispatchEvent(new window.Event('input', { bubbles: true }));
  const preview = shadow.querySelector('.ghsa-preview-code').textContent;
  assert.match(preview, /stars:>500/);
  assert.match(preview, /cats/, 'keyword from the URL is preserved');
});
