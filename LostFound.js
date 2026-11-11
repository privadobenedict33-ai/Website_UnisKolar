// UnisKolar – Lost & Found
// Data lives in localStorage so posts, claims and statuses survive a page refresh.
// Replace load()/save() with fetch() calls if you add a real backend later.

const STORE_KEY = 'uniskolar_lostfound_v1';
const NOTIF_KEY = 'uniskolar_notifications';   // shared with the Notifications page
const ME = { name: 'Benedict Privado', id: 'BSCS 1-1' };

const CATEGORIES = ['ID / Cards', 'Bags', 'Electronics', 'Books & Notes', 'Clothing', 'Wallets & Keys', 'Water Bottles & Umbrellas', 'Others'];
const LOCATIONS = ['Gusaling Lacson', 'Gusaling Bagatsing', 'Gusaling Katipunan', 'Gusaling Villegas', 'Gusaling Corazon Aquino',
  'Executive Bldg', 'Entrep Bldg', 'Raja Sulayman Gym', 'University Activity Center', 'Canteen', 'Quadrangle', 'Gates / Walkways', 'Other'];
const STATUS = { unclaimed: 'Unclaimed', pending: 'Claim pending', returned: 'Returned' };

const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const BOX_ICON = '<svg><use href="#i-box"/></svg>';
const PIN_ICON = '<svg><use href="#i-pin"/></svg>';
const CAL_ICON = '<svg><use href="#i-calendar"/></svg>';

const dayStr = (offset = 0) => { const d = new Date(); d.setDate(d.getDate() - offset); return d.toISOString().slice(0, 10); };
const fmtDate = (s) => new Date(s + 'T00:00:00').toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });

/* ---------- Data ---------- */
function seed() {
  return [
    { id: 1, type: 'found', title: 'Black umbrella', category: 'Water Bottles & Umbrellas', location: 'Canteen', date: dayStr(1), description: 'Black folding umbrella with a wooden handle.', keptAt: 'Security Office', contact: '2025-00417', status: 'unclaimed', claims: [] },
    { id: 2, type: 'found', title: 'Student ID (first name: Maria)', category: 'ID / Cards', location: 'Gusaling Lacson', date: dayStr(2), description: 'PLM student ID found near the elevator. Details hidden for privacy.', keptAt: 'Security Office', contact: '2025-00233', status: 'pending', claims: [{ name: 'Maria S.', studentNo: '2025-00555', details: 'It has my photo with a blue lanyard.', contact: 'maria@plm.edu.ph', date: dayStr(1) }] },
    { id: 3, type: 'found', title: 'Calculus notebook', category: 'Books & Notes', location: 'Gusaling Bagatsing', date: dayStr(3), description: 'Green spiral notebook, labeled for Math 102.', keptAt: 'Guidance Office', contact: '2024-01002', status: 'unclaimed', claims: [] },
    { id: 4, type: 'found', title: 'Wireless earbuds', category: 'Electronics', location: 'University Activity Center', date: dayStr(5), description: 'White earbuds in a small charging case.', keptAt: 'Security Office', contact: '2024-00781', status: 'returned', claims: [{ name: 'Joezer R.', studentNo: '2025-00311', details: 'Case has a sticker of a cat on the back.', contact: '2025-00311', date: dayStr(4) }] },
    { id: 5, type: 'found', title: 'Navy blue jacket', category: 'Clothing', location: 'Raja Sulayman Gym', date: dayStr(6), description: 'Size M jacket, left on the bleachers.', keptAt: 'Gym front desk', contact: '2025-00990', status: 'unclaimed', claims: [] },
    { id: 6, type: 'lost', title: 'Brown leather wallet', category: 'Wallets & Keys', location: 'Canteen', date: dayStr(1), description: 'Small bifold wallet. Please contact me if found.', contact: '2025-00640', status: 'unclaimed', claims: [] },
    { id: 7, type: 'lost', title: 'Scientific calculator (Casio fx-991)', category: 'Electronics', location: 'Gusaling Villegas', date: dayStr(3), description: 'Has my initials "MA" on the back.', contact: 'ma@plm.edu.ph', status: 'unclaimed', claims: [] }
  ];
}
function load() {
  try { const d = JSON.parse(localStorage.getItem(STORE_KEY)); if (Array.isArray(d)) return d; } catch (e) {}
  return seed();
}
function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(items)); } catch (e) { toast('Storage is full – try a smaller photo.'); } }
function notify(text) {
  let n = []; try { n = JSON.parse(localStorage.getItem(NOTIF_KEY)) || []; } catch (e) {}
  n.unshift({ id: Date.now(), source: 'Lost & Found', text, date: new Date().toISOString(), read: false });
  try { localStorage.setItem(NOTIF_KEY, JSON.stringify(n.slice(0, 50))); } catch (e) {}
  updateBell();
}
function updateBell() {
  let n = []; try { n = JSON.parse(localStorage.getItem(NOTIF_KEY)) || []; } catch (e) {}
  const c = n.filter((x) => !x.read).length;
  $('#bellCount').textContent = c; $('#bell').setAttribute('aria-label', `Notifications, ${c} new`);
  $('#bellCount').hidden = c === 0;
}

