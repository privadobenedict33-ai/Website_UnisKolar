// UnisKolar – Announcements
// Stored in localStorage under 'uniskolar_announcements' so the Dashboard can read the latest ones too.
// Replace load()/save() with fetch() calls if you add a real backend later.

const STORE_KEY = 'uniskolar_announcements';
const NOTIF_KEY = 'uniskolar_notifications';   // shared with Lost & Found and the Notifications page
const AUTHOR = 'Office of the University President';
const CATEGORIES = ['General', 'Academic', 'Events', 'Maintenance', 'Urgent'];
const ICONS = { General: 'i-megaphone', Academic: 'i-calendar', Events: 'i-users', Maintenance: 'i-wifi', Urgent: 'i-bolt' };
const NEW_DAYS = 3;

const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const dayStr = (offset = 0) => { const d = new Date(); d.setDate(d.getDate() - offset); return d.toISOString().slice(0, 10); };
const fmtDate = (s) => new Date(s + 'T00:00:00').toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
const ageDays = (s) => Math.floor((new Date(dayStr(0) + 'T00:00:00') - new Date(s + 'T00:00:00')) / 864e5);

/* ---------- Data ---------- */
function seed() {
  return [
    { id: 1, title: 'No Classes on November 21, 2026 (Saturday)', category: 'Events', pinned: true, date: dayStr(2), author: AUTHOR,
      body: 'Due to the upcoming university event, classes are suspended on Saturday, November 21, 2026.\nAll students are encouraged to join PLM Day 2026 at the PLM Quadrangle. Regular classes resume the following Monday.' },
    { id: 2, title: 'PLM Day 2026: Unity in Service', category: 'Events', pinned: false, date: dayStr(4), author: 'Office of Student Affairs',
      body: 'Join us this November 21 at the PLM Quadrangle for PLM Day 2026.\nThe program includes performances, org booths and a community service drive. Wear your school uniform or org shirt.' },
    { id: 3, title: 'Wi-Fi Maintenance Notice', category: 'Maintenance', pinned: false, date: dayStr(5), author: 'ICT Office',
      body: 'Campus Wi-Fi will be temporarily unavailable on November 12, 2026 from 8:00 PM to 11:00 PM for network upgrades.\nPlease save your work and plan around the downtime.' },
    { id: 4, title: 'Midterm Grade Submission Deadline', category: 'Academic', pinned: false, date: dayStr(8), author: 'Office of the Registrar',
      body: 'Faculty are reminded to submit midterm grades through the portal on or before the posted deadline.\nStudents may view released grades starting next week.' },
    { id: 5, title: 'Library Extended Hours During Exams', category: 'General', pinned: false, date: dayStr(12), author: 'University Library',
      body: 'The library will stay open until 8:00 PM on weekdays during the examination period.' }
  ];
}
function load() {
  try { const d = JSON.parse(localStorage.getItem(STORE_KEY)); if (Array.isArray(d)) return d; } catch (e) {}
  return seed();
}
function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(items)); } catch (e) { toast('Could not save – storage is full.'); } }
function notify(text) {
  let n = []; try { n = JSON.parse(localStorage.getItem(NOTIF_KEY)) || []; } catch (e) {}
  n.unshift({ id: Date.now(), source: 'Announcements', text, date: new Date().toISOString(), read: false });
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
let state = { cat: '', staff: false };
let openId = null, editId = null;

/* ---------- Render ---------- */
function renderChips() {
  $('#chips').innerHTML = ['All', ...CATEGORIES].map((c) =>
    `<button type="button" class="chip${(c === 'All' ? '' : c) === state.cat ? ' on' : ''}" data-cat="${c === 'All' ? '' : c}" aria-pressed="${(c === 'All' ? '' : c) === state.cat}">${c}</button>`).join('');
}

function visible() {
  const q = $('#q').value.trim().toLowerCase();
  return items
    .filter((i) => !state.cat || i.category === state.cat)
    .filter((i) => !q || (i.title + ' ' + i.body).toLowerCase().includes(q))
    .sort((a, b) => (b.pinned - a.pinned) || b.date.localeCompare(a.date) || b.id - a.id);
}

function render() {
  const list = visible();
  $('#list').innerHTML = list.map((i) => `
    <li tabindex="0" data-id="${i.id}" role="button" aria-label="Open ${esc(i.title)}">
      <div class="thumb c-${esc(i.category)}"><svg><use href="#${ICONS[i.category] || 'i-megaphone'}"/></svg></div>
      <div class="news-body">
        <div class="tags">
          ${i.pinned ? '<span class="tag tag-pin">Pinned</span>' : ''}
          ${ageDays(i.date) <= NEW_DAYS ? '<span class="tag tag-new">New</span>' : ''}
          <span class="tag tag-${esc(i.category)}">${esc(i.category)}</span>
        </div>
        <strong>${esc(i.title)}</strong>
        <p>${esc(i.body.replace(/\n/g, ' '))}</p>
      </div>
      <time>${fmtDate(i.date)}</time>
    </li>`).join('');
  $('#empty').hidden = list.length > 0;
  $('.an-list').hidden = list.length === 0;
  $('#count').textContent = list.length ? `${list.length} announcement${list.length > 1 ? 's' : ''}` : '';
}

$('#q').addEventListener('input', render);
$('#chips').addEventListener('click', (e) => {
  const b = e.target.closest('.chip'); if (!b) return;
  state.cat = b.dataset.cat; renderChips(); render();
});

/* ---------- Detail ---------- */
const detailDlg = $('#detailDlg');
function openDetail(id) {
  const i = items.find((x) => x.id === id); if (!i) return;
  openId = id;
  $('#dTitle').textContent = i.title;
  $('#dBody').innerHTML = `
    <div class="d-meta">
      <span class="tag tag-${esc(i.category)}">${esc(i.category)}</span>
      ${i.pinned ? '<span class="tag tag-pin">Pinned</span>' : ''}
      <span>${fmtDate(i.date)}</span><span>Posted by ${esc(i.author)}</span>
    </div>
    <div class="d-text">${i.body.split(/\n+/).map((p) => `<p>${esc(p)}</p>`).join('')}</div>`;
  $('#dFoot').innerHTML = state.staff
    ? `<button class="btn btn-ghost" data-act="pin">${i.pinned ? 'Unpin' : 'Pin'}</button>
       <button class="btn btn-ghost" data-act="edit">Edit</button>
       <button class="btn btn-red" data-act="delete">Delete</button>` : '';
  detailDlg.showModal();
}
$('#list').addEventListener('click', (e) => { const li = e.target.closest('li'); if (li) openDetail(Number(li.dataset.id)); });
$('#list').addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const li = e.target.closest('li'); if (li) { e.preventDefault(); openDetail(Number(li.dataset.id)); }
});

