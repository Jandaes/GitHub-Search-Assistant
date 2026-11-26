// ============================================================
// Independent, adversarial verification of the GitHub search
// query engine. Written from scratch (does not reuse
// test/query-builder.test.mjs). Asserts exact output against
// SPEC.md plus real GitHub search syntax.
//
// The suite is green for all behaviour that matches the spec. The
// ONLY intentionally-failing tests are the two `[BUG]` blocks near
// the bottom, which demonstrate a genuine defect in
// src/query-builder.js (see the report to the Lead).
// ============================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  quoteValue,
  buildItemTerm,
  buildKeywords,
  buildQuery,
  buildSearchUrl,
  createState,
} from '../src/query-builder.js';
import { SEARCH_TYPES, SEARCH_TYPE_MAP } from '../src/qualifiers.js';

// ---------- helpers ----------
function getItem(typeId, key) {
  const t = typeof typeId === 'string' ? SEARCH_TYPE_MAP[typeId] : typeId;
  for (const g of t.groups) for (const it of g.items) if (it.key === key) return it;
  throw new Error(`item ${typeId}/${key} not found`);
}
const isCode = (t) => t.id === 'code';

// ============================================================
// 1. quoteValue
// ============================================================
test('quoteValue: empty / whitespace-only / null', () => {
  assert.equal(quoteValue(''), '');
  assert.equal(quoteValue('   '), '');
  assert.equal(quoteValue('\t\n  '), '');
  assert.equal(quoteValue(null), '');
});

test('quoteValue: plain values pass through unchanged', () => {
  assert.equal(quoteValue('cats'), 'cats');
  assert.equal(quoteValue('  cats  '), 'cats');
  assert.equal(quoteValue('c++'), 'c++');
  assert.equal(quoteValue('foo:bar'), 'foo:bar');
  assert.equal(quoteValue('src/lib/index.js'), 'src/lib/index.js');
  assert.equal(quoteValue('a\\b'), 'a\\b'); // single backslash is preserved (no space/quote)
  assert.equal(quoteValue('0'), '0');
  assert.equal(quoteValue(0), '0');
  assert.equal(quoteValue(false), 'false');
});

test('quoteValue: already-quoted exact strings returned as-is', () => {
  assert.equal(quoteValue('"hello world"'), '"hello world"');
  assert.equal(quoteValue('""'), '""');
  assert.equal(quoteValue('"a" "b"'), '"a" "b"');
});

test('quoteValue: already-regex values returned as-is', () => {
  assert.equal(quoteValue('/sparse.*index/'), '/sparse.*index/');
  assert.equal(quoteValue('//'), '//');
  assert.equal(quoteValue('/^App\\/src\\//'), '/^App\\/src\\//');
});

test('quoteValue: values with spaces or double quotes get wrapped and escaped', () => {
  assert.equal(quoteValue('hello world'), '"hello world"');
  assert.equal(quoteValue('say "hi"'), '"say \\"hi\\""');
  assert.equal(quoteValue('a"b'), '"a\\"b"');
  assert.equal(quoteValue('  a  b  '), '"a  b"');
  assert.equal(quoteValue('hello\tworld'), '"hello\tworld"');
  assert.equal(quoteValue('"unterminated'), '"\\"unterminated"');
  assert.equal(quoteValue('foo"'), '"foo\\""');
});

// ============================================================
// 2. Item kinds across MANY real search types (exact output)
// ============================================================
test('text / combo rendering across types', () => {
  assert.equal(buildItemTerm(getItem('repositories', 'topic'), 'machine learning', {}, false), 'topic:"machine learning"');
  assert.equal(buildItemTerm(getItem('repositories', 'topic'), 'react', {}, false), 'topic:react');
  assert.equal(buildItemTerm(getItem('code', 'pathText'), 'src/index.js', {}, false), 'path:src/index.js');
  assert.equal(buildItemTerm(getItem('code', 'symbol'), 'myFunc', {}, false), 'symbol:myFunc');
  assert.equal(buildItemTerm(getItem('issues', 'author'), 'octocat', {}, false), 'author:octocat');
  assert.equal(buildItemTerm(getItem('commits', 'authorName'), "Ada Lovelace", {}, false), "author-name:\"Ada Lovelace\"");
  assert.equal(buildItemTerm(getItem('commits', 'hash'), 'deadbeef', {}, false), 'hash:deadbeef');
  assert.equal(buildItemTerm(getItem('discussions', 'category'), 'Q&A', {}, false), 'category:Q&A');
  assert.equal(buildItemTerm(getItem('users', 'location'), 'New York', {}, false), 'location:"New York"');
  assert.equal(buildItemTerm(getItem('gists', 'user'), 'octocat', {}, false), 'user:octocat');
});

