import * as http from 'http';
import * as https from 'https';
import { URL } from 'url';
import { HttpRequestSpec, HttpResponse } from '../types';

export class HttpService {
  private static TIMEOUT_MS = 30_000;

  send(spec: HttpRequestSpec): Promise<HttpResponse> {
    return new Promise((resolve) => {
      let parsed: URL;
      try {
        parsed = new URL(spec.url);
      } catch (e) {
        resolve({
          status: 0,
          statusText: '',
          headers: {},
          body: '',
          time: 0,
          size: 0,
          error: `Invalid URL: ${(e as Error).message}`
        });
        return;
      }

      const isHttps = parsed.protocol === 'https:';
      const lib = isHttps ? https : http;

      const headers: Record<string, string> = { ...spec.headers };

      // Inject auth header
      if (spec.auth.type === 'bearer' && spec.auth.token) {
        headers['Authorization'] = `Bearer ${spec.auth.token}`;
      } else if (spec.auth.type === 'basic' && spec.auth.username) {
        const encoded = Buffer.from(
          `${spec.auth.username}:${spec.auth.password ?? ''}`
        ).toString('base64');
        headers['Authorization'] = `Basic ${encoded}`;
      }

      // Default content-type for json body
      if (spec.bodyType === 'json' && spec.body && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
      }

      const options: http.RequestOptions = {
        method: spec.method,
        hostname: parsed.hostname,
        port: parsed.port || (isHttps ? 443 : 80),
        path: parsed.pathname + parsed.search,
        headers
      };

      const start = Date.now();
      const req = lib.request(options, (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (c: Buffer) => chunks.push(c));
        res.on('end', () => {
          const buf = Buffer.concat(chunks);
          const responseHeaders: Record<string, string> = {};
          for (const [k, v] of Object.entries(res.headers)) {
            if (typeof v === 'string') responseHeaders[k] = v;
            else if (Array.isArray(v)) responseHeaders[k] = v.join(', ');
          }
          resolve({
            status: res.statusCode ?? 0,
            statusText: res.statusMessage ?? '',
            headers: responseHeaders,
            body: buf.toString('utf8'),
            time: Date.now() - start,
            size: buf.length
          });
        });
      });

      req.on('error', (e) => {
        resolve({
          status: 0,
          statusText: '',
          headers: {},
          body: '',
          time: Date.now() - start,
          size: 0,
          error: e.message
        });
      });

      req.setTimeout(HttpService.TIMEOUT_MS, () => {
        req.destroy(new Error(`Timeout after ${HttpService.TIMEOUT_MS}ms`));
      });

      if (spec.body && spec.method !== 'GET' && spec.method !== 'DELETE') {
        req.write(spec.body);
      }
      req.end();
    });
  }
}