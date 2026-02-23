const connections = {
  heelflip:       ['ollie'],
  kickflip:       ['ollie'],
  popshuvit:      ['ollie'],
  fs180:          ['ollie'],
  bs180:          ['ollie'],

  varialheelflip: ['heelflip'],
  varialkickflip: ['kickflip'],
  '360shuvit':    ['popshuvit'],
  fs360:          ['fs180'],
  bs360:          ['bs180'],

  inwardheel:     ['varialheelflip'],
  treflip:        ['varialkickflip'],
  fsflip:         ['fs360'],
  bsheelflip:     ['bs360'],

  hardflip:       ['treflip'],
  fsheelflip:     ['fsflip'],
  bsflip:         ['bsheelflip'],
};

const completed = new Set();
let currentNode = null;

// ─── Pan & Zoom ──────────────────────────────────────────────────────
const viewport = document.getElementById('viewport');
const tree = document.getElementById('tree');

let panX = 0, panY = 0, scale = 1;
let isDragging = false, didDrag = false;
let dragStartX, dragStartY, panStartX, panStartY;

function applyTransform() {
  tree.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
  requestAnimationFrame(drawLines);
}

viewport.addEventListener('mousedown', (e) => {
  if (e.button !== 0) return;
  isDragging = true;
  didDrag = false;
  dragStartX = e.clientX;
  dragStartY = e.clientY;
  panStartX = panX;
  panStartY = panY;
  viewport.classList.add('dragging');
});

window.addEventListener('mousemove', (e) => {
  if (!isDragging) return;
  const dx = e.clientX - dragStartX;
  const dy = e.clientY - dragStartY;
  if (Math.abs(dx) > 4 || Math.abs(dy) > 4) didDrag = true;
  panX = panStartX + dx;
  panY = panStartY + dy;
  applyTransform();
});

window.addEventListener('mouseup', () => {
  isDragging = false;
  viewport.classList.remove('dragging');
});

viewport.addEventListener('wheel', (e) => {
  e.preventDefault();
  const factor = e.deltaY < 0 ? 1.1 : 0.9;
  const rect = viewport.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  panX = mx - (mx - panX) * factor;
  panY = my - (my - panY) * factor;
  scale = Math.min(Math.max(scale * factor, 0.15), 3);
  applyTransform();
}, { passive: false });

// ─── Lines ───────────────────────────────────────────────────────────
function drawLines() {
  const canvas = document.getElementById('lineCanvas');
  const vw = viewport.clientWidth;
  const vh = viewport.clientHeight;
  canvas.width = vw;
  canvas.height = vh;

  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, vw, vh);
  ctx.lineCap = 'round';

  const vRect = viewport.getBoundingClientRect();

  for (const [childId, parents] of Object.entries(connections)) {
    const childEl = document.getElementById(childId);
    if (!childEl) continue;
    for (const parentId of parents) {
      const parentEl = document.getElementById(parentId);
      if (!parentEl) continue;

      const cRect = childEl.getBoundingClientRect();
      const pRect = parentEl.getBoundingClientRect();

      const fx = pRect.left + pRect.width / 2 - vRect.left;
      const fy = pRect.top + pRect.height / 2 - vRect.top;
      const tx = cRect.left + cRect.width / 2 - vRect.left;
      const ty = cRect.top + cRect.height / 2 - vRect.top;

      const isGreen = completed.has(parentId) && completed.has(childId);

      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(tx, ty);
      ctx.strokeStyle = isGreen ? '#00cc55' : 'rgba(255,255,255,0.85)';
      ctx.lineWidth = isGreen ? 5 : 4.5;
      ctx.stroke();
    }
  }
}

// ─── Unlocks ─────────────────────────────────────────────────────────
function updateUnlocks() {
  document.querySelectorAll('.node').forEach(node => {
    const id = node.id;
    node.classList.remove('locked');
    if (completed.has(id)) {
      node.classList.add('completed');
    } else {
      node.classList.remove('completed');
    }
  });
  drawLines();
}

// ─── Popup ───────────────────────────────────────────────────────────
function openPopup(node) {
  if (node.classList.contains('locked')) return;
  currentNode = node;
  document.getElementById('popupTitle').textContent = node.dataset.title;
  document.getElementById('popupDesc').textContent = node.dataset.desc;

  const btn = document.getElementById('popupComplete');
  if (completed.has(node.id)) {
    btn.textContent = '✓ Completed!';
    btn.classList.add('done');
  } else {
    btn.textContent = 'Mark as Complete ✓';
    btn.classList.remove('done');
  }
  document.getElementById('popupOverlay').classList.add('active');
}

function closePopup() {
  document.getElementById('popupOverlay').classList.remove('active');
  currentNode = null;
}

document.querySelectorAll('.node').forEach(node => {
  node.addEventListener('click', () => { if (!didDrag) openPopup(node); });
});

document.getElementById('popupClose').addEventListener('click', closePopup);
document.getElementById('popupOverlay').addEventListener('click', (e) => {
  if (e.target === document.getElementById('popupOverlay')) closePopup();
});

document.getElementById('popupComplete').addEventListener('click', () => {
  if (!currentNode) return;
  const id = currentNode.id;
  completed.has(id) ? completed.delete(id) : completed.add(id);
  updateUnlocks();
  const btn = document.getElementById('popupComplete');
  btn.textContent = completed.has(id) ? '✓ Completed!' : 'Mark as Complete ✓';
  completed.has(id) ? btn.classList.add('done') : btn.classList.remove('done');
});

// ─── Init ─────────────────────────────────────────────────────────────
window.addEventListener('load', () => {
  const vw = viewport.clientWidth;
  const vh = viewport.clientHeight;
  panX = (vw - 1350) / 2;
  panY = (vh - 1010) / 2;
  applyTransform();
  updateUnlocks();
});

window.addEventListener('resize', drawLines);