test('select rendering across types (value never quoted)', () => {
  assert.equal(buildItemTerm(getItem('repositories', 'license'), 'apache-2.0', {}, false), 'license:apache-2.0');
  assert.equal(buildItemTerm(getItem('repositories', 'fork'), 'only', {}, false), 'fork:only');
  assert.equal(buildItemTerm(getItem('repositories', 'visibility'), 'public', {}, false), 'is:public');
  assert.equal(buildItemTerm(getItem('issues', 'state'), 'open', {}, false), 'is:open');
  assert.equal(buildItemTerm(getItem('issues', 'kindIs'), 'pr', {}, false), 'is:pr');
  assert.equal(buildItemTerm(getItem('issues', 'linked'), 'issue', {}, false), 'linked:issue');
  assert.equal(buildItemTerm(getItem('issues', 'review'), 'changes_requested', {}, false), 'review:changes_requested');
  assert.equal(buildItemTerm(getItem('issues', 'status'), 'success', {}, false), 'status:success');
  assert.equal(buildItemTerm(getItem('users', 'type'), 'org', {}, false), 'type:org');
  // empty select ignored
  assert.equal(buildItemTerm(getItem('repositories', 'license'), '', {}, false), '');
  assert.equal(buildItemTerm(getItem('repositories', 'license'), '   ', {}, false), '');
});

test('multiCsv rendering (comma-joined single qualifier)', () => {
  assert.equal(buildItemTerm(getItem('repositories', 'in'), ['name', 'readme'], {}, false), 'in:name,readme');
  assert.equal(buildItemTerm(getItem('repositories', 'in'), ['name'], {}, false), 'in:name');
  assert.equal(buildItemTerm(getItem('issues', 'in'), ['title', 'body', 'comments'], {}, false), 'in:title,body,comments');
  assert.equal(buildItemTerm(getItem('users', 'in'), ['login', 'email'], {}, false), 'in:login,email');
  assert.equal(buildItemTerm(getItem('repositories', 'in'), [], {}, false), '');
  assert.equal(buildItemTerm(getItem('repositories', 'in'), ['name', '', 'readme'], {}, false), 'in:name,readme');
});

test('multiRepeat rendering (one term per value, each quoted independently)', () => {
  assert.equal(buildItemTerm(getItem('issues', 'label'), ['bug', 'p1'], {}, false), 'label:bug label:p1');
  assert.equal(buildItemTerm(getItem('issues', 'label'), ['bug', 'help wanted'], {}, false), 'label:bug label:"help wanted"');
  assert.equal(buildItemTerm(getItem('issues', 'label'), [], {}, false), '');
  assert.equal(buildItemTerm(getItem('issues', 'label'), ['  ', 'bug'], {}, false), 'label:bug');
  assert.equal(buildItemTerm(getItem('discussions', 'label'), ['one', 'two'], {}, false), 'label:one label:two');
});

test('toggle rendering (on => qualifier:value, off => empty)', () => {
  assert.equal(buildItemTerm(getItem('repositories', 'archived'), true, {}, false), 'archived:true');
  assert.equal(buildItemTerm(getItem('repositories', 'mirror'), true, {}, false), 'mirror:true');
  assert.equal(buildItemTerm(getItem('repositories', 'sponsorable'), true, {}, false), 'is:sponsorable');
  assert.equal(buildItemTerm(getItem('repositories', 'fundingFile'), true, {}, false), 'has:funding-file');
  assert.equal(buildItemTerm(getItem('issues', 'isMerged'), true, {}, false), 'is:merged');
  assert.equal(buildItemTerm(getItem('issues', 'isQueued'), true, {}, false), 'is:queued');
  assert.equal(buildItemTerm(getItem('code', 'isVendored'), true, {}, false), 'is:vendored');
  assert.equal(buildItemTerm(getItem('commits', 'isMerge'), true, {}, false), 'is:merge');
  assert.equal(buildItemTerm(getItem('topics', 'isCurated'), true, {}, false), 'is:curated');
  assert.equal(buildItemTerm(getItem('repositories', 'archived'), false, {}, false), '');
});

