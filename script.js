// 丛林保卫战 - 单人对战核心 v0.4
// 添加更多卡牌（仙人棕、菠萝骑士、蒲公英医生、冰块冷莹机） + 基础特殊能力支持

let sunlight = 5;
let food = 5;
let playerBaseHP = 1000;
let enemyBaseHP = 1000;
let currentLevel = 1;
let gameRunning = true;

let selectedCard = null;
let grid = [];
let units = [];
let lastSpawnTime = 0;
let healTick = 0; // 用于蒲公英医生治疗计时

const cardDatabase = {
    // 白色
    'flower-shooter': {
        id: 'flower-shooter', name: '花生射手', type: 'plant',
        cost: { sunlight: 6, food: 0 }, attack: 5, hp: 50, canMove: false, cooldown: 2200,
        color: '#4ade80', range: 3, special: null
    },
    'walnut-guard': {
        id: 'walnut-guard', name: '核桃卫兵', type: 'plant',
        cost: { sunlight: 6, food: 0 }, attack: 0, hp: 200, canMove: false, cooldown: 5000,
        color: '#854d0e', range: 0, special: null
    },
    'giant-monster': {
        id: 'giant-monster', name: '巨头怪', type: 'monster',
        cost: { sunlight: 0, food: 6 }, attack: 40, hp: 400, canMove: true, cooldown: 10000,
        color: '#f87171', range: 1, special: null
    },

    // 绿色
    'xianrenzhang': {
        id: 'xianrenzhang', name: '仙人棕', type: 'plant',
        cost: { sunlight: 7, food: 0 }, attack: 10, hp: 50, canMove: false, cooldown: 2800,
        color: '#22c55e', range: 2, special: null
    },
    'boluo-qishi': {
        id: 'boluo-qishi', name: '菠萝骑士', type: 'plant',
        cost: { sunlight: 6, food: 0 }, attack: 30, hp: 400, canMove: true, cooldown: 8500,
        color: '#eab308', range: 1, special: null
    },

    // 蓝色 - 治疗
    'pugongying-yisheng': {
        id: 'pugongying-yisheng', name: '蒲公英医生', type: 'plant',
        cost: { sunlight: 10, food: 0 }, attack: 8, hp: 100, canMove: false, cooldown: 6000,
        color: '#3b82f6', range: 0, special: 'heal'
    },

    // 红色 - 控制
    'bingkuai-lengcui': {
        id: 'bingkuai-lengcui', name: '冰块冷莹机', type: 'monster',
        cost: { sunlight: 0, food: 5 }, attack: 12, hp: 60, canMove: false, cooldown: 3200,
        color: '#67e8f9', range: 8, special: 'ice'
    }
};

let cardCooldowns = {};

