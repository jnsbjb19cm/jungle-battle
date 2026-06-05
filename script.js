// v0.19 - Exact placement rules as per user spec

function placeCard(row, col, cellElement) {
    if (!selectedCard || !gameRunning) return;
    const cardData = cardDatabase[selectedCard];

    // 规则1: 只能放在我方区域 (左6列)
    if (col >= 6) {
        addLog('只能在我方区域放置');
        return;
    }

    // 规则2: 可移动单位只能放在后三列 (col 3,4,5)
    if (cardData.canMove) {
        if (col < 3) {
            addLog('可移动单位只能放置在靠近基地的三列');
            return;
        }
    }
    // 不可移动单位可以在左6列任意位置

    // 规则3: 可移动单位无视格子占用（可放在任何单位上）
    // 不可移动单位需要检查是否被我方单位占用
    if (!cardData.canMove) {
        if (isCellOccupiedByPlayer(row, col)) {
            addLog('该格子已有我方单位，无法放置');
            return;
        }
    }

    // 资源检查
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

function isCellOccupiedByPlayer(row, col) {
    const cellUnit = grid[row] && grid[row][col];
    return cellUnit && cellUnit.owner === 'player';
}