let items = load();
let state = { tab: 'found', staff: false };

/* ---------- Setup selects ---------- */
function fillSelect(sel, list, withAll) {
  sel.innerHTML = (withAll ? '<option value="">All</option>' : '<option value="" disabled selected>Select…</option>') +
    list.map((x) => `<option>${esc(x)}</option>`).join('');
}
fillSelect($('#fCat'), CATEGORIES, true);
$('#fStatus').innerHTML = '<option value="">All</option>' + Object.entries(STATUS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('');
fillSelect($('#itemForm').category, CATEGORIES, false);
fillSelect($('#itemForm').location, LOCATIONS, false);

/* ---------- Render ---------- */
function visible() {
  const q = $('#q').value.trim().toLowerCase(), cat = $('#fCat').value, st = $('#fStatus').value, sort = $('#fSort').value;
  return items
    .filter((i) => i.type === state.tab)
    .filter((i) => !cat || i.category === cat)
    .filter((i) => !st || i.status === st)
    .filter((i) => !q || [i.title, i.description, i.location, i.category].join(' ').toLowerCase().includes(q))
    .sort((a, b) => sort === 'old' ? a.date.localeCompare(b.date) || a.id - b.id : b.date.localeCompare(a.date) || b.id - a.id);
}

function badge(i) {
  if (i.type === 'lost') return '<span class="badge st-lost">Looking for</span>';
  return `<span class="badge st-${i.status}">${STATUS[i.status]}</span>`;
}

function render() {
  const list = visible();
  $('#grid').innerHTML = list.map((i) => `
    <button class="lf-card" data-id="${i.id}" aria-label="View ${esc(i.title)}">
      <div class="lf-img">${i.image ? `<img src="${esc(i.image)}" alt="">` : BOX_ICON}${badge(i)}</div>
      <div class="lf-body">
        <h4>${esc(i.title)}</h4>
        <span class="lf-meta">${PIN_ICON}${esc(i.location)}</span>
        <span class="lf-meta">${CAL_ICON}${i.type === 'found' ? 'Found' : 'Lost'} ${fmtDate(i.date)}</span>
        <span class="lf-cat">${esc(i.category)}</span>
      </div>
    </button>`).join('');
  $('#empty').hidden = list.length > 0;
  $('#count').textContent = list.length ? `${list.length} ${state.tab === 'found' ? 'found item' : 'lost report'}${list.length > 1 ? 's' : ''}` : '';

  const found = items.filter((i) => i.type === 'found');
  $('#sUnclaimed').textContent = found.filter((i) => i.status === 'unclaimed').length;
  $('#sPending').textContent = found.filter((i) => i.status === 'pending').length;
  $('#sReturned').textContent = found.filter((i) => i.status === 'returned').length;
  $('#sLost').textContent = items.filter((i) => i.type === 'lost' && i.status !== 'returned').length;
}

/* ---------- Filters / tabs ---------- */
['#q', '#fCat', '#fStatus', '#fSort'].forEach((s) => $(s).addEventListener('input', render));
document.querySelectorAll('.lf-tabs button').forEach((b) => b.addEventListener('click', () => {
  state.tab = b.dataset.tab;
  document.querySelectorAll('.lf-tabs button').forEach((x) => x.classList.toggle('on', x === b));
  // Lost reports only have Unclaimed / Returned ("found"), so hide the claim-pending filter option there
  render();
}));
$('#staffToggle').addEventListener('click', (e) => {
  state.staff = !state.staff;
  e.currentTarget.setAttribute('aria-pressed', state.staff);
  e.currentTarget.textContent = 'Staff view: ' + (state.staff ? 'On' : 'Off');
  toast(state.staff ? 'Staff view on – open an item to approve claims.' : 'Staff view off.');
});

/* ---------- Post / report form ---------- */
const formDlg = $('#formDlg'), form = $('#itemForm');
let formType = 'found', photoData = '';

function openForm(type) {
  formType = type; photoData = ''; form.reset(); $('#formErr').hidden = true;
  const found = type === 'found';
  $('#formTitle').textContent = found ? 'Post Found Item' : 'Report Lost Item';
  $('#formHint').textContent = found
    ? 'Thanks for helping! Hand the item to the office listed below, and don\'t post private details (ID numbers, card digits).'
    : 'Describe what you lost. If someone posts a matching item, you\'ll get a notification.';
  $('#dateLabel').textContent = found ? 'Date found *' : 'Date lost *';
  $('#locLabel').textContent = found ? 'Where was it found? *' : 'Where did you last see it? *';
  $('#keptWrap').hidden = !found;
  form.keptAt.required = found;
  form.date.max = dayStr(0); form.date.value = dayStr(0);
  formDlg.showModal();
}
document.querySelectorAll('[data-open]').forEach((b) => b.addEventListener('click', () => openForm(b.dataset.open)));

// Resize photos so localStorage doesn't fill up
form.photo.addEventListener('change', () => {
  const f = form.photo.files[0]; photoData = ''; if (!f) return;
  if (!f.type.startsWith('image/')) { form.photo.value = ''; return showErr('Please choose an image file.'); }
  const r = new FileReader();
  r.onload = () => {
    const img = new Image();
    img.onload = () => {
      const s = Math.min(1, 640 / Math.max(img.width, img.height));
      const c = document.createElement('canvas'); c.width = img.width * s; c.height = img.height * s;
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      photoData = c.toDataURL('image/jpeg', 0.7);
    };
    img.src = r.result;
  };
  r.readAsDataURL(f);
});

function showErr(msg) { const e = $('#formErr'); e.textContent = msg; e.hidden = false; }

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const fd = Object.fromEntries(new FormData(form));
  const need = ['title', 'category', 'date', 'location', 'description', 'contact'].concat(formType === 'found' ? ['keptAt'] : []);
  if (need.some((k) => !String(fd[k] || '').trim())) return showErr('Please fill in all required fields (*).');
  const item = {
    id: Date.now(), type: formType, title: fd.title.trim(), category: fd.category, location: fd.location, date: fd.date,
    description: fd.description.trim(), keptAt: (fd.keptAt || '').trim(), contact: fd.contact.trim(),
    image: photoData || '', status: 'unclaimed', claims: []
  };
  items.unshift(item); save();
  formDlg.close();
  state.tab = formType;
  document.querySelectorAll('.lf-tabs button').forEach((x) => x.classList.toggle('on', x.dataset.tab === state.tab));
  render();
  notify(formType === 'found' ? `Found item posted: ${item.title}` : `Lost report filed: ${item.title}`);
  // Simple auto-match: a found item vs. open lost reports of the same category
  if (formType === 'found') {
    const m = items.filter((i) => i.type === 'lost' && i.status === 'unclaimed' && i.category === item.category);
    if (m.length) notify(`A found item (${item.title}) may match ${m.length} lost report${m.length > 1 ? 's' : ''}.`);
  }
  toast(formType === 'found' ? 'Found item posted. Thank you!' : 'Lost report submitted.');
});

