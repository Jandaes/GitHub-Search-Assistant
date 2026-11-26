// ===== ui.js =====
// Builds the modal UI inside a Shadow DOM and wires it to the query builder.
// Depends (after build concatenation) on: CSS, SEARCH_TYPES, SEARCH_TYPE_MAP,
// buildQuery, buildSearchUrl, createState.

export const ICONS = {
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>',
  repo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2z"/><path d="M4 6h14"/><path d="M9 22V6"/></svg>',
  code: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
  issue: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
  pr: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M6 8.5v7"/><path d="M18 15.5V9a3 3 0 0 0-3-3h-3"/><path d="m14 3-3 3 3 3"/></svg>',
  discuss: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a3 3 0 0 1-3 3H8l-4 3V6a3 3 0 0 1 3-3h11a3 3 0 0 1 3 3z"/><line x1="8" y1="9" x2="16" y2="9"/><line x1="8" y1="13" x2="13" y2="13"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  commit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><line x1="2" y1="12" x2="8" y2="12"/><line x1="16" y1="12" x2="22" y2="12"/></svg>',
  topic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.6 13.4 12 22l-9-9V4a1 1 0 0 1 1-1h9z"/><circle cx="7.5" cy="7.5" r="1.5"/></svg>',
  market: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9h18l-1.5 10a2 2 0 0 1-2 1.7H6.5a2 2 0 0 1-2-1.7z"/><path d="M8 9V6a4 4 0 0 1 8 0v3"/></svg>',
  wiki: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
  gist: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 3 7v10l9 5 9-5V7z"/><path d="M3 7l9 5 9-5"/><path d="M12 12v10"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 6 15 12 9 18"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  github: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.3.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.8 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.5-2.7 5.5-5.3 5.8.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6 4.6-1.5 7.9-5.8 7.9-10.9C23.5 5.7 18.3.5 12 .5z"/></svg>',
};

// Official GitHub syntax documentation links (used by the footer "查看语法文档").
const SYNTAX_DOC_GENERAL = 'https://docs.github.com/zh/search-github/getting-started-with-searching-on-github/understanding-the-search-syntax';
const SYNTAX_DOC_CODE = 'https://docs.github.com/zh/search-github/github-code-search/understanding-github-code-search-syntax';

const OP_LIST = [
  { value: '>', label: '>' },
  { value: '>=', label: '>=' },
  { value: '<', label: '<' },
  { value: '<=', label: '<=' },
  { value: '=', label: '=' },
  { value: 'range', label: '区间' },
];

function isDarkMode() {
  const de = document.documentElement;
  const mode = de.getAttribute('data-color-mode') || de.getAttribute('data-theme') || '';
  if (/dark/i.test(mode)) return true;
  if (/light/i.test(mode)) return false;
  return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
}

