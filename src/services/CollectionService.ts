import { Memento } from 'vscode';
import { CollectionItem } from '../types';
import { uuid } from '../utils/id';

export const COLLECTION_KEY = 'apiTester.collections';

export class CollectionService {
  constructor(private _state: Memento) {}

  list(): CollectionItem[] {
    return this._state.get<CollectionItem[]>(COLLECTION_KEY) ?? [];
  }

  async save(item: Omit<CollectionItem, 'id' | 'ts'>): Promise<CollectionItem> {
    const full: CollectionItem = { ...item, id: uuid(), ts: Date.now() };
    const next = [...this.list(), full];
    await this._state.update(COLLECTION_KEY, next);
    return full;
  }

  async delete(id: string): Promise<void> {
    const next = this.list().filter((c) => c.id !== id);
    await this._state.update(COLLECTION_KEY, next);
  }

  get(id: string): CollectionItem | undefined {
    return this.list().find((c) => c.id === id);
  }
}