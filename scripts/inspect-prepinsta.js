const https = require('https');

https.get('https://prepinsta.com/infosys-aptitude-questions/', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const regex = /href=["'](https:\/\/prepinsta\.com\/infosys[^"']*)["']/g;
        let match;
        const links = new Set();
        while ((match = regex.exec(data)) !== null) {
            links.add(match[1]);
        }
        console.log('--- FOUND PREPINSTA INFOSYS LINKS ---');
        links.forEach(l => console.log(l));

        // Look for question blocks or h3 / h4 elements
        const qRegex = /<(?:h3|h4|strong|p)[^>]*>(?:Q(?:uestion|\.)?\s*\d+[\s\S]*?)<\/(?:h3|h4|strong|p)>/gi;
        const questions = [];
        while ((match = qRegex.exec(data)) !== null) {
            questions.push(match[0].replace(/<[^>]+>/g, '').trim());
        }
        console.log('--- EXTRACTED QUESTION SNIPPETS ---');
        questions.slice(0, 15).forEach(q => console.log(q));
    });
}).on('error', err => console.error(err.message));
