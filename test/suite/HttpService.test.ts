import * as assert from 'assert';
import * as http from 'http';
import { HttpService } from '../../src/services/HttpService';
import { HttpRequestSpec } from '../../src/types';

suite('HttpService', () => {
  let server: http.Server;
  let serverPort = 0;

  setup((done) => {
    server = http.createServer((req, res) => {
      let body = '';
      req.on('data', (c) => (body += c));
      req.on('end', () => {
        if (req.url === '/echo' && req.method === 'POST') {
          res.writeHead(200, { 'Content-Type': 'application/json', 'X-Echo': body });
          res.end(JSON.stringify({ received: body, method: req.method }));
        } else if (req.url === '/headers') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ token: req.headers['x-token'] || null }));
        } else {
          res.writeHead(404);
          res.end('not found');
        }
      });
    });
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      if (addr && typeof addr === 'object') {
        serverPort = addr.port;
        done();
      }
    });
  });

  teardown((done) => {
    server.close(done);
  });

  test('sends GET and parses response', async () => {
    const svc = new HttpService();
    const spec: HttpRequestSpec = {
      method: 'GET',
      url: `http://127.0.0.1:${serverPort}/headers`,
      headers: { 'X-Token': 'abc' },
      bodyType: 'none',
      auth: { type: 'none' }
    };
    const res = await svc.send(spec);
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.includes('"token":"abc"'));
    assert.ok(res.time >= 0);
    assert.ok(res.size > 0);
  });

  test('sends POST with JSON body', async () => {
    const svc = new HttpService();
    const spec: HttpRequestSpec = {
      method: 'POST',
      url: `http://127.0.0.1:${serverPort}/echo`,
      headers: { 'Content-Type': 'application/json' },
      body: '{"hello":"world"}',
      bodyType: 'json',
      auth: { type: 'none' }
    };
    const res = await svc.send(spec);
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.includes('"received":"{\\"hello\\":\\"world\\"}"'));
  });

  test('handles network error gracefully', async () => {
    const svc = new HttpService();
    const spec: HttpRequestSpec = {
      method: 'GET',
      url: 'http://127.0.0.1:1/nope',
      headers: {},
      bodyType: 'none',
      auth: { type: 'none' }
    };
    const res = await svc.send(spec);
    assert.ok(res.error, 'expected error message');
    assert.strictEqual(res.status, 0);
  });
});