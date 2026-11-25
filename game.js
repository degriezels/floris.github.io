const canvas = document.querySelector('#game-board');
const ctx = canvas.getContext('2d');
const scoreElement = document.querySelector('#score');
const bestElement = document.querySelector('#best-score');
const statusText = document.querySelector('#status-text');
const statusPill = document.querySelector('#game-status');
const overlay = document.querySelector('#board-overlay');
const overlayTitle = document.querySelector('#overlay-title');
const overlayCopy = document.querySelector('#overlay-copy');
const startButton = document.querySelector('#start-button');
const pauseButton = document.querySelector('#pause-button');
const restartButton = document.querySelector('#restart-button');

const gridSize = 20;
const cellSize = canvas.width / gridSize;
const directions = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};
const keyDirections = {
  ArrowUp: 'up', w: 'up', W: 'up',
  ArrowDown: 'down', s: 'down', S: 'down',
  ArrowLeft: 'left', a: 'left', A: 'left',
  ArrowRight: 'right', d: 'right', D: 'right',
};

let snake;
let food;
let direction;
let nextDirection;
let score;
let bestScore = readBestScore();
let gameState = 'ready';
let timer = null;

function readBestScore() {
  try {
    const saved = Number(window.localStorage.getItem('mini-arcade-snake-best'));
    return Number.isFinite(saved) && saved > 0 ? saved : 0;
  } catch {
    return 0;
  }
}

function saveBestScore() {
  try {
    window.localStorage.setItem('mini-arcade-snake-best', String(bestScore));
  } catch {
    // The game remains playable when browser storage is unavailable.
  }
}

function resetGame() {
  snake = [{ x: 9, y: 10 }, { x: 8, y: 10 }, { x: 7, y: 10 }];
  direction = directions.right;
  nextDirection = direction;
  score = 0;
  food = placeFood();
  updateScore();
  draw();
}

function placeFood() {
  const emptyCells = [];
  for (let y = 0; y < gridSize; y += 1) {
    for (let x = 0; x < gridSize; x += 1) {
      if (!snake.some((segment) => segment.x === x && segment.y === y)) {
        emptyCells.push({ x, y });
      }
    }
  }
  if (emptyCells.length === 0) return null;
  return emptyCells[Math.floor(Math.random() * emptyCells.length)];
}

function updateScore() {
  scoreElement.textContent = String(score).padStart(2, '0');
  bestElement.textContent = String(bestScore).padStart(2, '0');
}

function setState(state, title, copy, status) {
  gameState = state;
  statusText.textContent = status;
  statusPill.classList.toggle('is-playing', state === 'running');
  statusPill.classList.toggle('is-paused', state === 'paused');
  overlay.classList.toggle('is-hidden', state === 'running');
  overlayTitle.textContent = title;
  overlayCopy.textContent = copy;
  pauseButton.disabled = state !== 'running' && state !== 'paused';
  pauseButton.innerHTML = state === 'paused'
    ? '<span aria-hidden="true">▶</span> Verder spelen'
    : '<span aria-hidden="true">Ⅱ</span> Pauze';
}

function startGame() {
  if (gameState === 'running') return;
  if (gameState === 'paused') {
    resumeGame();
    return;
  }
  clearInterval(timer);
  resetGame();
  setState('running', '', '', 'Aan het spelen');
  timer = window.setInterval(tick, 125);
}

function resumeGame() {
  if (gameState !== 'paused') return;
  setState('running', '', '', 'Aan het spelen');
  timer = window.setInterval(tick, 125);
}

function pauseGame() {
  if (gameState === 'running') {
    clearInterval(timer);
    setState('paused', 'Even pauze', 'Druk op verder spelen als je klaar bent.', 'Gepauzeerd');
  } else if (gameState === 'paused') {
    resumeGame();
  }
}

function finishGame(won = false) {
  clearInterval(timer);
  setState('over', won ? 'Helemaal vol!' : 'Game over', won ? 'Je hebt het hele speelveld gevuld!' : 'Goed geprobeerd! Speel nog een rondje.', won ? 'Gewonnen' : 'Spel afgelopen');
}

function changeDirection(name) {
  if (!directions[name]) return;
  const candidate = directions[name];
  if (candidate.x === -direction.x && candidate.y === -direction.y) return;
  nextDirection = candidate;
  if (gameState === 'ready') startGame();
}

