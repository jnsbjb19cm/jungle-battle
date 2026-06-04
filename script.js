// 丛林保卫战 - 单人对战核心 v0.2
// 修复了HP显示、占用判定、UI细节 + 实现攻击、移动、敌人AI波次、伤害、死亡、胜负判定

let sunlight = 5;
let food = 5;
let playerBaseHP = 1000;
let enemyBaseHP = 1000;
let currentLevel = 1;
let gameRunning = true;

let selectedCard = null;
let grid = [];        // 5 x 12
let units = [];       // 所有活动单位
let lastSpawnTime = 0;

// 卡牌数据库
const cardDatabase = {
    'flower-shooter': { id: 'flower-shooter', name: '花生射手', type: 'plant', cost: { sunlight: 6, food: 0 }, attack: 5, hp: 50, canMove: false, cooldown: 2000, color: '#4ade80', range: 3 },
    'walnut-guard':   { id: 'walnut-guard',   name: '核桃卫兵', type: 'plant', cost: { sunlight: 6, food: 0 }, attack: 0, hp: 200, canMove: false, cooldown: 5000, color: '#854d0e', range: 0 },
    'giant-monster':  { id: 'giant-monster',  name: '巨头怪', type: 'monster', cost: { sunlight: 0, food: 6 }, attack: 40, hp: 400, canMove: true, cooldown: 10000, color: '#f87171', range: 1 }
};

let cardCooldowns = {};

function initHand() {
    const handContainer = document.getElementById('hand-cards');
    handContainer.innerHTML = '';

    const initialCards = ['flower-shooter', 'walnut-guard', 'giant-monster'];
    initialCards.forEach(cardId => {
        const cardData = cardDatabase[cardId];
        const cardEl = document.createElement('div');
        cardEl.className = 'card';
        cardEl.dataset.cardId = cardId;
        cardEl.innerHTML = `
            <div style="font-weight:bold; margin-bottom:4px;">${cardData.name}</div>
            <div style="font-size:12px; color:#94a3b8;">
                ${cardData.type === 'plant' ? '阳光' : '食物'}: ${cardData.cost.sunlight || cardData.cost.food}<br>
                攻击: ${cardData.attack} | 血量: ${cardData.hp}
            </div>
        `;
        cardEl.onclick = () => selectCard(cardId, cardEl);
        handContainer.appendChild(cardEl);
    });
}

function selectCard(cardId, cardElement) {
    if (cardCooldowns[cardId] && Date.now() < cardCooldowns[cardId]) {
        addLog(`${cardDatabase[cardId].name} 还在冷却中`);
        return;
    }
    document.querySelectorAll('.card').forEach(el => el.classList.remove('selected'));
    cardElement.classList.add('selected');
    selectedCard = cardId;
}

function isCellOccupied(row, col) {
    return grid[row] && grid[row][col] !== null;
}

function updateUnitDisplay(unit) {
    const cell = document.querySelector(`.cell[data-row="${unit.row}"][data-col="${unit.col}"]`);
    if (!cell) return;

    let unitEl = cell.querySelector('.unit');
    if (!unitEl) {
        unitEl = document.createElement('div');
        unitEl.className = `unit ${unit.type}`;
        cell.appendChild(unitEl);
    }

    unitEl.innerHTML = `
        ${unit.name}<br>
        <small>HP: ${Math.max(0, Math.floor(unit.currentHP))}</small>
        <div class="hp-bar" style="width: ${Math.max(0, (unit.currentHP / unit.hp) * 100)}%; background: ${unit.type === 'plant' ? '#4ade80' : '#f87171'};"></div>
    `;
    unitEl.style.background = unit.color;
}

function placeCard(row, col, cellElement) {
    if (!selectedCard || !gameRunning) return;

    const cardData = cardDatabase[selectedCard];

    // 只能在左半场放置植物
    if (col >= 6 && cardData.type === 'plant') {
        addLog('植物只能放在左半场');
        return;
    }

    if (isCellOccupied(row, col)) {
        addLog('该格子已有单位');
        return;
    }

    if ((cardData.cost.sunlight || 0) > sunlight || (cardData.cost.food || 0) > food) {
        addLog('资源不足');
        return;
    }

    const unit = {
        id: Date.now() + Math.random(),
        cardId: selectedCard,
        ...cardData,
        row: row,
        col: col,
        currentHP: cardData.hp,
        lastActionTime: Date.now()
    };

    sunlight -= cardData.cost.sunlight || 0;
    food -= cardData.cost.food || 0;
    updateResources();

    grid[row][col] = unit;
    units.push(unit);

    updateUnitDisplay(unit);

    // 设置冷却
    cardCooldowns[selectedCard] = Date.now() + (cardData.cooldown || 3000);

    addLog(`放置了 ${cardData.name}`);

    document.querySelectorAll('.card').forEach(el => el.classList.remove('selected'));
    selectedCard = null;
}

function updateResources() {
    document.getElementById('sunlight').textContent = sunlight;
    document.getElementById('food').textContent = food;
    document.getElementById('player-base-hp').textContent = Math.max(0, Math.floor(playerBaseHP));
    document.getElementById('enemy-base-hp').textContent = Math.max(0, Math.floor(enemyBaseHP));
}

function addLog(msg) {
    const logContent = document.getElementById('log-content');
    const p = document.createElement('p');
    p.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    logContent.appendChild(p);
    if (logContent.children.length > 12) logContent.removeChild(logContent.children[0]);
    logContent.scrollTop = logContent.scrollHeight;
}

