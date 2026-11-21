
'use strict';

const http = require('http');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;

const releases = [
  {
    id: 'LMG-001',
    title: 'Midnight Echoes',
    artist: 'Lunaris Collective',
    type: 'Single',
    date: '2026-12-05',
    status: 'Draft',
    stores: ['Spotify', 'Apple Music']
  },
  {
    id: 'LMG-002',
    title: 'Afterglow',
    artist: 'Nova Sky',
    type: 'EP',
    date: '2026-12-18',
    status: 'Ready',
    stores: ['Spotify', 'YouTube Music']
  }
];

const stores = [
  'Spotify',
  'Apple Music',
  'YouTube Music',
  'Amazon Music',
  'Deezer',
  'Tidal'
];

function json(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(JSON.stringify(data));
}

async function readBody(req) {
  let body = '';
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 100000) {
      throw new Error('Request too large');
    }
  }
  return JSON.parse(body || '{}');
}

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport"
content="width=device-width, initial-scale=1">
<title>Lunaris Media Group</title>
<style>
:root {
  --bg:#090a0e;
  --panel:#15161c;
  --border:#30313a;
  --text:#f4f4f6;
  --muted:#989aa6;
  --accent:#b9aaff;
}
* {box-sizing:border-box}
body {
  margin:0;
  background:var(--bg);
  color:var(--text);
  font:14px Arial,sans-serif;
}
button,input,select {font:inherit}
button {cursor:pointer}
.sidebar {
  position:fixed;
  top:0;bottom:0;left:0;
  width:245px;
  background:#101116;
  border-right:1px solid var(--border);
  padding:25px 15px;
  z-index:5;
  transition:transform .2s;
}
.logo {
  padding:10px 12px 30px;
  font-size:21px;
  font-weight:800;
  letter-spacing:2px;
}
.logo small {
  display:block;
  color:var(--muted);
  font-size:10px;
  letter-spacing:4px;
}
.nav {
  display:block;
  width:100%;
  text-align:left;
  background:transparent;
  color:#aaaebc;
  border:0;
  border-radius:9px;
  padding:14px;
  margin:4px 0;
}
.nav:hover,.nav.active {
  background:#292833;
  color:white;
}
.main {
  margin-left:245px;
  padding:30px;
}
.header {
  display:flex;
  justify-content:space-between;
  align-items:center;
  border-bottom:1px solid var(--border);
  padding-bottom:25px;
  margin-bottom:30px;
}
h1 {font-size:30px;margin:10px 0}
h2 {font-size:17px;margin:0 0 20px}
p {color:var(--muted)}
.eyebrow {
  color:var(--accent);
  font-size:11px;
  letter-spacing:3px;
}
.cards {
  display:grid;
  grid-template-columns:repeat(4,1fr);
  gap:15px;
  margin:25px 0;
}
.card,.panel {
  background:var(--panel);
  border:1px solid var(--border);
  border-radius:15px;
  padding:22px;
}
.card span {
  color:var(--muted);
  font-size:12px;
}
.card strong {
  display:block;
  font-size:29px;
  margin-top:14px;
}
.panel {margin-top:20px}
.primary {
  background:#f1f0f7;
  color:#111;
  border:0;
  padding:12px 18px;
  border-radius:9px;
  font-weight:bold;
}
.primary:hover {background:#cfc5ff}
table {
  width:100%;
  border-collapse:collapse;
  min-width:570px;
}
th,td {
  text-align:left;
  padding:15px 10px;
  border-bottom:1px solid var(--border);
}
th {
  color:var(--muted);
  font-size:11px;
}
.tablewrap {overflow-x:auto}
.status {
  background:#343044;
  color:#d7caff;
  padding:6px 10px;
  border-radius:20px;
}
.status.ready {
  background:#174333;
  color:#a2e9c3;
}
.grid {
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:17px;
}
label {
  display:block;
  color:#bbb;
  margin-bottom:7px;
}
input,select {
  width:100%;
  padding:12px;
  background:#22242d;
  color:white;
  border:1px solid #444653;
  border-radius:8px;
}
.field {margin-bottom:17px}
.stores {
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:12px;
  margin:20px 0;
}
.store {
  padding:14px;
  border:1px solid var(--border);
  border-radius:10px;
  background:#20212a;
}
.store input {width:auto}
.page {display:none}
.page.active {display:block}
.notice {
  padding:14px;
  border:1px solid #53486d;
  background:#292334;
  border-radius:9px;
  color:#d4c8e8;
  margin:20px 0;
}
#menu {display:none}
@media(max-width:900px) {
  .cards {grid-template-columns:repeat(2,1fr)}
}
@media(max-width:700px) {
  .sidebar {transform:translateX(-100%)}
  .sidebar.open {transform:translateX(0)}
  .main {margin-left:0;padding:20px}
  #menu {display:inline-block}
  .grid,.stores {grid-template-columns:1fr}
  h1 {font-size:25px}
}
</style>
</head>
<body>

<aside class="sidebar" id="sidebar">
  <div class="logo">
    LUNARIS
    <small>MEDIA GROUP</small>
  </div>

  <button class="nav active" data-page="dashboard">
    ◫ Dashboard
  </button>
  <button class="nav" data-page="catalog">
    ♫ Music Catalog
  </button>
  <button class="nav" data-page="create">
    + Create Release
  </button>
  <button class="nav" data-page="artists">
    ♙ Artists & Labels
  </button>
  <button class="nav" data-page="distribution">
    ◎ Distribution
  </button>
  <button class="nav" data-page="delivery">
    ⇧ Delivery Status
  </button>
</aside>

<div class="main">
  <header class="header">
    <div>
      <button id="menu" class="primary">☰</button>
      <strong>LUNARIS MEDIA GROUP</strong>
    </div>
    <span>● Server Online</span>
  </header>

  <section id="dashboard" class="page active">
    <div class="eyebrow">DISTRIBUTION CONSOLE</div>
    <h1>Welcome to Lunaris.</h1>
    <p>Your music. Your artists. One workspace.</p>
    <button class="primary" data-go="create">
      + New Release
    </button>

    <div class="cards">
      <div class="card">
        <span>Total Releases</span>
        <strong id="total">0</strong>
      </div>
      <div class="card">
        <span>Active Artists</span>
        <strong id="artistCount">0</strong>
      </div>
      <div class="card">
        <span>Ready for Delivery</span>
        <strong id="readyCount">0</strong>
      </div>
      <div class="card">
        <span>Revenue</span>
        <strong>$0.00</strong>
      </div>
    </div>

    <div class="panel">
      <h2>Recent Releases</h2>
      <div id="recent"></div>
    </div>
  </section>

  <section id="catalog" class="page">
    <h1>Music Catalog</h1>
    <p>Manage your releases.</p>
    <button class="primary" data-go="create">
      + Create Release
    </button>
    <div class="panel" id="catalogList"></div>
  </section>

  <section id="create" class="page">
    <h1>Create a Release</h1>
    <p>Prepare music metadata for distribution.</p>

    <div class="panel">
      <form id="releaseForm">
        <div class="grid">
          <div class="field">
            <label>Release Title *</label>
            <input name="title" required maxlength="120">
          </div>
          <div class="field">
            <label>Primary Artist *</label>
            <input name="artist" required maxlength="120">
          </div>
          <div class="field">
            <label>Release Type</label>
            <select name="type">
              <option>Single</option>
              <option>EP</option>
              <option>Album</option>
            </select>
          </div>
          <div class="field">
            <label>Release Date *</label>
            <input type="date" name="date" required>
          </div>
          <div class="field">
            <label>ISRC</label>
            <input name="isrc" maxlength="12">
          </div>
          <div class="field">
            <label>UPC</label>
            <input name="upc" maxlength="14">
          </div>
        </div>

        <h2>Distribution Platforms</h2>
        <div class="stores">
          <label class="store">
            <input type="checkbox" name="store"
              value="Spotify" checked> Spotify
          </label>
          <label class="store">
            <input type="checkbox" name="store"
              value="Apple Music" checked> Apple Music
          </label>
          <label class="store">
            <input type="checkbox" name="store"
              value="YouTube Music"> YouTube Music
          </label>
          <label class="store">
            <input type="checkbox" name="store"
              value="Deezer"> Deezer
          </label>
          <label class="store">
            <input type="checkbox" name="store"
              value="Amazon Music"> Amazon Music
          </label>
          <label class="store">
            <input type="checkbox" name="store"
              value="Tidal"> Tidal
          </label>
        </div>

        <div class="notice">
          Demo only. No real DSP delivery is connected.
        </div>
        <button class="primary" type="submit">
          Save Release Draft
        </button>
      </form>
    </div>
  </section>

  <section id="artists" class="page">
    <h1>Artists & Labels</h1>
    <div class="panel" id="artistList"></div>
  </section>

  <section id="distribution" class="page">
    <h1>DSP Distribution</h1>
    <p>Select destinations when creating releases.</p>
    <div class="panel">
      <h2>Supported Planning Destinations</h2>
      <div class="stores" id="storeList"></div>
      <div class="notice">
        DSP APIs are not connected.
        Selecting a store does not deliver music.
      </div>
    </div>
  </section>

  <section id="delivery" class="page">
    <h1>Delivery Status</h1>
    <p>Internal preparation status only.</p>
    <div class="panel" id="deliveryList"></div>
  </section>
</div>

<script>
const $ = selector => document.querySelector(selector);
let releases = [];

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&':'&amp;',
    '<':'&lt;',
    '>':'&gt;',
    '"':'&quot;',
    "'":'&#39;'
  })[char]);
}