/* ---------- Detail + claim ---------- */
const detailDlg = $('#detailDlg');
let openId = null;

function openDetail(id) {
  const i = items.find((x) => x.id === id); if (!i) return;
  openId = id;
  const found = i.type === 'found';
  $('#dTitle').textContent = i.title;
  const claims = i.claims || [];
  $('#dBody').innerHTML = `
    <div class="d-img">${i.image ? `<img src="${esc(i.image)}" alt="${esc(i.title)}">` : BOX_ICON}</div>
    <div>${badge(i)}</div>
    <dl class="d-grid">
      <div><dt>Category</dt><dd>${esc(i.category)}</dd></div>
      <div><dt>${found ? 'Date found' : 'Date lost'}</dt><dd>${fmtDate(i.date)}</dd></div>
      <div><dt>${found ? 'Found at' : 'Last seen at'}</dt><dd>${esc(i.location)}</dd></div>
      ${found ? `<div><dt>Being kept at</dt><dd>${esc(i.keptAt)}</dd></div>` : `<div><dt>Contact</dt><dd>${esc(i.contact)}</dd></div>`}
    </dl>
    <div class="d-desc">${esc(i.description)}</div>
    ${found && i.status === 'unclaimed' ? claimFormHtml() : ''}
    ${state.staff && claims.length ? `<p class="claims-title">Claims (${claims.length})</p>` + claims.map((c) => `
      <div class="claim-row"><strong>${esc(c.name)} · ${esc(c.studentNo)}</strong><span>${esc(c.details)}</span><small>${esc(c.contact)} · ${fmtDate(c.date)}</small></div>`).join('') : ''}
    ${!state.staff && found && i.status === 'pending' ? '<p class="note">A claim is being reviewed by the office. Bring a valid ID when you pick the item up.</p>' : ''}
    ${found && i.status === 'returned' ? '<p class="note">This item was returned to its owner.</p>' : ''}`;

  let foot = '';
  if (state.staff) {
    if (found && i.status === 'pending') foot += '<button class="btn btn-ghost" data-act="reject">Reject claim</button><button class="btn btn-green" data-act="return">Approve &amp; mark Returned</button>';
    if (found && i.status === 'unclaimed') foot += '<button class="btn btn-green" data-act="return">Mark as Returned</button>';
    if (!found && i.status !== 'returned') foot += '<button class="btn btn-green" data-act="return">Mark as Found</button>';
    foot += '<button class="btn btn-ghost" data-act="delete">Delete</button>';
  }
  $('#dFoot').innerHTML = foot;
  detailDlg.showModal();
}

