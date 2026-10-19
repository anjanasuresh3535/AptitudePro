const { connectDB, mongoose } = require('../backend/config/database');
const Question = require('../backend/models/Question');

function templates(title) {
    const clean = String(title || 'Accenture coding problem').replace(/[\r\n*]/g, ' ').trim();
    return {
        C: `/* ${clean} */\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nint main(void) {\n    /* Read the input format and print the required output. */\n    return 0;\n}\n`,
        'C++': `// ${clean}\n#include <iostream>\n#include <string>\n#include <vector>\n#include <algorithm>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // Read the input format and print the required output.\n    return 0;\n}\n`,
        Java: `// ${clean}\nimport java.io.*;\nimport java.util.*;\n\npublic class Main {\n    public static void main(String[] args) throws Exception {\n        Scanner in = new Scanner(System.in);\n        // Read the input format and print the required output.\n    }\n}\n`,
        Python: `# ${clean}\nimport sys\n\ndef main():\n    data = sys.stdin.read().strip().split()\n    # Read the input format and print the required output.\n\nif __name__ == "__main__":\n    main()\n`
    };
}

async function backfill() {
    await connectDB();
    const docs = await Question.find({ company: 'Accenture', questionType: 'coding', active: { $ne: false } });
    let changed = 0;
    for (const doc of docs) {
        const languages = (doc.supportedLanguages || []).filter(lang => ['C', 'C++', 'Java', 'Python'].includes(lang));
        const existing = doc.starterCodeByLanguage instanceof Map ? Object.fromEntries(doc.starterCodeByLanguage) : (doc.starterCodeByLanguage || {});
        const next = { ...existing };
        const generated = templates(doc.problemTitle || doc.question);
        for (const language of languages) if (!String(next[language] || '').trim()) next[language] = generated[language];
        if (!Object.keys(next).length) continue;
        if (Object.keys(next).some(language => next[language] !== existing[language])) {
            doc.starterCodeByLanguage = next;
            if (!String(doc.starterCode || '').trim()) doc.starterCode = next[languages[0]] || '';
            await doc.save();
            changed++;
        }
    }
    console.log(`Accenture coding starter backfill complete: ${changed} of ${docs.length} records updated.`);
    await mongoose.disconnect();
}

if (require.main === module) backfill().catch(error => { console.error('Accenture coding starter backfill failed:', error.message); process.exit(1); });
module.exports = { templates, backfill };
