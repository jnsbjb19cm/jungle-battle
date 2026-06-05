// v0.31 - Minimal playable battlefield

let sunlight = 5;
let food = 5;
let playerBaseHP = 1000;
let enemyBaseHP = 1000;
let gameRunning = true;
let grid = [];
let units = [];
let selectedCard = null;

// 简化版本的初始化
function initGame() {
    initGrid();
    updateResources();
    // 暂时用固定几张卡测试
    initTestHand();
}

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

function initTestHand() {
    const handContainer = document.getElementById('hand-cards');
    if (!handContainer) return;
    handContainer.innerHTML = '';

    // 用几张固定卡测试
    const testCards = ['flower-shooter', 'thorn-vine', 'giant-monster', 'scarecrow'];

    testCards.forEach(cardId => {
        const cardData = cardDatabase[cardId];
        if (!cardData) return;

        const cardEl = document.createElement('div');
        cardEl.className = 'card';
        cardEl.innerHTML = `
            <div style="font-weight:700; font-size:13px;">${cardData.name}</div>
            <div style="font-size:11px; color:#94a3b8;">
                ${cardData.type === 'plant' ? '阳光' : '食物'}: ${cardData.cost.sunlight || cardData.cost.food}
            </div>
        `;
        cardEl.onclick = () => {
            document.querySelectorAll('.card').forEach(el => el.classList.remove('selected'));
            cardEl.classList.add('selected');
            selectedCard = cardId;
        };
        handContainer.appendChild(cardEl);
    });
}

function placeCard(row, col, cellElement) {
    if (!selectedCard || !gameRunning) return;
    const cardData = cardDatabase[selectedCard];

    if (col >= 6) { addLog('只能在我方区域放置'); return; }

    if ((cardData.cost.sunlight||0) > sunlight || (cardData.cost.food||0) > food) {
        addLog('资源不足'); return;
    }

    const unit = {
        id: Date.now() + Math.random(),
        cardId: selectedCard,
        owner: 'player',
        ...cardData,
        row, col,
        currentHP: cardData.hp
    };

    sunlight -= cardData.cost.sunlight || 0;
    food -= cardData.cost.food || 0;
    updateResources();

    grid[row][col] = unit;
    units.push(unit);

    // 简单显示
    cellElement.innerHTML = `<div style="font-size:11px; text-align:center; padding-top:8px;">${cardData.name}</div>`;
    addLog(`放置了 ${cardData.name}`);

    selectedCard = null;
    document.querySelectorAll('.card').forEach(el => el.classList.remove('selected'));
}

function updateResources() {
    const sunEl = document.getElementById('sunlight');
    const foodEl = document.getElementById('food');
    if (sunEl) sunEl.textContent = sunlight;
    if (foodEl) foodEl.textContent = food;
}

function addLog(msg) {
    const log = document.getElementById('log-content');
    if (log) {
        log.innerHTML += `<div>${msg}</div>`;
        log.scrollTop = log.scrollHeight;
    }
}

function startWave() {
    addLog('波次开始！');
}

function resetGame() {
    location.reload();
}

window.onload = function() {
    if (typeof initGame === 'function') {
        initGame();
    }
};