import * as assert from 'assert';
import { formatJson, formatBytes } from '../../src/utils/format';

suite('format utils', () => {
  test('formatJson pretty-prints valid JSON', () => {
    const input = '{"a":1,"b":2}';
    const out = formatJson(input);
    assert.strictEqual(out, '{\n  "a": 1,\n  "b": 2\n}');
  });

  test('formatJson returns original string on invalid JSON', () => {
    const input = 'not json';
    assert.strictEqual(formatJson(input), input);
  });

  test('formatBytes formats bytes/KB/MB', () => {
    assert.strictEqual(formatBytes(512), '512 B');
    assert.strictEqual(formatBytes(1024), '1.0 KB');
    assert.strictEqual(formatBytes(1536), '1.5 KB');
    assert.strictEqual(formatBytes(1024 * 1024), '1.0 MB');
    assert.strictEqual(formatBytes(0), '0 B');
  });
});
