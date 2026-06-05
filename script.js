// v0.18 - Fix placement bugs + correct card names

function isCellOccupied(row, col) {
    const cellUnit = grid[row] && grid[row][col];
    // 只有当有我方单位时才阻止放置（敌方单位不阻止）
    return cellUnit && cellUnit.owner === 'player';
}

function placeCard(row, col, cellElement) {
    if (!selectedCard || !gameRunning) return;
    const cardData = cardDatabase[selectedCard];

    // 可移动单位只能放在后三列
    if (cardData.canMove) {
        if (col < 3) {
            addLog('可移动单位只能放在后三列');
            return;
        }
    } else {
        if (col >= 6) {
            addLog('只能在左半场放置');
            return;
        }
    }

    if (isCellOccupied(row, col)) {
        addLog('该格子已有我方单位');
        return;
    }

    if ((cardData.cost.sunlight||0) > sunlight || (cardData.cost.food||0) > food) {
        addLog('资源不足');
        return;
    }

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