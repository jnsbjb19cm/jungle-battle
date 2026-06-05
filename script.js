// v0.29 - Playable version with working battlefield and selection

// === 选卡逻辑 (from v0.28) ===
let selectedCards = [];
const MAX_CARDS = 6;
let currentFilter = 'all';

// ... (keep the robust selection functions from v0.28) ...

// === 战斗逻辑 ===
let sunlight = 5;
let food = 5;
let playerBaseHP = 1000;
let enemyBaseHP = 1000;
let gameRunning = true;
let grid = [];
let units = [];
let cardCooldowns = {};

// 初始化格子
function initGrid() {
    const battlefield = document.getElementById('battlefield');
    if (!battlefield) return;
    battlefield.innerHTML = '';
    grid = [];

    for (let r = 0; r < 5; r++) {
        grid[r] = [];
        for (let c = 0; c < 12; c++) {
            grid[r][c] = null;

            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = r;
            cell.dataset.col = c;
            cell.onclick = () => placeCard(r, c, cell);

            battlefield.appendChild(cell);
        }
    }
}

// 放置卡牌 (v0.19 规则)
function placeCard(row, col, cellElement) {
    if (!selectedCard || !gameRunning) return;
    const cardData = cardDatabase[selectedCard];

    if (col >= 6) { addLog('只能在我方区域放置'); return; }
    if (cardData.canMove && col < 3) { addLog('可移动单位只能放在后三列'); return; }
    if (!cardData.canMove && isCellOccupiedByPlayer(row, col)) { addLog('该格子已有我方单位'); return; }

    if ((cardData.cost.sunlight||0) > sunlight || (cardData.cost.food||0) > food) {
        addLog('资源不足'); return;
    }

    const unit = {
        id: Date.now() + Math.random(),
        cardId: selectedCard,
        owner: 'player',
        ...cardData,
        row, col,
        currentHP: cardData.hp,
        lastActionTime: Date.now()
    };

    sunlight -= cardData.cost.sunlight || 0;
    food -= cardData.cost.food || 0;
    updateResources();

    grid[row][col] = unit;
    units.push(unit);
    updateUnitDisplay(unit);

    cardCooldowns[selectedCard] = Date.now() + (cardData.cooldown || 3000);
    addLog(`放置了 ${cardData.name}`);

    document.querySelectorAll('.card').forEach(el => el.classList.remove('selected'));
    selectedCard = null;
}

function isCellOccupiedByPlayer(row, col) {
    const u = grid[row] && grid[row][col];
    return u && u.owner === 'player';
}

function updateUnitDisplay(unit) {
    // 简化版本，后续可以完善
    console.log('Unit placed:', unit.name);
}

function updateResources() {
    const sunEl = document.getElementById('sunlight');
    const foodEl = document.getElementById('food');
    if (sunEl) sunEl.textContent = sunlight;
    if (foodEl) foodEl.textContent = food;
}

function addLog(msg) {
    const logContent = document.getElementById('log-content');
    if (logContent) {
        logContent.innerHTML += `<div>${msg}</div>`;
        logContent.scrollTop = logContent.scrollHeight;
    }
}

// 简化版本的 gameLoop
let lastTime = Date.now();
function gameLoop() {
    // 后续可以添加移动、攻击、敌人AI等
}

// 其他函数省略...