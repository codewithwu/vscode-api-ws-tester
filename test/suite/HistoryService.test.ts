import * as assert from 'assert';
import { HistoryService } from '../../src/services/HistoryService';
import { HistoryItem } from '../../src/types';

function fakeState(initial: HistoryItem[] = []) {
  const data: Record<string, unknown> = { 'apiTester.history': initial };
  return {
    get: <T>(k: string): T | undefined => data[k] as T,
    update: (k: string, v: unknown) => Promise.resolve(void (data[k] = v))
  } as any;
}

function makeItem(i: number): HistoryItem {
  return {
    id: `id-${i}`,
    kind: 'http',
    method: 'GET',
    url: `http://test/${i}`,
    headers: {},
    bodyType: 'none',
    ts: i
  };
}

suite('HistoryService', () => {
  test('list returns empty array when no state', () => {
    const svc = new HistoryService(fakeState([]));
    assert.deepStrictEqual(svc.list(), []);
  });

  test('add prepends new item', async () => {
    const state = fakeState([makeItem(1)]);
    const svc = new HistoryService(state);
    await svc.add(makeItem(2));
    const items = svc.list();
    assert.strictEqual(items.length, 2);
    assert.strictEqual(items[0].id, 'id-2');
    assert.strictEqual(items[1].id, 'id-1');
  });

  test('add truncates to MAX (50) keeping newest', async () => {
    const initial = Array.from({ length: 50 }, (_, i) => makeItem(i));
    const state = fakeState(initial);
    const svc = new HistoryService(state);
    await svc.add(makeItem(99));
    const items = svc.list();
    assert.strictEqual(items.length, 50);
    assert.strictEqual(items[0].id, 'id-99');
  });
});