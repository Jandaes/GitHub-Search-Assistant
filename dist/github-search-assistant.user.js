// ==UserScript==
// @name         GitHub 搜索助手 · 可视化高级搜索
// @name:en      GitHub Search Assistant
// @namespace    https://github.com/Jandaes/GitHub-Search-Assistant
// @version      1.0.0
// @description  点击 GitHub 官方搜索框弹出可视化面板，按规则(仓库/代码/Issues/PR/用户/提交/话题等)组合 GitHub 搜索语法，只需输入搜索内容即可。
// @description:en  Visual advanced search builder for GitHub: click the search box to compose GitHub search qualifiers visually.
// @author       janda
// @license      MIT
// @match        https://github.com/*
// @match        https://gist.github.com/*
// @icon         data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMDk2OWRhIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PGNpcmNsZSBjeD0iMTEiIGN5PSIxMSIgcj0iNyIvPjxwYXRoIGQ9Im0yMSAyMS00LjMtNC4zIi8+PC9zdmc+
// @grant        none
// @run-at       document-idle
// @supportURL   https://docs.github.com/zh/search-github
// ==/UserScript==

/*
 * GitHub 搜索助手 · 可视化高级搜索
 * 语法参考: https://docs.github.com/zh/search-github/github-code-search/understanding-github-code-search-syntax
 * 本文件由 build.mjs 自动生成，请勿直接编辑；源码见 src/。
 */

