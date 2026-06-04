// 丛林保卫战 - 单人对战核心模块 v0.1
// 5行12列格子 + 资源系统 + 卡牌放置

let sunlight = 5;
let food = 5;
let playerBaseHP = 1000;
let enemyBaseHP = 1000;
let currentLevel = 1;

let selectedCard = null;
let grid = []; // 5行 x 12列
let units = []; // 存放单位信息

// 简化卡牌数据（根据文档初始版）
const cardDatabase = {
    'flower-shooter': {
        id: 'flower-shooter',
        name: '花生射手',
        type: 'plant',
        cost: { sunlight: 6, food: 0 },
        attack: 5,
        hp: 50,
        canMove: false,
        cooldown: 2,
        color: '#4ade80'
    },
    'walnut-guard': {
        id: 'walnut-guard',
        name: '核桃卫兵',
        type: 'plant',
        cost: { sunlight: 6, food: 0 },
        attack: 0,
        hp: 200,
        canMove: false,
        cooldown: 5,
        color: '#854d0e'
    },
    'giant-monster': {
        id: 'giant-monster',
        name: '巨头怪',
        type: 'monster',
        cost: { sunlight: 0, food: 6 },
        attack: 40,
        hp: 400,
        canMove: true,
        cooldown: 10,
        color: '#f87171'
    }
};

// 玩家初始手牌
function initHand() {
    const handContainer = document.getElementById('hand-cards');
    handContainer.innerHTML = '';

    const initialCards = ['flower-shooter', 'walnut-guard', 'giant-monster'];
    
    initialCards.forEach(cardId => {
        const cardData = cardDatabase[cardId];
        const cardEl = document.createElement('div');
        cardEl.className = 'card';
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
    // 取消其他卡牌选中
    document.querySelectorAll('.card').forEach(el => el.classList.remove('selected'));
    cardElement.classList.add('selected');
    selectedCard = cardId;
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

            // 区分左右半场
            if (col < 6) {
                cell.classList.add('player-side');
            } else {
                cell.classList.add('enemy-side');
            }

            cell.onclick = () => placeCard(row, col, cell);
            battlefield.appendChild(cell);
            grid[row][col] = null; // 空格子
        }
    }
}

function placeCard(row, col, cellElement) {
    if (!selectedCard) {
        addLog('请先选择卡牌');
        return;
    }

    const cardData = cardDatabase[selectedCard];

    // 只能在左半场放置植物类
    if (col >= 6 && cardData.type === 'plant') {
        addLog('植物只能放在左半场');
        return;
    }

    // 检查资源
    if ((cardData.cost.sunlight || 0) > sunlight || (cardData.cost.food || 0) > food) {
        addLog('资源不足');
        return;
    }

    // 创建单位
    const unit = {
        id: Date.now(),
        cardId: selectedCard,
        ...cardData,
        row: row,
        col: col,
        currentHP: cardData.hp,
        lastAttackTime: 0
    };

    // 扣除资源
    sunlight -= cardData.cost.sunlight || 0;
    food -= cardData.cost.food || 0;
    updateResources();

    // 在格子上显示单位
    const unitEl = document.createElement('div');
    unitEl.className = `unit ${cardData.type}`;
    unitEl.innerHTML = `${cardData.name}<br><small>HP:${unit.currentHP}</small>`;
    unitEl.style.background = cardData.color;
    
    cellElement.innerHTML = '';
    cellElement.appendChild(unitEl);

    grid[row][col] = unit;
    units.push(unit);

    addLog(`放置了 ${cardData.name}`);

    // 取消选中
    document.querySelectorAll('.card').forEach(el => el.classList.remove('selected'));
    selectedCard = null;
}

function updateResources() {
    document.getElementById('sunlight').textContent = sunlight;
    document.getElementById('food').textContent = food;
}

function addLog(msg) {
    const logContent = document.getElementById('log-content');
    const p = document.createElement('p');
    p.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    logContent.appendChild(p);
    logContent.scrollTop = logContent.scrollHeight;
}

// 游戏主循环（简化版）
function gameLoop() {
    // TODO: 实现资源自动增长、单位行为、攻击等逻辑
    // 目前只有基础放置
}

// 初始化游戏
function initGame() {
    initGrid();
    initHand();
    updateResources();

    // 每2秒增加资源（简化版）
    setInterval(() => {
        if (sunlight < 20) sunlight++;
        if (food < 20) food++;
        updateResources();
    }, 2000);

    // 简化游戏循环
    setInterval(gameLoop, 1000);

    addLog('游戏已加载 - 请选择卡牌并放置到左半场');
}

// 按钮事件
document.getElementById('reset-btn').onclick = () => {
    location.reload();
};

document.getElementById('start-wave-btn').onclick = () => {
    addLog('波次开始！（暂未实现AI）');
};

// 启动游戏
window.onload = initGame;