// ============================================================
// 3. number operators
// ============================================================
test('number: every operator', () => {
  const stars = getItem('repositories', 'stars'); // opDefault '>'
  assert.equal(buildItemTerm(stars, { op: '>', v1: '100' }, {}, false), 'stars:>100');
  assert.equal(buildItemTerm(stars, { op: '>=', v1: '100' }, {}, false), 'stars:>=100');
  assert.equal(buildItemTerm(stars, { op: '<', v1: '100' }, {}, false), 'stars:<100');
  assert.equal(buildItemTerm(stars, { op: '<=', v1: '100' }, {}, false), 'stars:<=100');
  assert.equal(buildItemTerm(stars, { op: '=', v1: '100' }, {}, false), 'stars:100');
});

test('number: range forms (both / open-ended / empty)', () => {
  const stars = getItem('repositories', 'stars');
  assert.equal(buildItemTerm(stars, { op: 'range', v1: '10', v2: '20' }, {}, false), 'stars:10..20');
  assert.equal(buildItemTerm(stars, { op: 'range', v1: '10' }, {}, false), 'stars:10..*');
  assert.equal(buildItemTerm(stars, { op: 'range', v2: '20' }, {}, false), 'stars:*..20');
  assert.equal(buildItemTerm(stars, { op: 'range' }, {}, false), '');
  assert.equal(buildItemTerm(stars, { op: 'range', v1: '', v2: '' }, {}, false), '');
});

test('number: default op, trimming, invalid/empty ignored, zero kept', () => {
  const stars = getItem('repositories', 'stars');
  assert.equal(buildItemTerm(stars, { v1: '10' }, {}, false), 'stars:>10'); // opDefault
  assert.equal(buildItemTerm(stars, { op: '>=', v1: ' 5 ' }, {}, false), 'stars:>=5');
  assert.equal(buildItemTerm(stars, { op: '>', v1: '' }, {}, false), '');
  assert.equal(buildItemTerm(stars, { op: '>', v1: '   ' }, {}, false), '');
  assert.equal(buildItemTerm(stars, { op: '>', v1: null }, {}, false), '');
  assert.equal(buildItemTerm(stars, { op: '>' }, {}, false), ''); // missing v1 treated as empty
  assert.equal(buildItemTerm(stars, { op: '=', v1: '0' }, {}, false), 'stars:0'); // 0 is a valid value
  // opDefault '<' honoured when no op passed
  assert.equal(buildItemTerm(getItem('repositories', 'size'), { v1: '1024' }, {}, false), 'size:<1024');
});

// ============================================================
// 4. date operators
// ============================================================
test('date: every operator + range + defaults + empty', () => {
  const created = getItem('issues', 'created'); // opDefault '>='
  assert.equal(buildItemTerm(created, { op: '>=', v1: '2024-01-01' }, {}, false), 'created:>=2024-01-01');
  assert.equal(buildItemTerm(created, { op: '>', v1: '2024-01-01' }, {}, false), 'created:>2024-01-01');
  assert.equal(buildItemTerm(created, { op: '<', v1: '2024-01-01' }, {}, false), 'created:<2024-01-01');
  assert.equal(buildItemTerm(created, { op: '<=', v1: '2024-01-01' }, {}, false), 'created:<=2024-01-01');
  assert.equal(buildItemTerm(created, { op: '=', v1: '2024-01-01' }, {}, false), 'created:2024-01-01');
  assert.equal(buildItemTerm(created, { op: 'range', v1: '2024-01-01', v2: '2024-12-31' }, {}, false), 'created:2024-01-01..2024-12-31');
  assert.equal(buildItemTerm(created, { op: 'range', v1: '2024-01-01' }, {}, false), 'created:2024-01-01..*');
  assert.equal(buildItemTerm(created, { op: 'range', v2: '2024-12-31' }, {}, false), 'created:*..2024-12-31');
  assert.equal(buildItemTerm(created, { v1: '2024-01-01' }, {}, false), 'created:>=2024-01-01'); // default
  assert.equal(buildItemTerm(created, { op: '>', v1: '' }, {}, false), '');
  assert.equal(buildItemTerm(created, { op: 'range' }, {}, false), '');
  // commit date qualifiers use distinct qualifier names
  assert.equal(buildItemTerm(getItem('commits', 'authorDate'), { op: '>=', v1: '2023-01-01' }, {}, false), 'author-date:>=2023-01-01');
  assert.equal(buildItemTerm(getItem('commits', 'committerDate'), { v1: '2023-01-01' }, {}, false), 'committer-date:>=2023-01-01');
});

