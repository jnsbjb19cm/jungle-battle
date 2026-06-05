// v0.12 - Simple Card Selection Screen

let selectedCards = [];
const MAX_CARDS = 6;

// 初始化选卡界面
function initCardSelection() {
    const grid = document.getElementById('card-grid');
    grid.innerHTML = '';

    Object.keys(cardDatabase).forEach(cardId => {
        const cardData = cardDatabase[cardId];
        const cardEl = document.createElement('div');
        cardEl.className = 'card';
        cardEl.innerHTML = `
            <div class="card-name">${cardData.name}</div>
            <div class="card-info">
                ${cardData.type === 'plant' ? '阳光' : '食物'}: ${cardData.cost.sunlight || cardData.cost.food}<br>
                攻击: ${cardData.attack} | 血量: ${cardData.hp}<br>
                ${cardData.special ? '<span style="color:#67e8f9">[特殊]</span>' : ''}
            </div>
        `;

        cardEl.onclick = () => toggleCardSelection(cardId, cardEl);
        grid.appendChild(cardEl);
    });

    updateSelectedCount();
}

function toggleCardSelection(cardId, cardElement) {
    const index = selectedCards.indexOf(cardId);

    if (index > -1) {
        // 取消选中
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

    updateSelectedCount();
}

function updateSelectedCount() {
    const countEl = document.getElementById('selected-count');
    countEl.textContent = selectedCards.length;

    const startBtn = document.getElementById('start-battle-btn');
    startBtn.disabled = selectedCards.length !== MAX_CARDS;
}

// 开始战斗
function startBattle() {
    // 隐藏选卡界面
    document.getElementById('selection-screen').style.display = 'none';
    document.getElementById('game-container').style.display = 'flex';

    // 初始化战场
    initGrid();
    initBattleHand();
    updateResources();

    // 启动游戏循环
    setInterval(() => {
        if (!gameRunning) return;
        if (sunlight < 20) sunlight++;
        if (food < 20) food++;
        updateResources();
    }, 2000);

    setInterval(gameLoop, 750);

    addLog('战斗开始！');
}

// 使用选择的卡牌初始化手牌
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

// 以下保留原来的函数（略有修改）
// ... (原来的 initGrid, gameLoop, tryMove 等函数保持不变) 

// 启动选卡界面
window.onload = function() {
    initCardSelection();

    document.getElementById('start-battle-btn').onclick = startBattle;
};