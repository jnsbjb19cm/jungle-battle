// v0.16 - Placement restrictions + Scarecrow fix

function placeCard(row, col, cellElement) {
    if (!selectedCard || !gameRunning) return;
    const cardData = cardDatabase[selectedCard];

    // 可移动单位只能放在后三列
    if (cardData.canMove) {
        if (col < 3) {  // 后三列 = col 3,4,5
            addLog('可移动单位只能放在后三列');
            return;
        }
    } else {
        // 不可移动单位可以放在左半场任意位置
        if (col >= 6) {
            addLog('只能在左半场放置');
            return;
        }
    }

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

// 更新网格显示区域区别（可选）
function updateGridVisual() {
    // 可以给后三列加一个轻微不同的背景色，方便区分
    document.querySelectorAll('.cell').forEach(cell => {
        const col = parseInt(cell.dataset.col);
        if (col >= 3 && col < 6) {
            cell.style.background = '#166534';  // 后三列稍深一点
        }
    });
}

// 在 initGrid 后调用 updateGridVisual() 即可显示区域区别