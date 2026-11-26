# Code Review — GitHub 搜索助手 (github-search-assistant.user.js)

Reviewer: reviewer (delegated audit)
Date: 2026-11-26
Scope: `src/*.js`, `build.mjs`, `SPEC.md`, and the built `github-search-assistant.user.js` (1,864 lines).
Method: static reading + `node --check` + `node --test` (query-builder / adversarial / dom-smoke) + a jsdom probe that loads the built script and exercises injection & selector paths.
Constraint observed: no source/build/package/built file was modified by this review.

## Verdict at a glance

- **Shippable?** Not yet. There is **no XSS/security blocker** (injection paths are correctly escaped — verified empirically), but there is **one genuine correctness defect** that produces malformed search queries, and the repository's own test suite is **red** (`npm test` → 2 failing tests).
- **Severity counts:** Blocker **0** · High **1** · Medium **4** · Low **6** · Nit **3**
- `node --check github-search-assistant.user.js` **passes**. Build output `dist/` is byte-identical to the root `.user.js` (in sync).
- Metadata block is sane (`@grant none`, `@match github.com/*` + `gist.github.com/*`, `@run-at document-idle`, no `@require`/`@connect`, no `GM_*`, no `eval`/`new Function`/`document.write`).

---

## High

### H1 — `buildKeywords` emits a leading boolean connector when the first keyword row is blank
- **Severity:** High (correctness; ships malformed query)
- **Location:** `src/query-builder.js:114-128` (`buildKeywords`), specifically `const conn = i === 0 ? '' : (row.connector || 'AND');` at **line 124**. Built file ≈ `github-search-assistant.user.js:1033-1055`.
- **Evidence:** The connector decision uses the **raw array index `i`**, but blank rows are skipped with an early `return` (line 120). So a blank row 0 followed by a filled row 1 makes the first *emitted* token think it is not first and prepend its connector:
  - `buildKeywords({rows:[{connector:'',value:'',mode:'normal'},{connector:'AND',value:'foo',mode:'normal'}]})` → `"AND foo"`
  - Direct `buildQuery(SEARCH_TYPE_MAP.repositories, st)` with a blank first row + `{connector:'AND',value:'foo'}` → **`"AND foo"`**
  - The bundled adversarial suite encodes exactly this: `test/adversarial.test.mjs:465` (`[BUG] blank leading keyword row must not emit a leading AND/OR connector`) and `:477` (`[BUG] buildQuery emits leading connector when first keyword row blank`) — both **fail**. `npm test` = 55 tests, **53 pass / 2 fail**, exit 1.
  - Reachable from the UI: `createState()` initialises one blank row; the "添加关键词" button pushes a second row (`src/ui.js:289-293`). A user who leaves row 0 empty and fills row 1 gets `AND foo`.
- **Suggested fix:** Decide the connector from whether anything has already been emitted, not from `i`. E.g. in `buildKeywords`:
  ```js
  const conn = parts.length === 0 ? '' : (row.connector || 'AND');
  ```
  (and keep `parts.push(conn ? `${conn} ${token}` : token)`). Add/keep the two regression tests; then `npm test` goes green.

---

## Medium

### M2 — `findSearchTrigger` bypasses its own header guard for any `#search-input`
- **Severity:** Medium (functional: can hijack the in-page search field on `/search`)
- **Location:** `src/main.js:56` — `if (inHeader(el) || el.id === 'search-input' || el.classList.contains('header-search-button')) return el;`
- **Evidence:** The comment at `src/main.js:54-55` states hijacking is kept scoped to the header "so the in-page search field (on /search) still behaves normally", but the `|| el.id === 'search-input'` clause **explicitly overrides that guard**. `#search-input` is also the *first* selector (`src/main.js:10`). jsdom probe on a page whose `<main>` contains `<input id="search-input" name="q">`:
  - click on `main #search-input` → `defaultPrevented = true`, overlay `display = flex` → **hijacked**.
  - click on `main input#in-page[name=q]` (a different id) → not hijacked.
  - The project's own `test/dom-smoke.test.mjs` "clicks on the in-page search input are NOT hijacked" uses id **`in-page-search`**, so it never exercises the real `#search-input` case and gives false assurance.
  - I could not confirm the live logged-in /search DOM (GitHub renders it client-side; the fetched logged-out HTML contains no `<input>`), so the practical impact depends on whether GitHub's in-page field uses that id — but the guard is self-contradictory regardless.
