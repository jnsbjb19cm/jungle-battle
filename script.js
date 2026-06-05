// v0.14 - Drag & Drop + Card Details

let selectedCards = [];
const MAX_CARDS = 6;
let currentFilter = 'all';
let draggedIndex = null;

// ... 以下为新增或修改的函数 ...

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
        empty.style.color = '#64748b';
        empty.textContent = '请点击编辑选择卡牌';
        container.appendChild(empty);
        return;
    }

    selectedCards.forEach((cardId, index) => {
        const cardData = cardDatabase[cardId];
        if (!cardData) return;

        const cardEl = document.createElement('div');
        cardEl.className = 'card';
        cardEl.draggable = true;
        cardEl.dataset.index = index;

        cardEl.innerHTML = `
            <div style="font-weight:700; font-size:13px; margin-bottom:4px;">${cardData.name}</div>
            <div style="font-size:11px; color:#94a3b8;">
                ${cardData.type === 'plant' ? '阳光' : '食物'}: ${cardData.cost.sunlight || cardData.cost.food}
            </div>
        `;

        // 点击查看详情
        cardEl.onclick = (e) => {
            if (!e.target.closest('button')) {
                showCardDetail(cardId);
            }
        };

        // 拖拽事件
        cardEl.addEventListener('dragstart', (e) => {
            draggedIndex = index;
            e.dataTransfer.effectAllowed = 'move';
        });

        cardEl.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        });

        cardEl.addEventListener('drop', (e) => {
            e.preventDefault();
            const targetIndex = parseInt(cardEl.dataset.index);

            if (draggedIndex !== null && draggedIndex !== targetIndex) {
                const [movedCard] = selectedCards.splice(draggedIndex, 1);
                selectedCards.splice(targetIndex, 0, movedCard);
                renderTeamPreview();
            }
            draggedIndex = null;
        });

        container.appendChild(cardEl);
    });
}

function updateTeamCount() {
    document.getElementById('team-count').textContent = selectedCards.length;
    const startBtn = document.getElementById('start-battle-btn');
    startBtn.disabled = selectedCards.length !== MAX_CARDS;
}

function openEditModal() {
    const modal = document.getElementById('edit-modal');
    modal.style.display = 'block';
    currentFilter = 'all';
    renderModalCards();

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderModalCards();
        };
    });

    document.getElementById('close-modal-btn').onclick = closeEditModal;
    document.getElementById('confirm-edit-btn').onclick = () => {
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
        if (selectedCards.includes(cardId)) cardEl.classList.add('selected');

        cardEl.innerHTML = `
            <div style="font-weight:700; margin-bottom:4px;">${cardData.name}</div>
            <div style="font-size:12px; color:#94a3b8;">
                ${cardData.type === 'plant' ? '阳光' : '食物'}: ${cardData.cost.sunlight || cardData.cost.food}<br>
                攻击 ${cardData.attack} | 血量 ${cardData.hp}
            </div>
        `;

        cardEl.onclick = () => toggleCardInModal(cardId, cardEl);
        grid.appendChild(cardEl);
    });
}

function toggleCardInModal(cardId, cardElement) {
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
}

function showCardDetail(cardId) {
    const cardData = cardDatabase[cardId];
    if (!cardData) return;

    document.getElementById('detail-card-name').textContent = cardData.name;

    const content = document.getElementById('card-detail-content');
    content.innerHTML = `
        <p><strong>类型:</strong> ${cardData.type === 'plant' ? '植物' : '怪物'}</p>
        <p><strong>消耗:</strong> ${cardData.type === 'plant' ? '阳光 ' + cardData.cost.sunlight : '食物 ' + cardData.cost.food}</p>
        <p><strong>攻击力:</strong> ${cardData.attack}</p>
        <p><strong>生命值:</strong> ${cardData.hp}</p>
        <p><strong>是否可移动:</strong> ${cardData.canMove ? '是' : '否'}</p>
        <p><strong>特殊能力:</strong> ${cardData.special ? cardData.special : '无'}</p>
        <p style="margin-top:12px; color:#94a3b8; font-size:13px;">详细描述暂无（后续可以补充）</p>
    `;

    document.getElementById('card-detail-modal').style.display = 'block';

    document.getElementById('close-detail-btn').onclick = closeDetailModal;
    document.getElementById('close-detail-btn2').onclick = closeDetailModal;
}

function closeDetailModal() {
    document.getElementById('card-detail-modal').style.display = 'none';
}

// 开始战斗等其他函数保持不变
// ... 省略 ...