// ============================================================
// 5. negate behaviour
// ============================================================
test('negate: non-code uses "-", code uses "NOT "', () => {
  assert.equal(buildItemTerm(getItem('repositories', 'language'), 'go', {}, false), 'language:go');
  assert.equal(buildItemTerm(getItem('repositories', 'language'), 'go', { negated: { language: true } }, false), '-language:go');
  assert.equal(buildItemTerm(getItem('code', 'language'), 'go', { negated: { language: true } }, true), 'NOT language:go');
});

test('negate: select / text / number / date / toggle', () => {
  assert.equal(buildItemTerm(getItem('repositories', 'license'), 'mit', { negated: { license: true } }, false), '-license:mit');
  assert.equal(buildItemTerm(getItem('issues', 'author'), 'octocat', { negated: { author: true } }, false), '-author:octocat');
  assert.equal(buildItemTerm(getItem('repositories', 'stars'), { op: '>', v1: '5' }, { negated: { stars: true } }, false), '-stars:>5');
  assert.equal(buildItemTerm(getItem('issues', 'created'), { op: '>=', v1: '2024-01-01' }, { negated: { created: true } }, true), 'NOT created:>=2024-01-01');
  assert.equal(buildItemTerm(getItem('repositories', 'archived'), true, { negated: { archived: true } }, false), '-archived:true');
  assert.equal(buildItemTerm(getItem('code', 'isArchived'), true, { negated: { isArchived: true } }, true), 'NOT is:archived');
});

test('negate: multiRepeat prefixes every repeated term', () => {
  const label = getItem('issues', 'label');
  assert.equal(buildItemTerm(label, ['bug', 'p1'], {}, false), 'label:bug label:p1');
  assert.equal(buildItemTerm(label, ['bug', 'p1'], { negated: { label: true } }, false), '-label:bug -label:p1');
  // generic multiRepeat on a code type must use NOT on every term
  const synth = { kind: 'multiRepeat', qualifier: 'label', key: 'label' };
  assert.equal(buildItemTerm(synth, ['bug', 'p1'], { negated: { label: true } }, true), 'NOT label:bug NOT label:p1');
});

test('negate: only applies to the matching key', () => {
  assert.equal(
    buildItemTerm(getItem('repositories', 'language'), 'go', { negated: { topic: true } }, false),
    'language:go'
  );
});

// ============================================================
// 6. keywords
// ============================================================
test('keywords: normal / exact / regex modes', () => {
  assert.equal(buildKeywords({ rows: [{ value: 'hello', mode: 'normal' }] }), 'hello');
  assert.equal(buildKeywords({ rows: [{ value: 'hello world', mode: 'normal' }] }), '"hello world"');
  assert.equal(buildKeywords({ rows: [{ value: 'hello world', mode: 'exact' }] }), '"hello world"');
  assert.equal(buildKeywords({ rows: [{ value: '  a  ', mode: 'exact' }] }), '"a"');
  assert.equal(buildKeywords({ rows: [{ value: 'say "hi"', mode: 'exact' }] }), '"say \\"hi\\""');
  assert.equal(buildKeywords({ rows: [{ value: 'foo.*bar', mode: 'regex' }] }), '/foo.*bar/');
  assert.equal(buildKeywords({ rows: [{ value: 'a/b', mode: 'regex' }] }), '/a\\/b/'); // forward slashes escaped
});

test('keywords: AND / OR / NOT connectors; first-row connector ignored', () => {
  assert.equal(
    buildKeywords({ rows: [
      { connector: '', value: 'sparse', mode: 'normal' },
      { connector: 'OR', value: 'index', mode: 'normal' },
      { connector: 'NOT', value: 'deprecated', mode: 'normal' },
    ] }),
    'sparse OR index NOT deprecated'
  );
  assert.equal(
    buildKeywords({ rows: [
      { connector: 'OR', value: 'a', mode: 'normal' },
      { connector: 'AND', value: 'b', mode: 'normal' },
    ] }),
    'a AND b'
  );
  assert.equal(
    buildKeywords({ rows: [
      { connector: '', value: 'a', mode: 'normal' },
      { connector: '', value: 'b', mode: 'normal' },
    ] }),
    'a AND b'
  );
});