- **Suggested fix:** Remove the `|| el.id === 'search-input'` escape hatch; require `inHeader(el)` for all selectors (or scope to `.AppHeader #search-input` / `header #search-input`). Update the smoke test to assert a `#search-input` **inside main** is *not* hijacked.

### M3 — `stopImmediatePropagation` on document capture + broad header/nav selectors can break unrelated GitHub buttons
- **Severity:** Medium (integration risk)
- **Location:** `src/main.js:82-90` (`onClickCapture`, `stopImmediatePropagation` at line 88); `src/main.js:44-46` (`inHeader` treats bare `nav` as header); selector list `src/main.js:9-21`.
- **Evidence:** The capture-phase listener on `document` calls `preventDefault()` + `stopPropagation()` + `stopImmediatePropagation()` for anything `findSearchTrigger` matches. That fires before GitHub's own handlers, so any *matched* click never reaches GitHub (intended for the global search box, but dangerous if over-matched).
  - Over-match surface: `button[aria-label*="Search" i]` and `button[aria-label*="搜索"]` combined with `inHeader()` accepting `nav` means any search-labelled button inside *any* `<nav>` on the page is swallowed. `[role="search"] button` is likewise broad (gated only by `inHeader`, whose `nav` case widens it).
  - On the logged-out marketing header the real trigger is `<button aria-label="Search or jump to, type / to search">` (no `header-search-button` class) — it matches `button[aria-label*="Search" i]`, which is good, but it also shows how generic the aria-label match is.
- **Suggested fix:** Prefer precise selectors (`[data-target^="qbsearch-input"]`, `.header-search-button`, `#search-input`) and drop the bare `nav` / generic aria-label matchers, or restrict them to `header, [role="banner"], .AppHeader`. Avoid `stopImmediatePropagation`; `preventDefault()` + `stopPropagation()` is enough, and don't `preventDefault()` until our modal is confirmed mounted/open.

### M4 — URL `?q=` prefill is stored only in `state.manual` and is silently discarded on any structured edit
- **Severity:** Medium (UX/data loss)
- **Location:** `src/ui.js:111-115` (`getQuery`), `open()` `src/ui.js:556-573` (`st.manual = opts.query`), `markManualOff` `src/ui.js:367`, structured onChange `src/ui.js:376`.
- **Evidence:** `currentPrefill()` passes the URL `q` as `opts.query`; `open()` sets `state.manual = query`. `getQuery()` returns `manual` verbatim while set. Any keyword/qualifier change calls `markManualOff(st)` → `st.manual = null`, after which the query is rebuilt from the empty structured state and the prefilled query is gone. jsdom probe opening `https://github.com/search?q=lang%3Ago+foo&type=repositories`:
  - preview before edit = `"lang:go foo"`, after typing `bar` into the keyword box = `"bar"` (the `lang:go foo` is lost).
- **Suggested fix:** Parse the prefilled query into the structured state (at least keyword rows + simple qualifiers), or keep `manual` sticky until the user explicitly toggles "手改" off, and/or warn that editing fields replaces the raw query. At minimum, don't discard the prefill on the first keystroke.

