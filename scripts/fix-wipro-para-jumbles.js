/**
 * Fix Para Jumble questions in wipro_verbal.json where the answer is a
 * sequence string (e.g., "BACD") that doesn't match any option text.
 * 
 * For Para Jumbles, the correct approach for our schema is:
 * - option1 = the sequence string (e.g., "BACD")  
 * - option2/3/4 = plausible wrong sequences
 * - answer = same sequence string as option1
 *
 * This script reads the file, finds broken Para Jumble records,
 * rewrites options so they ARE sequence strings, and saves the fixed file.
 */

const fs   = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../backend/data/wipro/wipro_verbal.json');
const data     = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// Common wrong sequence variants to use as distractors
function makeDistractors(correct) {
    const letters = correct.split('');
    const variants = new Set();
    // Swap pairs to create wrong answers
    for (let i = 0; i < letters.length; i++) {
        for (let j = i + 1; j < letters.length; j++) {
            const v = [...letters];
            [v[i], v[j]] = [v[j], v[i]];
            const s = v.join('');
            if (s !== correct) variants.add(s);
            if (variants.size >= 5) break;
        }
        if (variants.size >= 5) break;
    }
    return [...variants].slice(0, 3);
}

let fixed = 0;

const result = data.map((q, i) => {
    const ans  = String(q.answer || '').trim();
    const opts = [q.option1, q.option2, q.option3, q.option4].map(o => String(o || '').trim());
    
    // Detect Para Jumble by: answer is a sequence like BACD and doesn't match options
    const isSequence = /^[A-E]{3,5}$/.test(ans);
    const answerMatchesOpt = opts.includes(ans);
    
    if (isSequence && !answerMatchesOpt) {
        // Rebuild options as sequence strings
        const distractors = makeDistractors(ans);
        // Pad if needed
        while (distractors.length < 3) {
            const l = ['A','B','C','D','E'];
            distractors.push(l.slice(0, ans.length).join(''));
        }
        
        fixed++;
        return {
            ...q,
            option1: ans,
            option2: distractors[0] || 'ABCD',
            option3: distractors[1] || 'CDAB',
            option4: distractors[2] || 'DCBA',
            answer:  ans,
            explanation: q.explanation || `The correct order is ${ans}. Arrange the sentences in this sequence to form a coherent paragraph.`
        };
    }
    return q;
});

fs.writeFileSync(filePath, JSON.stringify(result, null, 2));
console.log(`Fixed ${fixed} Para Jumble questions. Total: ${result.length}`);

// Verify fix
let stillBroken = 0;
result.forEach(q => {
    const ans  = String(q.answer || '').trim();
    const opts = [q.option1, q.option2, q.option3, q.option4].map(o => String(o || '').trim());
    if (!opts.includes(ans)) stillBroken++;
});
console.log(`Still broken after fix: ${stillBroken}`);
