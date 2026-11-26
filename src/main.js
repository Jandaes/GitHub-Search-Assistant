// ===== main.js =====
// Bootstraps the assistant on github.com: intercepts the official search box,
// the "/" shortcut, and a floating launcher button.

(function () {
  if (window.__GHSA_MOUNTED__) return;
  window.__GHSA_MOUNTED__ = true;

  const SEARCH_SELECTORS = [
    '#search-input',
    '.header-search-button',
    '[data-target="qbsearch-input.inputButtonText"]',
    '[data-target="qbsearch-input.inputButton"]',
    '.search-input',
    '.search-input-container',
    '[role="search"] button',
    'button[aria-label*="Search" i]',
    'button[aria-label*="搜索"]',
    'header input[name="q"]',
    '.AppHeader input[name="q"]',
  ];

  const TYPE_PARAM_MAP = {
    repositories: 'repositories',
    Repositories: 'repositories',
    code: 'code',
    Code: 'code',
    issues: 'issues',
    Issues: 'issues',
    pullrequests: 'pullrequests',
    pullRequests: 'pullrequests',
    discussions: 'discussions',
    users: 'users',
    commits: 'commits',
    Commits: 'commits',
    topics: 'topics',
    marketplace: 'marketplace',
    wikis: 'wikis',
  };

  let assistant = null;
  let mountedHost = null;

  function inHeader(el) {
    return !!(el.closest('header, [role="banner"], .AppHeader, .Header, .js-header-wrapper, [data-testid="global-nav"]'));
  }

  function findSearchTrigger(target) {
    if (!target || !target.closest) return null;
    for (const sel of SEARCH_SELECTORS) {
      let el;
      try { el = target.closest(sel); } catch (e) { continue; }
      if (!el) continue;
      // Only hijack the site header's search entry. The in-page search field
      // (e.g. on /search) must keep its native behaviour, so every matched
      // element has to live inside the global header/banner.
      if (!inHeader(el)) continue;
      return el;
    }
    return null;
  }

  // Read the search the user is currently looking at, so clicking GitHub's
  // search box re-opens the panel filled in with exactly those conditions.
  function currentPrefill() {
    try {
      const u = new URL(window.location.href);
      const out = {};
      const t = u.searchParams.get('type');
      if (t && TYPE_PARAM_MAP[t]) out.type = TYPE_PARAM_MAP[t];
      if (u.pathname === '/search') {
        const q = u.searchParams.get('q');
        if (q) out.query = q;
        // keep the chosen sort so the panel reflects what is displayed
        const sortParam = (window.__GHSA__ && window.__GHSA__.sortParamFor)
          ? window.__GHSA__.sortParamFor(out.type || 'repositories') : 's';
        const sv = u.searchParams.get(sortParam);
        if (sv) out.sort = sv;
      }
      return out;
    } catch (e) { return {}; }
  }

  function openAssistant(extra) {
    if (!assistant) return;
    const prefill = Object.assign({}, currentPrefill(), extra || {});
    assistant.open(prefill);
  }

  function onClickCapture(e) {
    // ignore if clicking inside our own shadow host (handled internally)
    const trigger = findSearchTrigger(e.target);
    if (!trigger) return;
    e.preventDefault();
    e.stopPropagation();
    openAssistant();
  }

  function isEditable(el) {
    if (!el) return false;
    const tag = (el.tagName || '').toLowerCase();
    return tag === 'input' || tag === 'textarea' || tag === 'select' || el.isContentEditable;
  }

  function onKeydown(e) {
    if (e.defaultPrevented) return;
    if (e.key !== '/') return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    // Events from inside our Shadow DOM are retargeted to the host element, so
    // `e.target` looks like a <div>. Use the composed path to find the real
    // element; a "/" typed into any of our inputs/textareas must not be treated
    // as the global shortcut (that used to re-open the panel and steal focus).
    const path = typeof e.composedPath === 'function' ? e.composedPath() : [];
    const realTarget = path.length ? path[0] : e.target;
    if (isEditable(realTarget) || isEditable(e.target)) return;
    if (assistant && assistant.isOpen()) return;
    e.preventDefault();
    openAssistant();
  }

  function ensureMounted() {
    if (!assistant) return;
    if (mountedHost && !mountedHost.isConnected && document.body) {
      document.body.appendChild(mountedHost);
    }
  }

  function boot() {
    if (!document.body) { setTimeout(boot, 100); return; }
    assistant = mountAssistant({ defaultType: 'repositories' });
    mountedHost = assistant.host;
    document.addEventListener('click', onClickCapture, true);
    document.addEventListener('keydown', onKeydown, true);

    // Keep the widget alive across GitHub Turbo/SPA navigations.
    try {
      const mo = new MutationObserver(ensureMounted);
      mo.observe(document.body, { childList: true });
    } catch (e) {}
    document.addEventListener('turbo:load', ensureMounted);
    document.addEventListener('pjax:end', ensureMounted);

    window.__GHSA__ = assistant;
    try { console.info('[GitHub 搜索助手] 已加载。点击 GitHub 搜索框或按 / 打开。'); } catch (e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