### M5 — Accessibility: several custom controls are not keyboard-operable and expose no ARIA state
- **Severity:** Medium (a11y)
- **Location:** `src/ui.js`:
  - `multiCsv` chips: `div.ghsa-chip` with only a `click` handler — `src/ui.js:408-424` (no `tabindex`, no `role`, no keydown).
  - "排除" negate: a `<label>` with only a `click` handler — `src/ui.js:455-465` (no focusable control/keyboard).
  - toggle switch: `role="switch" tabindex="0"` but **no `aria-checked`** — `src/ui.js:436-447`.
  - tabs: `role="tablist"/"tab"` but no `aria-selected`, no `role="tabpanel"` linkage, no arrow-key navigation — `src/ui.js:181-189`.
  - group headers: `role="button" tabindex="0"` with Enter/Space — good — but no `aria-expanded` — `src/ui.js:348-351`.
  - Only `aria-label`(×5), `aria-live`(×1), `aria-modal`(×1) exist in the whole built file; **no `aria-checked`/`aria-expanded`/`aria-selected`** (grep-verified).
- **Evidence:** Chips and negate have no keydown handler and are not in `querySelectorAll('button, [href], input, select, textarea, [tabindex]...')`, so the focus trap and keyboard users cannot reach them. Screen readers announce the switch with no on/off state.
- **Suggested fix:** Use real `<button>` for chips/negate (or add `tabindex="0" role="button"` + Enter/Space handlers), add `aria-checked` to switches (update on flip), `aria-expanded` on group heads, `aria-selected` on tabs (+ Left/Right navigation), and `role="tabpanel"`/`aria-controls`.

---

## Low

### L6 — `multiRepeat` "label" help text contradicts the implementation (comma ≠ OR)
- **Location:** `src/qualifiers.js:124` (`help: '多个标签为 AND；用逗号可表示 OR'`) vs `src/ui.js:487-495` (`buildTagInput` treats `,`/`，` as a *delimiter*, emitting one AND term per value).
- **Evidence:** Typing `a,b` yields two tags → `label:a label:b` (AND); GitHub's `label:a,b` (OR) cannot be produced. The audit script also flags these as `multiRepeat-no-options`. Fix: either change the help text, or special-case a comma to emit `label:a,b` when the user wants OR.

### L7 — `--fg-faint` text fails WCAG AA contrast
- **Location:** `src/styles.js:12` `--fg-faint: #818b98` (light), `:35` `#6e7681` (dark). Used for `.ghsa-field-help`/placeholders/`.ghsa-hint` at 11px.
- **Evidence (computed):** `#818b98` on white = **3.45:1**, on `#f6f8fa` = **3.24:1**; dark `#6e7681` on `#161b22` = **3.77:1** — all below the 4.5:1 threshold for small text. Fix: darken light-mode faint text (e.g. `#66707a`) and lighten dark-mode (e.g. `#8b949e`).

### L8 — Raw-editor visibility ("手改") leaks across opens
- **Location:** `src/ui.js:563` — `if (rawWrapEl) rawWrapEl.classList.add('show')` is never removed when a later `open()` has no `opts.query`.
- **Evidence:** After the first open with a `?q=` prefill, the raw textarea stays visible on every subsequent open in the session (class `show` persists), and `state.manual` also persists. Fix: reset/conditionally toggle `show` (and optionally `manual`) at the start of `open()`.

### L9 — Full re-render on add/remove keyword loses focus and resets group expand state
- **Location:** `src/ui.js:289-293` and `:329-331` call `renderBody()`.
- **Evidence:** `renderBody()` does `bodyEl.innerHTML=''` and rebuilds; the newly added row's input is not focused, and groups the user manually expanded collapse back to `group.open || hasActive`. Fix: append/remove just the affected row, or re-focus the new input and preserve per-group open state in state.

### L10 — Focus trap can escape and background is not inert
- **Location:** `src/ui.js:586-599`.
- **Evidence:** The trap only wraps when `shadow.activeElement` is exactly the first or last focusable; if focus is on the overlay/host, Tab can leave. `aria-modal="true"` is set but the page behind the overlay is not `inert`/`aria-hidden`. Fix: make the trap intercept Tab whenever focus is outside `[first,last]`, and set `inert`/`aria-hidden` on `document.body` background (or use the `<dialog>` element) while open.

