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

      // Auto-rewrite URL protocol on tab switch
      if (target === 'http') {
        const url = document.getElementById('http-url').value.trim();
        if (url.startsWith('ws://')) {
          document.getElementById('http-url').value = 'http://' + url.slice(5);
        } else if (url.startsWith('wss://')) {
          document.getElementById('http-url').value = 'https://' + url.slice(6);
        }
        const wsUrl = document.getElementById('ws-url').value.trim();
        if (wsUrl.startsWith('http://')) {
          document.getElementById('ws-url').value = 'ws://' + wsUrl.slice(7);
        } else if (wsUrl.startsWith('https://')) {
          document.getElementById('ws-url').value = 'wss://' + wsUrl.slice(8);
        }
      } else if (target === 'ws') {
        const wsUrl = document.getElementById('ws-url').value.trim();
        if (!wsUrl) {
          const httpUrl = document.getElementById('http-url').value.trim();
          if (httpUrl.startsWith('http://')) {
            document.getElementById('ws-url').value = 'ws://' + httpUrl.slice(7);
          } else if (httpUrl.startsWith('https://')) {
            document.getElementById('ws-url').value = 'wss://' + httpUrl.slice(8);
          }
        }
      }
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

  // Ctrl+Enter triggers send (intercept before VS Code's default)
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      const httpPanel = document.getElementById('http-panel');
      const wsPanel = document.getElementById('ws-panel');
      if (httpPanel.classList.contains('active')) {
        sendHttp();
      } else if (wsPanel.classList.contains('active')) {
        sendWs();
      }
    }
  });

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

  // --- Save dialog ---
  document.getElementById('http-save').addEventListener('click', () => {
    const url = document.getElementById('http-url').value.trim();
    if (!url) {
      showError('URL is required');
      return;
    }
    const method = document.getElementById('http-method').value;
    const bodyType = document.querySelector('input[name="body-type"]:checked').value;
    const body = bodyType === 'none' ? undefined : document.getElementById('body-input').value;
    vscode.postMessage({
      type: 'collection.save.prompt',
      payload: {
        spec: { method, url, headers: collectHeaders(), body, bodyType }
      }
    });
  });

  // --- Collections tab ---
  document.getElementById('collections-refresh').addEventListener('click', () => {
    vscode.postMessage({ type: 'collection.list', payload: {} });
  });

  document.getElementById('history-refresh').addEventListener('click', () => {
    vscode.postMessage({ type: 'history.list', payload: {} });
  });

  function renderList(containerId, items, source) {
    const el = document.getElementById(containerId);
    el.innerHTML = '';
    if (!items.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-list';
      empty.textContent = source === 'history' ? 'No history yet' : 'No saved requests';
      el.appendChild(empty);
      return;
    }
    for (const item of items) {
      const div = document.createElement('div');
      div.className = 'list-item';
      const main = source === 'history'
        ? `${item.method} ${item.url}`
        : `${item.name} — ${item.method || 'WS'} ${item.url || item.wsUrl || ''}`;
      const meta = source === 'history'
        ? `${item.status || ''} ${item.time || 0}ms`
        : '';
      div.innerHTML =
        `<span class="item-main">${escapeHtml(main)}</span>` +
        `<span class="item-meta">${escapeHtml(meta)}</span>` +
        (source === 'collection'
          ? `<button class="item-action" data-id="${item.id}" title="Delete">×</button>`
          : '');
      div.querySelector('.item-main').addEventListener('click', () => {
        vscode.postMessage({
          type: 'request.execute',
          payload: { id: item.id, source }
        });
        // Switch to the appropriate tab based on item type
        const targetTab = item.wsUrl && !item.url ? 'ws' : 'http';
        document.querySelector('.tab[data-tab="' + targetTab + '"]').click();
      });
      if (source === 'collection') {
        div.querySelector('.item-action').addEventListener('click', (e) => {
          e.stopPropagation();
          vscode.postMessage({ type: 'collection.delete', payload: { id: item.id } });
        });
      }
      el.appendChild(div);
    }
  }

  // Extend window message handler
  window.addEventListener('message', (event) => {
    const msg = event.data;
    if (msg.type === 'history.list') {
      renderList('history-list', msg.payload.items, 'history');
    } else if (msg.type === 'collection.list' || msg.type === 'collection.saved') {
      const items = msg.type === 'collection.saved' ? [msg.payload.item] : msg.payload.items;
      // Refresh the full list after save
      if (msg.type === 'collection.saved') {
        vscode.postMessage({ type: 'collection.list', payload: {} });
      } else {
        renderList('collections-list', items, 'collection');
      }
    } else if (msg.type === 'collection.deleted') {
      vscode.postMessage({ type: 'collection.list', payload: {} });
    }
  });

  // Initial loads
  vscode.postMessage({ type: 'history.list', payload: {} });
  vscode.postMessage({ type: 'collection.list', payload: {} });
})();
