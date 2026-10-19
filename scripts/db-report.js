const { connectDB } = require('../backend/config/database');
const Question = require('../backend/models/Question');

connectDB().then(async () => {
    const active = await Question.find({company:'Wipro', questionType:'coding', active:{$ne:false}}).lean();
    const inactive = await Question.countDocuments({company:'Wipro', questionType:'coding', active:false});
    const allWipro = await Question.countDocuments({company:'Wipro'});
    const wiproMcq = await Question.countDocuments({company:'Wipro', questionType:'mcq', active:{$ne:false}});
    const wiproWriting = await Question.countDocuments({company:'Wipro', questionType:'fill_in_blank', active:{$ne:false}});

    const byDiff = {};
    const byTopic = {};
    active.forEach(q => {
        const d = q.difficulty || 'Unknown';
        byDiff[d] = (byDiff[d]||0)+1;
        const t = q.topic || q.subject || 'Unknown';
        byTopic[t] = (byTopic[t]||0)+1;
    });

    console.log('=== WIPRO DATABASE REPORT ===');
    console.log('Total Wipro documents (all):', allWipro);
    console.log('Active MCQ questions:       ', wiproMcq);
    console.log('Active Coding questions:    ', active.length);
    console.log('Active Writing prompts:     ', wiproWriting);
    console.log('Inactive (archived) coding: ', inactive);
    console.log('\nActive coding by difficulty:');
    Object.entries(byDiff).sort().forEach(([k,v]) => console.log('  '+k+':', v));
    console.log('\nActive coding by topic (top 10):');
    Object.entries(byTopic).sort(([,a],[,b])=>b-a).slice(0,10).forEach(([k,v])=>console.log('  '+k+':', v));
    process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });
