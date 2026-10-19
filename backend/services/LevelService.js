// ============================================
// LEVEL SERVICE - 195 Levels, 9 Tiers
// This replicates the PHP levels.php functionality
// ============================================

class LevelService {
    constructor() {
        this.tiers = [
            { tier: 'Nothing',  icon: '⬜', levels: 5,   increment: 100,  xp_per: 5,  penalty: 0, timer: 900 },
            { tier: 'Bronze',   icon: '🥉', levels: 5,   increment: 200,  xp_per: 8,  penalty: 1, timer: 780 },
            { tier: 'Silver',   icon: '🥈', levels: 5,   increment: 350,  xp_per: 10, penalty: 1, timer: 720 },
            { tier: 'Gold',     icon: '🥇', levels: 5,   increment: 550,  xp_per: 12, penalty: 2, timer: 660 },
            { tier: 'Platinum', icon: '💠', levels: 6,   increment: 800,  xp_per: 15, penalty: 3, timer: 600 },
            { tier: 'Diamond',  icon: '💎', levels: 9,   increment: 1200, xp_per: 18, penalty: 4, timer: 540 },
            { tier: 'Genius',   icon: '🧠', levels: 20,  increment: 1800, xp_per: 22, penalty: 5, timer: 480 },
            { tier: 'Master',   icon: '👑', levels: 40,  increment: 2800, xp_per: 28, penalty: 6, timer: 420 },
            { tier: 'GOAT',     icon: '🐐', levels: 100, increment: 4500, xp_per: 35, penalty: 8, timer: 360 }
        ];
        
        this.levels = this.buildLevels();
        this.tierColors = {
            'Nothing':  { color: '#aaaaaa', bg: 'rgba(170,170,170,0.15)', border: 'rgba(170,170,170,0.3)' },
            'Bronze':   { color: '#cd7f32', bg: 'rgba(205,127,50,0.15)', border: 'rgba(205,127,50,0.35)' },
            'Silver':   { color: '#c0c0c0', bg: 'rgba(192,192,192,0.15)', border: 'rgba(192,192,192,0.35)' },
            'Gold':     { color: '#ffd700', bg: 'rgba(255,215,0,0.15)', border: 'rgba(255,215,0,0.35)' },
            'Platinum': { color: '#00bfff', bg: 'rgba(0,191,255,0.15)', border: 'rgba(0,191,255,0.35)' },
            'Diamond':  { color: '#b9f2ff', bg: 'rgba(185,242,255,0.15)', border: 'rgba(185,242,255,0.35)' },
            'Genius':   { color: '#9b59b6', bg: 'rgba(155,89,182,0.15)', border: 'rgba(155,89,182,0.35)' },
            'Master':   { color: '#e74c3c', bg: 'rgba(231,76,60,0.15)', border: 'rgba(231,76,60,0.35)' },
            'GOAT':     { color: '#f39c12', bg: 'rgba(243,156,18,0.15)', border: 'rgba(243,156,18,0.35)' }
        };
    }
    
    buildLevels() {
        const levels = {};
        let levelNum = 1;
        let cumXP = 0;
        
        for (const tier of this.tiers) {
            for (let pos = 1; pos <= tier.levels; pos++) {
                const min = cumXP;
                const max = cumXP + tier.increment;
                const stay = tier.tier === 'Nothing' ? 0 : Math.round(min * 0.8);
                
                levels[levelNum] = {
                    tier: tier.tier,
                    icon: tier.icon,
                    name: tier.tier + ' ' + pos,
                    min: min,
                    max: max,
                    stay: stay,
                    xp_per: tier.xp_per,
                    penalty: tier.penalty,
                    timer: tier.timer
                };
                
                cumXP = max;
                levelNum++;
            }
        }
        
        return levels;
    }
    
    getLevelInfo(levelNumber) {
        const num = Math.min(Math.max(levelNumber, 1), 195);
        return this.levels[num] || this.levels[1];
    }
    
    getLevelDetails(levelNumber) {
        return this.getLevelInfo(levelNumber);
    }
    
    getLevelFromXP(xp) {
        // XP must never be negative, and a non-numeric value must never
        // reach the range comparisons below. Without this clamp, any XP
        // that doesn't fall inside a defined [min, max) range - including
        // every negative value, since level 1's own min is 0 - fell
        // through every iteration of the loop and hit the `return 195`
        // fallback below, which is meant only for XP at/above the top of
        // the highest level. That fallback was never meant to catch
        // negative XP too, which is exactly how -27 XP became "Level 195".
        const safeXP = Math.max(0, Number(xp) || 0);

        for (const [num, data] of Object.entries(this.levels)) {
            if (safeXP >= data.min && safeXP < data.max) {
                return parseInt(num);
            }
        }
        return 195;
    }
    
    getTierColors() {
        return this.tierColors;
    }
    
    getAllTiers() {
        return [
            { icon: '⬜', name: 'Nothing', levels: '1-5', range: [1, 5] },
            { icon: '🥉', name: 'Bronze', levels: '6-10', range: [6, 10] },
            { icon: '🥈', name: 'Silver', levels: '11-15', range: [11, 15] },
            { icon: '🥇', name: 'Gold', levels: '16-20', range: [16, 20] },
            { icon: '💠', name: 'Platinum', levels: '21-26', range: [21, 26] },
            { icon: '💎', name: 'Diamond', levels: '27-35', range: [27, 35] },
            { icon: '🧠', name: 'Genius', levels: '36-55', range: [36, 55] },
            { icon: '👑', name: 'Master', levels: '56-95', range: [56, 95] },
            { icon: '🐐', name: 'GOAT', levels: '96-195', range: [96, 195] }
        ];
    }
}

module.exports = new LevelService();