/* ---------- Window & Taskbar Management ---------- */
let activeWindows = []; // holds ids like 'about','projects','resume'
let zIndex = 1000;

function openWindow(id) {
  const el = document.getElementById(id + 'Window');
  if (!el) return;
  // show
  el.style.display = 'block';
  el.style.zIndex = ++zIndex;
  el.classList.add('active');

  // add taskbar button if not present
  if (!activeWindows.includes(id)) {
    activeWindows.push(id);
    createTaskbarButton(id);
  }

  // bring to front & focus
  focusWindow(el);
  makeDraggable(el);
  setupWindowControls(el, id);
}

function closeWindow(id) {
  const el = document.getElementById(id + 'Window');
  if (!el) return;
  el.style.display = 'none';
  el.classList.remove('active');

  // remove from activeWindows and taskbar
  activeWindows = activeWindows.filter(x => x !== id);
  const btn = document.querySelector(`.taskbar-item[data-window="${id}"]`);
  if (btn) btn.remove();
}

function createTaskbarButton(id) {
  const map = { about: 'About', resume: 'Resume' };
  const taskItems = document.getElementById('taskItems');
  const btn = document.createElement('button');
  btn.className = 'taskbar-item';
  btn.setAttribute('data-window', id);
  btn.style.height = '22px';
  btn.style.minWidth = '100px';
  btn.style.display = 'flex';
  btn.style.alignItems = 'center';
  btn.style.gap = '6px';
  btn.style.padding = '0 8px';
  btn.style.cursor = 'pointer';
  btn.style.borderRadius = '3px';
  btn.style.background = 'linear-gradient(to bottom,#4B9FEA,#338CF2)';
  btn.style.color = '#fff';
  btn.textContent = map[id] || id;
  btn.onclick = () => {
    const w = document.getElementById(id + 'Window');
    if (!w) return;
    if (w.style.display === 'none') openWindow(id);
    else {
      // if visible, bring to front
      focusWindow(w);
      w.style.zIndex = ++zIndex;
    }
  };
  taskItems.appendChild(btn);
}

/* ---------- Draggable & Focus ---------- */
function makeDraggable(element) {
  if (!element) return;
  const header = element.querySelector('.window-header');
  if (!header) return;
  header.style.cursor = 'move';
  header.onmousedown = dragMouseDown;

  let pos1=0,pos2=0,pos3=0,pos4=0;

  function dragMouseDown(e){
    e = e || window.event;
    e.preventDefault();
    pos3 = e.clientX; pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
    element.style.zIndex = ++zIndex;
  }

  function elementDrag(e){
    e = e || window.event;
    e.preventDefault();
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX; pos4 = e.clientY;
    element.style.top = (element.offsetTop - pos2) + "px";
    element.style.left = (element.offsetLeft - pos1) + "px";
  }

  function closeDragElement(){
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

function focusWindow(el){
  document.querySelectorAll('.window').forEach(w=>w.classList.remove('active'));
  if (!el) return;
  el.classList.add('active');
  el.style.zIndex = ++zIndex;
}

/* ---------- Window controls (minimize/max/close) ---------- */
function setupWindowControls(el, id) {
  if (!el || el.dataset.setup === 'true') return;
  el.dataset.setup = 'true';

  el.addEventListener('mousedown', ()=> focusWindow(el));

  const btnMin = el.querySelector('.minimize');
  const btnMax = el.querySelector('.maximize');
  const btnClose = el.querySelector('.close');

  if (btnMin) btnMin.addEventListener('click', (e)=> {
    e.stopPropagation();
    el.style.display = 'none';
  });

  if (btnClose) btnClose.addEventListener('click', (e)=> {
    e.stopPropagation();
    if (id) closeWindow(id);
    else el.remove();
  });

  if (btnMax) btnMax.addEventListener('click', (e)=> {
    e.stopPropagation();
    if (el.classList.contains('maximized')) {
      el.classList.remove('maximized');
      // restore from css not tracked positions (could be improved)
      el.style.width = el.dataset.prevWidth || '';
      el.style.height = el.dataset.prevHeight || '';
      el.style.left = el.dataset.prevLeft || '';
      el.style.top = el.dataset.prevTop || '';
    } else {
      // save previous inline
      el.dataset.prevWidth = el.style.width || el.offsetWidth + 'px';
      el.dataset.prevHeight = el.style.height || el.offsetHeight + 'px';
      el.dataset.prevLeft = el.style.left || el.offsetLeft + 'px';
      el.dataset.prevTop = el.style.top || el.offsetTop + 'px';
      el.classList.add('maximized');
      el.style.left='0'; el.style.top='0'; el.style.width='100%'; el.style.height='calc(100% - 30px)';
    }
  });
}

/* ---------- Start Menu toggle & interactions ---------- */
const startButton = document.getElementById('startButton');
const startMenu = document.getElementById('startMenu');
let startOpen = false;

startButton.addEventListener('click', (e)=> {
  e.stopPropagation();
  toggleStart();
});

function toggleStart(){
  startOpen = !startOpen;
  if (startOpen) {
    startMenu.classList.add('open');
    startMenu.setAttribute('aria-hidden','false');
    startButton.setAttribute('aria-expanded','true');
  } else {
    startMenu.classList.remove('open');
    startMenu.setAttribute('aria-hidden','true');
    startButton.setAttribute('aria-expanded','false');
  }
}

// close start menu clicking outside
document.addEventListener('click', (e)=> {
  if (!startMenu.contains(e.target) && !startButton.contains(e.target) && startOpen) {
    toggleStart();
  }
});

// keyboard Esc closes start
document.addEventListener('keydown', (e)=> {
  if (e.key === 'Escape' && startOpen) toggleStart();
});

/* ---------- Start menu button actions (open new tabs or windows) ---------- */
document.addEventListener('click', (e)=>{
  const btn = e.target.closest('.start-item');
  if (!btn) return;
  const action = btn.dataset.action;
  if (!action) return;
  e.preventDefault();

  // program links open in new tab
  if (action === 'clubpenguin') window.open('https://play.hashir.tech','_blank');
  else if (action === 'worldcars') window.open('https://hashir.tech/beta/','_blank');
  else if (action === 'jellyfin') window.open('https://jellyfin.hashir.tech/','_blank');
    else if (action === 'youtube') window.open('https://www.youtube.com/@hashirs','_blank');

  // system actions map to local windows
  else if (action === 'mycomputer') openWindow('about');
  else if (action === 'myresume') openWindow('resume');

  // All Programs: just close menu for now
  else if (action === 'allprograms') { /* keep placeholder */ }

  // close start after clicking an item
  if (startOpen) toggleStart();
});

/* Desktop icons use inline onclick attributes in the markup now; no duplicate JS listeners. */

/* ---------- Taskbar: dynamic update handled by createTaskbarButton ---------- */

/* ---------- Clock ---------- */
function updateClock(){
  const c = document.getElementById('clock');
  const now = new Date();
  const str = now.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
  c.textContent = str;
}
updateClock();
setInterval(updateClock, 60000);


/* ---------- Accessibility: allow Enter key to trigger focused start menu item ---------- */
startMenu.addEventListener('keydown', (e) => {
  if ((e.key === 'Enter' || e.key === ' ') && document.activeElement.classList.contains('start-item')) {
    document.activeElement.click();
  }
});

window.addEventListener('DOMContentLoaded', () => {
    const win = document.getElementById('aboutWindow');
    openWindow('about');
    win.style.left = '20%';
    win.style.top = '30%';
});

