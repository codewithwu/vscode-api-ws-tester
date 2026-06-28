export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
export type BodyType = 'none' | 'json' | 'text' | 'form';
export type AuthType = 'none' | 'bearer' | 'basic';
export type WsState = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';

export interface HttpRequestSpec {
  method: HttpMethod;
  url: string;
  headers: Record<string, string>;
  body?: string;
  bodyType: BodyType;
  auth: {
    type: AuthType;
    token?: string;
    username?: string;
    password?: string;
  };
}

export interface HttpResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  time: number; // ms
  size: number; // bytes
  error?: string;
}

export interface WsMessage {
  id: string;
  dir: 'send' | 'recv';
  data: string;
  ts: number;
}

export interface HistoryItem {
  id: string;
  kind: 'http';
  method: HttpMethod;
  url: string;
  headers: Record<string, string>;
  body?: string;
  bodyType: BodyType;
  ts: number;
  status?: number;
  time?: number;
}

export interface CollectionItem {
  id: string;
  name: string;
  method?: HttpMethod;
  url?: string;
  headers?: Record<string, string>;
  body?: string;
  bodyType?: BodyType;
  wsUrl?: string;
  ts: number;
}

// Webview ↔ Extension message contract
export type ExtMessage =
  | { type: 'http.response'; payload: HttpResponse }
  | { type: 'ws.status'; payload: { state: WsState; error?: string } }
  | { type: 'ws.message'; payload: WsMessage }
  | { type: 'history.list'; payload: { items: HistoryItem[] } }
  | { type: 'collection.list'; payload: { items: CollectionItem[] } }
  | { type: 'collection.saved'; payload: { item: CollectionItem } }
  | { type: 'collection.deleted'; payload: { id: string } }
  | { type: 'error'; payload: { message: string } };

export type WebviewMessage =
  | { type: 'http.send'; payload: HttpRequestSpec }
  | { type: 'ws.connect'; payload: { url: string } }
  | { type: 'ws.disconnect'; payload: Record<string, never> }
  | { type: 'ws.send'; payload: { data: string } }
  | { type: 'history.list'; payload: Record<string, never> }
  | { type: 'history.save'; payload: { item: HistoryItem } }
  | { type: 'collection.list'; payload: Record<string, never> }
  | { type: 'collection.save'; payload: { item: Omit<CollectionItem, 'id' | 'ts'> } }
  | { type: 'collection.delete'; payload: { id: string } }
  | { type: 'request.execute'; payload: { id: string; source: 'history' | 'collection' } };
