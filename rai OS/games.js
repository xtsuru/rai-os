/**
 * Rai OS - Games Logic & Engines (Standalone Version)
 */

// 1. Rai Games Hub (Game Store) logic
function renderGamesHub() {
    const container = document.getElementById('games-store-hub');
    if (!container) return;

    const games = Object.entries(appRegistry).filter(([_, app]) => app.isGame);
    
    container.innerHTML = `
        <div class="games-selection-screen">
            <div class="selection-header">
                <h2>Rai Game Store</h2>
                <p>좋아하는 게임을 다운로드하고 플레이하세요.</p>
            </div>
            <div class="games-grid">
                ${games.map(([key, app]) => renderGameStoreCard(key, app)).join('')}
            </div>
        </div>
    `;
}

function renderGameStoreCard(key, app) {
    const installedKey = `is${key.charAt(0).toUpperCase() + key.slice(1)}Installed`;
    const isInstalled = systemState[installedKey];
    
    return `
        <div class="game-card">
            <div class="game-card-icon ${app.logoClass}">${app.logoChar}</div>
            <div class="game-card-info">
                <h3>${app.name}</h3>
                <span>${app.type === 'paid' ? `가격: ${app.price} C` : '무료'}</span>
            </div>
            <div class="game-card-actions" id="game-btn-container-${key}">
                ${isInstalled 
                    ? `<button class="action-btn" onclick="openWindow('rai${key}')">플레이</button>`
                    : `<button id="download-${key}" class="action-btn primary" onclick="handleDownload('${key}')">${app.type === 'paid' ? '구매하기' : '다운로드'}</button>`
                }
            </div>
        </div>
    `;
}

// 2. Brick Breaker Standalone Engine
const bbState = {
    canvas: null, ctx: null, 
    ballX: 0, ballY: 0, dx: 4, dy: -4, radius: 8,
    paddleHeight: 12, paddleWidth: 80, paddleX: 0,
    brickRowCount: 5, brickColumnCount: 7, brickWidth: 70, brickHeight: 20, brickPadding: 10, brickOffsetTop: 40, brickOffsetLeft: 30,
    bricks: [], score: 0, isRunning: false, animationId: null
};

function initBrickBreaker() {
    const container = document.getElementById('bb-game-view');
    if (!container) return;

    container.innerHTML = `
        <div class="game-header">
            <span>Score: <b id="bb-score">0</b></span>
            <button class="action-btn" onclick="startBrickBreaker()">게임 시작</button>
        </div>
        <canvas id="bb-standalone-canvas" width="600" height="400"></canvas>
    `;

    bbState.canvas = document.getElementById('bb-standalone-canvas');
    if (!bbState.canvas) return;
    
    bbState.ctx = bbState.canvas.getContext('2d');
    bbState.paddleX = (bbState.canvas.width - bbState.paddleWidth) / 2;
    bbState.isRunning = false;
    bbState.score = 0;
    
    bbState.bricks = [];
    for (let c = 0; c < bbState.brickColumnCount; c++) {
        bbState.bricks[c] = [];
        for (let r = 0; r < bbState.brickRowCount; r++) {
            bbState.bricks[c][r] = { x: 0, y: 0, status: 1 };
        }
    }

    bbState.canvas.onmousemove = (e) => {
        const rect = bbState.canvas.getBoundingClientRect();
        const relativeX = e.clientX - rect.left;
        if (relativeX > 0 && relativeX < bbState.canvas.width) {
            bbState.paddleX = relativeX - bbState.paddleWidth / 2;
        }
    };

    drawBrickBreaker();
}

function startBrickBreaker() {
    if (bbState.isRunning) return;
    bbState.isRunning = true;
    bbState.ballX = bbState.canvas.width / 2;
    bbState.ballY = bbState.canvas.height - 30;
    bbState.dx = 4; bbState.dy = -4; bbState.score = 0;
    for (let c = 0; c < bbState.brickColumnCount; c++) {
        for (let r = 0; r < bbState.brickRowCount; r++) {
            bbState.bricks[c][r].status = 1;
        }
    }
    if (bbState.animationId) cancelAnimationFrame(bbState.animationId);
    runBrickBreaker();
}

