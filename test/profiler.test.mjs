import test from 'node:test';
import assert from 'node:assert/strict';
import { profileCsv, renderHtml } from '../src/profiler.mjs';

test('counts missing values and infers numeric and date columns', () => {
  const result = profileCsv('name,score,date\nAna,12,2026-01-01\n,8,\n');
  assert.equal(result.rows, 2);
  assert.deepEqual(result.columns, [
    { name: 'name', type: 'text', missing: 1, distinct: 1 },
    { name: 'score', type: 'number', missing: 0, distinct: 2, min: 8, max: 12 },
    { name: 'date', type: 'date', missing: 1, distinct: 1 },
  ]);
});

test('rejects malformed CSV and escapes HTML labels', () => {
  assert.throws(() => profileCsv('a,b\n"unclosed,2'), /unterminated/i);
  const html = renderHtml(profileCsv('"<script>",value\nX,1\n'));
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(!html.includes('<script>'));
});

test('profiles a large numeric column without a call-stack limit', () => {
  const csv = 'value\n' + Array.from({ length: 150_000 }, (_, index) => `${index}\n`).join('');
  const result = profileCsv(csv);
  assert.equal(result.rows, 150_000);
  assert.equal(result.columns[0].min, 0);
  assert.equal(result.columns[0].max, 149_999);
});
