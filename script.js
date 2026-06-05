// v0.17 - Scarecrow Aura + Better Enemy AI

// ... 保留原有代码 ...

function processSpecialAbilities() {
    specialTick++;

    const now = Date.now();

    units.forEach(unit => {
        if (!unit || unit.currentHP <= 0) return;

        // 蒲公英医生 治疗
        if (unit.special === 'heal' && unit.owner === 'player' && specialTick % 3 === 0) {
            // ... 原有治疗逻辑 ...
        }

        // 尖刺藤蔓
        if (unit.special === 'thorns' && specialTick % 2 === 0) {
            processThorns(unit);
        }

        // 稻草人 攻击光环 (+8 攻击)
        if (unit.special === 'aura_attack' && specialTick % 4 === 0) {
            applyAttackAura(unit);
        }
    });
}

function applyAttackAura(unit) {
    if (unit.currentHP <= 0) return;

    for (let r = -1; r <= 1; r++) {
        for (let c = -1; c <= 1; c++) {
            const tr = unit.row + r;
            const tc = unit.col + c;
            if (tr < 0 || tr >= 5 || tc < 0 || tc >= 12) continue;

            const target = grid[tr] && grid[tr][tc];
            if (target && target.owner === unit.owner && target.currentHP > 0) {
                // 给附近友方单位 +8 攻击力（暂时buff）
                if (!target.attackBuff) target.attackBuff = 0;
                target.attackBuff = 8;  // 持续buff

                // 可以给一个简单视觉提示
                const cell = document.querySelector(`.cell[data-row="${tr}"][data-col="${tc}"]`);
                if (cell) {
                    const el = cell.querySelector('.unit');
                    if (el) el.style.boxShadow = '0 0 8px #fbbf24';
                }
            }
        }
    }
}

// 优化敌人AI - 更聪明的目标选择
function findTarget(unit) {
    const direction = unit.owner === 'player' ? 1 : -1;
    const maxRange = unit.range || 1;

    let bestTarget = null;
    let bestScore = -Infinity;

    for (let r = -1; r <= 1; r++) {
        const checkRow = unit.row + r;
        if (checkRow < 0 || checkRow >= 5) continue;

        for (let dist = 1; dist <= maxRange; dist++) {
            const checkCol = unit.col + (direction * dist);
            if (checkCol < 0 || checkCol >= 12) continue;

            const target = grid[checkRow] && grid[checkRow][checkCol];
            if (target && target.owner !== unit.owner) {
                // 评分系统：优先攻击血量低的、距离近的
                let score = 100 - target.currentHP;  // 血少加分
                score -= dist * 10;                 // 距离近加分

                if (score > bestScore) {
                    bestScore = score;
                    bestTarget = target;
                }
            }
        }
    }
    return bestTarget;
}