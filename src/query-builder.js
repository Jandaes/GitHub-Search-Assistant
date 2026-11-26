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
    // A leading NOT is meaningful (`NOT foo`); a leading AND/OR is not.
    const conn = parts.length === 0
      ? (row.connector === 'NOT' ? 'NOT' : '')
      : (row.connector || 'AND');
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

// ===== parsing: query string -> UI state =====
// Lets the panel be re-populated from an existing GitHub search URL so the
// user can continue editing with checkboxes/inputs instead of raw text.

/** Split a query into tokens, keeping "quoted phrases" and /regex/ intact. */
export function tokenizeQuery(query) {
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
export function parseQuery(typeDef, query) {
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
