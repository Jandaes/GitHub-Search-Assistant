// ===== styles.js =====
// CSS injected into the shadow root. Scoped, theme-aware (light/dark).

export const CSS = `
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
