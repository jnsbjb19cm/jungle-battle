// 丛林保卫战 v0.5
// 改进攻击逻辑 + 冰块冷莹机特殊效果 + 更好的全屏适配布局

let sunlight = 5;
let food = 5;
let playerBaseHP = 1000;
let enemyBaseHP = 1000;
let gameRunning = true;

let selectedCard = null;
let grid = [];
let units = [];
let lastSpawnTime = 0;
let healTick = 0;

const cardDatabase = {
    'flower-shooter': { id: 'flower-shooter', name: '花生射手', type: 'plant', cost: { sunlight: 6, food: 0 }, attack: 5, hp: 50, canMove: false, cooldown: 2200, color: '#4ade80', range: 3, special: null },
    'walnut-guard':   { id: 'walnut-guard', name: '核桃卫兵', type: 'plant', cost: { sunlight: 6, food: 0 }, attack: 0, hp: 200, canMove: false, cooldown: 5000, color: '#854d0e', range: 0, special: null },
    'giant-monster':  { id: 'giant-monster', name: '巨头怪', type: 'monster', cost: { sunlight: 0, food: 6 }, attack: 40, hp: 400, canMove: true, cooldown: 10000, color: '#f87171', range: 1, special: null },
    'xianrenzhang':   { id: 'xianrenzhang', name: '仙人棕', type: 'plant', cost: { sunlight: 7, food: 0 }, attack: 10, hp: 50, canMove: false, cooldown: 2800, color: '#22c55e', range: 2, special: null },
    'boluo-qishi':    { id: 'boluo-qishi', name: '菠萝骑士', type: 'plant', cost: { sunlight: 6, food: 0 }, attack: 30, hp: 400, canMove: true, cooldown: 8500, color: '#eab308', range: 1, special: null },
    'pugongying-yisheng': { id: 'pugongying-yisheng', name: '蒲公英医生', type: 'plant', cost: { sunlight: 10, food: 0 }, attack: 8, hp: 100, canMove: false, cooldown: 6000, color: '#3b82f6', range: 0, special: 'heal' },
    'bingkuai-lengcui': { id: 'bingkuai-lengcui', name: '冰块冷莹机', type: 'monster', cost: { sunlight: 0, food: 5 }, attack: 12, hp: 60, canMove: false, cooldown: 3200, color: '#67e8f9', range: 8, special: 'ice' }
};

let cardCooldowns = {};