test('keywords: empty / blank rows are skipped, whitespace trimmed, empty input', () => {
  assert.equal(buildKeywords({ rows: [] }), '');
  assert.equal(buildKeywords(null), '');
  assert.equal(buildKeywords({}), '');
  assert.equal(
    buildKeywords({ rows: [
      { connector: '', value: 'a', mode: 'normal' },
      { connector: '', value: '   ', mode: 'normal' },
      { connector: '', value: 'b', mode: 'normal' },
    ] }),
    'a AND b'
  );
  assert.equal(buildKeywords({ rows: [{ value: '  a  ', mode: 'normal' }] }), 'a');
});

// ============================================================
// 7. buildQuery
// ============================================================
test('buildQuery: empty state => ""', () => {
  assert.equal(buildQuery(SEARCH_TYPE_MAP.repositories, createState()), '');
  assert.equal(buildQuery(null, createState()), '');
});

test('buildQuery: empty item values ignored', () => {
  const st = createState();
  st.quals = { stars: { op: '>', v1: '' }, language: '', in: [], label: [] };
  assert.equal(buildQuery(SEARCH_TYPE_MAP.repositories, st), '');
});

test('buildQuery: exact ordering — keywords, then groups in data order, then extra', () => {
  const st = createState();
  st.keywords.rows = [
    { connector: '', value: 'machine learning', mode: 'normal' },
    { connector: 'OR', value: 'deep', mode: 'normal' },
  ];
  // deliberately insert quals in a scrambled order
  st.quals = {};
  st.quals.license = 'mit';
  st.quals.created = { op: '>=', v1: '2020-01-01' };
  st.quals.language = 'Python';
  st.quals.archived = true;
  st.quals.stars = { op: '>=', v1: '50' };
  st.quals.followers = { op: '>', v1: '100' };
  st.quals.topicsCount = { op: '>', v1: '3' };
  st.quals.in = ['name', 'readme'];
  st.quals.topic = 'ml';
  st.quals.visibility = 'public';
  st.quals.fork = 'only';
  st.extra = 'NOT is:archived';
  assert.equal(
    buildQuery(SEARCH_TYPE_MAP.repositories, st),
    '"machine learning" OR deep in:name,readme stars:>=50 followers:>100 topics:>3 ' +
      'language:Python topic:ml license:mit fork:only is:public archived:true ' +
      'created:>=2020-01-01 NOT is:archived'
  );
});

test('buildQuery: qualifier output order follows data, not insertion order', () => {
  const st = createState();
  st.quals = {};
  st.quals.license = 'mit'; // group "topic" appears late
  st.quals.language = 'go'; // group "language"
  st.quals.stars = { op: '>', v1: '1' }; // group "metrics" first
  assert.equal(buildQuery(SEARCH_TYPE_MAP.repositories, st), 'stars:>1 language:go license:mit');
});

test('buildQuery: extra appended, trimmed, blank ignored, whitespace collapsed', () => {
  const st = createState();
  st.quals = { language: 'go' };
  st.extra = '   ';
  assert.equal(buildQuery(SEARCH_TYPE_MAP.repositories, st), 'language:go');
  st.extra = '  NOT   is:archived  ';
  assert.equal(buildQuery(SEARCH_TYPE_MAP.code, st), 'language:go NOT is:archived');
});

// ============================================================
// 8. buildSearchUrl
// ============================================================
test('buildSearchUrl: base + type + encoding', () => {
  assert.equal(buildSearchUrl(SEARCH_TYPE_MAP.repositories, 'cats stars:>10', ''), 'https://github.com/search?q=cats%20stars%3A%3E10&type=repositories');
  assert.equal(buildSearchUrl(SEARCH_TYPE_MAP.issues, 'is:open "a b"', ''), 'https://github.com/search?q=is%3Aopen%20%22a%20b%22&type=issues');
  assert.equal(buildSearchUrl(SEARCH_TYPE_MAP.code, 'path:src/index.js', ''), 'https://github.com/search?q=path%3Asrc%2Findex.js&type=code');
  assert.equal(buildSearchUrl(SEARCH_TYPE_MAP.repositories, 'a b+c:d/e"f', ''), "https://github.com/search?q=a%20b%2Bc%3Ad%2Fe%22f&type=repositories");
  assert.equal(buildSearchUrl(SEARCH_TYPE_MAP.repositories, '', ''), 'https://github.com/search?q=&type=repositories');
  assert.equal(buildSearchUrl(null, 'x', ''), 'https://github.com/search');
});

