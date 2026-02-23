// ─── Tree connections ───────────────────────────────────────────────
const connections = {
  kickflip:       ['ollie'],
  heelflip:       ['ollie'],
  popshuvit:      ['ollie'],
  fs180:          ['ollie'],
  bs180:          ['ollie'],

  hardflip:       ['kickflip'],
  kickflipbv:     ['kickflip'],
  doublekickflip: ['kickflip'],

  inwardheel:     ['heelflip'],
  doubleheelflip: ['heelflip'],
  heelflipbv:     ['heelflip'],

  '360shuvit':    ['popshuvit'],
  varialkickflip: ['popshuvit'],
  varialheelflip: ['popshuvit'],

  fs180kickflip:  ['fs180'],
  fsbigspin:      ['fs180'],

  bs180kickflip:  ['bs180'],
  bsbigspin:      ['bs180'],

  hardfliplbs:    ['hardflip'],
  hardflipbv:     ['hardflip'],

  lateinwardheel: ['inwardheel'],
  inwardheelbv:   ['inwardheel'],

  treflip:        ['varialkickflip'],
  laserflip:      ['varialkickflip'],

  '360hardflip':  ['fsbigspin'],
  '360inwardheel':['bsbigspin'],

  treflipbv:      ['treflip'],
  double360flip:  ['treflip'],
  quadkickflip:   ['doublekickflip'],
};

const completed = new Set();
let currentNode = null;

// ─── Pan & Zoom ──────────────────────────────────────────────────────
const viewport = document.getElementById('viewport');
const canvasWrap = document.getElementById('canvasWrap');

let panX = 40, panY = 40;
let scale = 1;
let isDragging = false;
let dragStartX, dragStartY, panStartX, panStartY;

function applyTransform() {
  canvasWrap.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
  drawLines();
}

viewport.addEventListener('mousedown', (e) => {
  if (e.button !== 0) return;
  isDragging = true;
  dragStartX = e.clientX;
  dragStartY = e.clientY;
  panStartX = panX;
  panStartY = panY;
  viewport.classList.add('dragging');
});

window.addEventListener('mousemove', (e) => {
  if (!isDragging) return;
  panX = panStartX + (e.clientX - dragStartX);
  panY = panStartY + (e.clientY - dragStartY);
  applyTransform();
});

window.addEventListener('mouseup', () => {
  isDragging = false;
  viewport.classList.remove('dragging');
});

viewport.addEventListener('wheel', (e) => {
  e.preventDefault();
  const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
  const rect = viewport.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  // Zoom toward mouse position
  panX = mouseX - (mouseX - panX) * zoomFactor;
  panY = mouseY - (mouseY - panY) * zoomFactor;
  scale *= zoomFactor;
  scale = Math.min(Math.max(scale, 0.2), 3);
  applyTransform();
}, { passive: false });

// ─── Canvas lines ────────────────────────────────────────────────────
function getCenter(el) {
  const tree = document.getElementById('tree');
  const treeRect = tree.getBoundingClientRect();
  const rect = el.getBoundingClientRect();
  return {
    x: (rect.left - treeRect.left + rect.width / 2) / scale,
    y: (rect.top - treeRect.top + rect.height / 2) / scale,
  };
}

function drawLines() {
  const canvas = document.getElementById('lineCanvas');
  const tree = document.getElementById('tree');
  const w = tree.scrollWidth;
  const h = tree.scrollHeight;
  canvas.width = w;
  canvas.height = h;
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';

  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, w, h);

  for (const [childId, parents] of Object.entries(connections)) {
    const childEl = document.getElementById(childId);
    if (!childEl) continue;

    for (const parentId of parents) {
      const parentEl = document.getElementById(parentId);
      if (!parentEl) continue;

      const from = getCenter(parentEl);
      const to = getCenter(childEl);
      // Line is green only when both parent AND child are completed
      const isGreen = completed.has(parentId) && completed.has(childId);

      // L-shaped: right from parent to midpoint X, then vertical, then right to child
      const midX = from.x + (to.x - from.x) / 2;

      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(midX, from.y);
      ctx.lineTo(midX, to.y);
      ctx.lineTo(to.x, to.y);

      ctx.strokeStyle = isGreen ? '#00cc55' : 'rgba(255,255,255,0.85)';
      ctx.lineWidth = isGreen ? 5 : 4.5;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.setLineDash([]);
      ctx.stroke();
    }
  }
}

// ─── Unlock logic ────────────────────────────────────────────────────
function updateUnlocks() {
  document.querySelectorAll('.node').forEach(node => {
    const id = node.id;
    if (id === 'ollie') return;

    const parents = connections[id] || [];
    const allDone = parents.every(p => completed.has(p));

    if (completed.has(id)) {
      node.classList.remove('locked');
      node.classList.add('unlocked', 'completed');
    } else if (allDone) {
      node.classList.remove('locked', 'completed');
      node.classList.add('unlocked');
    } else {
      node.classList.add('locked');
      node.classList.remove('unlocked', 'completed');
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
  document.getElementById('popupImg').src = node.querySelector('img').src;

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

// ─── Event listeners ─────────────────────────────────────────────────
document.querySelectorAll('.node').forEach(node => {
  node.addEventListener('click', (e) => {
    // Only open popup if we didn't just drag
    if (!isDragging) openPopup(node);
  });
});

document.getElementById('popupClose').addEventListener('click', closePopup);

document.getElementById('popupOverlay').addEventListener('click', (e) => {
  if (e.target === document.getElementById('popupOverlay')) closePopup();
});

document.getElementById('popupComplete').addEventListener('click', () => {
  if (!currentNode) return;
  const id = currentNode.id;
  if (completed.has(id)) {
    completed.delete(id);
  } else {
    completed.add(id);
  }
  updateUnlocks();

  const btn = document.getElementById('popupComplete');
  if (completed.has(id)) {
    btn.textContent = '✓ Completed!';
    btn.classList.add('done');
  } else {
    btn.textContent = 'Mark as Complete ✓';
    btn.classList.remove('done');
  }
});

// ─── Init ─────────────────────────────────────────────────────────────
window.addEventListener('load', () => {
  applyTransform();
  updateUnlocks();
});

window.addEventListener('resize', drawLines);
