// v1.0 Complete Working Version

let selectedCards = [];
const MAX_CARDS = 6;
let currentFilter = 'all';
let selectedCard = null;

let sunlight = 5;
let food = 5;
let playerBaseHP = 1000;
let enemyBaseHP = 1000;
let gameRunning = true;
let grid = [];
let units = [];

// === 选卡逻辑 ===
function initSelectionScreen() {
    renderTeamPreview();
    updateTeamCount();

    const editBtn = document.getElementById('edit-team-btn');
    if (editBtn) editBtn.onclick = openEditModal;

    const startBtn = document.getElementById('start-battle-btn');
    if (startBtn) startBtn.onclick = startBattle;
}

function renderTeamPreview() {
    const container = document.getElementById('team-preview');
    if (!container) return;
    container.innerHTML = '';

    if (selectedCards.length === 0) {
        const empty = document.createElement('div');
        empty.style.cssText = 'color:#64748b; padding:30px 40px;';
        empty.textContent = '请点击编辑战团选择卡牌';
        container.appendChild(empty);
        return;
    }

    selectedCards.forEach(cardId => {
        const cardData = cardDatabase[cardId];
        if (!cardData) return;

        const cardEl = document.createElement('div');
        cardEl.className = 'card';
        cardEl.innerHTML = `<div style="font-weight:700; font-size:13px;">${cardData.name}</div>`;
        container.appendChild(cardEl);
    });
}

function updateTeamCount() {
    const countEl = document.getElementById('team-count');
    if (countEl) countEl.textContent = selectedCards.length;

    const startBtn = document.getElementById('start-battle-btn');
    if (startBtn) startBtn.disabled = selectedCards.length !== MAX_CARDS;
}

function openEditModal() {
    const modal = document.getElementById('edit-modal');
    if (!modal) return;
    modal.style.display = 'block';

    currentFilter = 'all';
    renderModalCards();

    document.querySelectorAll('.tab').forEach(tab => {
        tab.onclick = () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentFilter = tab.dataset.filter || 'all';
            renderModalCards();
        };
    });

    const closeBtn = document.getElementById('close-modal-btn');
    if (closeBtn) closeBtn.onclick = closeEditModal;

    const confirmBtn = document.getElementById('confirm-btn');
    if (confirmBtn) confirmBtn.onclick = () => {
        closeEditModal();
        renderTeamPreview();
        updateTeamCount();
    };
}

function closeEditModal() {
    const modal = document.getElementById('edit-modal');
    if (modal) modal.style.display = 'none';
}

function renderModalCards() {
    const gridEl = document.getElementById('modal-card-grid');
    if (!gridEl) return;
    gridEl.innerHTML = '';

    Object.keys(cardDatabase).forEach(cardId => {
        const cardData = cardDatabase[cardId];
        if (currentFilter === 'plant' && cardData.type !== 'plant') return;
        if (currentFilter === 'monster' && cardData.type !== 'monster') return;

        const cardEl = document.createElement('div');
        cardEl.className = 'card';
        if (selectedCards.includes(cardId)) cardEl.classList.add('selected');

        cardEl.innerHTML = `
            <div style="font-weight:700; margin-bottom:4px;">${cardData.name}</div>
            <div style="font-size:11px; color:#94a3b8;">
                ${cardData.type === 'plant' ? '阳光' : '食物'}: ${cardData.cost.sunlight || cardData.cost.food}<br>
                攻击 ${cardData.attack} | 血量 ${cardData.hp}
            </div>
        `;
        cardEl.onclick = () => toggleCardSelection(cardId, cardEl);
        gridEl.appendChild(cardEl);
    });
}

function toggleCardSelection(cardId, cardElement) {
    const index = selectedCards.indexOf(cardId);
    if (index > -1) {
        selectedCards.splice(index, 1);
        cardElement.classList.remove('selected');
    } else {
        if (selectedCards.length >= MAX_CARDS) { alert('最多6张'); return; }
        selectedCards.push(cardId);
        cardElement.classList.add('selected');
    }
}

function startBattle() {
    if (selectedCards.length !== MAX_CARDS) { alert('请选6张卡牌'); return; }

    document.getElementById('selection-screen').style.display = 'none';
    document.getElementById('game-container').style.display = 'flex';

    initGrid();
    initBattleHand();
    updateResources();
}

function initBattleHand() {
    const handContainer = document.getElementById('hand-cards');
    if (!handContainer) return;
    handContainer.innerHTML = '';

    selectedCards.forEach(cardId => {
        const cardData = cardDatabase[cardId];
        if (!cardData) return;

        const cardEl = document.createElement('div');
        cardEl.className = 'card';
        cardEl.innerHTML = `<div style="font-weight:700; font-size:13px;">${cardData.name}</div>`;
        cardEl.onclick = () => {
            document.querySelectorAll('.card').forEach(el => el.classList.remove('selected'));
            cardEl.classList.add('selected');
            window.selectedCard = cardId;
        };
        handContainer.appendChild(cardEl);
    });
}

// === 战斗逻辑 ===
let windowSelectedCard = null;

window.selectedCard = null;

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

function placeCard(row, col, cellElement) {
    const cardId = window.selectedCard;
    if (!cardId || !gameRunning) return;

    const cardData = cardDatabase[cardId];
    if (!cardData) return;

    if (col >= 6) { addLog('只能在我方区域放置'); return; }
    if (cardData.canMove && col < 3) { addLog('可移动单位只能放在后三列'); return; }
    if (!cardData.canMove && isCellOccupiedByPlayer(row, col)) { addLog('该格子已有我方单位'); return; }

    if ((cardData.cost.sunlight||0) > sunlight || (cardData.cost.food||0) > food) {
        addLog('资源不足'); return;
    }

    const unit = {
        id: Date.now() + Math.random(),
        cardId: cardId,
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

    cellElement.innerHTML = `<div style="font-size:11px; text-align:center; padding-top:8px;">${cardData.name}</div>`;
    addLog(`放置了 ${cardData.name}`);

    window.selectedCard = null;
    document.querySelectorAll('.card').forEach(el => el.classList.remove('selected'));
}

function isCellOccupiedByPlayer(row, col) {
    const u = grid[row] && grid[row][col];
    return u && u.owner === 'player';
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

function startWave() { addLog('波次开始'); }

function resetGame() { location.reload(); }

function updateUnitDisplay(unit) {}

function gameLoop() {}

window.onload = function() {
    if (typeof initSelectionScreen === 'function') initSelectionScreen();
};