// 找到目标（简化版：前方相邻或范围内）
function findTarget(unit) {
    const direction = unit.type === 'plant' ? 1 : -1;
    const maxRange = unit.range || 1;

    for (let r = -1; r <= 1; r++) {
        const checkRow = unit.row + r;
        if (checkRow < 0 || checkRow >= 5) continue;

        for (let dist = 1; dist <= maxRange; dist++) {
            const checkCol = unit.col + (direction * dist);
            if (checkCol < 0 || checkCol >= 12) continue;

            const target = grid[checkRow] && grid[checkRow][checkCol];
            if (target && target.type !== unit.type) {
                return target;
            }
        }
    }
    return null;
}

function performAttack(attacker, target) {
    if (!attacker || !target || attacker.currentHP <= 0 || target.currentHP <= 0) return;

    const damage = attacker.attack;
    target.currentHP -= damage;

    addLog(`${attacker.name} 攻击了 ${target.name} (伤害${damage})`);

    updateUnitDisplay(target);

    if (target.currentHP <= 0) {
        removeUnit(target);
        addLog(`${target.name} 死亡了`);
    }
}

function removeUnit(unit) {
    const cell = document.querySelector(`.cell[data-row="${unit.row}"][data-col="${unit.col}"]`);
    if (cell) cell.innerHTML = '';

    grid[unit.row][unit.col] = null;
    units = units.filter(u => u.id !== unit.id);
}

// 移动逻辑
function tryMove(unit) {
    if (!unit.canMove || unit.currentHP <= 0) return;

    const direction = unit.type === 'plant' ? 1 : -1;
    const nextCol = unit.col + direction;

    if (nextCol < 0 || nextCol >= 12) {
        // 到达对方基地
        if (unit.type === 'plant') {
            enemyBaseHP -= Math.max(10, unit.attack);
        } else {
            playerBaseHP -= Math.max(10, unit.attack);
        }
        updateResources();
        removeUnit(unit);
        addLog(`${unit.name} 攻击了基地`);
        checkWinCondition();
        return;
    }

    if (!isCellOccupied(unit.row, nextCol)) {
        // 移动
        const oldCell = document.querySelector(`.cell[data-row="${unit.row}"][data-col="${unit.col}"]`);
        if (oldCell) oldCell.innerHTML = '';

        grid[unit.row][unit.col] = null;
        unit.col = nextCol;
        grid[unit.row][nextCol] = unit;

        updateUnitDisplay(unit);
    }
}

// 敌人AI波次生成
function spawnEnemyWave() {
    if (!gameRunning) return;

    const now = Date.now();
    if (now - lastSpawnTime < 4500) return; // 每4.5秒尝试生成一波

    let spawned = 0;
    for (let row = 0; row < 5; row++) {
        if (spawned >= 2) break; // 每波最多2个

        // 在右边区域找空位
        for (let col = 8; col < 11; col++) {
            if (!isCellOccupied(row, col)) {
                const monster = {
                    id: Date.now() + Math.random(),
                    cardId: 'giant-monster',
                    ...cardDatabase['giant-monster'],
                    row: row,
                    col: col,
                    currentHP: cardDatabase['giant-monster'].hp,
                    lastActionTime: now
                };
                grid[row][col] = monster;
                units.push(monster);
                updateUnitDisplay(monster);
                spawned++;
                addLog('敌人生成了 巨头怪');
                break;
            }
        }
    }
    lastSpawnTime = now;
}

function checkWinCondition() {
    if (playerBaseHP <= 0) {
        gameRunning = false;
        addLog('=== 你输了！基地被破坏 ===');
        alert('游戏结束 - 你输了');
    }
    if (enemyBaseHP <= 0) {
        gameRunning = false;
        addLog('=== 你赢了！敌人基地被破坏 ===');
        alert('游戏结束 - 你赢了！');
    }
}

// 核心游戏循环
function gameLoop() {
    if (!gameRunning) return;

    const now = Date.now();

    // 1. 敌人波次
    spawnEnemyWave();

    // 2. 处理所有单位
    for (let i = units.length - 1; i >= 0; i--) {
        const unit = units[i];
        if (!unit || unit.currentHP <= 0) continue;

        // 尝试攻击
        const target = findTarget(unit);
        if (target) {
            performAttack(unit, target);
        } else if (unit.canMove) {
            tryMove(unit);
        }
    }

    updateResources();
    checkWinCondition();
}

// 初始化格子
function initGrid() {
    const battlefield = document.getElementById('battlefield');
    battlefield.innerHTML = '';
    grid = [];

    for (let row = 0; row < 5; row++) {
        grid[row] = [];
        for (let col = 0; col < 12; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = row;
            cell.dataset.col = col;

            if (col < 6) cell.classList.add('player-side');
            else cell.classList.add('enemy-side');

            cell.onclick = () => placeCard(row, col, cell);
            battlefield.appendChild(cell);
            grid[row][col] = null;
        }
    }
}

function initGame() {
    initGrid();
    initHand();
    updateResources();

    // 资源自动增长
    setInterval(() => {
        if (!gameRunning) return;
        if (sunlight < 20) sunlight++;
        if (food < 20) food++;
        updateResources();
    }, 2000);

    // 核心游戏循环 (800ms 一次)
    setInterval(gameLoop, 800);

    addLog('游戏已加载 v0.2 - 请在左半场放置卡牌');
    addLog('敌人会自动生成怪物，尝试破坏你的基地！');
}

document.getElementById('reset-btn').onclick = () => location.reload();
document.getElementById('start-wave-btn').onclick = () => {
    addLog('手动触发波次（已自动生成中）');
};

window.onload = initGame;