function navigate(page) {
  document.querySelectorAll('.page').forEach(el => {
    el.classList.toggle('active', el.id === page);
  });
  document.querySelectorAll('.nav').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });
  $('#sidebar').classList.remove('open');
}

document.querySelectorAll('[data-page]').forEach(el => {
  el.addEventListener('click', () => navigate(el.dataset.page));
});

document.querySelectorAll('[data-go]').forEach(el => {
  el.addEventListener('click', () => navigate(el.dataset.go));
});

$('#menu').onclick = () => {
  $('#sidebar').classList.toggle('open');
};

function renderTable(items) {
  if (!items.length) return '<p>No releases yet.</p>';

  return '<div class="tablewrap"><table>' +
    '<thead><tr><th>Release</th><th>Artist</th>' +
    '<th>Type</th><th>Date</th><th>Status</th></tr></thead>' +
    '<tbody>' + items.map(r => {
      return '<tr><td>' + escapeHTML(r.title) +
        '</td><td>' + escapeHTML(r.artist) +
        '</td><td>' + escapeHTML(r.type) +
        '</td><td>' + escapeHTML(r.date) +
        '</td><td><span class="status ' +
        (r.status === 'Ready' ? 'ready' : '') +
        '">' + escapeHTML(r.status) +
        '</span></td></tr>';
    }).join('') + '</tbody></table></div>';
}

