function getLocalStorageData(){
  return localStorage.getItem("adminToken");
}
// ── Auth headers ─────────────────────────────────────────────────────────────
function authHeaders(extra = {}) {
  console.log("Token" ,getLocalStorageData())
  return { "Authorization": `Bearer ${getLocalStorageData()}`, ...extra };
}
async function checkAuth() {
    const token = getLocalStorageData();  
    if (!token) {
        window.location.href = '/admin/login';
        return;
    }

    try {
        
        const response = await fetch('/admin/api/verify', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`, 
               
            }
        });
        console.log(response)
        if (!response.ok) {
          localStorage.removeItem('adminToken');
          window.location.href = '/admin/login';
        } else {
          document.body.style.display = 'block'; 
        }
    } catch (error) {
        window.location.href = '/admin/login';
    }
}

checkAuth()



const API = '/api';

// ─── State ────────────────────────────────────────────────────────────────────
let documents = [];

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadDocuments();
  initUpload();
});

// ─── Toast ────────────────────────────────────────────────────────────────────
function toast(msg, type = 'info', duration = 3500) {
  const container = document.getElementById('toasts');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => {
    el.style.transition = 'opacity 0.3s';
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 300);
  }, duration);
}

// ─── Load Documents ───────────────────────────────────────────────────────────
async function loadDocuments() {
  const tbody = document.getElementById('doc-tbody');
  tbody.innerHTML = `<tr class="loading-row"><td colspan="4"><span class="spinner"></span>Loading documents...</td></tr>`;

  try {
    const res = await fetch(`${API}/documents`,
       {
         headers:authHeaders(),
         method: "GET"
        }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    documents = data.documents || [];
    renderDocuments(documents);
    updateStats(documents);
  } catch (err) {
    tbody.innerHTML = `<tr class="loading-row"><td colspan="4" style="color:var(--danger)">Failed to load: ${esc(err.message)}</td></tr>`;
    setStoreStatus('error', err.message);
    toast(`Could not reach API: ${err.message}`, 'error');
  }
}

// ─── Update Stats ─────────────────────────────────────────────────────────────
function updateStats(docs) {
  const totalChunks = docs.reduce((sum, d) => sum + (d.chunkCount || d.chunks || 0), 0);
  document.getElementById('stat-docs').textContent = docs.length;
  document.getElementById('stat-chunks').textContent = totalChunks.toLocaleString();
  document.getElementById('doc-count-badge').textContent = `${docs.length} doc${docs.length !== 1 ? 's' : ''}`;
  setStoreStatus('ok', 'weaviate');
}

function setStoreStatus(state, text) {
  const el = document.getElementById('stat-store');
  const sub = document.getElementById('stat-store-sub');
  const badge = document.getElementById('status-badge');
  if (state === 'ok') {
    el.textContent = 'Online';
    el.style.color = 'var(--success)';
    sub.textContent = text;
    badge.textContent = '● live';
    badge.className = 'topbar-badge live';
  } else {
    el.textContent = 'Error';
    el.style.color = 'var(--danger)';
    sub.textContent = text;
    badge.textContent = '● error';
    badge.className = 'topbar-badge';
    badge.style.color = 'var(--danger)';
  }
}

// ─── Render Table ─────────────────────────────────────────────────────────────
function renderDocuments(docs) {
  const tbody = document.getElementById('doc-tbody');

  if (!docs.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4">
          <div class="empty-state">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="6" y="4" width="20" height="24" rx="3"/>
              <path d="M11 10h10M11 15h10M11 20h6"/>
            </svg>
            <p>No documents yet — upload PDFs above to get started.</p>
          </div>
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = docs.map(doc => {
    const name = doc.source || 'Untitled';
    const id = doc.documentId || doc.id || '—';
    const storagePath = doc.storagePath  || '—';
    const shortId = (typeof id === 'string' && id.length > 20)
      ? id.slice(0, 8) + '…' + id.slice(-4)
      : id;

    return `
      <tr>
        <td>
          <div class="file-name-cell">
            <div class="file-icon">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.3">
                <path d="M3 2h5l3 3v7a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z"/>
                <path d="M8 2v3h3"/>
              </svg>
            </div>
            <span class="file-name-text">${esc(name)}</span>
          </div>
        </td>
        <td>
          <span class="doc-id-cell" title="${esc(id)}">${esc(shortId)}</span>
        </td>
        <td>
          <span class="doc-id-storagePath" title="${esc(storagePath)}">${esc(storagePath)}</span>
        </td>
       
      <td>
  <button class="btn-view" onclick="viewPdf('${esc(storagePath)}')" title="View document">
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  </button>
</td>
        <td>
          <button class="btn-del" onclick="confirmDelete('${esc(id)}','${esc(name)}')" title="Delete document">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M2 3h9M5 3V2h3v1M3 3l.7 8.5a.5.5 0 0 0 .5.5h4.6a.5.5 0 0 0 .5-.5L10 3"/>
              <path d="M5.5 6v3.5M7.5 6v3.5"/>
            </svg>
          </button>
        </td>
      </tr>`;
  }).join('');
}
// get the url for the file
async function viewPdf(storagePath) {
    // 1. Call your backend to get a signed URL
    const response = await fetch(`/api/documents/fileurl?path=${encodeURIComponent(storagePath)}`, {
        headers: authHeaders()
    });
    const { url } = await response.json();
    window.open(url, '_blank');
}

// ─── Delete ───────────────────────────────────────────────────────────────────
let pendingDeleteId = null;

function confirmDelete(id, name,storagePath) {
  pendingDeleteId = id;
  document.getElementById('modal-desc').textContent =
    `"${name}" and all its vector chunks will be permanently removed. This cannot be undone.`;
  document.getElementById('modal-confirm-btn').onclick = () => doDelete(id,storagePath);
  document.getElementById('modal-backdrop').classList.add('open');
}

function closeModal() {
  document.getElementById('modal-backdrop').classList.remove('open');
  pendingDeleteId = null;
}

// Close modal on backdrop click
document.getElementById('modal-backdrop').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeModal();
});

async function doDelete(id) {
  closeModal();
  try {
    const res = await fetch(`${API}/documents/${encodeURIComponent(id)}`,
   {headers: authHeaders(),
      method: 'DELETE',
   }
     );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    const data = await res.json();
    const removed = data.chunksDeleted != null ? ` (${data.chunksDeleted} chunks removed)` : '';
    toast(`Document deleted${removed}`, 'success');
    loadDocuments();
  } catch (err) {
    toast(`Delete failed: ${err.message}`, 'error');
  }
}

// ─── Upload ───────────────────────────────────────────────────────────────────
function initUpload() {
  const zone = document.getElementById('drop-zone');
  const input = document.getElementById('file-input');

  zone.addEventListener('dragover', (e) => {
    e.preventDefault();
    zone.classList.add('drag-over');
  });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    const pdfs = [...e.dataTransfer.files].filter(f => f.type === 'application/pdf');
    if (!pdfs.length) { toast('Only PDF files are accepted', 'error'); return; }
    if (pdfs.length > 10) { toast('Maximum 10 files per upload', 'error'); return; }
    uploadFiles(pdfs);
  });

  input.addEventListener('change', () => {
    if (input.files.length) uploadFiles([...input.files]);
    input.value = '';
  });
}

async function uploadFiles(files) {
  const section = document.getElementById('progress-section');
  section.style.display = 'flex';
  section.innerHTML = '';

  // Build progress rows
  const bars = files.map((f, i) => {
    const shortName = f.name.length > 22 ? f.name.slice(0, 19) + '...' : f.name;
    const row = document.createElement('div');
    row.className = 'progress-item';
    row.innerHTML = `
      <span class="progress-filename" title="${esc(f.name)}">${esc(shortName)}</span>
      <div class="progress-track"><div class="progress-fill" id="pf-${i}" style="width:0%"></div></div>
      <span class="progress-state" id="ps-${i}">—</span>`;
    section.appendChild(row);
    return {
      fill: document.getElementById(`pf-${i}`),
      state: document.getElementById(`ps-${i}`)
    };
  });

  // Animate to 40% while preparing
  bars.forEach(b => { b.fill.style.width = '40%'; b.state.textContent = 'uploading'; });

  const form = new FormData();
  files.forEach(f => form.append('files', f));

  try {
    // Animate to 75% while waiting for response
    setTimeout(() => bars.forEach(b => { if (b.fill.style.width === '40%') b.fill.style.width = '75%'; }), 400);

    const res = await fetch(`${API}/upload`, 
      {  headers:authHeaders(),
         method: 'POST',
          body: form,
      }
);

    bars.forEach(b => { b.fill.style.width = '100%'; });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }

    const data = await res.json();
    const results = data.results || [];

    results.forEach((r, i) => {
      if (!bars[i]) return;
      if (r.status === 'success') {
        bars[i].fill.classList.add('success');
        bars[i].state.textContent = 'done';
        bars[i].state.className = 'progress-state done';
      } else if (r.status === 'skipped') {
        bars[i].fill.classList.add('error');
        bars[i].state.textContent = 'skipped';
        bars[i].state.className = 'progress-state err';
      } else {
        bars[i].fill.classList.add('error');
        bars[i].state.textContent = 'error';
        bars[i].state.className = 'progress-state err';
      }
    });

    const ok = results.filter(r => r.status === 'success').length;
    const skipped = results.filter(r => r.status === 'skipped').length;
    const failed = results.filter(r => r.status === 'error').length;

    if (ok > 0) toast(`${ok} file${ok > 1 ? 's' : ''} uploaded successfully`, 'success');
    if (skipped > 0) toast(`${skipped} file${skipped > 1 ? 's' : ''} skipped (no extractable text)`, 'info');
    if (failed > 0) toast(`${failed} file${failed > 1 ? 's' : ''} failed`, 'error');

    // Refresh table after short delay
    setTimeout(() => {
      section.style.display = 'none';
      loadDocuments();
    }, 2200);

  } catch (err) {
    bars.forEach(b => {
      b.fill.classList.add('error');
      b.fill.style.width = '100%';
      b.state.textContent = 'error';
      b.state.className = 'progress-state err';
    });
    toast(`Upload failed: ${err.message}`, 'error');
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}


// 1. Function to switch between Dashboard and Logs
function showView(viewName) {
    // Toggle Sections
    document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
    document.getElementById(`view-${viewName}`).classList.add('active');

    // Toggle Nav Buttons
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');

    if (viewName === 'logs') {
        loadLogs();
    }
}


async function loadLogs() {
    const container = document.getElementById('logs-container');
    const token = localStorage.getItem('adminToken');
    
    container.innerHTML = '<div style="padding:2rem; text-align:center;"><span class="spinner"></span> Loading logs...</div>';

    try {
        const res = await fetch('/admin/api/logs', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (!data.logs || data.logs.length === 0) {
            container.innerHTML = '<div style="padding:2rem; text-align:center;">No activity logs found.</div>';
            return;
        }

        // Render logs into HTML
        container.innerHTML = data.logs.map(log => `
            <div class="log-item">
                <div class="log-timestamp">${log.createdAt 
    ? new Date(esc(log.createdAt))
    : 'N/A'}</div>
                <div><span class="event-tag">${esc(log.eventName)}</span></div>
                <div style="font-weight: 500;">${esc(log.documentName) || 'N/A'}</div>
                <div style="color: var(--text-muted);">Email ${log.userEmail?esc(log.userEmail):"N/A"} <br> <small>Ip address: ${log.ipAddress}</small></div>
            </div>
        `).join('');

    } catch (err) {
        container.innerHTML = `<div style="padding:2rem; text-align:center; color:var(--danger);">Error loading logs: ${err.message}</div>`;
    }
}