function claimFormHtml() {
  return `
    <form id="claimForm" novalidate>
      <p class="claims-title">Is this yours? Submit a claim</p>
      <p class="note">Describe something only the owner would know (marks, contents, serial number). Staff will verify it before returning the item.</p>
      <div class="two">
        <label class="lf-field"><span>Full name *</span><input name="name" value="${esc(ME.name)}" required maxlength="60"></label>
        <label class="lf-field"><span>Student no. *</span><input name="studentNo" required maxlength="20" placeholder="2025-00123"></label>
      </div>
      <label class="lf-field"><span>Proof / identifying details *</span><textarea name="details" rows="3" required maxlength="300"></textarea></label>
      <label class="lf-field"><span>Contact (email or phone) *</span><input name="contact" required maxlength="80"></label>
      <p class="err" id="claimErr" role="alert" hidden></p>
      <button type="submit" class="btn">Submit claim</button>
    </form>`;
}

$('#grid').addEventListener('click', (e) => { const c = e.target.closest('.lf-card'); if (c) openDetail(Number(c.dataset.id)); });

$('#dBody').addEventListener('submit', (e) => {
  if (e.target.id !== 'claimForm') return;
  e.preventDefault();
  const fd = Object.fromEntries(new FormData(e.target));
  if (['name', 'studentNo', 'details', 'contact'].some((k) => !String(fd[k] || '').trim())) {
    const er = $('#claimErr'); er.textContent = 'Please fill in all fields.'; er.hidden = false; return;
  }
  const i = items.find((x) => x.id === openId);
  i.claims.push({ name: fd.name.trim(), studentNo: fd.studentNo.trim(), details: fd.details.trim(), contact: fd.contact.trim(), date: dayStr(0) });
  i.status = 'pending'; save();
  notify(`Claim submitted for "${i.title}". Staff will review it.`);
  detailDlg.close(); render(); toast('Claim submitted. Staff will review it.');
});

$('#dFoot').addEventListener('click', (e) => {
  const act = e.target.closest('[data-act]')?.dataset.act; if (!act) return;
  const i = items.find((x) => x.id === openId); if (!i) return;
  if (act === 'return') { i.status = 'returned'; notify(`"${i.title}" has been marked as returned.`); toast('Marked as returned.'); }
  if (act === 'reject') { i.status = 'unclaimed'; i.claims = []; notify(`Claim for "${i.title}" was rejected.`); toast('Claim rejected. Item is unclaimed again.'); }
  if (act === 'delete') { if (!confirm('Delete this post?')) return; items = items.filter((x) => x.id !== i.id); toast('Post deleted.'); }
  save(); detailDlg.close(); render();
});

/* ---------- Dialog close + toast ---------- */
document.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => b.closest('dialog').close()));
document.querySelectorAll('dialog').forEach((d) => d.addEventListener('click', (e) => { if (e.target === d) d.close(); }));

let toastTimer;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 3200);
}

render(); updateBell();