test('buildSearchUrl: sort params s/o, per type', () => {
  assert.equal(buildSearchUrl(SEARCH_TYPE_MAP.repositories, 'cats', 'stars'), 'https://github.com/search?q=cats&type=repositories&s=stars&o=desc');
  assert.equal(buildSearchUrl(SEARCH_TYPE_MAP.repositories, 'cats', 'forks'), 'https://github.com/search?q=cats&type=repositories&s=forks&o=desc');
  assert.equal(buildSearchUrl(SEARCH_TYPE_MAP.repositories, 'cats', 'updated'), 'https://github.com/search?q=cats&type=repositories&s=updated&o=desc');
  assert.equal(buildSearchUrl(SEARCH_TYPE_MAP.issues, 'is:open', 'created'), 'https://github.com/search?q=is%3Aopen&type=issues&s=created&o=desc');
  assert.equal(buildSearchUrl(SEARCH_TYPE_MAP.users, 'x', 'followers'), 'https://github.com/search?q=x&type=users&s=followers&o=desc');
});

test('buildSearchUrl: no sort when value empty / invalid', () => {
  assert.equal(buildSearchUrl(SEARCH_TYPE_MAP.repositories, 'cats', ''), 'https://github.com/search?q=cats&type=repositories');
  assert.equal(buildSearchUrl(SEARCH_TYPE_MAP.repositories, 'cats', 'bogus'), 'https://github.com/search?q=cats&type=repositories');
});

test('buildSearchUrl: gists use gist base and only ?q (no type, no sort)', () => {
  assert.equal(buildSearchUrl(SEARCH_TYPE_MAP.gists, 'vimrc', ''), 'https://gist.github.com/search?q=vimrc');
  assert.equal(buildSearchUrl(SEARCH_TYPE_MAP.gists, 'vimrc', 'stars'), 'https://gist.github.com/search?q=vimrc');
  assert.equal(buildSearchUrl(SEARCH_TYPE_MAP.gists, 'a b', ''), 'https://gist.github.com/search?q=a%20b');
});

test('buildSearchUrl: option without order emits no order param', () => {
  const syn = { id: 'x', sort: { param: 's', orderParam: 'o', options: [{ value: 'best' }] } };
  assert.equal(buildSearchUrl(syn, 'q', 'best'), 'https://github.com/search?q=q&type=x&s=best');
});

// ============================================================
// 9. Data sanity
// ============================================================
const VALID_KINDS = new Set(['text', 'select', 'combo', 'multiCsv', 'multiRepeat', 'number', 'date', 'toggle']);

