import { Memento } from 'vscode';
import { HistoryItem } from '../types';

export const HISTORY_KEY = 'apiTester.history';
export const HISTORY_MAX = 50;

export class HistoryService {
  constructor(private _state: Memento) {}

  list(): HistoryItem[] {
    return this._state.get<HistoryItem[]>(HISTORY_KEY) ?? [];
  }

  async add(item: HistoryItem): Promise<void> {
    const current = this.list();
    const next = [item, ...current].slice(0, HISTORY_MAX);
    await this._state.update(HISTORY_KEY, next);
  }
}