function initHand() {
    const handContainer = document.getElementById('hand-cards');
    handContainer.innerHTML = '';

    const initialCards = ['flower-shooter','walnut-guard','giant-monster','xianrenzhang','boluo-qishi','pugongying-yisheng','bingkuai-lengcui'];
    
    initialCards.forEach(cardId => {
        const cardData = cardDatabase[cardId];
        const cardEl = document.createElement('div');
        cardEl.className = 'card';
        cardEl.dataset.cardId = cardId;
        cardEl.innerHTML = `
            <div style="font-weight:700; margin-bottom:3px; font-size:13px;">${cardData.name}</div>
            <div style="font-size:11px; color:#94a3b8; line-height:1.35;">
                ${cardData.type === 'plant' ? '阳光' : '食物'}: ${cardData.cost.sunlight || cardData.cost.food}<br>
                攻击 ${cardData.attack} | 血量 ${cardData.hp}
                ${cardData.special ? '<br><span style="color:#67e8f9; font-weight:600;">[ 特殊 ]</span>' : ''}
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
    if (unit.special === 'ice') extra = '<br><small style="color:#67e8f9">冰控</small>';

    unitEl.innerHTML = `
        ${unit.name}<br>
        <small>HP ${Math.floor(unit.currentHP)}</small>
        ${extra}
        <div class="hp-bar" style="width:${hpPercent}%;"></div>
    `;
    unitEl.style.background = unit.color;
}

function placeCard(row, col, cellElement) {
    if (!selectedCard || !gameRunning) return;
    const cardData = cardDatabase[selectedCard];

    if (col >= 6) { addLog('只能在左半场放置'); return; }
    if (isCellOccupied(row, col)) { addLog('该格子已有单位'); return; }
    if ((cardData.cost.sunlight||0) > sunlight || (cardData.cost.food||0) > food) { addLog('资源不足'); return; }

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
    if (logContent.children.length > 16) logContent.removeChild(logContent.children[0]);
    logContent.scrollTop = logContent.scrollHeight;
}

// 攻击逻辑 - 增强可见度
function performAttack(attacker, target) {
    if (!attacker || !target || attacker.currentHP <= 0 || target.currentHP <= 0) return;

    const damage = attacker.attack;
    target.currentHP -= damage;

    // 攻击闪光效果
    const cell = document.querySelector(`.cell[data-row="${attacker.row}"][data-col="${attacker.col}"]`);
    if (cell) {
        const unitEl = cell.querySelector('.unit');
        if (unitEl) {
            unitEl.classList.add('attacking');
            setTimeout(() => unitEl.classList.remove('attacking'), 280);
        }
    }

    addLog(`${attacker.name} 攻击了 ${target.name} (-${damage})`);
    updateUnitDisplay(target);

    if (target.currentHP <= 0) {
        removeUnit(target);
        addLog(`${target.name} 死亡`);
    }
}

// 冰块冷莹机 特殊效果：随机多目标攻击
function processIceSpecial(unit) {
    if (unit.special !== 'ice' || unit.currentHP <= 0) return;

    const enemies = units.filter(u => u.owner !== unit.owner && u.currentHP > 0);
    if (enemies.length === 0) return;

    // 随机选择最多 6 个目标进行攻击
    const targets = [];
    const shuffled = [...enemies].sort(() => Math.random() - 0.5);
    for (let i = 0; i < Math.min(6, shuffled.length); i++) {
        targets.push(shuffled[i]);
    }

    let hitCount = 0;
    targets.forEach(target => {
        if (target.currentHP > 0) {
            const dmg = Math.floor(unit.attack * (0.7 + Math.random() * 0.6)); // 70%~130%
            target.currentHP -= dmg;
            hitCount++;

            const cell = document.querySelector(`.cell[data-row="${unit.row}"][data-col="${unit.col}"]`);
            if (cell) {
                const el = cell.querySelector('.unit');
                if (el) { el.classList.add('attacking'); setTimeout(() => el.classList.remove('attacking'), 300); }
            }

            updateUnitDisplay(target);

            if (target.currentHP <= 0) {
                removeUnit(target);
                addLog(`${target.name} 被冰块冷莹机击败`);
            }
        }
    });

    if (hitCount > 0) {
        addLog(`${unit.name} 随机攻击了 ${hitCount} 个目标`);
    }
}

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

function removeUnit(unit) {
    const cell = document.querySelector(`.cell[data-row="${unit.row}"][data-col="${unit.col}"]`);
    if (cell) cell.innerHTML = '';
    grid[unit.row][unit.col] = null;
    units = units.filter(u => u.id !== unit.id);
}

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

function processSpecialAbilities() {
    healTick++;
    if (healTick % 3 === 0) {
        // 蒲公英医生 治疗
        units.forEach(u => {
            if (u.special === 'heal' && u.owner === 'player' && u.currentHP > 0) {
                for (let r = -1; r <= 1; r++) {
                    for (let c = -1; c <= 1; c++) {
                        const tr = u.row + r, tc = u.col + c;
                        if (tr<0||tr>=5||tc<0||tc>=12) continue;
                        const t = grid[tr] && grid[tr][tc];
                        if (t && t.owner === 'player' && t.currentHP < t.hp) {
                            t.currentHP = Math.min(t.hp, t.currentHP + 12);
                            updateUnitDisplay(t);
                        }
                    }
                }
            }
        });
    }
}

function spawnEnemyWave() {
    if (!gameRunning) return;
    const now = Date.now();
    if (now - lastSpawnTime < 4200) return;

    let spawned = 0;
    for (let row = 0; row < 5 && spawned < 2; row++) {
        for (let col = 8; col < 11; col++) {
            if (!isCellOccupied(row, col)) {
                const m = { id: Date.now()+Math.random(), cardId:'giant-monster', owner:'enemy', ...cardDatabase['giant-monster'], row, col, currentHP: cardDatabase['giant-monster'].hp, lastActionTime: now };
                grid[row][col] = m;
                units.push(m);
                updateUnitDisplay(m);
                spawned++;
                addLog('敌人生成 巨头怪');
                break;
            }
        }
    }
    lastSpawnTime = now;
}

function checkWinCondition() {
    if (playerBaseHP <= 0) { gameRunning = false; addLog('=== 你输了 ==='); setTimeout(()=>alert('游戏结束 - 你输了'),80); }
    if (enemyBaseHP <= 0) { gameRunning = false; addLog('=== 你赢了 ==='); setTimeout(()=>alert('游戏结束 - 你赢了'),80); }
}

function gameLoop() {
    if (!gameRunning) return;

    spawnEnemyWave();
    processSpecialAbilities();

    for (let i = units.length-1; i>=0; i--) {
        const u = units[i];
        if (!u || u.currentHP <= 0) continue;

        // 冰块冷莹机 特殊处理
        if (u.special === 'ice') {
            processIceSpecial(u);
            continue; // 冰控不走普通攻击逻辑
        }

        const target = findTarget(u);
        if (target) {
            performAttack(u, target);
        } else if (u.canMove) {
            tryMove(u);
        }
    }

    updateResources();
    checkWinCondition();
}

function initGrid() {
    const bf = document.getElementById('battlefield');
    bf.innerHTML = '';
    grid = [];

    for (let row=0; row<5; row++) {
        grid[row] = [];
        for (let col=0; col<12; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = row;
            cell.dataset.col = col;
            if (col < 6) cell.classList.add('player-side');
            else cell.classList.add('enemy-side');
            cell.onclick = () => placeCard(row, col, cell);
            bf.appendChild(cell);
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

    setInterval(gameLoop, 750);

    addLog('v0.5 已加载');
    addLog('冰块冷莹机已实现随机多目标攻击');
}

document.getElementById('reset-btn').onclick = () => location.reload();
document.getElementById('start-wave-btn').onclick = () => addLog('波次自动进行中');

window.onload = initGame;