import test from 'node:test';
import assert from 'node:assert/strict';
import { parseQuery, buildQuery, tokenizeQuery, createState } from '../src/query-builder.js';
import { SEARCH_TYPE_MAP } from '../src/qualifiers.js';

const norm = (s) => String(s).replace(/\s+/g, ' ').trim();
const rt = (type, q) => buildQuery(SEARCH_TYPE_MAP[type], parseQuery(SEARCH_TYPE_MAP[type], q));

test('tokenizeQuery keeps quoted phrases and regex together', () => {
  assert.deepEqual(tokenizeQuery('a "b c" /d e/ f'), ['a', '"b c"', '/d e/', 'f']);
  assert.deepEqual(tokenizeQuery('path:"src/a b" stars:>1'), ['path:"src/a b"', 'stars:>1']);
  assert.deepEqual(tokenizeQuery('"say \\"hi\\"" x'), ['"say \\"hi\\""', 'x']);
});

test('round-trips repositories queries', () => {
  assert.equal(norm(rt('repositories', '"machine learning" stars:>1000 language:Python')),
    '"machine learning" stars:>1000 language:Python');
  assert.equal(norm(rt('repositories', 'react in:name,description -license:mit archived:true')),
    'react in:name,description -license:mit archived:true');
});

test('round-trips code queries incl. NOT negation', () => {
  assert.equal(norm(rt('code', 'useEffect repo:facebook/react NOT is:fork path:src/**/*.js')),
    'useEffect repo:facebook/react path:src/**/*.js NOT is:fork');
});

test('round-trips issues queries with tags and ranges', () => {
  assert.equal(norm(rt('issues', 'is:open author:@me label:"good first issue" -label:wontfix comments:>5 created:2023-01-01..2023-12-31')),
    'is:open author:@me label:"good first issue" -label:wontfix comments:>5 created:2023-01-01..2023-12-31');
});

test('keyword modes are inferred (exact / regex / normal)', () => {
  const st = parseQuery(SEARCH_TYPE_MAP.repositories, '"a b" /x.y/ plain');
  const modes = st.keywords.rows.map((r) => r.mode);
  assert.deepEqual(modes, ['exact', 'regex', 'normal']);
  assert.equal(st.keywords.rows[0].value, 'a b');
  assert.equal(st.keywords.rows[1].value, '/x.y/');
});

test('unknown qualifiers are preserved verbatim in extra', () => {
  const st = parseQuery(SEARCH_TYPE_MAP.repositories, 'foo made-up:1');
  assert.equal(st.extra, 'made-up:1');
  assert.match(buildQuery(SEARCH_TYPE_MAP.repositories, st), /made-up:1/);
});

test('numbers parse operators, exact, and open-ended ranges', () => {
  const st = parseQuery(SEARCH_TYPE_MAP.repositories, 'stars:>=100 forks:5 size:10..*');
  assert.deepEqual(st.quals.stars, { op: '>=', v1: '100', v2: '' });
  assert.deepEqual(st.quals.forks, { op: '=', v1: '5', v2: '' });
  assert.deepEqual(st.quals.size, { op: 'range', v1: '10', v2: '' });
});

test('dates parse operators and ranges', () => {
  const st = parseQuery(SEARCH_TYPE_MAP.repositories, 'created:>=2020-01-01 pushed:2023-01-01..2023-12-31');
  assert.deepEqual(st.quals.created, { op: '>=', v1: '2020-01-01', v2: '' });
  assert.deepEqual(st.quals.pushed, { op: 'range', v1: '2023-01-01', v2: '2023-12-31' });
});

test('select / toggle / multiCsv / multiRepeat all parse', () => {
  const st = parseQuery(SEARCH_TYPE_MAP.issues, 'is:open is:pr in:title,body label:a label:b');
  assert.equal(st.quals.state, 'open');
  assert.equal(st.quals.kindIs, 'pr');
  assert.deepEqual(st.quals.in, ['title', 'body']);
  assert.deepEqual(st.quals.label, ['a', 'b']);
});

test('empty query yields a clean empty state', () => {
  const st = parseQuery(SEARCH_TYPE_MAP.repositories, '');
  assert.equal(buildQuery(SEARCH_TYPE_MAP.repositories, st), '');
  assert.equal(st.keywords.rows.length, 1);
  assert.equal(st.keywords.rows[0].value, '');
});

test('a fresh state and a parsed-empty state behave the same', () => {
  assert.equal(buildQuery(SEARCH_TYPE_MAP.repositories, parseQuery(SEARCH_TYPE_MAP.repositories, '')),
    buildQuery(SEARCH_TYPE_MAP.repositories, createState()));
});