$('#dFoot').addEventListener('click', (e) => {
  const act = e.target.closest('[data-act]')?.dataset.act; if (!act) return;
  const i = items.find((x) => x.id === openId); if (!i) return;
  if (act === 'pin') { i.pinned = !i.pinned; save(); detailDlg.close(); render(); toast(i.pinned ? 'Pinned to top.' : 'Unpinned.'); }
  if (act === 'edit') { detailDlg.close(); openForm(i); }
  if (act === 'delete') {
    if (!confirm('Delete this announcement?')) return;
    items = items.filter((x) => x.id !== i.id); save(); detailDlg.close(); render(); toast('Announcement deleted.');
  }
});

/* ---------- Staff: post / edit ---------- */
const formDlg = $('#formDlg'), form = $('#annForm');
form.category.innerHTML = CATEGORIES.map((c) => `<option>${c}</option>`).join('');

function openForm(item) {
  editId = item ? item.id : null;
  form.reset(); $('#formErr').hidden = true;
  $('#formTitle').textContent = item ? 'Edit Announcement' : 'New Announcement';
  if (item) { form.title.value = item.title; form.category.value = item.category; form.body.value = item.body; form.pinned.checked = item.pinned; }
  formDlg.showModal();
}
$('#newBtn').addEventListener('click', () => openForm(null));

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const title = form.title.value.trim(), body = form.body.value.trim();
  if (!title || !body) { const er = $('#formErr'); er.textContent = 'Please add a title and a message.'; er.hidden = false; return; }
  const data = { title, body, category: form.category.value, pinned: form.pinned.checked };
  if (editId) {
    Object.assign(items.find((x) => x.id === editId), data);
    toast('Announcement updated.');
  } else {
    items.unshift({ id: Date.now(), date: dayStr(0), author: AUTHOR, ...data });
    notify(`${data.category === 'Urgent' ? 'Urgent: ' : 'New announcement: '}${title}`);
    toast('Announcement published.');
  }
  save(); formDlg.close(); render();
});

/* ---------- Staff toggle ---------- */
$('#staffToggle').addEventListener('click', (e) => {
  state.staff = !state.staff;
  e.currentTarget.setAttribute('aria-pressed', state.staff);
  e.currentTarget.textContent = 'Staff view: ' + (state.staff ? 'On' : 'Off');
  $('#newBtn').hidden = !state.staff;
  toast(state.staff ? 'Staff view on – you can post, edit and delete.' : 'Staff view off.');
});

/* ---------- Dialog close + toast ---------- */
document.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => b.closest('dialog').close()));
document.querySelectorAll('dialog').forEach((d) => d.addEventListener('click', (e) => { if (e.target === d) d.close(); }));
let toastTimer;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 3200);
}

renderChips(); render(); updateBell();