// tiny DOM helpers -----------------------------------------------------------
function h(tag, props, children) {
  const n = document.createElement(tag);
  if (props) {
    for (const k in props) {
      if (k === 'class') n.className = props[k];
      else if (k === 'text') n.textContent = props[k];
      else if (k === 'html') n.innerHTML = props[k];
      else if (k === 'style') n.setAttribute('style', props[k]);
      else if (k.startsWith('on') && typeof props[k] === 'function') n.addEventListener(k.slice(2), props[k]);
      else if (props[k] !== undefined && props[k] !== false) n.setAttribute(k, props[k] === true ? '' : props[k]);
    }
  }
  if (children) {
    (Array.isArray(children) ? children : [children]).forEach((c) => {
      if (c == null) return;
      n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
  }
  return n;
}
function svg(name) {
  const span = document.createElement('span');
  span.style.display = 'inline-flex';
  span.innerHTML = ICONS[name] || '';
  return span.firstChild;
}
function safeText(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

// ---------------------------------------------------------------------------

export function mountAssistant(options) {
  options = options || {};
  const states = new Map(); // typeId -> state
  let activeTypeId = options.defaultType || 'repositories';
  let overlayEl = null;
  let modalEl = null;
  let bodyEl = null;
  let previewCodeEl = null;
  let rawWrapEl = null;
  let rawEl = null;
  let returnFocus = null;
  let launcherEl = null;
  let openFlag = false;

  // host + shadow
  const host = document.createElement('div');
  host.id = 'ghsa-host';
  host.style.cssText = 'all:initial;';
  (document.body || document.documentElement).appendChild(host);
  const shadow = host.attachShadow({ mode: 'open' });
  const styleEl = document.createElement('style');
  styleEl.textContent = CSS;
  shadow.appendChild(styleEl);
  const root = h('div', { class: 'ghsa-root' });
  root.classList.toggle('ghsa-dark', isDarkMode());
  shadow.appendChild(root);

  function typeDef() { return SEARCH_TYPE_MAP[activeTypeId]; }
  function state() {
    if (!states.has(activeTypeId)) states.set(activeTypeId, createState());
    return states.get(activeTypeId);
  }

  function getQuery() {
    const st = state();
    if (st.manual !== undefined && st.manual !== null) return String(st.manual);
    return buildQuery(typeDef(), st);
  }

  // ---------- launcher ----------
  launcherEl = h('button', {
    class: 'ghsa-launcher', title: 'GitHub 搜索助手 (按 / 打开)', 'aria-label': 'GitHub 搜索助手',
    onclick: () => open(),
  }, [svg('search')]);
  root.appendChild(launcherEl);

  // ---------- overlay skeleton ----------
  function buildSkeleton() {
    overlayEl = h('div', { class: 'ghsa-overlay', style: 'display:none' });
    overlayEl.addEventListener('mousedown', (e) => { if (e.target === overlayEl) close(); });

    const closeBtn = h('button', { class: 'ghsa-close', title: '关闭 (Esc)', 'aria-label': '关闭', onclick: () => close() }, [svg('close')]);
    const header = h('div', { class: 'ghsa-header' }, [
      h('div', { class: 'ghsa-logo', html: ICONS.github }),
      h('div', { class: 'ghsa-heading' }, [
        h('h2', { class: 'ghsa-title', text: 'GitHub 高级搜索' }),
        h('p', { class: 'ghsa-subtitle', text: '选择规则、输入关键词，即可组合出 GitHub 搜索语句' }),
      ]),
      closeBtn,
    ]);

    bodyEl = h('div', { class: 'ghsa-body', role: 'tabpanel' });

    const copyBtn = h('button', { class: 'ghsa-toggle-raw', title: '复制查询语句', 'aria-label': '复制查询语句' }, ['复制']);
    copyBtn.addEventListener('click', () => copyQuery(copyBtn));
    const preview = h('div', { class: 'ghsa-preview' }, [
      h('span', { class: 'ghsa-preview-label', text: '查询' }),
      (previewCodeEl = h('div', { class: 'ghsa-preview-code', 'aria-live': 'polite' })),
      h('button', { class: 'ghsa-toggle-raw', title: '直接编辑最终查询语句', onclick: () => toggleRaw() }, ['手改']),
      copyBtn,
    ]);

    rawWrapEl = h('div', { class: 'ghsa-raw-wrap' }, [
      (rawEl = h('textarea', { class: 'ghsa-raw', rows: '2', placeholder: '直接编辑最终 GitHub 查询语句…' })),
    ]);
    rawEl.addEventListener('input', () => {
      const s = state();
      s.manual = rawEl.value;
      s.rawOpen = true; // editing implies the raw editor is active
      updatePreview();
    });

    // A real hyperlink to the official GitHub search-syntax documentation.
    const docsLink = h('a', {
      class: 'ghsa-docs-link',
      href: SYNTAX_DOC_GENERAL,
      target: '_blank',
      rel: 'noopener noreferrer',
      text: '查看官方语法文档 ↗',
    });
    const hint = h('div', { class: 'ghsa-hint' }, [docsLink]);

    const actions = h('div', { class: 'ghsa-actions' }, [
      hint,
      h('div', { class: 'ghsa-spacer' }),
      h('button', { class: 'ghsa-btn ghsa-btn-ghost', onclick: () => resetCurrent() }, ['重置']),
      h('button', { class: 'ghsa-btn', onclick: () => close() }, ['取消']),
      h('button', { class: 'ghsa-btn ghsa-btn-primary', onclick: () => doSearch() }, [svg('search'), '搜索']),
    ]);

    const footer = h('div', { class: 'ghsa-footer' }, [preview, rawWrapEl, actions]);

    modalEl = h('div', { class: 'ghsa-modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'GitHub 高级搜索' }, [header, buildTabs(), bodyEl, footer]);

    // CRITICAL: keep keystrokes that happen inside the panel from leaking to
    // GitHub's global single-key shortcuts. Because our inputs live in a Shadow
    // DOM, GitHub sees the event target as the host <div> (event retargeting),
    // concludes the user is NOT typing, and fires shortcuts like "s" (focus
    // search) / "t" / "g", calling preventDefault() — which swallowed letters
    // typed into our fields. Stopping propagation in the bubble phase keeps
    // typing intact while our own document-capture handlers (Esc/Tab) still work.
    ['keydown', 'keypress', 'keyup'].forEach((type) => {
      modalEl.addEventListener(type, (e) => { e.stopPropagation(); }, false);
    });
    overlayEl.appendChild(modalEl);
    root.appendChild(overlayEl);
  }

  // ---------- tabs ----------
  function buildTabs() {
    const bar = h('div', { class: 'ghsa-tabs', role: 'tablist', 'aria-label': '搜索类型' });
    SEARCH_TYPES.forEach((t) => {
      const btn = h('button', { class: 'ghsa-tab', role: 'tab', 'data-type': t.id, 'aria-selected': 'false', tabindex: '-1' }, [svg(t.icon), t.label]);
      btn.addEventListener('click', () => setType(t.id));
      bar.appendChild(btn);
    });
    bar.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const tabs = Array.prototype.slice.call(bar.querySelectorAll('.ghsa-tab'));
      const idx = tabs.indexOf(shadow.activeElement);
      if (idx < 0) return;
      e.preventDefault();
      const next = e.key === 'ArrowRight' ? (idx + 1) % tabs.length : (idx - 1 + tabs.length) % tabs.length;
      tabs[next].focus();
      setType(tabs[next].getAttribute('data-type'));
    });
    return bar;
  }

  function setType(id) {
    if (!SEARCH_TYPE_MAP[id]) return;
    activeTypeId = id;
    overlayEl.querySelectorAll('.ghsa-tab').forEach((b) => {
      const on = b.getAttribute('data-type') === id;
      b.classList.toggle('active', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
    });
    // Point the footer doc link at the matching official syntax reference.
    const docsLink = overlayEl.querySelector('.ghsa-docs-link');
    if (docsLink) docsLink.href = id === 'code' ? SYNTAX_DOC_CODE : SYNTAX_DOC_GENERAL;
    // Keep the raw editor's visibility in sync with this type's own state.
    if (rawWrapEl) rawWrapEl.classList.toggle('show', !!state().rawOpen);
    renderBody();
    updatePreview();
  }

  // ---------- preview ----------
  function updatePreview() {
    if (!previewCodeEl) return;
    const st = state();
    // The 手改 box's visibility is authoritative from state: once opened it
    // stays open (until the user toggles it), so it can never be closed by an
    // incidental re-render / re-open while the user is editing.
    if (rawWrapEl) rawWrapEl.classList.toggle('show', !!st.rawOpen);
    const q = getQuery();
    if (!q) {
      previewCodeEl.innerHTML = '<span class="ph">在下方选择规则或输入关键词，这里实时显示查询语句…</span>';
    } else {
      previewCodeEl.innerHTML = highlightQuery(q);
    }
    if (rawEl && shadow.activeElement !== rawEl) {
      rawEl.value = (st.manual == null) ? q : st.manual;
    }
  }

  function highlightQuery(q) {
    return q.split(/(\s+)/).map((tok) => {
      if (/^\s+$/.test(tok)) return tok;
      if (tok === 'AND' || tok === 'OR' || tok === 'NOT') return '<span class="tok">' + safeText(tok) + '</span>';
      if (/[:]/.test(tok) || /^\/.*\/$/.test(tok)) return '<span class="tok">' + safeText(tok) + '</span>';
      return safeText(tok);
    }).join('');
  }

  function toggleRaw() {
    const st = state();
    const show = !st.rawOpen;
    st.rawOpen = show;
    rawWrapEl.classList.toggle('show', show);
    if (show) {
      if (st.manual == null) rawEl.value = buildQuery(typeDef(), st);
      rawEl.focus();
    } else {
      try { rawEl.blur(); } catch (e) {}
    }
  }

  function copyQuery(btn) {
    const q = getQuery();
    const done = () => {
      if (!btn) return;
      const old = btn.innerHTML;
      btn.innerHTML = '';
      btn.appendChild(svg('check'));
      setTimeout(() => { btn.innerHTML = old; }, 1200);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(q).then(done, done);
    } else {
      const ta = document.createElement('textarea');
      ta.value = q; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch (e) {}
      ta.remove(); done();
    }
  }

  // ---------- body ----------
  function renderBody() {
    if (!bodyEl) return;
    bodyEl.innerHTML = '';
    const t = typeDef();
    if (!t) return;
    bodyEl.appendChild(renderKeywords(state(), t));
    if (t.sort && t.sort.options && t.sort.options.length) {
      bodyEl.appendChild(renderSort(state(), t));
    }
    if (!t.groups || !t.groups.length) {
      bodyEl.appendChild(h('div', { class: 'ghsa-empty' }, [
        h('div', {}, [h('b', { text: t.label })]),
        h('div', { style: 'margin-top:6px', text: '此搜索类型主要使用关键词 + 限定符，直接输入关键词即可搜索。' }),
      ]));
      return;
    }
    t.groups.forEach((g) => bodyEl.appendChild(renderGroup(g, state())));
  }

  function renderSort(st, t) {
    const sel = h('select', { class: 'ghsa-select' });
    t.sort.options.forEach((o) => {
      const opt = h('option', { value: o.value, text: o.label });
      if (st.sort === o.value) opt.selected = true;
      sel.appendChild(opt);
    });
    sel.addEventListener('change', () => { st.sort = sel.value; markManualOff(st); updatePreview(); });
    return h('div', { class: 'ghsa-sort-row' }, [h('label', { text: '排序' }), sel]);
  }

  function renderKeywords(st, t) {
    const list = h('div', { class: 'ghsa-kw-list' });
    if (!st.keywords || !Array.isArray(st.keywords.rows) || !st.keywords.rows.length) {
      st.keywords = { rows: [{ connector: '', value: '', mode: 'normal' }] };
    }
    st.keywords.rows.forEach((row, i) => list.appendChild(renderKeywordRow(st, t, row, i)));
    const addBtn = h('button', { class: 'ghsa-btn ghsa-btn-ghost', style: 'padding:5px 10px;font-size:12px', onclick: () => {
      if (st.keywords.rows.length >= 8) return;
      st.keywords.rows.push({ connector: 'AND', value: '', mode: 'normal' });
      renderBody(); updatePreview();
      const inputs = bodyEl.querySelectorAll('.ghsa-kw-input');
      const last = inputs[inputs.length - 1];
      if (last) last.focus();
    } }, [svg('plus'), '添加关键词']);
    const actions = h('div', { class: 'ghsa-kw-actions' }, [addBtn]);
    const top = h('div', { class: 'ghsa-keywords-top' }, [h('span', { class: 'ghsa-label-sm', text: '关键词 / 搜索内容' })]);
    return h('div', { class: 'ghsa-keywords' }, [top, list, actions]);
  }

  function renderKeywordRow(st, t, row, i) {
    const rowEl = h('div', { class: 'ghsa-kw-row' });
    if (i === 0) {
      rowEl.appendChild(h('span', { class: 'ghsa-connector', style: 'visibility:hidden', text: 'AND' }));
    } else {
      const conn = h('select', { class: 'ghsa-connector' });
      ['AND', 'OR', 'NOT'].forEach((v) => {
        const o = h('option', { value: v, text: v });
        if ((row.connector || 'AND') === v) o.selected = true;
        conn.appendChild(o);
      });
      conn.addEventListener('change', () => { row.connector = conn.value; markManualOff(st); updatePreview(); });
      rowEl.appendChild(conn);
    }
    const input = h('input', { class: 'ghsa-input ghsa-kw-input', type: 'text', placeholder: i === 0 ? (t.keywordLabel || '输入关键词…') : '追加关键词…' });
    input.value = row.value || '';
    input.addEventListener('input', () => { row.value = input.value; markManualOff(st); updatePreview(); });
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); doSearch(); } });
    rowEl.appendChild(input);

    const mode = h('select', { class: 'ghsa-select', style: 'width:78px;flex:0 0 auto' });
    [['normal', '普通'], ['exact', '精确'], ['regex', '正则']].forEach(([v, l]) => {
      const o = h('option', { value: v, text: l });
      if ((row.mode || 'normal') === v) o.selected = true;
      mode.appendChild(o);
    });
    mode.addEventListener('change', () => { row.mode = mode.value; markManualOff(st); updatePreview(); });
    rowEl.appendChild(mode);

    if (st.keywords.rows.length > 1) {
      rowEl.appendChild(h('button', { class: 'ghsa-kw-remove', title: '移除', onclick: () => {
        st.keywords.rows.splice(i, 1); renderBody(); updatePreview();
      } }, [svg('x')]));
    } else {
      rowEl.appendChild(h('span', { style: 'width:28px;flex:0 0 auto' }));
    }
    return rowEl;
  }

  function renderGroup(group, st) {
    if (!st._open) st._open = {};
    // default open if configured, or if it already contains an active value
    const defaultOpen = !!group.open || (group.items || []).some((it) => isItemActive(st, it));
    const open = (group.id in st._open) ? !!st._open[group.id] : defaultOpen;
    const wrap = h('div', { class: 'ghsa-group' + (open ? ' open' : '') });
    const chev = h('span', { class: 'ghsa-chevron', html: ICONS.chevron });
    const title = h('div', { class: 'ghsa-group-title' }, [
      document.createTextNode(group.title),
      group.desc ? h('span', { class: 'ghsa-group-desc', text: group.desc }) : null,
    ]);
    const head = h('div', { class: 'ghsa-group-head', role: 'button', tabindex: '0', 'aria-expanded': open ? 'true' : 'false' }, [chev, title]);
    const toggle = () => {
      const now = wrap.classList.toggle('open');
      head.setAttribute('aria-expanded', now ? 'true' : 'false');
      st._open[group.id] = now;
    };
    head.addEventListener('click', toggle);
    head.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
    const body = h('div', { class: 'ghsa-group-body' });
    (group.items || []).forEach((it) => body.appendChild(renderField(it, st)));
    wrap.appendChild(head);
    wrap.appendChild(body);
    return wrap;
  }

  function isItemActive(st, it) {
    const v = st.quals[it.key];
    if (it.kind === 'toggle') return !!v;
    if (it.kind === 'number' || it.kind === 'date') return !!(v && (v.v1 || v.v2));
    if (Array.isArray(v)) return v.length > 0;
    return v !== undefined && v !== null && String(v).trim() !== '';
  }

  function markManualOff(st) { if ('manual' in st) st.manual = null; }

  function renderField(it, st) {
    const field = h('div', { class: 'ghsa-field' });
    const labelEl = h('div', { class: 'ghsa-field-label' }, [document.createTextNode(it.label)]);
    if (it.help) labelEl.appendChild(h('span', { class: 'ghsa-field-help', text: it.help }));
    field.appendChild(labelEl);

    const control = h('div', { class: 'ghsa-field-control' });
    const onChange = () => { markManualOff(st); updatePreview(); };

    switch (it.kind) {
      case 'text':
      case 'combo': {
        const inp = h('input', { class: 'ghsa-input', type: 'text', placeholder: it.placeholder || '' });
        inp.style.flex = '1 1 220px';
        inp.value = st.quals[it.key] != null ? st.quals[it.key] : '';
        if (it.kind === 'combo' && it.options) {
          const listId = 'ghsa-dl-' + activeTypeId + '-' + it.key;
          inp.setAttribute('list', listId);
          const dl = h('datalist', { id: listId });
          it.options.forEach((o) => dl.appendChild(h('option', { value: o.value })));
          control.appendChild(dl);
        }
        inp.addEventListener('input', () => { st.quals[it.key] = inp.value; onChange(); });
        control.appendChild(inp);
        break;
      }
      case 'select': {
        const sel = h('select', { class: 'ghsa-select' });
        sel.style.minWidth = '150px';
        sel.appendChild(h('option', { value: '', text: '不限' }));
        (it.options || []).forEach((o) => {
          const opt = h('option', { value: o.value, text: o.label });
          if (st.quals[it.key] === o.value) opt.selected = true;
          sel.appendChild(opt);
        });
        sel.addEventListener('change', () => { st.quals[it.key] = sel.value; onChange(); });
        control.appendChild(sel);
        break;
      }
      case 'multiCsv': {
        const chips = h('div', { class: 'ghsa-chips', role: 'group' });
        (it.options || []).forEach((o) => {
          let arr = Array.isArray(st.quals[it.key]) ? st.quals[it.key].slice() : [];
          const chip = h('button', { type: 'button', class: 'ghsa-chip' + (arr.includes(o.value) ? ' active' : ''), 'aria-pressed': arr.includes(o.value) ? 'true' : 'false', text: o.label });
          chip.addEventListener('click', () => {
            arr = Array.isArray(st.quals[it.key]) ? st.quals[it.key].slice() : [];
            const idx = arr.indexOf(o.value);
            if (idx >= 0) arr.splice(idx, 1); else arr.push(o.value);
            st.quals[it.key] = arr;
            chip.classList.toggle('active', arr.includes(o.value));
            chip.setAttribute('aria-pressed', arr.includes(o.value) ? 'true' : 'false');
            onChange();
          });
          chips.appendChild(chip);
        });
        control.appendChild(chips);
        break;
      }
      case 'multiRepeat': {
        control.appendChild(buildTagInput(it, st, onChange));
        break;
      }
      case 'number':
      case 'date': {
        control.appendChild(buildOpInput(it, st, onChange));
        break;
      }
      case 'toggle': {
        const sw = h('div', { class: 'ghsa-switch' + (st.quals[it.key] ? ' on' : ''), role: 'switch', tabindex: '0', 'aria-checked': st.quals[it.key] ? 'true' : 'false' }, [
          h('div', { class: 'track' }), h('span', { text: st.quals[it.key] ? '已启用' : '未启用' }),
        ]);
        const flip = () => {
          st.quals[it.key] = !st.quals[it.key];
          sw.classList.toggle('on', !!st.quals[it.key]);
          sw.setAttribute('aria-checked', st.quals[it.key] ? 'true' : 'false');
          sw.querySelector('span').textContent = st.quals[it.key] ? '已启用' : '未启用';
          onChange();
        };
        sw.addEventListener('click', flip);
        sw.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); } });
        control.appendChild(sw);
        break;
      }
      default:
        control.appendChild(document.createTextNode('未知字段类型: ' + it.kind));
    }

    if (it.allowNegate) {
      const neg = h('button', { type: 'button', class: 'ghsa-negate' + (st.negated[it.key] ? ' on' : ''), 'aria-pressed': st.negated[it.key] ? 'true' : 'false' }, [
        h('span', { class: 'dot' }), h('span', { text: '排除' }),
      ]);
      neg.addEventListener('click', (e) => {
        e.preventDefault();
        st.negated[it.key] = !st.negated[it.key];
        neg.classList.toggle('on', !!st.negated[it.key]);
        neg.setAttribute('aria-pressed', st.negated[it.key] ? 'true' : 'false');
        onChange();
      });
      control.appendChild(neg);
    }

    field.appendChild(control);
    return field;
  }

  function buildTagInput(it, st, onChange) {
    if (!Array.isArray(st.quals[it.key])) st.quals[it.key] = [];
    const box = h('div', { class: 'ghsa-taginput' });
    const input = h('input', { type: 'text', placeholder: it.placeholder || '输入后回车' });
    function rerender() {
      box.querySelectorAll('.ghsa-tag').forEach((n) => n.remove());
      st.quals[it.key].forEach((v, idx) => {
        const tag = h('span', { class: 'ghsa-tag' }, [
          document.createTextNode(v),
          h('button', { type: 'button', title: '移除', onclick: (e) => {
            e.stopPropagation(); st.quals[it.key].splice(idx, 1); rerender(); onChange();
          } }, ['×']),
        ]);
        box.insertBefore(tag, input);
      });
    }
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ',' || e.key === '，') {
        e.preventDefault();
        const v = input.value.trim().replace(/,$/, '');
        if (v && !st.quals[it.key].includes(v)) { st.quals[it.key].push(v); input.value = ''; rerender(); onChange(); }
      } else if (e.key === 'Backspace' && !input.value && st.quals[it.key].length) {
        st.quals[it.key].pop(); rerender(); onChange();
      }
    });
    box.appendChild(input);
    rerender();
    return box;
  }

  function buildOpInput(it, st, onChange) {
    const isDate = it.kind === 'date';
    let cur = st.quals[it.key];
    if (!cur || typeof cur !== 'object') cur = { op: it.opDefault || (isDate ? '>=' : '>'), v1: '', v2: '' };
    if (!cur.op) cur.op = it.opDefault || (isDate ? '>=' : '>');
    st.quals[it.key] = cur;

    const wrap = h('div', { style: 'display:flex;gap:8px;align-items:center;flex-wrap:wrap' });
    const opSel = h('select', { class: 'ghsa-op' });
    OP_LIST.forEach((o) => {
      const opt = h('option', { value: o.value, text: o.label });
      if (cur.op === o.value) opt.selected = true;
      opSel.appendChild(opt);
    });
    const mk = (val) => h('input', { class: isDate ? 'ghsa-date' : 'ghsa-num', type: isDate ? 'date' : 'number', value: val || '' });
    const v1 = mk(cur.v1);
    const sep = h('span', { text: '..', style: 'color:var(--fg-faint)' });
    const v2 = mk(cur.v2);
    const unit = it.unit ? h('span', { class: 'ghsa-hint', text: it.unit }) : null;

    function refreshRangeUI() {
      const isRange = cur.op === 'range';
      sep.style.display = isRange ? '' : 'none';
      v2.style.display = isRange ? '' : 'none';
      if (unit) unit.style.display = isRange ? 'none' : '';
    }
    opSel.addEventListener('change', () => { cur.op = opSel.value; st.quals[it.key] = cur; refreshRangeUI(); onChange(); });
    v1.addEventListener('input', () => { cur.v1 = v1.value; onChange(); });
    v2.addEventListener('input', () => { cur.v2 = v2.value; onChange(); });
    refreshRangeUI();

    wrap.appendChild(opSel); wrap.appendChild(v1); wrap.appendChild(sep); wrap.appendChild(v2);
    if (unit) wrap.appendChild(unit);
    return wrap;
  }

  // ---------- actions ----------
  function resetCurrent() {
    states.set(activeTypeId, createState());
    renderBody(); updatePreview();
  }

  function doSearch() {
    const q = getQuery().trim();
    if (!q) { focusFirstKeyword(); return; }
    const url = buildSearchUrl(typeDef(), q, state().sort);
    try { window.location.assign(url); } catch (e) { window.open(url, '_blank', 'noopener'); }
  }

  function focusFirstKeyword() {
    // Never steal focus while the raw (手改) editor is in use.
    if (state().rawOpen) return;
    const inp = bodyEl && bodyEl.querySelector('.ghsa-kw-input');
    if (inp) inp.focus();
  }

  // ---------- open / close ----------
  function open(opts) {
    opts = opts || {};
    // If the panel is already open, never reset the user's in-progress edits.
    // (A stray re-open used to clear state.manual / hide the 手改 box / steal
    // focus back to the top keyword field — that is the bug we guard against.)
    if (openFlag) {
      if (opts.type && SEARCH_TYPE_MAP[opts.type]) setType(opts.type);
      return;
    }
    if (!overlayEl) buildSkeleton();
    if (opts.type && SEARCH_TYPE_MAP[opts.type]) activeTypeId = opts.type;
    returnFocus = document.activeElement;

    // Re-populate from an existing query: either the one we were handed (the
    // current /search?q=... URL) or a raw query in "手改" mode.
    if (opts.query) {
      states.set(activeTypeId, restoreState(typeDef(), String(opts.query)));
    } else if (opts.fresh) {
      states.set(activeTypeId, createState());
    }
    const st = state();
    if (opts.sort) st.sort = String(opts.sort);
    setType(activeTypeId);
    overlayEl.style.display = 'flex';
    openFlag = true;
    launcherEl.classList.add('ghsa-hidden');
    if (rawEl && st.manual != null) rawEl.value = st.manual;
    updatePreview();
    if (opts.query) flashRestored();
    setTimeout(() => {
      const s = state();
      // Never steal focus away from an open raw editor / active manual edit.
      if (s.rawOpen) { if (rawEl) rawEl.focus(); }
      else if (s.manual == null) focusFirstKeyword();
    }, 0);
  }

  // Turn a query string into structured state; keep it raw-editable too so a
  // user can still see/edit the exact text they arrived with.
  function restoreState(td, query) {
    const parsed = parseQuery(td, query);
    parsed.rawOpen = false;
    return parsed;
  }

  // Brief confirmation that the current search was pulled into the form.
  function flashRestored() {
    if (!bodyEl) return;
    const old = bodyEl.querySelector('.ghsa-restored');
    if (old) old.remove();
    const note = h('div', { class: 'ghsa-restored', role: 'status' }, ['已回填当前搜索条件，可继续调整']);
    bodyEl.insertBefore(note, bodyEl.firstChild);
    setTimeout(() => { if (note.parentNode) note.remove(); }, 3200);
  }

  function close() {
    if (!overlayEl) return;
    overlayEl.style.display = 'none';
    openFlag = false;
    launcherEl.classList.remove('ghsa-hidden');
    if (returnFocus && returnFocus.focus) { try { returnFocus.focus(); } catch (e) {} }
  }

  function toggle() { openFlag ? close() : open(); }

  // keyboard: Esc to close + focus trap
  function onKeydown(e) {
    if (!openFlag) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key === 'Tab') {
      const focusables = Array.prototype.slice.call(
        modalEl.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
      ).filter((n) => !n.disabled && n.offsetParent !== null);
      if (!focusables.length) return;
      const first = focusables[0], last = focusables[focusables.length - 1];
      const active = shadow.activeElement;
      if (!active || !modalEl.contains(active)) { e.preventDefault(); first.focus(); return; }
      if (e.shiftKey && active === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
    }
  }

  document.addEventListener('keydown', onKeydown, true);

  return {
    open, close, toggle,
    isOpen: () => openFlag,
    setType,
    sortParamFor: (typeId) => {
      const t = SEARCH_TYPE_MAP[typeId];
      return (t && t.sort && t.sort.param) ? t.sort.param : 's';
    },
    getQuery,
    host,
    destroy() {
      document.removeEventListener('keydown', onKeydown, true);
      if (host.parentNode) host.parentNode.removeChild(host);
    },
  };
}
