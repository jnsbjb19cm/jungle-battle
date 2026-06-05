// v0.22 - Fixed names and placement

let sunlight = 5;
let food = 5;
let playerBaseHP = 1000;
let enemyBaseHP = 1000;
let gameRunning = true;

let selectedCard = null;
let grid = [];
let units = [];
let lastSpawnTime = 0;
let specialTick = 0;

// ... (rest of the code from previous version, with placement fix) ... 

function placeCard(row, col, cellElement) {
    if (!selectedCard || !gameRunning) return;
    const cardData = cardDatabase[selectedCard];

    // Rule 1: Only in player side (left 6 columns)
    if (col >= 6) {
        addLog('只能在我方区域放置');
        return;
    }

    // Rule 2: Movable units only in back 3 columns
    if (cardData.canMove && col < 3) {
        addLog('可移动单位只能放在后三列');
        return;
    }

    // Rule 3: Movable units can stack, Immovable cannot
    if (!cardData.canMove && isCellOccupiedByPlayer(row, col)) {
        addLog('该格子已有我方单位');
        return;
    }

    if ((cardData.cost.sunlight || 0) > sunlight || (cardData.cost.food || 0) > food) {
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
        lastActionTime: Date.now()
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
    const u = grid[row] && grid[row][col];
    return u && u.owner === 'player';
}

// ... other functions remain the same ...