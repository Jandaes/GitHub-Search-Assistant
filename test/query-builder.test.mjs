import test from 'node:test';
import assert from 'node:assert/strict';
import {
  quoteValue, buildItemTerm, buildKeywords, buildQuery, buildSearchUrl, createState,
} from '../src/query-builder.js';
import { SEARCH_TYPES, SEARCH_TYPE_MAP } from '../src/qualifiers.js';

const repoType = SEARCH_TYPE_MAP.repositories;
const codeType = SEARCH_TYPE_MAP.code;
const issueType = SEARCH_TYPE_MAP.issues;

function item(key, type = repoType) {
  for (const g of type.groups) for (const it of g.items) if (it.key === key) return it;
  throw new Error('item not found: ' + key);
}

test('quoteValue basics', () => {
  assert.equal(quoteValue('cats'), 'cats');
  assert.equal(quoteValue('  cats '), 'cats');
  assert.equal(quoteValue('hello world'), '"hello world"');
  assert.equal(quoteValue('"hello world"'), '"hello world"');
  assert.equal(quoteValue('/sparse.*index/'), '/sparse.*index/');
  assert.equal(quoteValue(''), '');
  assert.equal(quoteValue('say "hi"'), '"say \\"hi\\""');
});

test('text item quoting', () => {
  assert.equal(buildItemTerm(item('topic'), 'machine learning', {}, false), 'topic:"machine learning"');
  assert.equal(buildItemTerm(item('topic'), 'react', {}, false), 'topic:react');
  assert.equal(buildItemTerm(item('topic'), '', {}, false), '');
});

test('select item', () => {
  assert.equal(buildItemTerm(item('license'), 'mit', {}, false), 'license:mit');
  assert.equal(buildItemTerm(item('license'), '', {}, false), '');
});

test('multiCsv item', () => {
  assert.equal(buildItemTerm(item('in'), ['name', 'description'], {}, false), 'in:name,description');
  assert.equal(buildItemTerm(item('in'), [], {}, false), '');
});

test('multiRepeat item (labels) both negate modes', () => {
  const it = item('label', issueType);
  assert.equal(buildItemTerm(it, ['bug', 'help wanted'], {}, false), 'label:bug label:"help wanted"');
  assert.equal(buildItemTerm(it, ['bug'], { negated: { label: true } }, false), '-label:bug');
  assert.equal(buildItemTerm(it, ['bug'], { negated: { label: true } }, true), 'NOT label:bug');
});

test('number operators incl range', () => {
  const stars = item('stars');
  assert.equal(buildItemTerm(stars, { op: '>', v1: '1000' }, {}, false), 'stars:>1000');
  assert.equal(buildItemTerm(stars, { op: '>=', v1: '10' }, {}, false), 'stars:>=10');
  assert.equal(buildItemTerm(stars, { op: '=', v1: '500' }, {}, false), 'stars:500');
  assert.equal(buildItemTerm(stars, { op: 'range', v1: '10', v2: '50' }, {}, false), 'stars:10..50');
  assert.equal(buildItemTerm(stars, { op: 'range', v1: '10' }, {}, false), 'stars:10..*');
  assert.equal(buildItemTerm(stars, { op: '>', v1: '' }, {}, false), '');
});

test('date operators', () => {
  const created = item('created');
  assert.equal(buildItemTerm(created, { op: '>=', v1: '2020-01-01' }, {}, false), 'created:>=2020-01-01');
  assert.equal(buildItemTerm(created, { op: 'range', v1: '2020-01-01', v2: '2021-01-01' }, {}, false), 'created:2020-01-01..2021-01-01');
});

test('toggle item', () => {
  const archived = item('archived');
  assert.equal(buildItemTerm(archived, true, {}, false), 'archived:true');
  assert.equal(buildItemTerm(archived, false, {}, false), '');
  const isSponsorable = item('sponsorable');
  assert.equal(buildItemTerm(isSponsorable, true, {}, false), 'is:sponsorable');
});

test('negate on normal item', () => {
  assert.equal(buildItemTerm(item('language'), 'go', { negated: { language: true } }, false), '-language:go');
  assert.equal(buildItemTerm(item('language'), 'go', { negated: { language: true } }, true), 'NOT language:go');
});