function collisionDetection() {
    for (let c = 0; c < bbState.brickColumnCount; c++) {
        for (let r = 0; r < bbState.brickRowCount; r++) {
            let b = bbState.bricks[c][r];
            if (b.status === 1) {
                if (bbState.ballX > b.x && bbState.ballX < b.x + bbState.brickWidth && bbState.ballY > b.y && bbState.ballY < b.y + bbState.brickHeight) {
                    bbState.dy = -bbState.dy;
                    b.status = 0;
                    bbState.score++;
                    document.getElementById('bb-score').textContent = bbState.score;
                    if (bbState.score === bbState.brickRowCount * bbState.brickColumnCount) {
                        alert('축하합니다! 승리하셨습니다!');
                        bbState.isRunning = false;
                    }
                }
            }
        }
    }
}

function drawBall() {
    const ctx = bbState.ctx;
    ctx.beginPath();
    ctx.arc(bbState.ballX, bbState.ballY, bbState.radius, 0, Math.PI * 2);
    ctx.fillStyle = "#FFDD00"; ctx.fill(); ctx.closePath();
}

function drawPaddle() {
    const ctx = bbState.ctx;
    ctx.beginPath();
    ctx.rect(bbState.paddleX, bbState.canvas.height - bbState.paddleHeight, bbState.paddleWidth, bbState.paddleHeight);
    ctx.fillStyle = "#00c6ff"; ctx.fill(); ctx.closePath();
}

function drawBricks() {
    const ctx = bbState.ctx;
    const colors = ["#FF512F", "#DD2476", "#8E2DE2", "#4A00E0", "#00c6ff"];
    for (let c = 0; c < bbState.brickColumnCount; c++) {
        for (let r = 0; r < bbState.brickRowCount; r++) {
            if (bbState.bricks[c][r].status === 1) {
                let brickX = (c * (bbState.brickWidth + bbState.brickPadding)) + bbState.brickOffsetLeft;
                let brickY = (r * (bbState.brickHeight + bbState.brickPadding)) + bbState.brickOffsetTop;
                bbState.bricks[c][r].x = brickX; bbState.bricks[c][r].y = brickY;
                ctx.beginPath();
                ctx.rect(brickX, brickY, bbState.brickWidth, bbState.brickHeight);
                ctx.fillStyle = colors[r % colors.length]; ctx.fill(); ctx.closePath();
            }
        }
    }
}

function drawBrickBreaker() {
    const ctx = bbState.ctx;
    if (!ctx) return;
    ctx.clearRect(0, 0, bbState.canvas.width, bbState.canvas.height);
    drawBricks(); drawBall(); drawPaddle();
}

function runBrickBreaker() {
    if (!bbState.isRunning) return;
    drawBrickBreaker();
    collisionDetection();
    if (bbState.ballX + bbState.dx > bbState.canvas.width - bbState.radius || bbState.ballX + bbState.dx < bbState.radius) bbState.dx = -bbState.dx;
    if (bbState.ballY + bbState.dy < bbState.radius) {
        bbState.dy = -bbState.dy;
    } else if (bbState.ballY + bbState.dy > bbState.canvas.height - bbState.radius) {
        if (bbState.ballX > bbState.paddleX && bbState.ballX < bbState.paddleX + bbState.paddleWidth) {
            bbState.dy = -bbState.dy;
        } else {
            alert('GAME OVER');
            bbState.isRunning = false;
        }
    }
    bbState.ballX += bbState.dx; bbState.ballY += bbState.dy;
    bbState.animationId = requestAnimationFrame(runBrickBreaker);
}

// 3. Minesweeper Standalone Engine
const msState = {
    rows: 10, cols: 10, mines: 15,
    grid: [], gameOver: false, revealedCount: 0
};

