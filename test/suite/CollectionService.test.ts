import * as assert from 'assert';
import { CollectionService } from '../../src/services/CollectionService';
import { CollectionItem } from '../../src/types';

function fakeState(initial: CollectionItem[] = []) {
  const data: Record<string, unknown> = { 'apiTester.collections': initial };
  return {
    get: <T>(k: string): T | undefined => data[k] as T,
    update: (k: string, v: unknown) => Promise.resolve(void (data[k] = v))
  } as any;
}

suite('CollectionService', () => {
  test('list returns empty array when no state', () => {
    const svc = new CollectionService(fakeState([]));
    assert.deepStrictEqual(svc.list(), []);
  });

  test('save appends item with generated id and timestamp', async () => {
    const svc = new CollectionService(fakeState([]));
    const saved = await svc.save({
      name: 'Get user',
      method: 'GET',
      url: 'http://x',
      headers: {},
      bodyType: 'none'
    });
    assert.ok(saved.id);
    assert.ok(saved.ts);
    assert.strictEqual(svc.list().length, 1);
  });

  test('delete removes by id', async () => {
    const svc = new CollectionService(fakeState([]));
    const a = await svc.save({ name: 'A', bodyType: 'none' });
    const b = await svc.save({ name: 'B', bodyType: 'none' });
    await svc.delete(a.id);
    const items = svc.list();
    assert.strictEqual(items.length, 1);
    assert.strictEqual(items[0].id, b.id);
  });

  test('get returns item by id or undefined', async () => {
    const svc = new CollectionService(fakeState([]));
    const a = await svc.save({ name: 'A', bodyType: 'none' });
    assert.strictEqual(svc.get(a.id)?.name, 'A');
    assert.strictEqual(svc.get('nope'), undefined);
  });
});