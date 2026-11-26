// ===== query-builder.js =====
// Pure functions: turn a UI state into a GitHub search query string / URL.
// No DOM access here, so it can be unit-tested in Node.

const GHS_QUOTE_RE_EXACT = /^".*"$/s;
const GHS_QUOTE_RE_REGEX = /^\/.*\/$/s;

/** Quote a single value the way GitHub search expects. */
export function quoteValue(raw) {
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
export function buildItemTerm(item, value, state, isCode) {
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
      const terms = arr.map((v) => `${q}:${quoteValue(v)}`);
      if (state && state.negated && state.negated[item.key]) {
        const neg = isCode ? 'NOT ' : '-';
        return terms.map((t) => neg + t).join(' ');
      }
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
export function buildKeywords(keywords) {
  if (!keywords || !Array.isArray(keywords.rows)) return '';
  const parts = [];
  keywords.rows.forEach((row, i) => {
    const raw = row && row.value !== undefined ? String(row.value).trim() : '';
    if (!raw) return;
    let token;
    if (row.mode === 'exact') token = escapeExact(raw);
    else if (row.mode === 'regex') token = '/' + raw.replace(/\//g, '\\/') + '/';
    else token = quoteValue(raw);
    const conn = parts.length === 0 ? '' : (row.connector || 'AND');
    parts.push(conn ? `${conn} ${token}` : token);
  });
  return parts.join(' ');
}

/** Main entry: build the full query string. */
export function buildQuery(typeDef, state) {
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
export function buildSearchUrl(typeDef, query, sortValue) {
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
export function createState() {
  return { keywords: { rows: [{ connector: '', value: '', mode: 'normal' }] }, quals: {}, negated: {}, sort: '', extra: '' };
}