function initMinesweeper() {
    const container = document.getElementById('ms-game-view');
    if (!container) return;

    container.innerHTML = `
        <div class="game-header">
            <div class="ms-stats"> 지뢰: 15 </div>
            <button class="action-btn" onclick="initMinesweeper()">재시작</button>
        </div>
        <div class="ms-board-wrapper">
            <div id="ms-standalone-board" class="ms-board"></div>
        </div>
    `;

    const board = document.getElementById('ms-standalone-board');
    msState.grid = []; msState.gameOver = false; msState.revealedCount = 0;
    board.innerHTML = '';
    board.style.gridTemplateColumns = `repeat(${msState.cols}, 1fr)`;

    for (let r = 0; r < msState.rows; r++) {
        msState.grid[r] = [];
        for (let c = 0; c < msState.cols; c++) {
            msState.grid[r][c] = { r, c, isMine: false, revealed: false, flagged: false, neighborMines: 0 };
        }
    }

    let minesPlaced = 0;
    while (minesPlaced < msState.mines) {
        let r = Math.floor(Math.random() * msState.rows);
        let c = Math.floor(Math.random() * msState.cols);
        if (!msState.grid[r][c].isMine) {
            msState.grid[r][c].isMine = true;
            minesPlaced++;
        }
    }

    for (let r = 0; r < msState.rows; r++) {
        for (let c = 0; c < msState.cols; c++) {
            if (!msState.grid[r][c].isMine) {
                let neighbors = 0;
                for (let i = -1; i <= 1; i++) {
                    for (let j = -1; j <= 1; j++) {
                        if (msState.grid[r+i] && msState.grid[r+i][c+j] && msState.grid[r+i][c+j].isMine) neighbors++;
                    }
                }
                msState.grid[r][c].neighborMines = neighbors;
            }
        }
    }

    for (let r = 0; r < msState.rows; r++) {
        for (let c = 0; c < msState.cols; c++) {
            const cell = document.createElement('div');
            cell.className = 'ms-cell';
            cell.onclick = () => revealCell(r, c);
            cell.oncontextmenu = (e) => { e.preventDefault(); toggleFlag(r, c); };
            cell.dataset.r = r; cell.dataset.c = c;
            board.appendChild(cell);
        }
    }
}

function revealCell(r, c) {
    if (msState.gameOver) return;
    const cellData = msState.grid[r][c];
    if (cellData.revealed || cellData.flagged) return;
    cellData.revealed = true;
    const cellEl = document.querySelector(`#ms-standalone-board .ms-cell[data-r="${r}"][data-c="${c}"]`);
    cellEl.classList.add('revealed');
    if (cellData.isMine) {
        msState.gameOver = true;
        cellEl.classList.add('mine'); cellEl.textContent = '💣';
        revealAllMines();
        alert('GAME OVER!'); return;
    }
    msState.revealedCount++;
    if (cellData.neighborMines > 0) {
        cellEl.textContent = cellData.neighborMines;
        cellEl.dataset.mines = cellData.neighborMines;
    } else {
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (msState.grid[r+i] && msState.grid[r+i][c+j]) revealCell(r+i, c+j);
            }
        }
    }
    if (msState.revealedCount === (msState.rows * msState.cols) - msState.mines) {
        msState.gameOver = true;
        alert('WIN!');
    }
}

function toggleFlag(r, c) {
    if (msState.gameOver) return;
    const cellData = msState.grid[r][c];
    if (cellData.revealed) return;
    cellData.flagged = !cellData.flagged;
    const cellEl = document.querySelector(`#ms-standalone-board .ms-cell[data-r="${r}"][data-c="${c}"]`);
    cellEl.textContent = cellData.flagged ? '🚩' : '';
    cellEl.classList.toggle('flagged', cellData.flagged);
}

function revealAllMines() {
    for (let r = 0; r < msState.rows; r++) {
        for (let c = 0; c < msState.cols; c++) {
            if (msState.grid[r][c].isMine) {
                const cellEl = document.querySelector(`#ms-standalone-board .ms-cell[data-r="${r}"][data-c="${c}"]`);
                cellEl.classList.add('revealed', 'mine'); cellEl.textContent = '💣';
            }
        }
    }
}