test('data: every type is well-formed, ids/labels/docs present, ids unique', () => {
  assert.ok(SEARCH_TYPES.length >= 11, 'expected at least 11 search types');
  const ids = new Set();
  for (const t of SEARCH_TYPES) {
    assert.ok(t.id && typeof t.id === 'string', 'type has string id');
    assert.ok(!ids.has(t.id), `duplicate type id ${t.id}`);
    ids.add(t.id);
    assert.ok(t.label && typeof t.label === 'string', `type ${t.id} has label`);
    assert.ok(typeof t.icon === 'string', `type ${t.id} has icon`);
    assert.ok(typeof t.docs === 'string' && /^https?:\/\//.test(t.docs), `type ${t.id} has docs url`);
    assert.ok(Array.isArray(t.groups), `type ${t.id} has groups array`);
  }
  assert.deepEqual(
    [...ids].sort(),
    ['code', 'commits', 'discussions', 'gists', 'issues', 'marketplace', 'pullrequests', 'repositories', 'topics', 'users', 'wikis']
  );
});

test('data: unique item keys per type; each item well-formed', () => {
  for (const t of SEARCH_TYPES) {
    const keys = new Set();
    for (const g of t.groups) {
      assert.ok(g.id && g.title, `group in ${t.id} has id+title`);
      assert.ok(Array.isArray(g.items), `group ${g.id} has items`);
      for (const it of g.items) {
        assert.ok(it.key, `item in ${t.id}/${g.id} has key`);
        assert.ok(!keys.has(it.key), `DUPLICATE item key "${it.key}" in type ${t.id}`);
        keys.add(it.key);
        assert.ok(it.label, `item ${t.id}/${it.key} has label`);
        assert.ok(VALID_KINDS.has(it.kind), `item ${t.id}/${it.key} kind "${it.kind}" invalid`);
        assert.equal(typeof it.qualifier, 'string', `item ${t.id}/${it.key} qualifier must be string`);
        assert.ok(it.qualifier.length > 0, `item ${t.id}/${it.key} qualifier must be non-empty`);
        if (it.kind === 'select' || it.kind === 'multiCsv') {
          assert.ok(Array.isArray(it.options) && it.options.length > 0, `item ${t.id}/${it.key} (${it.kind}) must have options`);
        }
        if (it.kind === 'combo' && it.options) {
          assert.ok(Array.isArray(it.options), `item ${t.id}/${it.key} combo options must be array`);
        }
        if (it.kind === 'toggle') {
          assert.ok(typeof it.value === 'string' && it.value.length > 0, `toggle ${t.id}/${it.key} must have a non-empty value`);
        }
      }
    }
  }
});

test('data: SEARCH_TYPE_MAP is consistent with SEARCH_TYPES', () => {
  assert.equal(Object.keys(SEARCH_TYPE_MAP).length, SEARCH_TYPES.length);
  for (const t of SEARCH_TYPES) assert.equal(SEARCH_TYPE_MAP[t.id], t);
});

test('data: hand-picked qualifier strings are correct', () => {
  const repoQ = { in: 'in', stars: 'stars', forks: 'forks', followers: 'followers', size: 'size', topic: 'topic', license: 'license', language: 'language' };
  for (const [k, q] of Object.entries(repoQ)) assert.equal(getItem('repositories', k).qualifier, q, `repositories.${k}`);
  const codeQ = { repo: 'repo', language: 'language', pathText: 'path', symbol: 'symbol', enterprise: 'enterprise', isVendored: 'is' };
  for (const [k, q] of Object.entries(codeQ)) assert.equal(getItem('code', k).qualifier, q, `code.${k}`);
  const issueQ = { state: 'is', author: 'author', assignee: 'assignee', label: 'label', created: 'created', comments: 'comments' };
  for (const [k, q] of Object.entries(issueQ)) assert.equal(getItem('issues', k).qualifier, q, `issues.${k}`);
  // qualifiers may contain '+' and '-'
  assert.equal(getItem('issues', 'reactionsPlus1').qualifier, 'reactions-+1');
  assert.equal(getItem('issues', 'reactionsHeart').qualifier, 'reactions-heart');
});

// ============================================================
// 10. KNOWN BUG (intentionally failing) — genuine defect in src
// ============================================================
// When the FIRST keyword row is blank but a later row is filled, that
// later row's connector is still prepended, producing a leading boolean
// operator ("AND foo" / "OR foo"). A query must never start with
// AND/OR; blank rows must be skipped entirely (including their slot in
// the "first token" determination). GitHub's syntax treats AND/OR as
// infix operators between terms, so a leading one is malformed.
test('[BUG] blank leading keyword row must not emit a leading AND/OR connector', () => {
  const blankThenDefault = buildKeywords({ rows: [
    { connector: '', value: '', mode: 'normal' },
    { connector: '', value: 'foo', mode: 'normal' },
  ] });
  const blankThenOr = buildKeywords({ rows: [
    { connector: '', value: '', mode: 'normal' },
    { connector: 'OR', value: 'foo', mode: 'normal' },
  ] });
  assert.deepEqual([blankThenDefault, blankThenOr], ['foo', 'foo']);
});

test('[BUG] buildQuery emits leading connector when first keyword row is blank', () => {
  const st = createState();
  st.keywords.rows = [
    { connector: '', value: '', mode: 'normal' },
    { connector: 'OR', value: 'foo', mode: 'normal' },
  ];
  st.quals = { language: 'go' };
  assert.equal(buildQuery(SEARCH_TYPE_MAP.repositories, st), 'foo language:go');
});
