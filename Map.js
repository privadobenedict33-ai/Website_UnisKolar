// Side-panel content. Edit these lists to match your campus.
// Each place: [name, type, description]
const PLACES = [
  ['Gusaling Lacson', 'Academic building', 'Classrooms and faculty offices.'],
  ['Gusaling Bagatsing', 'Academic building', 'Classrooms and department offices.'],
  ['Gusaling Katipunan', 'Academic building', 'Classrooms and department offices.'],
  ['Gusaling Villegas', 'Academic building', 'Classrooms along the south side of the campus.'],
  ['Gusaling Corazon Aquino', 'Academic building', 'Classrooms and the library.'],
  ['Executive Bldg', 'Office', 'Offices of the university president and executives.'],
  ['Entrep Bldg', 'Office', 'Entrepreneurship offices and classrooms.'],
  ['Raja Sulayman Gym', 'Facility', 'Gymnasium for PE classes, games and events.'],
  ['University Activity Center', 'Facility', 'Venue for student activities and programs.'],
  ['Canteen', 'Facility', 'Food stalls and student lounge.']
];
const GATES = [
  ['Sta. Lucia Gate', 'Gate', 'Entrance on the north side.'],
  ['Muralla Gate', 'Gate', 'Entrance on the west side.']
];
const TOURS = [
  ['First-Year Walk', 'Tour', 'Gates, offices and your classrooms.'],
  ['Campus Heritage', 'Tour', 'Monuments and the university facade.'],
  ['Student Life', 'Tour', 'Where events and activities happen.']
];
const DATA = { locations: PLACES, tours: TOURS, gates: GATES };

const $ = (s) => document.querySelector(s);
const list = $('#locList'), info = $('#info');
const chev = '<svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.500" stroke-linecap="round"/></svg>';

function renderList(tab) {
  list.innerHTML = DATA[tab].map((p, i) =>
    `<li data-i="${i}"><span class="dot" style="color:#5240d6"></span><span class="nm">${p[0]}<small>${p[1]}</small></span>${chev}</li>`).join('');
  list._tab = tab;
}

list.addEventListener('click', (e) => {
  const li = e.target.closest('li'); if (!li) return;
  list.querySelectorAll('.sel').forEach((x) => x.classList.remove('sel'));
  li.classList.add('sel');
  const p = DATA[list._tab][li.dataset.i];
  $('#infoTitle').textContent = p[0]; $('#infoType').textContent = p[1]; $('#infoText').textContent = p[2];
  info.hidden = false;
});
$('#infoX').addEventListener('click', () => { info.hidden = true; list.querySelectorAll('.sel').forEach((x) => x.classList.remove('sel')); });

document.querySelector('.tabs').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  document.querySelectorAll('.tabs button').forEach((x) => x.classList.toggle('on', x === b));
  info.hidden = true; renderList(b.dataset.tab);
});

// Zoom the map image
let z = 1;
function zoom(d) { z = Math.min(2.5, Math.max(1, z + d)); $('#stage').style.width = $('#stage').style.height = z * 100 + '%'; }
$('#zin').addEventListener('click', () => zoom(0.5));
$('#zout').addEventListener('click', () => zoom(-0.5));

renderList('locations');