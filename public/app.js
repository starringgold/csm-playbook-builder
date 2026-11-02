let plays = [];

document.addEventListener('DOMContentLoaded', async () => {
  loadApiKey();
  await loadPlays();
  renderPlays();
  updatePlaysCount();
  document.getElementById('saveKey').addEventListener('click', saveApiKey);
  document.getElementById('addPlayBtn').addEventListener('click', addPlay);
  document.getElementById('generateBtn').addEventListener('click', generatePlaybook);
  document.getElementById('copyBtn').addEventListener('click', copyPlaybook);
  document.getElementById('newBtn').addEventListener('click', showForm);
  document.getElementById('apiKey').addEventListener('keydown', e => { if (e.key === 'Enter') saveApiKey(); });

  // Intro banner: hide if previously dismissed
  try {
    if (localStorage.getItem('csm_intro_dismissed')) {
      const banner = document.getElementById('introBanner');
      if (banner) banner.style.display = 'none';
    }
  } catch(e) {}
  const dismissBtn = document.getElementById('introDismiss');
  if (dismissBtn) {
    dismissBtn.addEventListener('click', () => {
      const banner = document.getElementById('introBanner');
      if (banner) banner.style.display = 'none';
      try { localStorage.setItem('csm_intro_dismissed', '1'); } catch(e) {}
    });
  }
});

function loadApiKey() {
  try { const s = localStorage.getItem('csm_api_key'); if (s) document.getElementById('apiKey').value = s; } catch(e){}
}
function saveApiKey() {
  const key = document.getElementById('apiKey').value.trim();
  if (!key) { showToast('Please enter your API key first', 'error'); return; }
  try { localStorage.setItem('csm_api_key', key); } catch(e){}
  showToast('API key saved');
}

async function loadPlays() {
  try { const s = localStorage.getItem('csm_plays'); if (s) { plays = JSON.parse(s); return; } } catch(e){}
  try { const r = await fetch('/data/example-plays.json'); if (r.ok) { plays = await r.json(); savePlays(); } } catch(e){ plays = []; }
}
function savePlays() { try { localStorage.setItem('csm_plays', JSON.stringify(plays)); } catch(e){} }
function renderPlays() {
  const list = document.getElementById('playsList');
  if (plays.length === 0) { list.innerHTML = '<p class="empty-plays">No plays yet.<br>Add your first winning play below.</p>'; return; }
  list.innerHTML = plays.map((p, i) => `
    <div class="play-card">
      <div class="play-card-header">
        <span class="play-situation">${escapeHtml(p.situation)}</span>
        <button class="play-delete" onclick="deletePlay(${i})" title="Remove">×</button>
      </div>
      <p class="play-action">${escapeHtml(p.play)}</p>
      <p class="play-outcome">✅ ${escapeHtml(p.outcome)}</p>
    </div>`).join('');
}
function addPlay() {
  const situation = document.getElementById('playSituation').value.trim();
  const play = document.getElementById('playAction').value.trim();
  const outcome = document.getElementById('playOutcome').value.trim();
  if (!situation || !play || !outcome) { showToast('Fill in all three fields', 'error'); return; }
  plays.push({ id: String(Date.now()), situation, play, outcome });
  savePlays(); renderPlays(); updatePlaysCount();
  document.getElementById('playSituation').value = '';
  document.getElementById('playAction').value = '';
  document.getElementById('playOutcome').value = '';
  showToast('Play added!');
}
function deletePlay(i) { plays.splice(i, 1); savePlays(); renderPlays(); updatePlaysCount(); }
function updatePlaysCount() {
  const el = document.getElementById('playsCount');
  if (!el) return;
  el.innerHTML = plays.length === 0
    ? 'No plays in library yet — add some on the left for best results.'
    : `<strong>${plays.length}</strong> winning play${plays.length !== 1 ? 's' : ''} will be woven in`;
}

async function generatePlaybook() {
  const apiKey = document.getElementById('apiKey').value.trim();
  if (!apiKey) { showToast('Enter your Claude API key at the top first', 'error'); document.getElementById('apiKey').focus(); return; }
  const segment = document.getElementById('segment').value;
  const product = document.getElementById('product').value.trim();
  const industry = document.getElementById('industry').value.trim();
  const companySize = document.getElementById('companySize').value.trim();
  const goals = document.getElementById('goals').value.trim();
  if (!segment || !product || !industry || !goals) { showToast('Fill in Segment, Product, Industry, and Goals', 'error'); return; }
  const btn = document.getElementById('generateBtn');
  const btnText = document.getElementById('generateBtnText');
  btn.disabled = true; btnText.textContent = '⏳ Generating...';
  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey, segment, product, industry, companySize, goals, plays })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to generate playbook');
    try { localStorage.setItem('csm_api_key', apiKey); } catch(e){}
    showPlaybook(data.playbook, { segment, product, industry });
  } catch(err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false; btnText.textContent = '✨ Generate Playbook';
  }
}

function showPlaybook(markdown, meta) {
  // Show playbook section alongside the form (two-panel layout on wide screens)
  const section = document.getElementById('playbookSection');
  section.style.display = 'flex';

  // Switch panels to two-column grid
  document.getElementById('mainPanels').classList.add('has-playbook');

  // Hide empty state, show toolbar and content
  document.getElementById('playbookEmpty').style.display = 'none';
  document.getElementById('playbookToolbar').style.display = 'flex';

  const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  document.getElementById('playbookMeta').innerHTML = [meta.segment, meta.product, meta.industry, date]
    .map(t => `<span class="meta-tag">${escapeHtml(t)}</span>`).join('');
  const contentEl = document.getElementById('playbookContent');
  contentEl.innerHTML = marked.parse(markdown);
  contentEl.dataset.raw = markdown;

  // Scroll playbook into view on narrow screens; on wide screens it's already visible
  if (window.innerWidth < 1100) {
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    section.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

function showForm() {
  // Reset playbook section back to empty state
  document.getElementById('mainPanels').classList.remove('has-playbook');
  document.getElementById('playbookSection').style.display = 'none';
  document.getElementById('playbookEmpty').style.display = 'flex';
  document.getElementById('playbookToolbar').style.display = 'none';
  document.getElementById('playbookContent').innerHTML = '';
  delete document.getElementById('playbookContent').dataset.raw;

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function copyPlaybook() {
  const raw = document.getElementById('playbookContent').dataset.raw;
  if (!raw) return;
  navigator.clipboard.writeText(raw).then(() => showToast('Copied!')).catch(() => showToast('Could not copy', 'error'));
}
function showToast(msg, type = 'success') {
  const container = document.getElementById('toastContainer');
  const t = document.createElement('div');
  t.className = `toast toast-${type}`; t.textContent = msg;
  container.appendChild(t);
  requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add('show')));
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 3500);
}
function escapeHtml(str) { const d = document.createElement('div'); d.textContent = String(str||''); return d.innerHTML; }