function tick() {
  direction = nextDirection;
  const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
  const ateFood = food && head.x === food.x && head.y === food.y;
  const bodyToCheck = ateFood ? snake : snake.slice(0, -1);
  const hitsWall = head.x < 0 || head.x >= gridSize || head.y < 0 || head.y >= gridSize;
  const hitsSelf = bodyToCheck.some((segment) => segment.x === head.x && segment.y === head.y);

  if (hitsWall || hitsSelf) {
    finishGame();
    return;
  }

  snake.unshift(head);
  if (ateFood) {
    score += 1;
    if (score > bestScore) {
      bestScore = score;
      saveBestScore();
    }
    food = placeFood();
    updateScore();
    if (!food) {
      draw();
      finishGame(true);
      return;
    }
  } else {
    snake.pop();
  }
  draw();
}

function roundedRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.fill();
}

function draw() {
  ctx.fillStyle = '#111912';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = 'rgba(177, 205, 166, 0.055)';
  ctx.lineWidth = 1;
  for (let i = 1; i < gridSize; i += 1) {
    const point = i * cellSize;
    ctx.beginPath();
    ctx.moveTo(point, 0);
    ctx.lineTo(point, canvas.height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, point);
    ctx.lineTo(canvas.width, point);
    ctx.stroke();
  }

  if (food) {
    const centerX = food.x * cellSize + cellSize / 2;
    const centerY = food.y * cellSize + cellSize / 2;
    ctx.shadowColor = '#f2a76e';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#f2a76e';
    ctx.beginPath();
    ctx.arc(centerX, centerY, cellSize * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffe0bd';
    ctx.beginPath();
    ctx.arc(centerX - 2, centerY - 2, cellSize * 0.09, 0, Math.PI * 2);
    ctx.fill();
  }

  snake.forEach((segment, index) => {
    const inset = index === 0 ? 2 : 3;
    const x = segment.x * cellSize + inset;
    const y = segment.y * cellSize + inset;
    const size = cellSize - inset * 2;
    ctx.shadowColor = index === 0 ? 'rgba(172, 226, 130, .38)' : 'transparent';
    ctx.shadowBlur = index === 0 ? 16 : 0;
    ctx.fillStyle = index === 0 ? '#c1ed8f' : `rgba(157, 211, 116, ${Math.max(0.55, 0.92 - index * 0.012)})`;
    roundedRect(x, y, size, size, index === 0 ? 8 : 6);
  });
  ctx.shadowBlur = 0;

  const head = snake[0];
  const eyeOffset = cellSize * 0.22;
  const eyeRadius = cellSize * 0.045;
  const eyePositions = direction.x === 1
    ? [[0.69, 0.31], [0.69, 0.69]]
    : direction.x === -1
      ? [[0.31, 0.31], [0.31, 0.69]]
      : direction.y === -1
        ? [[0.31, 0.31], [0.69, 0.31]]
        : [[0.31, 0.69], [0.69, 0.69]];
  ctx.fillStyle = '#26321f';
  eyePositions.forEach(([x, y]) => {
    ctx.beginPath();
    ctx.arc(head.x * cellSize + cellSize * x, head.y * cellSize + cellSize * y, eyeRadius, 0, Math.PI * 2);
    ctx.fill();
  });
}

startButton.addEventListener('click', startGame);
pauseButton.addEventListener('click', pauseGame);
restartButton.addEventListener('click', startGame);
document.querySelectorAll('[data-direction]').forEach((button) => {
  button.addEventListener('click', () => changeDirection(button.dataset.direction));
});

document.addEventListener('keydown', (event) => {
  const name = keyDirections[event.key];
  if (name) {
    event.preventDefault();
    changeDirection(name);
  } else if (event.code === 'Space' && gameState !== 'over') {
    event.preventDefault();
    if (gameState === 'running' || gameState === 'paused') pauseGame();
    else startGame();
  }
});

let touchStart = null;
canvas.addEventListener('touchstart', (event) => {
  const touch = event.changedTouches[0];
  touchStart = { x: touch.clientX, y: touch.clientY };
}, { passive: true });
canvas.addEventListener('touchend', (event) => {
  if (!touchStart) return;
  const touch = event.changedTouches[0];
  const dx = touch.clientX - touchStart.x;
  const dy = touch.clientY - touchStart.y;
  touchStart = null;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
  changeDirection(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
}, { passive: true });

bestElement.textContent = String(bestScore).padStart(2, '0');
document.querySelector('#footer-year').textContent = new Date().getFullYear();
resetGame();
