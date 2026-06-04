// 丛林保卫战 - 卡牌数据库
// 独立文件，方便后续扩展和维护

const cardDatabase = {
    // 白色
    'flower-shooter': {
        id: 'flower-shooter', name: '花生射手', type: 'plant',
        cost: { sunlight: 6, food: 0 }, attack: 5, hp: 50, canMove: false, cooldown: 2200,
        color: '#4ade80', range: 3, special: null
    },
    'walnut-guard': {
        id: 'walnut-guard', name: '核桃卫兵', type: 'plant',
        cost: { sunlight: 6, food: 0 }, attack: 0, hp: 200, canMove: false, cooldown: 5000,
        color: '#854d0e', range: 0, special: null
    },
    'giant-monster': {
        id: 'giant-monster', name: '巨头怪', type: 'monster',
        cost: { sunlight: 0, food: 6 }, attack: 40, hp: 400, canMove: true, cooldown: 10000,
        color: '#f87171', range: 1, special: null
    },

    // 绿色
    'xianrenzhang': {
        id: 'xianrenzhang', name: '仙人棕', type: 'plant',
        cost: { sunlight: 7, food: 0 }, attack: 10, hp: 50, canMove: false, cooldown: 2800,
        color: '#22c55e', range: 2, special: null
    },
    'boluo-qishi': {
        id: 'boluo-qishi', name: '菠萝骑士', type: 'plant',
        cost: { sunlight: 6, food: 0 }, attack: 30, hp: 400, canMove: true, cooldown: 8500,
        color: '#eab308', range: 1, special: null
    },

    // 新增 - 绿色
    'thorn-vine': {
        id: 'thorn-vine', name: '尖刺藤蔓', type: 'plant',
        cost: { sunlight: 5, food: 0 }, attack: 6, hp: 90, canMove: false, cooldown: 3000,
        color: '#16a34a', range: 1, special: 'thorns'
    },
    'wild-boar': {
        id: 'wild-boar', name: '狂暴野猪', type: 'monster',
        cost: { sunlight: 0, food: 5 }, attack: 28, hp: 160, canMove: true, cooldown: 8000,
        color: '#b45309', range: 1, special: 'knockback'
    },

    // 蓝色
    'pugongying-yisheng': {
        id: 'pugongying-yisheng', name: '蒲公英医生', type: 'plant',
        cost: { sunlight: 10, food: 0 }, attack: 8, hp: 100, canMove: false, cooldown: 6000,
        color: '#3b82f6', range: 0, special: 'heal'
    },
    'bingkuai-lengcui': {
        id: 'bingkuai-lengcui', name: '冰块冷莹机', type: 'monster',
        cost: { sunlight: 0, food: 5 }, attack: 12, hp: 60, canMove: false, cooldown: 3200,
        color: '#67e8f9', range: 8, special: 'ice'
    }
};