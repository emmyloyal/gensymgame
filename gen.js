/* ==================== GLOBAL VARIABLES ==================== */
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const GAME = {
    width: canvas.width,
    height: canvas.height,
    groundY: canvas.height - 40,
    speed: 3,
    score: 0,
    playerName: ''
};

/* Player (Bee) – SMOOTH & CUTE */
const player = {
    x: 120,
    y: GAME.groundY - 34,
    w: 34,
    h: 34,
    vy: 0,
    gravity: 0.55,
    jumpPower: -13,
    jumping: false
};

/* Obstacles */
let obstacles = [];

/* DOM elements */
const loginScreen   = document.getElementById('loginScreen');
const gameScreen    = document.getElementById('gameScreen');
const usernameInput = document.getElementById('usernameInput');
const loginBtn      = document.getElementById('loginBtn');
const playerNameEl  = document.getElementById('playerName');
const scoreEl       = document.getElementById('scoreDisplay');

/* Game state */
let gameRunning = false;
let gameOver = false;

/* Obstacle spacing */
const MIN_GAP = 320;
const MAX_GAP = 520;
let lastObstacleX = 0;

/* ==================== LOGIN LOGIC ==================== */
function startGameWithName(name) {
    if (!name.trim()) name = 'SwarmBee';
    GAME.playerName = name;
    playerNameEl.textContent = `Bee: ${name}`;
    loginScreen.classList.remove('active');
    gameScreen.classList.add('active');
    resetGame();
    gameRunning = true;
    requestAnimationFrame(gameLoop);
}

loginBtn.addEventListener('click', () => startGameWithName(usernameInput.value));
usernameInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') startGameWithName(usernameInput.value);
});

/* ==================== GAME HELPERS ==================== */
function resetGame() {
    player.y = GAME.groundY - player.h;
    player.vy = 0;
    player.jumping = false;
    obstacles = [];
    lastObstacleX = 0;
    GAME.speed = 3;
    GAME.score = 0;
    scoreEl.textContent = 'Score: 0';
    gameOver = false;
    document.getElementById('gameOverOverlay')?.remove();
}

/* Draw functions */
function drawBee() {
    // Body
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(player.x + player.w/2, player.y + player.h/2, player.w/2, 0, Math.PI*2);
    ctx.fill();

    // Animated wings
    const wingOffset = Math.sin(Date.now() * 0.01) * 3;
    ctx.fillStyle = '#FFF';
    ctx.fillRect(player.x - 10, player.y + 12 + wingOffset, 14, 10);
    ctx.fillRect(player.x + player.w - 4, player.y + 12 - wingOffset, 14, 10);
}

function drawObstacle(obs) {
    ctx.fillStyle = '#666';
    ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
    ctx.fillStyle = '#FFF';
    ctx.font = '12px Arial';
    ctx.fillText('Cloud', obs.x + 4, obs.y + 20);
}

function drawGround() {
    ctx.fillStyle = '#228B22';
    ctx.fillRect(0, GAME.groundY, GAME.width, GAME.height - GAME.groundY);
}

/* ==================== OBSTACLE SPAWNING (SHORTER HEIGHT) ==================== */
function spawnObstacle() {
    const height = 30 + Math.random() * 35;   // 30–65px tall
    const gap = MIN_GAP + Math.random() * (MAX_GAP - MIN_GAP);
    const x = lastObstacleX + gap;

    obstacles.push({
        x: x,
        y: GAME.groundY - height,
        w: 50,
        h: height
    });

    lastObstacleX = x;
}

/* Update obstacles */
function updateObstacles() {
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const o = obstacles[i];
        o.x -= GAME.speed;
        if (o.x + o.w < 0) {
            obstacles.splice(i, 1);
            GAME.score += 20;
            scoreEl.textContent = `Score: ${GAME.score}`;
        }
    }
}

/* FORGIVING COLLISION */
function checkCollisions() {
    for (const o of obstacles) {
        const obsHitbox = {
            x: o.x + 5,
            y: o.y + 8,
            w: o.w - 10,
            h: o.h - 15   // Ignore bottom 15px
        };

        if (player.x + 5 < obsHitbox.x + obsHitbox.w &&
            player.x + player.w - 5 > obsHitbox.x &&
            player.y + 8 < obsHitbox.y + obsHitbox.h &&
            player.y + player.h - 8 > obsHitbox.y) {
            endGame();
        }
    }
}

/* Game over */
function endGame() {
    gameRunning = false;
    gameOver = true;

    const overlay = document.createElement('div');
    overlay.id = 'gameOverOverlay';
    overlay.innerHTML = `
        <div style="font-size:2.5rem; margin-bottom:0.5rem;">Game Over!</div>
        <div style="font-size:1.3rem; margin:1rem 0;">${GAME.playerName} – Score: ${GAME.score}</div>
        <button id="restartBtn" style="margin-top:1rem; padding:0.8rem 2rem; font-size:1.1rem;">Play Again</button>
    `;
    gameScreen.appendChild(overlay);
    overlay.style.display = 'flex';

    document.getElementById('restartBtn').addEventListener('click', () => {
        overlay.remove();
        resetGame();
        gameRunning = true;
        requestAnimationFrame(gameLoop);
    });
}

/* ==================== INPUT ==================== */
let lastJumpTime = 0;
const JUMP_COOLDOWN = 150;

document.addEventListener('keydown', e => {
    if (!gameRunning || gameOver) return;
    if (e.code === 'Space') {
        const now = Date.now();
        if (now - lastJumpTime > JUMP_COOLDOWN && !player.jumping) {
            player.vy = player.jumpPower;
            player.jumping = true;
            lastJumpTime = now;
        }
    }
});

canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    if (!gameRunning || gameOver) return;
    const now = Date.now();
    if (now - lastJumpTime > JUMP_COOLDOWN && !player.jumping) {
        player.vy = player.jumpPower;
        player.jumping = true;
        lastJumpTime = now;
    }
});

/* ==================== MAIN LOOP ==================== */
function gameLoop() {
    if (!gameRunning) return;

    ctx.clearRect(0, 0, GAME.width, GAME.height);

    // Player physics
    player.vy += player.gravity;
    player.y += player.vy;
    if (player.y + player.h >= GAME.groundY) {
        player.y = GAME.groundY - player.h;
        player.vy = 0;
        player.jumping = false;
    }

    // Update & spawn
    updateObstacles();
    checkCollisions();

    if (obstacles.length === 0 || obstacles[obstacles.length - 1].x < GAME.width - MIN_GAP) {
        spawnObstacle();
    }

    // Slow speed increase (every ~25 seconds)
    if (GAME.score > 0 && GAME.score % 1250 === 0) {
        GAME.speed = Math.min(GAME.speed + 0.25, 7.5);
    }

    // Draw
    drawGround();
    drawBee();
    obstacles.forEach(drawObstacle);

    requestAnimationFrame(gameLoop);
}

/* ==================== INITIAL STATE ==================== */
loginScreen.classList.add('active');