test('keywords: normal / exact / regex / boolean', () => {
  assert.equal(buildKeywords({ rows: [{ value: 'hello world', mode: 'normal' }] }), '"hello world"');
  assert.equal(buildKeywords({ rows: [{ value: 'hello world', mode: 'exact' }] }), '"hello world"');
  assert.equal(buildKeywords({ rows: [{ value: 'foo.*bar', mode: 'regex' }] }), '/foo.*bar/');
  assert.equal(
    buildKeywords({ rows: [
      { connector: '', value: 'sparse', mode: 'normal' },
      { connector: 'OR', value: 'index', mode: 'normal' },
      { connector: 'NOT', value: 'deprecated', mode: 'normal' },
    ] }),
    'sparse OR index NOT deprecated'
  );
});

test('buildQuery full repo example', () => {
  const state = createState();
  state.keywords.rows[0].value = 'machine learning';
  state.quals = {
    in: ['name', 'description'],
    stars: { op: '>', v1: '1000' },
    language: 'Python',
    license: 'mit',
    archived: true,
  };
  state.negated = { language: true };
  const q = buildQuery(repoType, state);
  // keyword + in + stars + language(negated) + license + archived
  assert.match(q, /"machine learning"/);
  assert.match(q, /in:name,description/);
  assert.match(q, /stars:>1000/);
  assert.match(q, /-language:Python/);
  assert.match(q, /license:mit/);
  assert.match(q, /archived:true/);
});

test('buildQuery empty state returns empty', () => {
  assert.equal(buildQuery(repoType, createState()), '');
});

test('buildQuery ignores empty item values', () => {
  const state = createState();
  state.quals = { stars: { op: '>', v1: '' }, language: '' };
  assert.equal(buildQuery(repoType, state), '');
});

test('extra tail is appended', () => {
  const state = createState();
  state.quals = { language: 'go' };
  state.extra = 'NOT is:archived';
  assert.equal(buildQuery(codeType, state), 'language:go NOT is:archived');
});

test('buildSearchUrl with sort', () => {
  const url = buildSearchUrl(repoType, 'cats stars:>10', 'stars');
  assert.match(url, /^https:\/\/github\.com\/search\?q=/);
  assert.match(url, /type=repositories/);
  assert.match(url, /&s=stars&o=desc/);
});

test('buildSearchUrl without sort', () => {
  const url = buildSearchUrl(issueType, 'is:open', '');
  assert.equal(url, 'https://github.com/search?q=is%3Aopen&type=issues');
});

test('buildSearchUrl gist base', () => {
  const gist = SEARCH_TYPE_MAP.gists;
  const url = buildSearchUrl(gist, 'vimrc', '');
  assert.equal(url, 'https://gist.github.com/search?q=vimrc');
});

// ---------- data validation ----------

const VALID_KINDS = new Set(['text', 'select', 'combo', 'multiCsv', 'multiRepeat', 'number', 'date', 'toggle']);

test('every search type is well formed and keys are unique', () => {
  assert.ok(SEARCH_TYPES.length >= 8, 'has a good number of search types');
  for (const t of SEARCH_TYPES) {
    assert.ok(t.id && t.label, `type has id+label: ${t.id}`);
    assert.ok(Array.isArray(t.groups), `type ${t.id} has groups`);
    const keys = new Set();
    for (const g of t.groups) {
      assert.ok(g.id && g.title, `group in ${t.id} has id+title`);
      assert.ok(Array.isArray(g.items), `group ${g.id} has items`);
      for (const it of g.items) {
        assert.ok(it.key, `item in ${t.id}/${g.id} has key`);
        assert.ok(!keys.has(it.key), `duplicate key ${it.key} in type ${t.id}`);
        keys.add(it.key);
        assert.ok(it.label, `item ${it.key} has label`);
        assert.ok(VALID_KINDS.has(it.kind), `item ${it.key} kind ${it.kind} valid`);
        if (it.kind === 'select' || it.kind === 'multiCsv') {
          assert.ok(Array.isArray(it.options) && it.options.length > 0, `item ${it.key} needs options`);
        }
        if (it.kind === 'combo' && it.options) {
          assert.ok(Array.isArray(it.options), `item ${it.key} options is array`);
        }
        if (it.kind === 'toggle') {
          assert.ok(it.value !== undefined, `toggle ${it.key} needs value`);
        }
        assert.ok(typeof it.qualifier === 'string', `item ${it.key} has qualifier string`);
      }
    }
  }
});
