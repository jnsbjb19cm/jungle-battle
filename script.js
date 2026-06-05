// v0.21 - Working card selection + better visuals

let selectedCards = [];
const MAX_CARDS = 6;
let currentFilter = 'all';

// 初始化选卡界面
function initSelectionScreen() {
    renderTeamPreview();
    updateTeamCount();

    document.getElementById('edit-team-btn').onclick = openEditModal;
    document.getElementById('start-battle-btn').onclick = startBattle;
}

function renderTeamPreview() {
    const container = document.getElementById('team-preview');
    container.innerHTML = '';

    if (selectedCards.length === 0) {
        const empty = document.createElement('div');
        empty.style.cssText = 'color:#64748b; padding:20px;';
        empty.innerHTML = '请点击编辑战团选择卡牌';
        container.appendChild(empty);
        return;
    }

    selectedCards.forEach(cardId => {
        const cardData = cardDatabase[cardId];
        if (!cardData) return;

        const cardEl = document.createElement('div');
        cardEl.className = 'card';
        cardEl.innerHTML = `
            <div style="font-weight:700; font-size:13px; margin-bottom:4px;">${cardData.name}</div>
            <div style="font-size:11px; color:#94a3b8;">
                ${cardData.type === 'plant' ? '阳光' : '食物'}: ${cardData.cost.sunlight || cardData.cost.food}
            </div>
        `;
        container.appendChild(cardEl);
    });
}

function updateTeamCount() {
    document.getElementById('team-count').textContent = selectedCards.length;
    const startBtn = document.getElementById('start-battle-btn');
    startBtn.disabled = selectedCards.length !== MAX_CARDS;
}

// 打开编辑弹窗
function openEditModal() {
    const modal = document.getElementById('edit-modal');
    modal.style.display = 'block';
    currentFilter = 'all';
    renderModalCards();

    // Tab 切换
    document.querySelectorAll('.tab').forEach(tab => {
        tab.onclick = () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentFilter = tab.dataset.filter;
            renderModalCards();
        };
    });

    document.getElementById('close-modal-btn').onclick = closeEditModal;
    document.getElementById('confirm-btn').onclick = () => {
        closeEditModal();
        renderTeamPreview();
        updateTeamCount();
    };
}

function closeEditModal() {
    document.getElementById('edit-modal').style.display = 'none';
}

function renderModalCards() {
    const grid = document.getElementById('modal-card-grid');
    grid.innerHTML = '';

    Object.keys(cardDatabase).forEach(cardId => {
        const cardData = cardDatabase[cardId];

        if (currentFilter === 'plant' && cardData.type !== 'plant') return;
        if (currentFilter === 'monster' && cardData.type !== 'monster') return;

        const cardEl = document.createElement('div');
        cardEl.className = 'card';
        if (selectedCards.includes(cardId)) {
            cardEl.classList.add('selected');
        }

        cardEl.innerHTML = `
            <div style="font-weight:700; margin-bottom:4px;">${cardData.name}</div>
            <div style="font-size:12px; color:#94a3b8;">
                ${cardData.type === 'plant' ? '阳光' : '食物'}: ${cardData.cost.sunlight || cardData.cost.food}<br>
                攻击 ${cardData.attack} | 血量 ${cardData.hp}
            </div>
        `;

        cardEl.onclick = () => toggleCardSelection(cardId, cardEl);
        grid.appendChild(cardEl);
    });
}

function toggleCardSelection(cardId, cardElement) {
    const index = selectedCards.indexOf(cardId);

    if (index > -1) {
        selectedCards.splice(index, 1);
        cardElement.classList.remove('selected');
    } else {
        if (selectedCards.length >= MAX_CARDS) {
            alert(`最多只能选 ${MAX_CARDS} 张卡牌`);
            return;
        }
        selectedCards.push(cardId);
        cardElement.classList.add('selected');
    }

    // 更新弹窗内数量显示
    const countEl = document.getElementById('modal-count');
    if (countEl) countEl.textContent = selectedCards.length;
}

// 开始战斗
function startBattle() {
    if (selectedCards.length !== MAX_CARDS) return;

    document.getElementById('selection-screen').style.display = 'none';
    document.getElementById('game-container').style.display = 'flex';

    initGrid();
    initBattleHand();
    updateResources();

    setInterval(() => {
        if (!gameRunning) return;
        if (sunlight < 20) sunlight++;
        if (food < 20) food++;
        updateResources();
    }, 2000);

    setInterval(gameLoop, 750);

    addLog('战斗开始！');
}

function initBattleHand() {
    const handContainer = document.getElementById('hand-cards');
    handContainer.innerHTML = '';

    selectedCards.forEach(cardId => {
        const cardData = cardDatabase[cardId];
        if (!cardData) return;

        const cardEl = document.createElement('div');
        cardEl.className = 'card';
        cardEl.dataset.cardId = cardId;
        cardEl.innerHTML = `
            <div style="font-weight:700; margin-bottom:3px; font-size:13px;">${cardData.name}</div>
            <div style="font-size:11px; color:#94a3b8;">
                ${cardData.type === 'plant' ? '阳光' : '食物'}: ${cardData.cost.sunlight || cardData.cost.food}<br>
                攻击 ${cardData.attack} | 血量 ${cardData.hp}
            </div>
        `;
        cardEl.onclick = () => selectCard(cardId, cardEl);
        handContainer.appendChild(cardEl);
    });
}

// 保留原有其他函数
// initGrid, gameLoop, placeCard 等保持不变

window.onload = function() {
    initSelectionScreen();
};