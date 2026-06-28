import { EventEmitter } from 'events';
import WebSocket from 'ws';
import { WsMessage, WsState } from '../types';
import { uuid } from '../utils/id';

const MAX_MESSAGES = 500;
const TRIM_BATCH = 100;

export class WsService extends EventEmitter {
  private _state: WsState = 'idle';
  private _ws?: WebSocket;
  private _buffer: WsMessage[] = [];

  getState(): WsState {
    return this._state;
  }

  getMessages(): WsMessage[] {
    return [...this._buffer];
  }

  connect(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this._setState('connecting');
      let ws: WebSocket;
      try {
        ws = new WebSocket(url);
      } catch (e) {
        this._setState('error', (e as Error).message);
        reject(e);
        return;
      }
      this._ws = ws;

      const onOpen = () => {
        ws.off('error', onError);
        this._setState('connected');
        resolve();
      };
      const onError = (err: Error) => {
        ws.off('open', onOpen);
        this._setState('error', err.message);
        reject(err);
      };

      ws.once('open', onOpen);
      ws.once('error', onError);
      ws.on('message', (data) => {
        const text = data instanceof Buffer ? data.toString('utf8') : String(data);
        this._appendMessage({ id: uuid(), dir: 'recv', data: text, ts: Date.now() });
      });
      ws.on('close', () => {
        this._setState('disconnected');
      });
      ws.on('error', (err) => {
        // If we never opened, onError handler already rejected.
        if (this._state !== 'connected') return;
        this._setState('error', err.message);
      });
    });
  }

  async send(data: string): Promise<void> {
    if (this._state !== 'connected' || !this._ws) {
      throw new Error(`Cannot send: state is ${this._state}`);
    }
    this._ws.send(data);
    this._appendMessage({ id: uuid(), dir: 'send', data, ts: Date.now() });
  }

  disconnect(): void {
    if (this._ws) {
      try {
        this._ws.close();
      } catch {
        // ignore
      }
      this._ws = undefined;
    }
    this._setState('disconnected');
  }

  private _setState(state: WsState, error?: string): void {
    this._state = state;
    this.emit('status', error ? { state, error } : { state });
  }

  private _appendMessage(msg: WsMessage): void {
    this._buffer.push(msg);
    if (this._buffer.length > MAX_MESSAGES) {
      this._buffer.splice(0, this._buffer.length - MAX_MESSAGES + TRIM_BATCH);
    }
    this.emit('message', msg);
  }
}