async function refresh() {
  const response = await fetch('/api/releases');
  if (!response.ok) throw new Error('API error');
  releases = await response.json();

  const artists = [...new Set(releases.map(r => r.artist))];

  $('#total').textContent = releases.length;
  $('#artistCount').textContent = artists.length;
  $('#readyCount').textContent =
    releases.filter(r => r.status === 'Ready').length;

  $('#recent').innerHTML =
    renderTable(releases.slice(-5).reverse());
  $('#catalogList').innerHTML = renderTable(releases);
  $('#deliveryList').innerHTML = renderTable(releases);

  $('#artistList').innerHTML = artists.map(name =>
    '<div class="card">' + escapeHTML(name) + '</div>'
  ).join('') || '<p>No artists.</p>';
}

$('#storeList').innerHTML = [
  'Spotify','Apple Music','YouTube Music',
  'Amazon Music','Deezer','Tidal'
].map(name =>
  '<div class="store">' + escapeHTML(name) +
  '<p>Not connected</p></div>'
).join('');

$('#releaseForm').addEventListener('submit', async event => {
  event.preventDefault();
  const form = new FormData(event.target);

  const payload = {
    title: form.get('title'),
    artist: form.get('artist'),
    type: form.get('type'),
    date: form.get('date'),
    isrc: form.get('isrc'),
    upc: form.get('upc'),
    stores: form.getAll('store')
  };

  try {
    const response = await fetch('/api/releases', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Save failed');
    }

    event.target.reset();
    await refresh();
    navigate('catalog');
    alert('Release draft saved!');
  } catch (error) {
    alert(error.message);
  }
});

refresh().catch(() => alert('Cannot connect to API'));
</script>
</body>
</html>`;

const server = http.createServer(async (req, res) => {
  const path = new URL(req.url, 'http://localhost').pathname;

  try {
    if (req.method === 'GET' && path === '/') {
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Content-Type-Options': 'nosniff'
      });
      return res.end(html);
    }

    if (req.method === 'GET' && path === '/api/health') {
      return json(res, 200, {
        status: 'online',
        service: 'Lunaris Media Group'
      });
    }

    if (req.method === 'GET' && path === '/api/releases') {
      return json(res, 200, releases);
    }

    if (req.method === 'POST' && path === '/api/releases') {
      const body = await readBody(req);

      const title = String(body.title || '').trim();
      const artist = String(body.artist || '').trim();
      const type = String(body.type || 'Single');
      const date = String(body.date || '');
      const isrc = String(body.isrc || '').trim();
      const upc = String(body.upc || '').trim();

      if (
        !title || title.length > 120 ||
        !artist || artist.length > 120 ||
        !['Single','EP','Album'].includes(type) ||
        !/^\\d{4}-\\d{2}-\\d{2}$/.test(date) ||
        !Number.isFinite(Date.parse(date)) ||
        isrc.length > 12 || upc.length > 14 ||
        !Array.isArray(body.stores) ||
        body.stores.length > 10 ||
        body.stores.some(s => !stores.includes(s))
      ) {
        return json(res, 400, {
          error: 'Invalid release details'
        });
      }

      const item = {
        id: crypto.randomUUID(),
        title,
        artist,
        type,
        date,
        isrc,
        upc,
        stores: [...new Set(body.stores)],
        status: 'Draft'
      };

      releases.push(item);
      return json(res, 201, item);
    }

    return json(res, 404, {error:'Not found'});
  } catch (error) {
    return json(res, 400, {
      error: 'Invalid request'
    });
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('Lunaris Media Group running on port ' + PORT);
});
