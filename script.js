// ─── Tree connections ────────────────────────────────────────────────
// Left side expands leftward from center, right side expands rightward
const connections = {
  // Center col → Left col1
  kickflip:       ['ollie'],
  heelflip:       ['ollie'],
  popshuvit:      ['ollie'],

  // Center col → Right col1
  fs180:          ['ollie'],
  bs180:          ['ollie'],

  // Left col1 → Left col2
  hardflip:       ['kickflip'],
  kickflipbv:     ['kickflip'],
  doublekickflip: ['kickflip'],
  inwardheel:     ['heelflip'],
  doubleheelflip: ['heelflip'],
  heelflipbv:     ['heelflip'],
  '360shuvit':    ['popshuvit'],
  varialkickflip: ['popshuvit'],
  varialheelflip: ['popshuvit'],

  // Left col2 → Left col3
  hardfliplbs:    ['hardflip'],
  hardflipbv:     ['hardflip'],
  lateinwardheel: ['inwardheel'],
  inwardheelbv:   ['inwardheel'],
  treflip:        ['varialkickflip'],
  laserflip:      ['varialkickflip'],

  // Left col3 → Left col4
  treflipbv:      ['treflip'],
  double360flip:  ['treflip'],
  quadkickflip:   ['doublekickflip'],

  // Right col1 → Right col2
  fs180kickflip:  ['fs180'],
  fsbigspin:      ['fs180'],
  bs180kickflip:  ['bs180'],
  bsbigspin:      ['bs180'],

  // Right col2 → Right col3
  '360hardflip':  ['fsbigspin'],
  '360inwardheel':['bsbigspin'],
};

const completed = new Set();
let currentNode = null;

// ─── Pan & Zoom ──────────────────────────────────────────────────────
const viewport = document.getElementById('viewport');
const canvasWrap = document.getElementById('canvasWrap');

let panX = 40, panY = 40;
let scale = 0.7;
let isDragging = false;
let dragStartX, dragStartY, panStartX, panStartY;
let didDrag = false;

function applyTransform() {
  canvasWrap.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
  drawLines();
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
  if (Math.abs(dx) > 3 || Math.abs(dy) > 3) didDrag = true;
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
  const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
  const rect = viewport.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  panX = mouseX - (mouseX - panX) * zoomFactor;
  panY = mouseY - (mouseY - panY) * zoomFactor;
  scale *= zoomFactor;
  scale = Math.min(Math.max(scale, 0.15), 3);
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
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  for (const [childId, parents] of Object.entries(connections)) {
    const childEl = document.getElementById(childId);
    if (!childEl) continue;

    for (const parentId of parents) {
      const parentEl = document.getElementById(parentId);
      if (!parentEl) continue;

      const from = getCenter(parentEl);
      const to = getCenter(childEl);
      const isGreen = completed.has(parentId) && completed.has(childId);

      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.strokeStyle = isGreen ? '#00cc55' : 'rgba(255,255,255,0.85)';
      ctx.lineWidth = isGreen ? 5 : 4.5;
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
  node.addEventListener('click', () => {
    if (!didDrag) openPopup(node);
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
  // Center the tree on load
  const vw = viewport.clientWidth;
  const vh = viewport.clientHeight;
  const tree = document.getElementById('tree');
  panX = (vw - tree.scrollWidth * scale) / 2;
  panY = (vh - tree.scrollHeight * scale) / 2;
  applyTransform();
  updateUnlocks();
});

window.addEventListener('resize', drawLines);
