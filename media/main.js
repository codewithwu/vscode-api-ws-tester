(function () {
  const vscode = acquireVsCodeApi();

  // --- Tab switching ---
  document.querySelectorAll('.tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      document.querySelectorAll('.tab').forEach((b) => b.classList.toggle('active', b === btn));
      document.querySelectorAll('.panel').forEach((p) => {
        p.classList.toggle('active', p.id === target + '-panel');
      });
    });
  });

  // --- Sub-tab switching ---
  document.querySelectorAll('.subtab').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.subtab;
      document.querySelectorAll('.subtab').forEach((b) => b.classList.toggle('active', b === btn));
      document.querySelectorAll('.subpanel').forEach((p) => {
        p.classList.toggle('active', p.id === 'sub-' + target);
      });
    });
  });

  // --- Headers ---
  function addHeaderRow(key = '', value = '') {
    const list = document.getElementById('headers-list');
    const row = document.createElement('div');
    row.className = 'header-row';
    row.innerHTML = `
      <input class="header-key" placeholder="Header" value="${escapeAttr(key)}">
      <input class="header-value" placeholder="Value" value="${escapeAttr(value)}">
      <button class="header-remove" title="Remove">×</button>
    `;
    row.querySelector('.header-remove').addEventListener('click', () => row.remove());
    list.appendChild(row);
  }

  function collectHeaders() {
    const headers = {};
    document.querySelectorAll('#headers-list .header-row').forEach((row) => {
      const k = row.querySelector('.header-key').value.trim();
      const v = row.querySelector('.header-value').value;
      if (k) headers[k] = v;
    });
    return headers;
  }

  document.getElementById('header-add').addEventListener('click', () => addHeaderRow());
  addHeaderRow('Content-Type', 'application/json');

  // --- Auth ---
  const authType = document.getElementById('auth-type');
  const authBearer = document.getElementById('auth-bearer');
  const authBasic = document.getElementById('auth-basic');
  authType.addEventListener('change', () => {
    authBearer.hidden = authType.value !== 'bearer';
    authBasic.hidden = authType.value !== 'basic';
  });

  function collectAuth() {
    const auth = { type: authType.value };
    if (auth.type === 'bearer') {
      auth.token = document.getElementById('auth-token').value;
    } else if (auth.type === 'basic') {
      auth.username = document.getElementById('auth-user').value;
      auth.password = document.getElementById('auth-pass').value;
    }
    return auth;
  }

  // --- Send ---
  document.getElementById('http-send').addEventListener('click', sendHttp);

  function sendHttp() {
    const method = document.getElementById('http-method').value;
    const url = document.getElementById('http-url').value.trim();
    if (!url) {
      showError('URL is required');
      return;
    }
    const bodyType = document.querySelector('input[name="body-type"]:checked').value;
    const body = bodyType === 'none' ? undefined : document.getElementById('body-input').value;
    const spec = {
      method,
      url,
      headers: collectHeaders(),
      body,
      bodyType,
      auth: collectAuth()
    };
    vscode.postMessage({ type: 'http.send', payload: spec });
    setStatus('Sending...', '0');
  }

  // --- Response ---
  window.addEventListener('message', (event) => {
    const msg = event.data;
    if (msg.type === 'http.response') {
      renderResponse(msg.payload);
    } else if (msg.type === 'error') {
      showError(msg.payload.message);
    }
  });

  function renderResponse(res) {
    const statusEl = document.getElementById('response-status');
    const bodyEl = document.getElementById('response-body');
    const timeEl = document.getElementById('response-time');
    const sizeEl = document.getElementById('response-size');

    if (res.error) {
      statusEl.textContent = 'Error';
      statusEl.className = 'response-status status-0';
      bodyEl.textContent = res.error;
      timeEl.textContent = `Time: ${res.time}ms`;
      sizeEl.textContent = `Size: 0 B`;
      return;
    }

    setStatus(`${res.status} ${res.statusText}`, String(res.status));
    bodyEl.textContent = tryFormatJson(res.body);
    timeEl.textContent = `Time: ${res.time}ms`;
    sizeEl.textContent = `Size: ${formatBytes(res.size)}`;
  }

  function setStatus(text, code) {
    const statusEl = document.getElementById('response-status');
    statusEl.textContent = text;
    const cls = code.charAt(0);
    statusEl.className = 'response-status status-' + (cls === '0' ? '0' : cls + 'xx');
  }

  function showError(msg) {
    setStatus('Error', '0');
    document.getElementById('response-body').textContent = msg;
  }

  function tryFormatJson(text) {
    try {
      return JSON.stringify(JSON.parse(text), null, 2);
    } catch {
      return text;
    }
  }

  function formatBytes(n) {
    if (n < 1024) return n + ' B';
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
    return (n / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function escapeAttr(s) {
    return String(s).replace(/"/g, '&quot;').replace(/</g, '&lt;');
  }

  // --- WebSocket ---
  const wsConnectBtn = document.getElementById('ws-connect');
  const wsDisconnectBtn = document.getElementById('ws-disconnect');
  const wsSendBtn = document.getElementById('ws-send');
  const wsUrlInput = document.getElementById('ws-url');
  const wsInput = document.getElementById('ws-input');
  const wsMessagesEl = document.getElementById('ws-messages');
  const wsStatusDot = document.getElementById('ws-status-dot');
  const wsStatusText = document.getElementById('ws-status-text');

  wsConnectBtn.addEventListener('click', () => {
    const url = wsUrlInput.value.trim();
    if (!url) {
      showWsError('URL is required');
      return;
    }
    vscode.postMessage({ type: 'ws.connect', payload: { url } });
  });

  wsDisconnectBtn.addEventListener('click', () => {
    vscode.postMessage({ type: 'ws.disconnect', payload: {} });
  });

  wsSendBtn.addEventListener('click', sendWs);
  wsInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendWs();
    }
  });

  function sendWs() {
    const data = wsInput.value;
    if (!data) return;
    vscode.postMessage({ type: 'ws.send', payload: { data } });
    wsInput.value = '';
  }

  function appendWsMessage(msg) {
    const div = document.createElement('div');
    div.className = 'ws-msg ' + msg.dir;
    const ts = new Date(msg.ts).toLocaleTimeString();
    div.innerHTML =
      `<span class="ws-dir">${msg.dir === 'send' ? '→' : '←'}</span>` +
      `<span class="ws-ts">${escapeHtml(ts)}</span>` +
      `<span class="ws-data">${escapeHtml(msg.data)}</span>`;
    wsMessagesEl.appendChild(div);
    wsMessagesEl.scrollTop = wsMessagesEl.scrollHeight;
  }

  function setWsStatus(state, error) {
    wsStatusDot.className = 'status-dot ' + state;
    wsStatusText.textContent =
      state === 'connected' ? 'Connected' :
      state === 'connecting' ? 'Connecting...' :
      state === 'error' ? ('Error: ' + (error || '')) :
      'Disconnected';
  }

  function showWsError(msg) {
    setWsStatus('error', msg);
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // Hook into message router (extend existing window listener)
  const origHandler = window.onmessage;
  // The handler is registered via addEventListener; instead we patch the message event below.
  window.addEventListener('message', (event) => {
    const msg = event.data;
    if (msg.type === 'ws.status') {
      setWsStatus(msg.payload.state, msg.payload.error);
    } else if (msg.type === 'ws.message') {
      appendWsMessage(msg.payload);
    }
  });
})();