### L11 — `destroy()` is incomplete (latent leak)
- **Location:** `src/ui.js:608-612` removes only the shadow keydown handler; `src/main.js:119-128` click/keydown listeners and the `MutationObserver` are never removed.
- **Evidence:** `destroy` is not called in normal flow, so impact is latent. Fix: have `destroy()` remove all document listeners and disconnect the observer if it will ever be used (e.g. on script unload).

---

## Nit

- **N1 — Non-deterministic build:** `build.mjs:45` embeds `new Date().toISOString()` in the banner, so byte-for-byte reproducible builds are impossible and dist/root can differ only by timestamp. Consider omitting it or using `SOURCE_DATE_EPOCH`.
- **N2 — Dead CSS:** `src/styles.js:204` `.ghsa-negate input { display:none; }` — no `<input>` exists inside `.ghsa-negate`.
- **N3 — Build regex fragility / metadata extras:** `build.mjs:16-17` strips `import`/`export` with line-anchored regexes (fine today, but a line beginning with `import`/`export ` inside a template string would be mangled). Userscript lacks `@updateURL`/`@downloadURL` (optional). `window.__GHSA__`/`window.__GHSA_MOUNTED__` pollute the page global (acceptable, namespaced).

---

## What is actually fine (verified, so we don't "fix" non-problems)

1. **SECURITY / XSS — no exploitable path found.** This is the strongest positive result:
   - `highlightQuery` (`src/ui.js:214-221`) HTML-escapes every token via `safeText`, and returns only whitespace verbatim (whitespace-only branch). `safeText` (`src/ui.js:72-74`) escapes `& < > "`. The only `innerHTML` sinks in the built file are: `h()`'s `html` prop and `svg()` (both fed **static** `ICONS` constants only), the constant empty-preview placeholder, `highlightQuery(q)`, and `copyQuery` re-assigning a captured static `innerHTML`.
   - jsdom probe, keyword = `<img src=x onerror=window.__PWNED=1>"><script>...` → preview `innerHTML` is fully entity-encoded, `querySelectorAll('img').length = 0`, `window.__PWNED`/`__PWNED2` remain `undefined` (no execution). textContent shows the literal string.
   - jsdom probe, prefilled `?q=<svg onload=...>` (manual mode) → rendered as text, `svg` element count 0, `window.__PWNED3` `undefined`.
   - All qualifier/keyword values reach the DOM via `textContent`/`createTextNode`/`option.text`; the query→URL path uses `encodeURIComponent`. The `{{...}}`-style tokens visible in source are a harness-substituted sentinel used consistently as the "unset" value — not a runtime defect (the built file passes `node --check`).
2. **DOM selector — `/` shortcut does not conflict with typing.** `onKeydown` bails for `input/textarea/select/contentEditable` (`src/main.js:92-102`). jsdom probe: `/` inside an `<input>` does **not** open the modal; `/` on `body` opens it (`defaultPrevented = true`).
3. **Modern header search is generally caught** by `.header-search-button` / `[data-target^="qbsearch-input"]` and (logged-out) by `button[aria-label*="Search" i]`; the logged-out trigger is a `<button aria-label="Search or jump to, type / to search">` inside the header, so `inHeader` + the aria-label matcher catch it.
4. **Event wiring / re-mount is sound for normal use.** Mount guard `window.__GHSA_MOUNTED__` prevents double binding; jsdom double-`eval` yields exactly one `#ghsa-host`. `MutationObserver` + `turbo:load`/`pjax:end` re-attach a detached host. No per-render global listener leaks (listeners live on recreated nodes). Launcher hide/show via class on open/close works.
5. **Query/URL building.** `encodeURIComponent` on `q`; `type=<id>`; sort appended as `&s=<value>&o=<order>` only for known options with a non-empty value; gists use `gist.github.com/search?q=` with no `type`/sort (SPEC-conformant). Empty query: `doSearch` focuses the first keyword and does **not** navigate.
6. **State preservation across tabs.** `states` is a `Map` keyed by type id; switching tabs re-renders from the stored state (`src/ui.js:80,105-109,191-197`).
7. **Build hygiene basics.** `node --check` passes; `dist/` == root; no `eval`/`new Function`/`document.write`/`GM_*`; `@grant none` appropriate; `@match` covers github.com + gist.github.com; `@run-at document-idle`.

