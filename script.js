// v0.23 - Selection screen fix

let selectedCards = [];
const MAX_CARDS = 6;
let currentFilter = 'all';

// ... (keep previous working functions, ensure renderModalCards and toggle work) ...

// Make sure these functions exist and are correct:

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
        if (selectedCards.length >= MAX_CARDS) { alert('最多选6张'); return; }
        selectedCards.push(cardId);
        cardElement.classList.add('selected');
    }
}

// Ensure openEditModal calls renderModalCards()
// ... rest of selection logic ...