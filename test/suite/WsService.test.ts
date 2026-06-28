import * as assert from 'assert';
import * as http from 'http';
import { WebSocketServer } from 'ws';
import { WsService } from '../../src/services/WsService';

suite('WsService', () => {
  let server: http.Server;
  let wss: WebSocketServer;
  let port = 0;

  setup((done) => {
    server = http.createServer();
    wss = new WebSocketServer({ server });
    wss.on('connection', (ws) => {
      ws.on('message', (data) => {
        // echo
        ws.send('echo:' + data.toString());
      });
    });
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      if (addr && typeof addr === 'object') {
        port = addr.port;
        done();
      }
    });
  });

  teardown((done) => {
    wss.close();
    server.close(done);
  });

  test('connect → status becomes connected; send → message logged; recv → message logged', async () => {
    const svc = new WsService();

    const statuses: string[] = [];
    const messages: { dir: string; data: string }[] = [];
    svc.on('status', (s: { state: string }) => statuses.push(s.state));
    svc.on('message', (m: { dir: string; data: string }) => messages.push(m));

    await svc.connect(`ws://127.0.0.1:${port}`);
    await svc.send('hello');
    await new Promise((r) => setTimeout(r, 50));

    assert.deepStrictEqual(statuses, ['connecting', 'connected']);
    assert.ok(messages.some((m) => m.dir === 'send' && m.data === 'hello'));
    assert.ok(messages.some((m) => m.dir === 'recv' && m.data === 'echo:hello'));

    svc.disconnect();
  });

  test('disconnect clears state', async () => {
    const svc = new WsService();
    await svc.connect(`ws://127.0.0.1:${port}`);
    svc.disconnect();
    assert.strictEqual(svc.getState(), 'disconnected');
  });

  test('invalid URL is rejected', async () => {
    const svc = new WsService();
    const statuses: string[] = [];
    svc.on('status', (s: { state: string }) => statuses.push(s.state));
    try {
      await svc.connect('not-a-url');
      assert.fail('should have thrown');
    } catch {
      assert.ok(statuses.includes('error'));
    }
  });
});