---

## Priority order to reach "safe to ship"

1. Fix **H1** (one-line `buildKeywords` change) → makes the intended-red adversarial suite green.
2. Fix **M2** (remove `#search-input` escape hatch) and adjust the smoke test.
3. Address **M3** selector breadth / `stopImmediatePropagation` and **M4** prefill handling.
4. Do the **M5** a11y pass (chips/negate focusability + `aria-*` state).
5. Clean up **L6–L11** and **N1–N3** opportunistically.

---

## Round 2 — Re-verification after fixes (2026-11-26)

Status: **all previously-reported Blocker/High/Medium items resolved. No Blocker/High remain.**

Commands re-run:
- `node --check github-search-assistant.user.js` → **PASS**
- `node --test test/query-builder.test.mjs test/adversarial.test.mjs test/dom-smoke.test.mjs` → **62 tests, 62 pass, 0 fail**
- `dist/` == root `.user.js` → **byte-identical**

Fix-by-fix re-inspection (source + built):
- **H1** — `src/query-builder.js` now `const conn = parts.length === 0 ? '' : (row.connector || 'AND')` (built L1043). Independent UI repro (blank row0 + fill added row1) → preview `"foo"` (no leading `AND`). The two `[BUG]` adversarial tests now pass.
- **M2** — `findSearchTrigger` now `if (!inHeader(el)) continue;` for every selector (`src/main.js:57`); no `#search-input`/class escape hatch. jsdom probe: `<main> #search-input` → `defaultPrevented=false`, no overlay; header `#search-input` → `defaultPrevented=true`, overlay opens. Correct.
- **M3** — `stopImmediatePropagation` count in built = **0**; `onClickCapture` now only `preventDefault()+stopPropagation()`. `inHeader` narrowed to `header, [role="banner"], .AppHeader, .Header, .js-header-wrapper, [data-testid="global-nav"]` (no bare `nav`).
- **M4** — `currentPrefill()` now carries only `type` (not `?q=`); `open()` clears stale `manual` and removes raw-editor `.show` on a fresh open, while programmatic `open({query})` still works. jsdom probe on `/search?q=lang%3Ago+foo`: preview stays empty placeholder, raw editor hidden → prefill no longer silently lost. Correct.
- **M5** — chips are `<button aria-pressed>` (built: 4 `aria-pressed`), 排除 is a `<button aria-pressed>`, switches `aria-checked` (updated on flip), tabs `aria-selected` + roving `tabindex` + Left/Right nav, group heads `aria-expanded` (updated on toggle), body `role="tabpanel"`, focus trap catches focus outside the modal (`!modalEl.contains(active)`). Correct.
- **L6** label help now "回车添加下一个；多个标签为 AND 关系". **L7** `--fg-faint` now `#66707a` / `#8b949e`. **L8** raw `.show` reset on fresh open. **L9** group open-state kept in `state._open`, new keyword row focused on add (`src/ui.js:310-311`). **N1** build timestamp removed. **N2** dead `.ghsa-negate input` CSS removed.
- Security re-checked: jsdom injection with keyword `<img onerror>`/`<script>` still fully entity-encoded, 0 injected elements, no execution.

Residual (optional, non-blocking): tabpanel has no `aria-controls`/`aria-labelledby` linkage; `.ghsa-chip`/`.ghsa-negate` as native `<button>` may need `font: inherit` for pixel-perfect parity. These are Nits only.

**Verdict: SHIP.**
