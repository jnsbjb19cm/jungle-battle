// v0.11 - Thorn Vine HP 280 + Smooth movement animation

// ... (keep all previous functions, only modify tryMove and add CSS if needed)

function tryMove(unit) {
    if (!unit.canMove || unit.currentHP <= 0) return;

    const direction = unit.owner === 'player' ? 1 : -1;
    const nextCol = unit.col + direction;

    if (nextCol < 0 || nextCol >= 12) {
        if (unit.owner === 'player') enemyBaseHP -= Math.max(8, unit.attack);
        else playerBaseHP -= Math.max(8, unit.attack);
        updateResources();
        removeUnit(unit);
        addLog(`${unit.name} 攻击了基地`);
        checkWinCondition();
        return;
    }

    if (isCellOccupied(unit.row, nextCol)) return;

    const oldCell = document.querySelector(`.cell[data-row="${unit.row}"][data-col="${unit.col}"]`);
    const newCell = document.querySelector(`.cell[data-row="${unit.row}"][data-col="${nextCol}"]`);

    if (!oldCell || !newCell) return;

    const unitEl = oldCell.querySelector('.unit');
    if (!unitEl) return;

    // Calculate pixel distance between cells
    const oldRect = oldCell.getBoundingClientRect();
    const newRect = newCell.getBoundingClientRect();
    const deltaX = newRect.left - oldRect.left;

    // Start smooth animation
    unitEl.style.transition = 'transform 0.3s ease';
    unitEl.style.transform = `translateX(${deltaX}px)`;

    setTimeout(() => {
        // Animation finished - move to new cell
        unitEl.style.transition = 'none';
        unitEl.style.transform = 'none';

        oldCell.removeChild(unitEl);
        newCell.appendChild(unitEl);

        // Update data model
        grid[unit.row][unit.col] = null;
        unit.col = nextCol;
        grid[unit.row][nextCol] = unit;

        updateUnitDisplay(unit);
    }, 300);
}