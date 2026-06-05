// v0.30 - Fixed selection modal + live count

let selectedCards = [];
const MAX_CARDS = 6;
let currentFilter = 'all';

// 初始化选卡界面
function initSelectionScreen() {
    renderTeamPreview();
    updateTeamCount();

    const editBtn = document.getElementById('edit-team-btn');
    if (editBtn) {
        editBtn.onclick = openEditModal;
    }

    const startBtn = document.getElementById('start-battle-btn');
    if (startBtn) {
        startBtn.onclick = startBattle;
    }
}

// 渲染战团预览
function renderTeamPreview() {
    const container = document.getElementById('team-preview');
    if (!container) return;
    container.innerHTML = '';

    if (selectedCards.length === 0) {
        const empty = document.createElement('div');
        empty.style.cssText = 'color:#64748b; padding:30px 40px; font-size:16px;';
        empty.textContent = '请点击编辑战团选择卡牌';
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
    const countEl = document.getElementById('team-count');
    if (countEl) countEl.textContent = selectedCards.length;

    const startBtn = document.getElementById('start-battle-btn');
    if (startBtn) startBtn.disabled = selectedCards.length !== MAX_CARDS;
}

// 打开编辑弹窗
function openEditModal() {
    const modal = document.getElementById('edit-modal');
    if (!modal) {
        console.error('Modal not found');
        return;
    }
    modal.style.display = 'block';

    currentFilter = 'all';
    renderModalCards();

    // Tab 切换
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
    if (confirmBtn) {
        confirmBtn.onclick = () => {
            closeEditModal();
            renderTeamPreview();
            updateTeamCount();
        };
    }
}

function closeEditModal() {
    const modal = document.getElementById('edit-modal');
    if (modal) modal.style.display = 'none';
}

// 渲染弹窗内卡牌
function renderModalCards() {
    const grid = document.getElementById('modal-card-grid');
    if (!grid) return;
    grid.innerHTML = '';

    Object.keys(cardDatabase).forEach(cardId => {
        const cardData = cardDatabase[cardId];

        if (currentFilter === 'plant' && cardData.type !== 'plant') return;
        if (currentFilter === 'monster' && cardData.type !== 'monster') return;

        const cardEl = document.createElement('div');
        cardEl.className = 'card';
        if (selectedCards.includes(cardId)) cardEl.classList.add('selected');

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
            alert('最多只能选6张卡牌');
            return;
        }
        selectedCards.push(cardId);
        cardElement.classList.add('selected');
    }

    // 实时更新弹窗内数量
    updateModalCount();
}

function updateModalCount() {
    // 如果弹窗里有显示当前选中数量的元素，在这里更新
    // 暂时可以用 alert 或 console 确认
    console.log('Current selected:', selectedCards.length);
}

// 开始战斗
function startBattle() {
    if (selectedCards.length !== MAX_CARDS) {
        alert('请先选6张卡牌');
        return;
    }

    const selection = document.getElementById('selection-screen');
    const game = document.getElementById('game-container');

    if (selection) selection.style.display = 'none';
    if (game) game.style.display = 'flex';

    if (typeof initGrid === 'function') initGrid();
    if (typeof initBattleHand === 'function') initBattleHand();
    if (typeof updateResources === 'function') updateResources();

    setInterval(() => {
        if (!gameRunning) return;
        if (sunlight < 20) sunlight++;
        if (food < 20) food++;
        if (typeof updateResources === 'function') updateResources();
    }, 2000);

    if (typeof gameLoop === 'function') setInterval(gameLoop, 750);
    if (typeof addLog === 'function') addLog('战斗开始！');
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
        cardEl.dataset.cardId = cardId;
        cardEl.innerHTML = `
            <div style="font-weight:700; margin-bottom:3px; font-size:13px;">${cardData.name}</div>
            <div style="font-size:11px; color:#94a3b8;">
                ${cardData.type === 'plant' ? '阳光' : '食物'}: ${cardData.cost.sunlight || cardData.cost.food}<br>
                攻击 ${cardData.attack} | 血量 ${cardData.hp}
            </div>
        `;
        cardEl.onclick = () => {
            if (typeof selectCard === 'function') selectCard(cardId, cardEl);
        };
        handContainer.appendChild(cardEl);
    });
}

window.onload = function() {
    if (typeof initSelectionScreen === 'function') {
        initSelectionScreen();
    }
};