(function () {
  'use strict';

// ================= src/styles.js =================
// ===== styles.js =====
// CSS injected into the shadow root. Scoped, theme-aware (light/dark).

const CSS = `
:host { all: initial; }
.ghsa-root {
  --bg: #ffffff;
  --bg-subtle: #f6f8fa;
  --bg-inset: #f0f3f6;
  --fg: #1f2328;
  --fg-muted: #59636e;
  --fg-faint: #66707a;
  --border: #d1d9e0;
  --border-strong: #b7c0c9;
  --accent: #0969da;
  --accent-hover: #0757b3;
  --accent-soft: #ddf4ff;
  --accent-fg: #ffffff;
  --danger: #cf222e;
  --shadow: 0 16px 48px rgba(31, 35, 40, 0.18), 0 4px 12px rgba(31, 35, 40, 0.12);
  --radius: 14px;
  --radius-sm: 9px;
  --radius-xs: 7px;
  --mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
  --sans: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, "PingFang SC", "Microsoft YaHei", sans-serif;
  font-family: var(--sans);
  color: var(--fg);
}
.ghsa-root.ghsa-dark {
  --bg: #161b22;
  --bg-subtle: #1c2129;
  --bg-inset: #0d1117;
  --fg: #e6edf3;
  --fg-muted: #9aa4af;
  --fg-faint: #8b949e;
  --border: #30363d;
  --border-strong: #424a53;
  --accent: #4493f8;
  --accent-hover: #6cb0ff;
  --accent-soft: #121d2f;
  --accent-fg: #ffffff;
  --danger: #f85149;
  --shadow: 0 16px 48px rgba(1, 4, 9, 0.6), 0 4px 12px rgba(1, 4, 9, 0.5);
}

.ghsa-overlay {
  position: fixed; inset: 0; z-index: 2147483646;
  display: flex; align-items: flex-start; justify-content: center;
  padding: 6vh 16px 16px;
  background: rgba(15, 20, 26, 0.55);
  -webkit-backdrop-filter: blur(4px); backdrop-filter: blur(4px);
  animation: ghsa-fade 140ms ease-out;
  overflow: auto;
}
@keyframes ghsa-fade { from { opacity: 0 } to { opacity: 1 } }
@keyframes ghsa-pop { from { opacity: 0; transform: translateY(8px) scale(.985) } to { opacity: 1; transform: none } }
@media (prefers-reduced-motion: reduce) { .ghsa-overlay, .ghsa-modal { animation: none !important } }

.ghsa-modal {
  width: min(940px, 100%);
  max-height: 88vh;
  display: flex; flex-direction: column;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  overflow: hidden;
  animation: ghsa-pop 160ms cubic-bezier(.2,.8,.2,1);
  color: var(--fg);
}

/* ---------- header ---------- */
.ghsa-header {
  display: flex; align-items: center; gap: 12px;
  padding: 16px 18px 12px;
  border-bottom: 1px solid var(--border);
}
.ghsa-logo {
  width: 34px; height: 34px; flex: 0 0 auto;
  display: grid; place-items: center;
  border-radius: 9px;
  background: var(--accent-soft); color: var(--accent);
}
.ghsa-logo svg { width: 20px; height: 20px; }
.ghsa-heading { flex: 1 1 auto; min-width: 0; }
.ghsa-title { margin: 0; font-size: 15.5px; font-weight: 650; letter-spacing: .1px; }
.ghsa-subtitle { margin: 2px 0 0; font-size: 12px; color: var(--fg-muted); }
.ghsa-close {
  flex: 0 0 auto; width: 30px; height: 30px; border-radius: 8px;
  border: 1px solid transparent; background: transparent; color: var(--fg-muted);
  cursor: pointer; display: grid; place-items: center;
}
.ghsa-close:hover { background: var(--bg-subtle); color: var(--fg); border-color: var(--border); }
.ghsa-close svg { width: 16px; height: 16px; }

/* ---------- tabs ---------- */
.ghsa-tabs {
  display: flex; gap: 4px; padding: 10px 12px;
  overflow-x: auto; border-bottom: 1px solid var(--border);
  background: var(--bg-subtle);
  scrollbar-width: thin;
}
.ghsa-tab {
  flex: 0 0 auto; display: inline-flex; align-items: center; gap: 6px;
  padding: 7px 12px; border-radius: 999px;
  border: 1px solid transparent; background: transparent;
  color: var(--fg-muted); font-size: 13px; font-weight: 550;
  cursor: pointer; white-space: nowrap;
  transition: background .12s, color .12s, border-color .12s;
}
.ghsa-tab:hover { background: var(--bg); color: var(--fg); }
.ghsa-tab.active {
  background: var(--bg); color: var(--accent);
  border-color: var(--border); box-shadow: 0 1px 0 rgba(0,0,0,.02);
}
.ghsa-tab svg { width: 15px; height: 15px; }

/* ---------- body ---------- */
.ghsa-body { padding: 16px 18px 4px; overflow-y: auto; flex: 1 1 auto; scrollbar-width: thin; }
.ghsa-body::-webkit-scrollbar, .ghsa-tabs::-webkit-scrollbar { height: 8px; width: 8px; }
.ghsa-body::-webkit-scrollbar-thumb, .ghsa-tabs::-webkit-scrollbar-thumb { background: var(--border-strong); border-radius: 8px; }

/* restored-from-URL hint */
.ghsa-restored {
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 12px; padding: 8px 12px;
  font-size: 12px; font-weight: 550;
  color: var(--accent); background: var(--accent-soft);
  border: 1px solid transparent; border-radius: var(--radius-xs);
  animation: ghsa-fade 160ms ease-out;
}
.ghsa-restored::before { content: '✓'; font-weight: 700; }

/* keyword area */
.ghsa-keywords {
  border: 1px solid var(--border); border-radius: var(--radius-sm);
  background: var(--bg-subtle); padding: 12px;
  margin-bottom: 14px;
}
.ghsa-keywords-top { display:flex; align-items:center; justify-content:space-between; margin-bottom: 8px; }
.ghsa-label-sm { font-size: 12px; font-weight: 600; color: var(--fg-muted); text-transform: none; letter-spacing: .2px; }
.ghsa-kw-list { display: flex; flex-direction: column; gap: 8px; }
.ghsa-kw-row { display: flex; align-items: center; gap: 8px; }
.ghsa-kw-row .ghsa-connector {
  flex: 0 0 auto; font: 600 11px var(--mono); color: var(--accent);
  background: var(--accent-soft); border: 1px solid transparent; border-radius: 6px;
  padding: 5px 7px; min-width: 46px; text-align: center; cursor: pointer;
}
select.ghsa-connector { appearance: none; }
.ghsa-kw-input { flex: 1 1 auto; }
.ghsa-kw-remove {
  flex: 0 0 auto; width: 28px; height: 28px; border-radius: 6px; border: 1px solid var(--border);
  background: var(--bg); color: var(--fg-faint); cursor: pointer; display: grid; place-items: center;
}
.ghsa-kw-remove:hover { color: var(--danger); border-color: var(--danger); }
.ghsa-kw-remove svg { width: 14px; height: 14px; }
.ghsa-kw-actions { display: flex; align-items: center; gap: 8px; margin-top: 8px; }
.ghsa-kw-mode {
  display: inline-flex; border: 1px solid var(--border); border-radius: 7px; overflow: hidden;
  background: var(--bg);
}
.ghsa-kw-mode button {
  border: 0; background: transparent; color: var(--fg-muted); font-size: 11.5px; font-weight: 550;
  padding: 5px 9px; cursor: pointer;
}
.ghsa-kw-mode button.active { background: var(--accent); color: var(--accent-fg); }

/* inputs */
.ghsa-input, .ghsa-select, .ghsa-op, .ghsa-num, .ghsa-date {
  font-family: var(--sans); font-size: 13px; color: var(--fg);
  background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius-xs);
  padding: 7px 9px; outline: none; min-width: 0;
  transition: border-color .12s, box-shadow .12s;
}
.ghsa-input:focus, .ghsa-select:focus, .ghsa-op:focus, .ghsa-num:focus, .ghsa-date:focus {
  border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft);
}
.ghsa-input::placeholder { color: var(--fg-faint); }
.ghsa-select { appearance: none; -webkit-appearance: none;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23818b98' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>");
  background-repeat: no-repeat; background-position: right 8px center; padding-right: 26px;
}
.ghsa-op { flex: 0 0 auto; width: 100px; }
.ghsa-num { width: 92px; }
.ghsa-date { width: 138px; }

/* groups */
.ghsa-group { border: 1px solid var(--border); border-radius: var(--radius-sm); margin-bottom: 10px; overflow: hidden; background: var(--bg); }
.ghsa-group-head {
  display: flex; align-items: center; gap: 8px; padding: 11px 13px;
  cursor: pointer; user-select: none; background: var(--bg-subtle);
}
.ghsa-group-head:hover { background: var(--bg-inset); }
.ghsa-group-title { font-size: 13px; font-weight: 600; flex: 1 1 auto; }
.ghsa-group-desc { font-size: 11.5px; color: var(--fg-faint); font-weight: 400; margin-left: 6px; }
.ghsa-chevron { width: 16px; height: 16px; color: var(--fg-faint); transition: transform .15s; flex: 0 0 auto; }
.ghsa-group.open .ghsa-chevron { transform: rotate(90deg); }
.ghsa-group-body { display: none; padding: 12px 13px; border-top: 1px solid var(--border); }
.ghsa-group.open .ghsa-group-body { display: block; }
.ghsa-badge { font: 600 10px var(--mono); color: var(--fg-muted); background: var(--bg-inset); border-radius: 5px; padding: 2px 6px; }

/* fields */
.ghsa-field { display: flex; align-items: flex-start; gap: 12px; padding: 7px 0; }
.ghsa-field + .ghsa-field { border-top: 1px dashed var(--border); }
.ghsa-field-label { flex: 0 0 168px; padding-top: 6px; font-size: 12.5px; color: var(--fg); line-height: 1.3; }
.ghsa-field-label code { font: 600 11px var(--mono); color: var(--accent); background: var(--accent-soft); padding: 1px 5px; border-radius: 4px; }
.ghsa-field-help { display:block; font-size: 11px; color: var(--fg-faint); margin-top: 3px; }
.ghsa-field-control { flex: 1 1 auto; display: flex; flex-wrap: wrap; align-items: center; gap: 8px; min-width: 0; }
.ghsa-negate {
  display: inline-flex; align-items: center; gap: 5px; font-family: var(--sans); font-size: 11px; color: var(--fg-faint);
  border: 1px solid var(--border); border-radius: 999px; padding: 3px 8px 3px 6px; cursor: pointer;
  background: var(--bg); user-select: none; -webkit-appearance: none;
}
.ghsa-negate.on { color: var(--danger); border-color: var(--danger); }
.ghsa-negate .dot { width: 12px; height: 12px; border-radius: 50%; border: 2px solid currentColor; display:inline-block; }

/* chips */
.ghsa-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.ghsa-chip {
  font-family: var(--sans); font-size: 12px; padding: 5px 10px; border-radius: 999px; cursor: pointer;
  border: 1px solid var(--border); background: var(--bg); color: var(--fg-muted);
  transition: all .1s; user-select: none; -webkit-appearance: none;
}
.ghsa-chip:hover { border-color: var(--border-strong); color: var(--fg); }
.ghsa-chip.active { background: var(--accent); border-color: var(--accent); color: var(--accent-fg); font-weight: 550; }

/* switch */
.ghsa-switch {
  display: inline-flex; align-items: center; gap: 8px; cursor: pointer; user-select: none; font-size: 12.5px; color: var(--fg-muted);
}
.ghsa-switch .track {
  width: 34px; height: 20px; border-radius: 999px; background: var(--border-strong); position: relative; transition: background .15s;
}
.ghsa-switch .track::after {
  content: ''; position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; border-radius: 50%;
  background: #fff; box-shadow: 0 1px 2px rgba(0,0,0,.3); transition: transform .15s;
}
.ghsa-switch.on .track { background: var(--accent); }
.ghsa-switch.on .track::after { transform: translateX(14px); }

/* tag input */
.ghsa-taginput {
  flex: 1 1 auto; display: flex; flex-wrap: wrap; gap: 6px; align-items: center;
  border: 1px solid var(--border); border-radius: var(--radius-xs); padding: 5px 6px; background: var(--bg); min-height: 34px;
}
.ghsa-taginput:focus-within { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
.ghsa-tag { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; background: var(--accent-soft); color: var(--accent); border-radius: 6px; padding: 3px 4px 3px 8px; }
.ghsa-tag button { border: 0; background: transparent; color: inherit; cursor: pointer; font-size: 13px; line-height: 1; padding: 1px 3px; border-radius: 4px; }
.ghsa-tag button:hover { background: rgba(0,0,0,.08); }
.ghsa-taginput input { flex: 1 1 120px; border: 0; outline: 0; background: transparent; font: inherit; font-size: 12.5px; color: var(--fg); padding: 3px; min-width: 80px; }

/* footer */
.ghsa-footer {
  border-top: 1px solid var(--border); background: var(--bg-subtle);
  padding: 12px 18px 14px; display: flex; flex-direction: column; gap: 10px;
}
.ghsa-preview { display: flex; align-items: center; gap: 10px; }
.ghsa-preview-label { font-size: 11px; font-weight: 600; color: var(--fg-faint); flex: 0 0 auto; text-transform: uppercase; letter-spacing: .4px; }
.ghsa-preview-code {
  flex: 1 1 auto; font: 12.5px var(--mono); color: var(--fg);
  background: var(--bg-inset); border: 1px solid var(--border); border-radius: var(--radius-xs);
  padding: 8px 10px; white-space: nowrap; overflow-x: auto; min-height: 34px; display: flex; align-items: center;
}
.ghsa-preview-code .ph { color: var(--fg-faint); font-style: italic; }
.ghsa-preview-code .tok { color: var(--accent); }
.ghsa-toggle-raw { font-size: 11px; color: var(--fg-muted); cursor: pointer; border: 1px solid var(--border); background: var(--bg); border-radius: 6px; padding: 4px 7px; }
.ghsa-raw-wrap { display: none; }
.ghsa-raw-wrap.show { display: block; }
.ghsa-raw { width: 100%; box-sizing: border-box; font: 12.5px var(--mono); color: var(--fg); background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius-xs); padding: 8px 10px; resize: vertical; min-height: 38px; outline: none; }
.ghsa-raw:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }

.ghsa-actions { display: flex; align-items: center; gap: 8px; justify-content: flex-end; flex-wrap: wrap; }
.ghsa-spacer { flex: 1 1 auto; }
.ghsa-hint { font-size: 11.5px; color: var(--fg-faint); }
.ghsa-hint a { color: var(--accent); text-decoration: none; }
.ghsa-hint a:hover { text-decoration: underline; }
.ghsa-btn {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 13px; font-weight: 600; padding: 8px 14px; border-radius: 8px; cursor: pointer;
  border: 1px solid var(--border); background: var(--bg); color: var(--fg);
  transition: background .12s, border-color .12s;
}
.ghsa-btn:hover { background: var(--bg-inset); }
.ghsa-btn svg { width: 15px; height: 15px; }
.ghsa-btn-ghost { color: var(--fg-muted); border-color: transparent; background: transparent; }
.ghsa-btn-ghost:hover { background: var(--bg-inset); }
.ghsa-btn-primary { background: var(--accent); border-color: var(--accent); color: var(--accent-fg); }
.ghsa-btn-primary:hover { background: var(--accent-hover); border-color: var(--accent-hover); }
.ghsa-btn:disabled { opacity: .5; cursor: not-allowed; }

.ghsa-sort-row { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.ghsa-sort-row label { font-size: 12px; color: var(--fg-muted); }
.ghsa-sort-row .ghsa-select { min-width: 150px; }

/* floating launcher */
.ghsa-launcher {
  position: fixed; right: 22px; bottom: 22px; z-index: 2147483640;
  width: 48px; height: 48px; border-radius: 50%;
  display: grid; place-items: center; cursor: pointer;
  background: var(--accent); color: #fff; border: none;
  box-shadow: 0 6px 20px rgba(9, 105, 218, .4), 0 2px 6px rgba(0,0,0,.2);
  transition: transform .12s, box-shadow .12s, opacity .15s;
}
.ghsa-launcher:hover { transform: translateY(-2px) scale(1.04); box-shadow: 0 10px 26px rgba(9,105,218,.5); }
.ghsa-launcher svg { width: 22px; height: 22px; }
.ghsa-launcher.ghsa-hidden { opacity: 0; pointer-events: none; transform: scale(.6); }

.ghsa-empty { padding: 28px 12px; text-align: center; color: var(--fg-muted); font-size: 13px; }
.ghsa-empty b { color: var(--fg); }
`;

// ================= src/qualifiers.js =================
// ===== qualifiers.js =====
// Declarative dataset describing every search type and its qualifiers.
// Schema is defined in SPEC.md. Values are rendered by query-builder.js.

const LANGUAGES = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Rust', 'C', 'C++', 'C#',
  'PHP', 'Ruby', 'Swift', 'Kotlin', 'Scala', 'Shell', 'PowerShell', 'HTML', 'CSS',
  'SCSS', 'Vue', 'Dart', 'Lua', 'Perl', 'Haskell', 'Elixir', 'Erlang', 'Clojure',
  'Objective-C', 'R', 'Julia', 'Matlab', 'Groovy', 'Zig', 'Nim', 'OCaml', 'Lisp',
  'Assembly', 'Dockerfile', 'Makefile', 'Vim script', 'Jupyter Notebook', 'TeX',
];

const LICENSES = [
  { value: 'mit', label: 'MIT' },
  { value: 'apache-2.0', label: 'Apache-2.0' },
  { value: 'gpl-3.0', label: 'GPL-3.0' },
  { value: 'gpl-2.0', label: 'GPL-2.0' },
  { value: 'lgpl-3.0', label: 'LGPL-3.0' },
  { value: 'agpl-3.0', label: 'AGPL-3.0' },
  { value: 'mpl-2.0', label: 'MPL-2.0' },
  { value: 'bsd-3-clause', label: 'BSD-3-Clause' },
  { value: 'bsd-2-clause', label: 'BSD-2-Clause' },
  { value: 'isc', label: 'ISC' },
  { value: 'unlicense', label: 'Unlicense' },
  { value: 'cc0-1.0', label: 'CC0-1.0' },
  { value: 'epl-2.0', label: 'EPL-2.0' },
];

const langOptions = LANGUAGES.map((l) => ({ value: l, label: l }));

const OP_OPTIONS = [
  { value: '>', label: '大于 >' },
  { value: '>=', label: '大于等于 >=' },
  { value: '<', label: '小于 <' },
  { value: '<=', label: '小于等于 <=' },
  { value: '=', label: '精确 =' },
  { value: 'range', label: '区间 a..b' },
];

// ---------- shared block builders ----------

function ownerBlock() {
  return {
    id: 'owner',
    title: '归属范围',
    desc: '限定在某个用户 / 组织 / 仓库内搜索',
    items: [
      { key: 'user', label: '用户 user:', kind: 'text', qualifier: 'user', placeholder: '用户名，或用 @me', allowNegate: true },
      { key: 'org', label: '组织 org:', kind: 'text', qualifier: 'org', placeholder: '组织名', allowNegate: true },
      { key: 'repo', label: '仓库 repo:', kind: 'text', qualifier: 'repo', placeholder: 'owner/name', allowNegate: true },
    ],
  };
}

function languageBlock() {
  return {
    id: 'language',
    title: '语言',
    items: [
      { key: 'language', label: '语言 language:', kind: 'combo', qualifier: 'language', options: langOptions, placeholder: '如 JavaScript', allowNegate: true },
    ],
  };
}

function issueGroups() {
  return [
    {
      id: 'status',
      title: '状态与类型',
      open: true,
      items: [
        {
          key: 'state', label: '状态', kind: 'select', qualifier: 'is',
          options: [
            { value: 'open', label: '打开 open' },
            { value: 'closed', label: '关闭 closed' },
          ],
        },
        {
          key: 'kindIs', label: '类型', kind: 'select', qualifier: 'is',
          options: [
            { value: 'issue', label: '仅 Issue' },
            { value: 'pr', label: '仅 Pull Request' },
          ],
        },
        { key: 'isMerged', label: '已合并 (is:merged)', kind: 'toggle', qualifier: 'is', value: 'merged' },
        { key: 'isUnmerged', label: '未合并 (is:unmerged)', kind: 'toggle', qualifier: 'is', value: 'unmerged' },
        { key: 'isQueued', label: '合并队列 (is:queued)', kind: 'toggle', qualifier: 'is', value: 'queued' },
        { key: 'isDraft', label: '草稿 (is:draft)', kind: 'toggle', qualifier: 'is', value: 'draft' },
        { key: 'isArchived', label: '已归档 (is:archived)', kind: 'toggle', qualifier: 'is', value: 'archived' },
      ],
    },
    {
      id: 'in',
      title: '搜索位置',
      items: [
        {
          key: 'in', label: '匹配于 in:', kind: 'multiCsv', qualifier: 'in',
          options: [
            { value: 'title', label: '标题' },
            { value: 'body', label: '正文' },
            { value: 'comments', label: '评论' },
          ],
        },
      ],
    },
    ownerBlock(),
    {
      id: 'people',
      title: '相关人员',
      items: [
        { key: 'author', label: '作者 author:', kind: 'text', qualifier: 'author', placeholder: '用户名或 @me', allowNegate: true },
        { key: 'assignee', label: '受理人 assignee:', kind: 'text', qualifier: 'assignee', placeholder: '用户名或 @me', allowNegate: true },
        { key: 'mentions', label: '提及 mentions:', kind: 'text', qualifier: 'mentions', placeholder: '用户名', allowNegate: true },
        { key: 'commenter', label: '评论者 commenter:', kind: 'text', qualifier: 'commenter', placeholder: '用户名', allowNegate: true },
        { key: 'involves', label: '涉及 involves:', kind: 'text', qualifier: 'involves', placeholder: '用户名', allowNegate: true },
        { key: 'team', label: '团队 team:', kind: 'text', qualifier: 'team', placeholder: 'org/team' },
      ],
    },
    {
      id: 'meta',
      title: '标签与元数据',
      items: [
        { key: 'label', label: '标签 label:', kind: 'multiRepeat', qualifier: 'label', placeholder: '输入标签后回车', help: '回车添加下一个；多个标签为 AND 关系', allowNegate: true },
        { key: 'milestone', label: '里程碑 milestone:', kind: 'text', qualifier: 'milestone', placeholder: '里程碑名', allowNegate: true },
        { key: 'project', label: '项目 project:', kind: 'text', qualifier: 'project', placeholder: 'org/编号' },
        { key: 'linked', label: '关联 linked:', kind: 'select', qualifier: 'linked', options: [{ value: 'pr', label: 'PR' }, { value: 'issue', label: 'Issue' }] },
        {
          key: 'no', label: '缺失元数据 no:', kind: 'select', qualifier: 'no',
          options: [
            { value: 'label', label: '无标签' },
            { value: 'assignee', label: '无受理人' },
            { value: 'milestone', label: '无里程碑' },
            { value: 'project', label: '无项目' },
          ],
        },
      ],
    },
    {
      id: 'counts',
      title: '数量指标',
      items: [
        { key: 'comments', label: '评论数 comments:', kind: 'number', qualifier: 'comments', opDefault: '>' },
        { key: 'interactions', label: '交互数 interactions:', kind: 'number', qualifier: 'interactions', opDefault: '>' },
        { key: 'reactions', label: '反应数 reactions:', kind: 'number', qualifier: 'reactions', opDefault: '>' },
        { key: 'reactionsPlus1', label: '👍 reactions-+1:', kind: 'number', qualifier: 'reactions-+1', opDefault: '>' },
        { key: 'reactionsHeart', label: '❤️ reactions-heart:', kind: 'number', qualifier: 'reactions-heart', opDefault: '>' },
      ],
    },
    {
      id: 'time',
      title: '时间范围',
      desc: '日期格式 YYYY-MM-DD，支持 >、>=、<、<=、区间',
      items: [
        { key: 'created', label: '创建 created:', kind: 'date', qualifier: 'created', opDefault: '>=' },
        { key: 'updated', label: '更新 updated:', kind: 'date', qualifier: 'updated', opDefault: '>=' },
        { key: 'closedAt', label: '关闭 closed:', kind: 'date', qualifier: 'closed', opDefault: '>=' },
        { key: 'mergedAt', label: '合并 merged:', kind: 'date', qualifier: 'merged', opDefault: '>=' },
      ],
    },
    {
      id: 'review',
      title: '审查与提交状态',
      items: [
        {
          key: 'review', label: '审查结论 review:', kind: 'select', qualifier: 'review',
          options: [
            { value: 'approved', label: '通过 approved' },
            { value: 'changes_requested', label: '请求修改' },
            { value: 'required', label: '需要审查' },
          ],
        },
        { key: 'reviewedBy', label: '审查人 reviewed-by:', kind: 'text', qualifier: 'reviewed-by', placeholder: '用户名或 @me' },
        { key: 'reviewRequested', label: '待审 review-requested:', kind: 'text', qualifier: 'review-requested', placeholder: '用户名或 @me' },
        {
          key: 'status', label: '提交状态 status:', kind: 'select', qualifier: 'status',
          options: [
            { value: 'pending', label: '等待中 pending' },
            { value: 'success', label: '成功 success' },
            { value: 'failure', label: '失败 failure' },
          ],
        },
        { key: 'head', label: '源分支 head:', kind: 'text', qualifier: 'head', placeholder: '分支名' },
        { key: 'base', label: '目标分支 base:', kind: 'text', qualifier: 'base', placeholder: '分支名' },
      ],
    },
  ];
}

// ---------- SEARCH_TYPES ----------

const SEARCH_TYPES = [
  {
    id: 'repositories',
    label: '仓库',
    icon: 'repo',
    docs: 'https://docs.github.com/zh/search-github/searching-on-github/searching-for-repositories',
    keywordLabel: '搜索仓库名称 / 描述 / README…',
    hint: '默认搜索仓库名称、描述与主题；使用 in: 可扩展到 README。',
    sort: {
      param: 's',
      orderParam: 'o',
      options: [
        { value: '', label: '最佳匹配' },
        { value: 'stars', label: 'Star 最多', order: 'desc' },
        { value: 'forks', label: 'Fork 最多', order: 'desc' },
        { value: 'updated', label: '最近更新', order: 'desc' },
      ],
    },
    groups: [
      {
        id: 'in',
        title: '搜索位置',
        open: true,
        items: [
          {
            key: 'in', label: '匹配于 in:', kind: 'multiCsv', qualifier: 'in',
            options: [
              { value: 'name', label: '名称' },
              { value: 'description', label: '描述' },
              { value: 'readme', label: 'README' },
              { value: 'topics', label: '主题' },
            ],
          },
        ],
      },
      ownerBlock(),
      {
        id: 'metrics',
        title: '数据指标',
        items: [
          { key: 'stars', label: 'Star 数 stars:', kind: 'number', qualifier: 'stars', opDefault: '>' },
          { key: 'forks', label: 'Fork 数 forks:', kind: 'number', qualifier: 'forks', opDefault: '>' },
          { key: 'followers', label: '关注数 followers:', kind: 'number', qualifier: 'followers', opDefault: '>' },
          { key: 'size', label: '大小 size:', kind: 'number', qualifier: 'size', opDefault: '<', unit: 'KB' },
          { key: 'topicsCount', label: '主题数 topics:', kind: 'number', qualifier: 'topics', opDefault: '>' },
          { key: 'goodFirstIssues', label: '好上手 issue 数:', kind: 'number', qualifier: 'good-first-issues', opDefault: '>' },
          { key: 'helpWantedIssues', label: '求助 issue 数:', kind: 'number', qualifier: 'help-wanted-issues', opDefault: '>' },
        ],
      },
      languageBlock(),
      {
        id: 'topic',
        title: '主题与许可',
        items: [
          { key: 'topic', label: '主题 topic:', kind: 'text', qualifier: 'topic', placeholder: '如 react', allowNegate: true },
          { key: 'license', label: '许可 license:', kind: 'select', qualifier: 'license', options: LICENSES, allowNegate: true },
        ],
      },
      {
        id: 'attrs',
        title: '属性与可见性',
        items: [
          {
            key: 'fork', label: 'Fork', kind: 'select', qualifier: 'fork',
            options: [
              { value: 'true', label: '包含 fork (fork:true)' },
              { value: 'only', label: '仅 fork (fork:only)' },
            ],
          },
          {
            key: 'visibility', label: '可见性 is:', kind: 'select', qualifier: 'is',
            options: [
              { value: 'public', label: '公开' },
              { value: 'private', label: '私有' },
            ],
          },
          { key: 'archived', label: '已归档 (archived:true)', kind: 'toggle', qualifier: 'archived', value: 'true' },
          { key: 'mirror', label: '镜像 (mirror:true)', kind: 'toggle', qualifier: 'mirror', value: 'true' },
          { key: 'template', label: '模板 (template:true)', kind: 'toggle', qualifier: 'template', value: 'true' },
          { key: 'sponsorable', label: '可赞助 (is:sponsorable)', kind: 'toggle', qualifier: 'is', value: 'sponsorable' },
          { key: 'fundingFile', label: '含赞助文件 (has:funding-file)', kind: 'toggle', qualifier: 'has', value: 'funding-file' },
        ],
      },
      {
        id: 'time',
        title: '时间范围',
        desc: '日期格式 YYYY-MM-DD',
        items: [
          { key: 'created', label: '创建 created:', kind: 'date', qualifier: 'created', opDefault: '>=' },
          { key: 'pushed', label: '推送 pushed:', kind: 'date', qualifier: 'pushed', opDefault: '>=' },
        ],
      },
    ],
  },

  {
    id: 'code',
    label: '代码',
    icon: 'code',
    docs: 'https://docs.github.com/zh/search-github/github-code-search/understanding-github-code-search-syntax',
    keywordLabel: '要搜索的代码内容…',
    hint: '代码搜索：支持正则 /表达式/、精确 "短语"、布尔 AND/OR/NOT；排除用 NOT。',
    groups: [
      ownerBlock(),
      {
        id: 'enterprise',
        title: '企业',
        items: [{ key: 'enterprise', label: '企业 enterprise:', kind: 'text', qualifier: 'enterprise', placeholder: '企业名' }],
      },
      languageBlock(),
      {
        id: 'path',
        title: '路径与符号',
        items: [
          { key: 'pathText', label: '路径 path:', kind: 'text', qualifier: 'path', placeholder: '如 src/**/*.js 或 /README\\.md$/', help: '支持 glob 与正则' },
          { key: 'symbol', label: '符号 symbol:', kind: 'text', qualifier: 'symbol', placeholder: '函数 / 类名，支持正则' },
        ],
      },
      {
        id: 'codeAttrs',
        title: '文件属性 (is:)',
        desc: '排除请开启右侧“排除”，生成 NOT is:xxx',
        items: [
          { key: 'isArchived', label: '已归档', kind: 'toggle', qualifier: 'is', value: 'archived', allowNegate: true },
          { key: 'isFork', label: 'Fork', kind: 'toggle', qualifier: 'is', value: 'fork', allowNegate: true },
          { key: 'isVendored', label: '第三方依赖', kind: 'toggle', qualifier: 'is', value: 'vendored', allowNegate: true },
          { key: 'isGenerated', label: '生成代码', kind: 'toggle', qualifier: 'is', value: 'generated', allowNegate: true },
        ],
      },
    ],
  },

  {
    id: 'issues',
    label: 'Issues',
    icon: 'issue',
    docs: 'https://docs.github.com/zh/search-github/searching-on-github/searching-issues-and-pull-requests',
    keywordLabel: '搜索 Issue 标题 / 正文 / 评论…',
    hint: '默认同时搜索 Issue 与 PR，可用“类型”限定。',
    sort: {
      param: 's', orderParam: 'o',
      options: [
        { value: '', label: '最佳匹配' },
        { value: 'created', label: '最新创建', order: 'desc' },
        { value: 'updated', label: '最近更新', order: 'desc' },
        { value: 'comments', label: '评论最多', order: 'desc' },
        { value: 'reactions', label: '反应最多', order: 'desc' },
      ],
    },
    groups: issueGroups(),
  },

  {
    id: 'pullrequests',
    label: 'Pull requests',
    icon: 'pr',
    docs: 'https://docs.github.com/zh/search-github/searching-on-github/searching-issues-and-pull-requests',
    keywordLabel: '搜索 Pull Request…',
    hint: '已默认限定为 Pull Request；可叠加审查状态、分支等。',
    sort: {
      param: 's', orderParam: 'o',
      options: [
        { value: '', label: '最佳匹配' },
        { value: 'created', label: '最新创建', order: 'desc' },
        { value: 'updated', label: '最近更新', order: 'desc' },
        { value: 'comments', label: '评论最多', order: 'desc' },
      ],
    },
    groups: [
      { id: 'prDefault', title: '类型', open: true, items: [{ key: 'isPr', label: '仅 PR (is:pr)', kind: 'toggle', qualifier: 'is', value: 'pr' }] },
      ...issueGroups(),
    ],
  },

  {
    id: 'discussions',
    label: '讨论',
    icon: 'discuss',
    docs: 'https://docs.github.com/zh/search-github/searching-on-github/searching-discussions',
    keywordLabel: '搜索 Discussion…',
    groups: [
      {
        id: 'status',
        title: '状态',
        open: true,
        items: [
          {
            key: 'state', label: '状态', kind: 'select', qualifier: 'is',
            options: [{ value: 'open', label: '打开 open' }, { value: 'closed', label: '关闭 closed' }],
          },
          { key: 'answered', label: '已回答 (is:answered)', kind: 'toggle', qualifier: 'is', value: 'answered' },
        ],
      },
      {
        id: 'in',
        title: '搜索位置',
        items: [
          {
            key: 'in', label: '匹配于 in:', kind: 'multiCsv', qualifier: 'in',
            options: [{ value: 'title', label: '标题' }, { value: 'body', label: '正文' }, { value: 'comments', label: '评论' }],
          },
        ],
      },
      ownerBlock(),
      {
        id: 'meta',
        title: '标签与分类',
        items: [
          { key: 'label', label: '标签 label:', kind: 'multiRepeat', qualifier: 'label', placeholder: '输入标签后回车' },
          { key: 'category', label: '分类 category:', kind: 'text', qualifier: 'category', placeholder: '分类名' },
          { key: 'author', label: '作者 author:', kind: 'text', qualifier: 'author', placeholder: '用户名或 @me', allowNegate: true },
          { key: 'team', label: '团队 team:', kind: 'text', qualifier: 'team', placeholder: 'org/team' },
          { key: 'comments', label: '评论数 comments:', kind: 'number', qualifier: 'comments', opDefault: '>' },
        ],
      },
      {
        id: 'time',
        title: '时间范围',
        items: [
          { key: 'created', label: '创建 created:', kind: 'date', qualifier: 'created', opDefault: '>=' },
          { key: 'updated', label: '更新 updated:', kind: 'date', qualifier: 'updated', opDefault: '>=' },
        ],
      },
    ],
  },

  {
    id: 'users',
    label: '用户',
    icon: 'user',
    docs: 'https://docs.github.com/zh/search-github/searching-on-github/searching-users',
    keywordLabel: '搜索用户名 / 名称 / 邮箱…',
    sort: {
      param: 's', orderParam: 'o',
      options: [
        { value: '', label: '最佳匹配' },
        { value: 'followers', label: '粉丝最多', order: 'desc' },
        { value: 'repositories', label: '仓库最多', order: 'desc' },
        { value: 'joined', label: '最新加入', order: 'desc' },
      ],
    },
    groups: [
      {
        id: 'in',
        title: '搜索位置',
        open: true,
        items: [
          {
            key: 'in', label: '匹配于 in:', kind: 'multiCsv', qualifier: 'in',
            options: [
              { value: 'login', label: '登录名' },
              { value: 'name', label: '昵称' },
              { value: 'email', label: '邮箱' },
              { value: 'fullname', label: '全名' },
            ],
          },
        ],
      },
      {
        id: 'type',
        title: '账号类型',
        items: [
          {
            key: 'type', label: '类型 type:', kind: 'select', qualifier: 'type',
            options: [{ value: 'user', label: '个人用户' }, { value: 'org', label: '组织' }],
          },
        ],
      },
      {
        id: 'metrics',
        title: '数据指标',
        items: [
          { key: 'repos', label: '仓库数 repos:', kind: 'number', qualifier: 'repos', opDefault: '>' },
          { key: 'followers', label: '粉丝数 followers:', kind: 'number', qualifier: 'followers', opDefault: '>' },
          { key: 'followings', label: '关注数 followings:', kind: 'number', qualifier: 'followings', opDefault: '>' },
        ],
      },
      {
        id: 'profile',
        title: '资料',
        items: [
          languageBlock().items[0],
          { key: 'location', label: '位置 location:', kind: 'text', qualifier: 'location', placeholder: '城市 / 地区' },
        ],
      },
      {
        id: 'time',
        title: '时间',
        items: [{ key: 'created', label: '注册 created:', kind: 'date', qualifier: 'created', opDefault: '>=' }],
      },
    ],
  },

  {
    id: 'commits',
    label: '提交',
    icon: 'commit',
    docs: 'https://docs.github.com/zh/search-github/searching-on-github/searching-commits',
    keywordLabel: '搜索提交信息…',
    groups: [
      ownerBlock(),
      {
        id: 'people',
        title: '作者与提交者',
        items: [
          { key: 'author', label: '作者 author:', kind: 'text', qualifier: 'author', placeholder: '用户名', allowNegate: true },
          { key: 'committer', label: '提交者 committer:', kind: 'text', qualifier: 'committer', placeholder: '用户名', allowNegate: true },
          { key: 'authorName', label: '作者名 author-name:', kind: 'text', qualifier: 'author-name', placeholder: '姓名' },
          { key: 'authorEmail', label: '作者邮箱 author-email:', kind: 'text', qualifier: 'author-email', placeholder: 'name@example.com' },
          { key: 'committerName', label: '提交者名 committer-name:', kind: 'text', qualifier: 'committer-name', placeholder: '姓名' },
        ],
      },
      {
        id: 'hash',
        title: '哈希与合并',
        items: [
          { key: 'hash', label: '提交哈希 hash:', kind: 'text', qualifier: 'hash', placeholder: '完整 SHA' },
          { key: 'parent', label: '父提交 parent:', kind: 'text', qualifier: 'parent', placeholder: '父 SHA' },
          { key: 'tree', label: '树 tree:', kind: 'text', qualifier: 'tree', placeholder: '树 SHA' },
          { key: 'isMerge', label: '合并提交 (is:merge)', kind: 'toggle', qualifier: 'is', value: 'merge' },
        ],
      },
      {
        id: 'time',
        title: '时间',
        items: [
          { key: 'authorDate', label: '作者时间 author-date:', kind: 'date', qualifier: 'author-date', opDefault: '>=' },
          { key: 'committerDate', label: '提交时间 committer-date:', kind: 'date', qualifier: 'committer-date', opDefault: '>=' },
        ],
      },
    ],
  },

  {
    id: 'topics',
    label: '话题',
    icon: 'topic',
    docs: 'https://docs.github.com/zh/search-github/searching-on-github/searching-topics',
    keywordLabel: '搜索话题名称…',
    groups: [
      {
        id: 'attrs',
        title: '话题属性',
        open: true,
        items: [
          { key: 'isCurated', label: '精选 (is:curated)', kind: 'toggle', qualifier: 'is', value: 'curated' },
          { key: 'isFeatured', label: '推荐 (is:featured)', kind: 'toggle', qualifier: 'is', value: 'featured' },
          { key: 'repositories', label: '关联仓库数 repositories:', kind: 'number', qualifier: 'repositories', opDefault: '>' },
        ],
      },
      {
        id: 'time',
        title: '时间',
        items: [{ key: 'created', label: '创建 created:', kind: 'date', qualifier: 'created', opDefault: '>=' }],
      },
    ],
  },

  {
    id: 'marketplace',
    label: 'Marketplace',
    icon: 'market',
    docs: 'https://docs.github.com/zh/search-github/searching-on-github/searching-github-marketplace',
    keywordLabel: '搜索 Marketplace 应用…',
    groups: [],
  },

  {
    id: 'wikis',
    label: 'Wiki',
    icon: 'wiki',
    docs: 'https://docs.github.com/zh/search-github/searching-on-github/searching-wikis',
    keywordLabel: '搜索 Wiki 内容…',
    groups: [ownerBlock()],
  },

  {
    id: 'gists',
    label: 'Gist',
    icon: 'gist',
    baseUrl: 'https://gist.github.com/search',
    docs: 'https://docs.github.com/zh/search-github/searching-on-github/searching-gists',
    keywordLabel: '搜索 Gist 内容…',
    groups: [
      {
        id: 'owner',
        title: '归属',
        open: true,
        items: [{ key: 'user', label: '用户 user:', kind: 'text', qualifier: 'user', placeholder: '用户名' }],
      },
    ],
  },
];

const SEARCH_TYPE_MAP = SEARCH_TYPES.reduce((acc, t) => {
  acc[t.id] = t;
  return acc;
}, {});

// ================= src/query-builder.js =================
// ===== query-builder.js =====
// Pure functions: turn a UI state into a GitHub search query string / URL.
// No DOM access here, so it can be unit-tested in Node.

const GHS_QUOTE_RE_EXACT = /^".*"$/s;
const GHS_QUOTE_RE_REGEX = /^\/.*\/$/s;

/** Quote a single value the way GitHub search expects. */
function quoteValue(raw) {
  if (raw === null || raw === undefined) return '';
  let v = String(raw).trim();
  if (v === '') return '';
  if (GHS_QUOTE_RE_EXACT.test(v) || GHS_QUOTE_RE_REGEX.test(v)) return v;
  if (/[\s"]/u.test(v)) {
    return '"' + v.replace(/"/g, '\\"') + '"';
  }
  return v;
}

/** Escape a value for use inside an exact-match quoted string. */
function escapeExact(raw) {
  return '"' + String(raw).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
}

/** Build the `a:b` prefix for a term, honouring the negate flag. */
function applyNegate(term, key, state, isCode) {
  if (!term) return '';
  if (state && state.negated && state.negated[key]) {
    return isCode ? 'NOT ' + term : '-' + term;
  }
  return term;
}

/** Build one item's term(s) from its current value. Returns a string or ''. */
function buildItemTerm(item, value, state, isCode) {
  if (value === undefined || value === null) return '';
  const q = item.qualifier || '';
  let term = '';

  switch (item.kind) {
    case 'text':
    case 'combo': {
      const v = String(value).trim();
      if (!v) return '';
      term = q ? `${q}:${quoteValue(v)}` : quoteValue(v);
      break;
    }
    case 'select': {
      const v = String(value).trim();
      if (!v) return '';
      term = `${q}:${v}`;
      break;
    }
    case 'multiCsv': {
      const arr = Array.isArray(value) ? value.map((v) => String(v).trim()).filter(Boolean) : [];
      if (!arr.length) return '';
      term = `${q}:${arr.join(',')}`;
      break;
    }
    case 'multiRepeat': {
      const arr = Array.isArray(value) ? value.filter((x) => String(x).trim() !== '') : [];
      if (!arr.length) return '';
      const negAll = !!(state && state.negated && state.negated[item.key]);
      const negList = (state && state._negValues && state._negValues[item.key]) || [];
      const negPrefix = isCode ? 'NOT ' : '-';
      const terms = arr.map((v) => {
        const t = `${q}:${quoteValue(v)}`;
        const isNeg = negAll || negList.indexOf(String(v)) !== -1;
        return isNeg ? negPrefix + t : t;
      });
      return terms.join(' ');
    }
    case 'number': {
      const o = value || {};
      const op = o.op || item.opDefault || '>';
      const v1 = o.v1 !== undefined && o.v1 !== null ? String(o.v1).trim() : '';
      const v2 = o.v2 !== undefined && o.v2 !== null ? String(o.v2).trim() : '';
      if (op === 'range') {
        if (!v1 && !v2) return '';
        term = `${q}:${v1 || '*'}..${v2 || '*'}`;
      } else {
        if (!v1) return '';
        term = `${q}:${op === '=' ? '' : op}${v1}`;
      }
      break;
    }
    case 'date': {
      const o = value || {};
      const op = o.op || item.opDefault || '>=';
      const v1 = o.v1 ? String(o.v1).trim() : '';
      const v2 = o.v2 ? String(o.v2).trim() : '';
      if (op === 'range') {
        if (!v1 && !v2) return '';
        term = `${q}:${v1 || '*'}..${v2 || '*'}`;
      } else {
        if (!v1) return '';
        term = `${q}:${op === '=' ? '' : op}${v1}`;
      }
      break;
    }
    case 'toggle': {
      if (!value) return '';
      term = `${q}:${item.value !== undefined ? item.value : 'true'}`;
      break;
    }
    default:
      return '';
  }

  if (!term) return '';
  // multiRepeat already applied negate itself.
  if (item.kind === 'multiRepeat') return term;
  return applyNegate(term, item.key, state, isCode);
}

/** Build the keyword part (supports AND/OR/NOT + exact/regex). */
function buildKeywords(keywords) {
  if (!keywords || !Array.isArray(keywords.rows)) return '';
  const parts = [];
  keywords.rows.forEach((row, i) => {
    const raw = row && row.value !== undefined ? String(row.value).trim() : '';
    if (!raw) return;
    let token;
    if (row.mode === 'exact') token = escapeExact(raw);
    else if (row.mode === 'regex') token = '/' + raw.replace(/\//g, '\\/') + '/';
    else token = quoteValue(raw);
    // A leading NOT is meaningful (`NOT foo`); a leading AND/OR is not.
    const conn = parts.length === 0
      ? (row.connector === 'NOT' ? 'NOT' : '')
      : (row.connector || 'AND');
    parts.push(conn ? `${conn} ${token}` : token);
  });
  return parts.join(' ');
}

/** Main entry: build the full query string. */
function buildQuery(typeDef, state) {
  if (!typeDef) return '';
  const isCode = typeDef.id === 'code';
  const terms = [];

  const kw = buildKeywords(state && state.keywords);
  if (kw) terms.push(kw);

  (typeDef.groups || []).forEach((group) => {
    (group.items || []).forEach((item) => {
      const val = state && state.quals ? state.quals[item.key] : undefined;
      const term = buildItemTerm(item, val, state, isCode);
      if (term) terms.push(term);
    });
  });

  if (state && state.extra) {
    const extra = String(state.extra).trim();
    if (extra) terms.push(extra);
  }

  return terms.join(' ').replace(/\s+/g, ' ').trim();
}

/** Build the final GitHub search URL. */
function buildSearchUrl(typeDef, query, sortValue) {
  if (!typeDef) return 'https://github.com/search';
  const isGist = (typeDef.baseUrl || '').indexOf('gist.github.com') !== -1;
  const base = typeDef.baseUrl || 'https://github.com/search';
  const enc = encodeURIComponent(query || '');

  if (isGist) {
    return `${base}?q=${enc}`;
  }

  let url = `${base}?q=${enc}&type=${encodeURIComponent(typeDef.id)}`;
  if (sortValue && typeDef.sort && Array.isArray(typeDef.sort.options)) {
    const opt = typeDef.sort.options.find((o) => o.value === sortValue);
    if (opt && opt.value) {
      const p = typeDef.sort.param || 's';
      url += `&${p}=${encodeURIComponent(opt.value)}`;
      const order = opt.order;
      if (order) {
        const op = typeDef.sort.orderParam || 'o';
        url += `&${op}=${encodeURIComponent(order)}`;
      }
    }
  }
  return url;
}

/** Fresh, empty state. */
function createState() {
  return { keywords: { rows: [{ connector: '', value: '', mode: 'normal' }] }, quals: {}, negated: {}, sort: '', extra: '' };
}

// ===== parsing: query string -> UI state =====
// Lets the panel be re-populated from an existing GitHub search URL so the
// user can continue editing with checkboxes/inputs instead of raw text.

/** Split a query into tokens, keeping "quoted phrases" and /regex/ intact. */
function tokenizeQuery(query) {
  const s = String(query || '');
  const tokens = [];
  let i = 0;
  while (i < s.length) {
    const ch = s[i];
    if (/\s/.test(ch)) { i += 1; continue; }
    let tok = '';
    if (ch === '"') {
      tok = '"';
      i += 1;
      while (i < s.length) {
        const c = s[i];
        if (c === '\\' && i + 1 < s.length) { tok += c + s[i + 1]; i += 2; continue; }
        tok += c; i += 1;
        if (c === '"') break;
      }
      // allow `qualifier:"a b"` to be assembled below via the ":" lookback
    } else if (ch === '/') {
      tok = '/';
      i += 1;
      while (i < s.length) {
        const c = s[i];
        if (c === '\\' && i + 1 < s.length) { tok += c + s[i + 1]; i += 2; continue; }
        tok += c; i += 1;
        if (c === '/') break;
      }
    } else {
      while (i < s.length && !/\s/.test(s[i])) {
        const c = s[i];
        // a qualifier may be followed directly by a quoted phrase / regex
        if (c === ':' && (s[i + 1] === '"' || s[i + 1] === '/')) {
          tok += c; i += 1;
          const q = s[i];
          tok += q; i += 1;
          while (i < s.length) {
            const d = s[i];
            if (d === '\\' && i + 1 < s.length) { tok += d + s[i + 1]; i += 2; continue; }
            tok += d; i += 1;
            if (d === q) break;
          }
          break;
        }
        tok += c; i += 1;
      }
    }
    if (tok) tokens.push(tok);
  }
  return tokens;
}

/** Remove the wrapping quotes of a quoted value (handles \" and \\) . */
function unquote(raw) {
  const v = String(raw || '');
  if (v.length >= 2 && v[0] === '"' && v[v.length - 1] === '"') {
    return v.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  }
  if (v.length >= 2 && v[0] === '/' && v[v.length - 1] === '/') {
    return v;
  }
  return v;
}

function splitQualifier(token) {
  const idx = token.indexOf(':');
  if (idx <= 0) return null;
  const name = token.slice(0, idx);
  if (!/^[A-Za-z0-9_.+-]+$/.test(name)) return null;
  return { name: name.toLowerCase(), value: token.slice(idx + 1) };
}

/**
 * Parse a GitHub query into a UI state for the given search type.
 * Values that map onto structured fields fill `quals`/`negated`; anything that
 * cannot be represented is preserved verbatim in `state.extra` so nothing is
 * lost. The first plain terms become keyword rows.
 */
function parseQuery(typeDef, query) {
  const st = createState();
  if (!typeDef) { st.extra = String(query || '').trim(); return st; }
  const isCode = typeDef.id === 'code';
  const tokens = tokenizeQuery(query);

  // index every item by its qualifier name (may be several items per name)
  const byName = {};
  (typeDef.groups || []).forEach((g) => (g.items || []).forEach((it) => {
    const q = (it.qualifier || '').toLowerCase();
    if (!q) return;
    (byName[q] = byName[q] || []).push(it);
  }));

  const keywords = [];
  const extras = [];
  let pendingConnector = '';
  // A leading NOT applies to the NEXT term only. For code search GitHub spells
  // negation as `NOT is:fork` rather than `-is:fork`, so it must be honoured.
  let pendingNot = false;

  const isBool = (t) => t === 'AND' || t === 'OR' || t === 'NOT';

  for (let idx = 0; idx < tokens.length; idx += 1) {
    const tok = tokens[idx];
    if (isBool(tok)) {
      pendingConnector = tok;
      if (tok === 'NOT') pendingNot = true;
      continue;
    }

    let negated = pendingNot;
    pendingNot = false;
    let body = tok;
    if (body[0] === '-' && body.length > 1) { negated = true; body = body.slice(1); }
    else if (body[0] === '-' && body.length === 1) { continue; }

    const qp = splitQualifier(body);
    if (!qp) {
      // plain search term
      const mode = /^\/.*\/$/s.test(body) ? 'regex' : (/^".*"$/s.test(body) ? 'exact' : 'normal');
      const conn = negated ? 'NOT' : pendingConnector;
      keywords.push({ connector: conn, value: unquote(body), mode });
      pendingConnector = '';
      continue;
    }

    const items = byName[qp.name];
    if (!items || !items.length) {
      // unknown qualifier -> keep it verbatim so nothing is lost
      extras.push((negated ? '-' : '') + body);
      pendingConnector = '';
      continue;
    }

    const rawVal = qp.value;
    const item = items.find((it) => canConsume(it, rawVal, isCode)) || items[0];
    if (!assignItemValue(st, item, rawVal, negated)) {
      extras.push((negated ? '-' : '') + body);
    }
    pendingConnector = '';
  }

  if (keywords.length) {
    st.keywords.rows = keywords.map((k, i) => ({
      connector: i === 0 ? (k.connector === 'NOT' ? 'NOT' : '') : (k.connector || 'AND'),
      value: k.value,
      mode: k.mode,
    }));
  }
  st.extra = extras.join(' ');
  return st;
}

/** Can this item represent the given raw value? Used to disambiguate shared names. */
function canConsume(item, rawVal, isCode) {
  const val = unquote(rawVal);
  switch (item.kind) {
    case 'select':
      return (item.options || []).some((o) => String(o.value).toLowerCase() === val.toLowerCase());
    case 'toggle':
      return String(item.value).toLowerCase() === val.toLowerCase();
    case 'multiCsv':
      return val.split(',').every((v) => (item.options || []).some((o) => String(o.value).toLowerCase() === v.trim().toLowerCase()));
    case 'number':
      return /^[<>]=?/.test(val) || /\.\./.test(val) || /^\d+$/.test(val);
    case 'date':
      return /\d{4}-\d{2}-\d{2}/.test(val);
    default:
      return true;
  }
}

/** Write one parsed qualifier into the state. Returns false if it doesn't fit. */
function assignItemValue(st, item, rawVal, negated) {
  const val = unquote(rawVal);
  switch (item.kind) {
    case 'select': {
      const opt = (item.options || []).find((o) => String(o.value).toLowerCase() === val.toLowerCase());
      if (!opt) return false;
      if (negated) {
        // only offer the排除 flag when the field actually supports it
        if (!item.allowNegate) return false;
        st.negated[item.key] = true;
      }
      st.quals[item.key] = opt.value;
      return true;
    }
    case 'toggle': {
      if (String(item.value).toLowerCase() !== val.toLowerCase()) return false;
      st.quals[item.key] = true;
      if (negated) st.negated[item.key] = true;
      return true;
    }
    case 'multiCsv': {
      const arr = val.split(',').map((v) => v.trim()).filter(Boolean);
      if (!arr.length) return false;
      if (negated) return false; // `-in:name,body` has no UI form; keep verbatim
      st.quals[item.key] = arr;
      return true;
    }
    case 'multiRepeat': {
      const cur = Array.isArray(st.quals[item.key]) ? st.quals[item.key] : [];
      cur.push(val);
      st.quals[item.key] = cur;
      if (negated) {
        // mixed polarity (label:a -label:b) can't be expressed by the single
        // per-field flag; remember which values were negated.
        st._negValues = st._negValues || {};
        st._negValues[item.key] = st._negValues[item.key] || [];
        st._negValues[item.key].push(val);
      }
      return true;
    }
    case 'number': {
      const m = val.match(/^(>=|<=|>|<)?(.*)$/);
      const op = m && m[1] ? m[1] : '=';
      const rest = m ? m[2] : val;
      const range = rest.split('..');
      if (range.length === 2) {
        st.quals[item.key] = { op: 'range', v1: range[0] === '*' ? '' : range[0], v2: range[1] === '*' ? '' : range[1] };
      } else {
        if (!/^-?\d+(\.\d+)?$/.test(rest)) return false;
        st.quals[item.key] = { op: op, v1: rest, v2: '' };
      }
      if (negated) st.negated[item.key] = true;
      return true;
    }
    case 'date': {
      const m = val.match(/^(>=|<=|>|<)?(.*)$/);
      const op = m && m[1] ? m[1] : '=';
      const rest = (m ? m[2] : val).split('T')[0];
      const range = rest.split('..');
      if (range.length === 2) {
        st.quals[item.key] = { op: 'range', v1: range[0] === '*' ? '' : range[0], v2: range[1] === '*' ? '' : range[1] };
      } else {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(rest)) return false;
        st.quals[item.key] = { op: op, v1: rest, v2: '' };
      }
      if (negated) st.negated[item.key] = true;
      return true;
    }
    default: {
      st.quals[item.key] = val;
      if (negated) st.negated[item.key] = true;
      return true;
    }
  }
}

// ================= src/ui.js =================
// ===== ui.js =====
// Builds the modal UI inside a Shadow DOM and wires it to the query builder.
// Depends (after build concatenation) on: CSS, SEARCH_TYPES, SEARCH_TYPE_MAP,
// buildQuery, buildSearchUrl, createState.

const ICONS = {
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

function mountAssistant(options) {
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

// ================= src/main.js =================
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

})();
