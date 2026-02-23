// Define the tree connections: child -> parent(s)
const connections = {
  kickflip:      ['ollie'],
  heelflip:      ['ollie'],
  popshuvit:     ['ollie'],
  fs180:         ['ollie'],
  bs180:         ['ollie'],

  hardflip:      ['kickflip'],
  kickflipbv:    ['kickflip'],
  doublekickflip:['kickflip'],

  inwardheel:    ['heelflip'],
  doubleheelflip:['heelflip'],
  heelflipbv:    ['heelflip'],

  '360shuvit':   ['popshuvit'],
  varialkickflip:['popshuvit'],
  varialheelflip:['popshuvit'],

  fs180kickflip: ['fs180'],
  fsbigspin:     ['fs180'],

  bs180kickflip: ['bs180'],
  bsbigspin:     ['bs180'],

  treflip:       ['varialkickflip'],
  laserflip:     ['varialkickflip'],

  hardfliplbs:   ['hardflip'],
  hardflipbv:    ['hardflip'],

  lateinwardheel:['inwardheel'],
  inwardheelbv:  ['inwardheel'],

  '360hardflip': ['fsbigspin'],
  '360inwardheel':['bsbigspin'],

  treflipbv:     ['treflip'],
  double360flip: ['treflip'],
  quadkickflip:  ['doublekickflip'],
};

// Track completed tricks
const completed = new Set();

// Current node open in popup
let currentNode = null;

function getCenter(el) {
  const wrapper = document.querySelector('.tree-wrapper');
  const wrapperRect = wrapper.getBoundingClientRect();
  const rect = el.getBoundingClientRect();
  return {
    x: rect.left - wrapperRect.left + rect.width / 2,
    y: rect.top - wrapperRect.top + rect.height / 2,
  };
}

function drawLines() {
  const canvas = document.getElementById('lineCanvas');
  const wrapper = document.querySelector('.tree-wrapper');
  canvas.width = wrapper.scrollWidth;
  canvas.height = wrapper.scrollHeight;

  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const [childId, parents] of Object.entries(connections)) {
    const childEl = document.getElementById(childId);
    if (!childEl) continue;

    for (const parentId of parents) {
      const parentEl = document.getElementById(parentId);
      if (!parentEl) continue;

      const from = getCenter(parentEl);
      const to = getCenter(childEl);

      const isCompleted = completed.has(parentId);

      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.strokeStyle = isCompleted ? '#00cc55' : 'rgba(255,255,255,0.35)';
      ctx.lineWidth = isCompleted ? 3 : 2;
      ctx.setLineDash(isCompleted ? [] : [6, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
}

function updateUnlocks() {
  const allNodes = document.querySelectorAll('.node');
  allNodes.forEach(node => {
    const id = node.id;
    if (id === 'ollie') return;

    const parents = connections[id] || [];
    const allParentsDone = parents.every(p => completed.has(p));

    if (allParentsDone) {
      node.classList.remove('locked');
      node.classList.add('unlocked');
    } else {
      node.classList.add('locked');
      node.classList.remove('unlocked');
      node.classList.remove('completed');
    }

    if (completed.has(id)) {
      node.classList.add('completed');
      node.classList.remove('locked');
    }
  });

  drawLines();
}

function openPopup(node) {
  if (node.classList.contains('locked')) return;

  currentNode = node;
  const title = node.dataset.title;
  const desc = node.dataset.desc;
  const imgSrc = node.querySelector('img').src;

  document.getElementById('popupTitle').textContent = title;
  document.getElementById('popupDesc').textContent = desc;
  document.getElementById('popupImg').src = imgSrc;

  const completeBtn = document.getElementById('popupComplete');
  if (completed.has(node.id)) {
    completeBtn.textContent = '✓ Completed!';
    completeBtn.classList.add('done');
  } else {
    completeBtn.textContent = 'Mark as Complete ✓';
    completeBtn.classList.remove('done');
  }

  document.getElementById('popupOverlay').classList.add('active');
}

function closePopup() {
  document.getElementById('popupOverlay').classList.remove('active');
  currentNode = null;
}

// Event listeners
document.querySelectorAll('.node').forEach(node => {
  node.addEventListener('click', () => openPopup(node));
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

  const completeBtn = document.getElementById('popupComplete');
  if (completed.has(id)) {
    completeBtn.textContent = '✓ Completed!';
    completeBtn.classList.add('done');
  } else {
    completeBtn.textContent = 'Mark as Complete ✓';
    completeBtn.classList.remove('done');
  }
});

// Initial draw
window.addEventListener('load', () => {
  updateUnlocks();
  drawLines();
});

window.addEventListener('resize', drawLines);
