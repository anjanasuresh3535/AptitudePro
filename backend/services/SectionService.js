// ============================================
// SECTION SERVICE - Configuration
// This replicates the PHP sections.php functionality
// ============================================

class SectionService {
    constructor() {
        this.sections = {
            Maths: {
                name: 'Mathematics',
                icon: '📐',
                color: '#3b82f6',
                gradient: 'linear-gradient(135deg,#1a56db,#3b82f6)',
                bg: 'rgba(26,86,219,0.15)',
                border: 'rgba(26,86,219,0.3)',
                desc: 'Arithmetic, Algebra, Percentages & more',
                category: 'Maths'
            },
            Logical: {
                name: 'Logical Reasoning',
                icon: '🧠',
                color: '#9b59b6',
                gradient: 'linear-gradient(135deg,#6c3483,#9b59b6)',
                bg: 'rgba(155,89,182,0.15)',
                border: 'rgba(155,89,182,0.3)',
                desc: 'Series, Analogies, Puzzles & more',
                category: 'Logical'
            },
            English: {
                name: 'English',
                icon: '📝',
                color: '#00cc66',
                gradient: 'linear-gradient(135deg,#00994d,#00cc66)',
                bg: 'rgba(0,204,102,0.15)',
                border: 'rgba(0,204,102,0.3)',
                desc: 'Grammar, Vocabulary, Comprehension',
                category: 'English'
            },
            Mixed: {
                name: 'Mixed Challenge',
                icon: '🎯',
                color: '#ff9500',
                gradient: 'linear-gradient(135deg,#cc7700,#ff9500)',
                bg: 'rgba(255,149,0,0.15)',
                border: 'rgba(255,149,0,0.3)',
                desc: 'Mix of Maths + Logic + English',
                category: 'Mixed'
            },
            Programming: {
                name: 'Programming Aptitude',
                icon: '💻',
                color: '#00cccc',
                gradient: 'linear-gradient(135deg,#008080,#00cccc)',
                bg: 'rgba(0,204,204,0.15)',
                border: 'rgba(0,204,204,0.3)',
                desc: 'Programming Logic, Output Prediction, Data Structures & more',
                category: 'Programming'
            }
        };
    }
    
    getSections() {
        return this.sections;
    }
    
    getSection(key) {
        return this.sections[key] || this.sections['Maths'];
    }
}

module.exports = new SectionService();