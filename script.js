// 丛林保卫战 v0.11
// 尖刺藤蔓血量280 + 平滑移动动画

let sunlight = 5;
let food = 5;
let playerBaseHP = 1000;
let enemyBaseHP = 1000;
let gameRunning = true;

let selectedCard = null;
let grid = [];
let units = [];
let lastSpawnTime = 0;
let specialTick = 0;

function showFloatingText(row, col, text, color = '#ef4444') {
    const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
    if (!cell) return;

    const floatDiv = document.createElement('div');
    floatDiv.textContent = text;
    floatDiv.style.cssText = `
        position: absolute;
        left: 50%;
        top: -2px;
        transform: translateX(-50%);
        color: ${color};
        font-size: 10px;
        font-weight: 700;
        text-shadow: 0 1px 2px rgba(0,0,0,0.7);
        pointer-events: none;
        z-index: 200;
        white-space: nowrap;
        transition: all 0.55s cubic-bezier(0.4, 0, 1, 1);
    `;

    cell.appendChild(floatDiv);

    requestAnimationFrame(() => {
        floatDiv.style.transform = 'translate(-50%, -22px)';
        floatDiv.style.opacity = '0';
    });

    setTimeout(() => {
        floatDiv.remove();
    }, 580);
}

function initHand() {
    const handContainer = document.getElementById('hand-cards');
    handContainer.innerHTML = '';

    const initialCards = [
        'flower-shooter', 'walnut-guard', 'giant-monster',
        'thorn-vine', 'wild-boar',
        'pugongying-yisheng', 'bingkuai-lengcui'
    ];
    
    initialCards.forEach(cardId => {
        const cardData = cardDatabase[cardId];
        if (!cardData) return;

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
    if (unit.special === 'thorns') extra = '<br><small style="color:#4ade80">荆棓</small>';
    if (unit.special === 'knockback') extra = '<br><small style="color:#f59e0b">击退</small>';
    if (unit.special === 'ice') extra = '<br><small style="color:#67e8f9">冰控</small>';

    let statusText = '';
    const now = Date.now();
    if (unit.freezeUntil && unit.freezeUntil > now) {
        statusText = '<br><small style="color:#bae6fd; font-weight:700;">[冰封]</small>';
    } else if (unit.slowUntil && unit.slowUntil > now) {
        statusText = '<br><small style="color:#bae6fd;">减速</small>';
    }

    unitEl.innerHTML = `
        ${unit.name}<br>
        <small>HP ${Math.floor(unit.currentHP)}</small>
        ${extra}
        ${statusText}
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
        lastActionTime: Date.now(),
        slowUntil: 0,
        freezeUntil: 0,
        freezeImmuneUntil: 0
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
    if (logContent.children.length > 18) logContent.removeChild(logContent.children[0]);
    logContent.scrollTop = logContent.scrollHeight;
}

// 冰块冷莹机完整特殊效果
function processIceSpecial(unit) {
    if (unit.special !== 'ice' || unit.currentHP <= 0) return;

    const now = Date.now();
    const enemies = units.filter(u => 
        u.owner !== unit.owner && 
        u.currentHP > 0 &&
        (!u.freezeUntil || u.freezeUntil < now)
    );

    if (enemies.length === 0) return;

    const shuffled = [...enemies].sort(() => Math.random() - 0.5);
    const targets = shuffled.slice(0, Math.min(8, shuffled.length));

    let hitCount = 0;

    targets.forEach(target => {
        if (target.currentHP <= 0) return;

        let dmg = unit.attack;
        if (target.range && target.range >= 2) dmg = Math.floor(dmg * 0.5);

        target.currentHP -= dmg;
        hitCount++;

        showFloatingText(target.row, target.col, `-${dmg}`, '#ef4444');
        updateUnitDisplay(target);

        const isFrozen = target.freezeUntil && target.freezeUntil > now;
        const isSlowed = target.slowUntil && target.slowUntil > now;

        if (!isFrozen && isSlowed) {
            if (!target.freezeImmuneUntil || target.freezeImmuneUntil < now) {
                target.freezeUntil = now + 1000;
                target.freezeImmuneUntil = now + 3000;
                addLog(`${target.name} 被冰封了`);
            }
        } else if (!isFrozen && !isSlowed) {
            if (Math.random() < 0.5) {
                target.slowUntil = now + 1500;
                addLog(`${target.name} 被减速了`);
            }
        }

        if (target.currentHP <= 0) {
            removeUnit(target);
            addLog(`${target.name} 被冰块冷莹机击败`);
        }
    });

    if (hitCount > 0) {
        addLog(`${unit.name} 随机攻击了 ${hitCount} 个目标`);
    }
}

function performAttack(attacker, target) {
    if (!attacker || !target || attacker.currentHP <= 0 || target.currentHP <= 0) return;

    const damage = attacker.attack;
    target.currentHP -= damage;

    showFloatingText(target.row, target.col, `-${damage}`, '#ef4444');

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

    if (attacker.special === 'knockback') {
        tryKnockback(attacker, target);
    }

    if (target.currentHP <= 0) {
        removeUnit(target);
        addLog(`${target.name} 死亡`);
    }
}

function removeUnit(unit) {
    const cell = document.querySelector(`.cell[data-row="${unit.row}"][data-col="${unit.col}"]`);
    if (cell) cell.innerHTML = '';
    grid[unit.row][unit.col] = null;
    units = units.filter(u => u.id !== unit.id);
}

// 平滑移动动画版
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

    if (isCellOccupied(unit.row, nextCol)) return;

    const oldCell = document.querySelector(`.cell[data-row="${unit.row}"][data-col="${unit.col}"]`);
    const newCell = document.querySelector(`.cell[data-row="${unit.row}"][data-col="${nextCol}"]`);

    if (!oldCell || !newCell) return;

    const unitEl = oldCell.querySelector('.unit');
    if (!unitEl) return;

    // 平滑动画
    const oldRect = oldCell.getBoundingClientRect();
    const newRect = newCell.getBoundingClientRect();
    const deltaX = newRect.left - oldRect.left;

    unitEl.style.transition = 'transform 0.3s ease';
    unitEl.style.transform = `translateX(${deltaX}px)`;

    setTimeout(() => {
        unitEl.style.transition = 'none';
        unitEl.style.transform = 'none';

        oldCell.removeChild(unitEl);
        newCell.appendChild(unitEl);

        // 更新数据
        grid[unit.row][unit.col] = null;
        unit.col = nextCol;
        grid[unit.row][nextCol] = unit;

        updateUnitDisplay(unit);
    }, 300);
}

function processSpecialAbilities() {
    specialTick++;

    const now = Date.now();

    units.forEach(unit => {
        if (!unit || unit.currentHP <= 0) return;

        if (unit.special === 'heal' && unit.owner === 'player' && specialTick % 3 === 0) {
            for (let r = -1; r <= 1; r++) {
                for (let c = -1; c <= 1; c++) {
                    const tr = unit.row + r;
                    const tc = unit.col + c;
                    if (tr<0||tr>=5||tc<0||tc>=12) continue;
                    const t = grid[tr] && grid[tr][tc];
                    if (t && t.owner === 'player' && t.currentHP < t.hp) {
                        const healAmount = 12;
                        t.currentHP = Math.min(t.hp, t.currentHP + healAmount);
                        showFloatingText(t.row, t.col, `+${healAmount}`, '#22c55e');
                        updateUnitDisplay(t);
                    }
                }
            }
        }

        if (unit.special === 'thorns' && specialTick % 2 === 0) {
            processThorns(unit);
        }
    });
}

function spawnEnemyWave() {
    if (!gameRunning) return;
    const now = Date.now();
    if (now - lastSpawnTime < 15000) return;

    let spawned = 0;
    for (let row = 0; row < 5 && spawned < 2; row++) {
        for (let col = 8; col < 11; col++) {
            if (!isCellOccupied(row, col)) {
                const m = {
                    id: Date.now() + Math.random(),
                    cardId: 'giant-monster',
                    owner: 'enemy',
                    ...cardDatabase['giant-monster'],
                    row, col,
                    currentHP: cardDatabase['giant-monster'].hp,
                    lastActionTime: now,
                    slowUntil: 0,
                    freezeUntil: 0,
                    freezeImmuneUntil: 0
                };
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
    if (playerBaseHP <= 0) {
        gameRunning = false;
        addLog('=== 你输了 ===');
        setTimeout(() => alert('游戏结束 - 你输了'), 80);
    }
    if (enemyBaseHP <= 0) {
        gameRunning = false;
        addLog('=== 你赢了 ===');
        setTimeout(() => alert('游戏结束 - 你赢了'), 80);
    }
}

function gameLoop() {
    if (!gameRunning) return;

    spawnEnemyWave();
    processSpecialAbilities();

    const now = Date.now();

    for (let i = units.length - 1; i >= 0; i--) {
        const u = units[i];
        if (!u || u.currentHP <= 0) continue;

        if (u.freezeUntil && u.freezeUntil > now) {
            continue;
        }

        if (u.special === 'ice') {
            processIceSpecial(u);
            continue;
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

function processThorns(unit) {
    if (unit.special !== 'thorns' || unit.currentHP <= 0) return;

    let damaged = 0;
    const directions = [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]];

    directions.forEach(([dr, dc]) => {
        const tr = unit.row + dr;
        const tc = unit.col + dc;
        if (tr < 0 || tr >= 5 || tc < 0 || tc >= 12) return;

        const target = grid[tr] && grid[tr][tc];
        if (target && target.owner !== unit.owner && target.currentHP > 0) {
            const dmg = 4;
            target.currentHP -= dmg;
            damaged++;

            showFloatingText(target.row, target.col, `-${dmg}`, '#ef4444');
            updateUnitDisplay(target);

            if (target.currentHP <= 0) {
                removeUnit(target);
                addLog(`${target.name} 被荆棓杀死`);
            }
        }
    });

    if (damaged > 0) addLog(`${unit.name} 造成荆棓伤害`);
}

function tryKnockback(attacker, target) {
    if (attacker.special !== 'knockback') return;
    if (Math.random() > 0.35) return;

    const direction = attacker.owner === 'player' ? 1 : -1;
    const pushDirection = -direction;
    const newCol = target.col + pushDirection;

    if (newCol < 0 || newCol >= 12) return;
    if (isCellOccupied(target.row, newCol)) return;

    const oldCell = document.querySelector(`.cell[data-row="${target.row}"][data-col="${target.col}"]`);
    if (oldCell) oldCell.innerHTML = '';

    grid[target.row][target.col] = null;
    target.col = newCol;
    grid[target.row][newCol] = target;

    updateUnitDisplay(target);
    addLog(`${attacker.name} 击退了 ${target.name}`);
}

function initGrid() {
    const bf = document.getElementById('battlefield');
    bf.innerHTML = '';
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

    addLog('v0.11 已加载');
    addLog('尖刺藤蔓血量已调为280');
    addLog('移动已改为平滑动画');
}

let cardCooldowns = {};

document.getElementById('reset-btn').onclick = () => location.reload();
document.getElementById('start-wave-btn').onclick = () => addLog('波次自动进行中');

window.onload = initGame;