function initHand() {
    const handContainer = document.getElementById('hand-cards');
    handContainer.innerHTML = '';

    // 更多卡牌供测试
    const initialCards = [
        'flower-shooter', 'walnut-guard', 'giant-monster',
        'xianrenzhang', 'boluo-qishi', 'pugongying-yisheng', 'bingkuai-lengcui'
    ];
    
    initialCards.forEach(cardId => {
        const cardData = cardDatabase[cardId];
        const cardEl = document.createElement('div');
        cardEl.className = 'card';
        cardEl.dataset.cardId = cardId;
        cardEl.innerHTML = `
            <div style="font-weight:bold; margin-bottom:4px; font-size:13px;">${cardData.name}</div>
            <div style="font-size:11px; color:#cbd5e1; line-height:1.3;">
                ${cardData.type === 'plant' ? '阳光' : '食物'}: ${cardData.cost.sunlight || cardData.cost.food}<br>
                攻击: ${cardData.attack} | 血量: ${cardData.hp}<br>
                ${cardData.special ? '<span style="color:#67e8f9">[特殊]</span>' : ''}
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

    const hpPercent = Math.max(0, Math.min(100, (unit.currentHP / unit.hp) * 100));
    let extra = '';
    if (unit.special === 'heal') extra = '<br><small style="color:#67e8f9">治疗</small>';
    if (unit.special === 'ice') extra = '<br><small style="color:#67e8f9">冰冻</small>';

    unitEl.innerHTML = `
        ${unit.name}<br>
        <small>HP: ${Math.max(0, Math.floor(unit.currentHP))}</small>
        ${extra}
        <div class="hp-bar" style="width: ${hpPercent}%; background: ${unit.owner === 'player' ? '#4ade80' : '#f87171'};"></div>
    `;
    unitEl.style.background = unit.color;
}

function placeCard(row, col, cellElement) {
    if (!selectedCard || !gameRunning) return;

    const cardData = cardDatabase[selectedCard];

    if (col >= 6) {
        addLog('只能在左半场放置卡牌');
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
        owner: 'player',
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
    if (logContent.children.length > 14) logContent.removeChild(logContent.children[0]);
    logContent.scrollTop = logContent.scrollHeight;
}

// 找目标
function findTarget(unit) {
    const direction = unit.owner === 'player' ? 1 : -1;
    const maxRange = unit.range || 1;

    for (let r = -1; r <= 1; r++) {
        const checkRow = unit.row + r;
        if (checkRow < 0 || checkRow >= 5) continue;

        for (let dist = 1; dist <= maxRange; dist++) {
            const checkCol = unit.col + (direction * dist);
            if (checkCol < 0 || checkCol >= 12) continue;

            const target = grid[checkRow] && grid[checkRow][checkCol];
            if (target && target.owner !== unit.owner) {
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

// 移动
function tryMove(unit) {
    if (!unit.canMove || unit.currentHP <= 0) return;

    const direction = unit.owner === 'player' ? 1 : -1;
    const nextCol = unit.col + direction;

    if (nextCol < 0 || nextCol >= 12) {
        if (unit.owner === 'player') enemyBaseHP -= Math.max(8, unit.attack);
        else playerBaseHP -= Math.max(8, unit.attack);

        updateResources();
        removeUnit(unit);
        addLog(`${unit.name} 攻击了基地`);
        checkWinCondition();
        return;
    }

    if (!isCellOccupied(unit.row, nextCol)) {
        const oldCell = document.querySelector(`.cell[data-row="${unit.row}"][data-col="${unit.col}"]`);
        if (oldCell) oldCell.innerHTML = '';

        grid[unit.row][unit.col] = null;
        unit.col = nextCol;
        grid[unit.row][nextCol] = unit;
        updateUnitDisplay(unit);
    }
}

// 蒲公英医生 治疗逻辑 (每 2.4秒 治疗附近我方单位)
function processSpecialAbilities() {
    healTick++;
    if (healTick % 3 !== 0) return; // 每 2.4 秒执行一次

    units.forEach(unit => {
        if (unit.special === 'heal' && unit.owner === 'player' && unit.currentHP > 0) {
            // 治疗周围3x3范围内的我方单位
            for (let r = -1; r <= 1; r++) {
                for (let c = -1; c <= 1; c++) {
                    const tr = unit.row + r;
                    const tc = unit.col + c;
                    if (tr < 0 || tr >= 5 || tc < 0 || tc >= 12) continue;

                    const targetUnit = grid[tr] && grid[tr][tc];
                    if (targetUnit && targetUnit.owner === 'player' && targetUnit.currentHP < targetUnit.hp) {
                        targetUnit.currentHP = Math.min(targetUnit.hp, targetUnit.currentHP + 12);
                        updateUnitDisplay(targetUnit);
                        addLog(`${unit.name} 治疗了 ${targetUnit.name}`);
                    }
                }
            }
        }
    });
}

// 敌人AI波次
function spawnEnemyWave() {
    if (!gameRunning) return;

    const now = Date.now();
    if (now - lastSpawnTime < 4200) return;

    let spawned = 0;
    for (let row = 0; row < 5; row++) {
        if (spawned >= 2) break;

        for (let col = 8; col < 11; col++) {
            if (!isCellOccupied(row, col)) {
                const monster = {
                    id: Date.now() + Math.random(),
                    cardId: 'giant-monster',
                    owner: 'enemy',
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
        setTimeout(() => alert('游戏结束 - 你输了'), 80);
    }
    if (enemyBaseHP <= 0) {
        gameRunning = false;
        addLog('=== 你赢了！敌人基地被破坏 ===');
        setTimeout(() => alert('游戏结束 - 你赢了！'), 80);
    }
}

// 核心游戏循环
function gameLoop() {
    if (!gameRunning) return;

    spawnEnemyWave();
    processSpecialAbilities();

    for (let i = units.length - 1; i >= 0; i--) {
        const unit = units[i];
        if (!unit || unit.currentHP <= 0) continue;

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

    setInterval(() => {
        if (!gameRunning) return;
        if (sunlight < 20) sunlight++;
        if (food < 20) food++;
        updateResources();
    }, 2000);

    setInterval(gameLoop, 800);

    addLog('游戏已加载 v0.4 - 卡牌库已扩展');
    addLog('新增：仙人棕、菠萝骑士、蒲公英医生、冰块冷莹机');
}

document.getElementById('reset-btn').onclick = () => location.reload();
document.getElementById('start-wave-btn').onclick = () => addLog('波次自动进行中');

window.onload = initGame;