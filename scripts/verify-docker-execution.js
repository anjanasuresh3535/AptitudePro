/**
 * scripts/verify-docker-execution.js
 *
 * REAL sandbox verification. Runs actual student submissions through the
 * Docker sandbox for every language whose image is available locally.
 *
 * This is the script that satisfies "if Docker is available, actually execute
 * the test submissions". If the daemon is down or an image is missing it
 * reports that honestly instead of pretending to have executed anything.
 *
 * Usage: node scripts/verify-docker-execution.js
 */
const { execFileSync, execFile } = require('child_process');
const availability = require('../backend/services/coding/availability');
const codingService = require('../backend/services/coding');
const codingConfig = require('../backend/config/codingExecutionConfig');

function docker(args, timeoutMs = 120000) {
    try {
        return execFileSync('docker', args, { timeout: timeoutMs, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (e) {
        return null;
    }
}

async function main() {
    console.log('=== DOCKER EXECUTION VERIFICATION ===\n');

    const status = await availability.getExecutionStatus({ force: true });
    if (!status.available) {
        console.log('RESULT: SANDBOX NOT AVAILABLE');
        console.log('Reason:', status.reason);
        console.log('No code was executed. Nothing was faked.');
        process.exit(2);
    }

    console.log('Docker daemon:', status.docker.version, '\n');

    // Only test languages whose image is already present locally.
    const localImages = (docker(['images', '--format', '{{.Repository}}:{{.Tag}}']) || '')
        .split(/\r?\n/).map(s => s.trim()).filter(Boolean);

    const problem = {
        problemTitle: 'Sum of Digits',
        testCases: [
            { input: '1234', output: '10', isHidden: false },
            { input: '9', output: '9', isHidden: true }
        ]
    };

    const cases = {
        Python: {
            correct: 'n=int(input().strip())\nprint(sum(int(c) for c in str(n)))',
            wrong: 'print(0)',
            syntaxError: 'def broken(:\n    pass'
        },
        C: {
            correct: '#include <stdio.h>\nint main(void){int n,s=0;scanf("%d",&n);while(n){s+=n%10;n/=10;}printf("%d\\n",s);return 0;}',
            wrong: '#include <stdio.h>\nint main(void){printf("0\\n");return 0;}',
            syntaxError: '#include <stdio.h>\nint main(void){ this is not c }'
        },
        'C++': {
            correct: '#include <iostream>\nint main(){int n,s=0;std::cin>>n;while(n){s+=n%10;n/=10;}std::cout<<s<<std::endl;}',
            wrong: '#include <iostream>\nint main(){std::cout<<0<<std::endl;}',
            syntaxError: '#include <iostream>\nint main(){ @@@ }'
        },
        Java: {
            correct: 'import java.util.Scanner;\npublic class Main{public static void main(String[] a){Scanner s=new Scanner(System.in);int n=s.nextInt(),sum=0;while(n>0){sum+=n%10;n/=10;}System.out.println(sum);}}',
            wrong: 'public class Main{public static void main(String[] a){System.out.println(0);}}',
            syntaxError: 'public class Main{ this is not java }'
        }
    };

    let ran = 0;
    let failedChecks = 0;

    for (const [lang, src] of Object.entries(cases)) {
        const image = codingConfig.images[lang];
        const haveImage = localImages.includes(image);
        if (!haveImage) {
            console.log(`SKIP ${lang}: image ${image} is not present locally (not pulling automatically).`);
            continue;
        }
        ran++;

        const ok = await codingService.evaluateSubmission({ problem, question: problem, language: lang, source: src.correct, executionAvailable: true });
        const good = ok.status === 'accepted' && ok.passedTests === 2;
        console.log(`  ${lang} correct solution -> ${ok.status} (${ok.passedTests}/${ok.totalTests}) ${good ? 'OK' : 'FAIL'}`);
        if (!good) { failedChecks++; console.log('     ', ok.message || ''); }

        const bad = await codingService.evaluateSubmission({ question: problem, language: lang, source: src.wrong, executionAvailable: true });
        const badOk = bad.status === 'wrong_answer' && bad.passedTests === 0;
        console.log(`  ${lang} wrong solution   -> ${bad.status} (${bad.passedTests}/${bad.totalTests}) ${badOk ? 'OK' : 'FAIL'}`);
        if (!badOk) failedChecks++;

        const ce = await codingService.evaluateSubmission({ question: problem, language: lang, source: src.syntaxError, executionAvailable: true });
        const ceOk = ce.status === 'compile_error';
        console.log(`  ${lang} compile error    -> ${ce.status} ${ceOk ? 'OK' : 'FAIL'}`);
        if (!ceOk) failedChecks++;
    }

    // Timeout test (Python only - an infinite loop must be stopped).
    if (localImages.includes(codingConfig.images.Python)) {
        const loop = 'while True:\n    pass';
        const to = await codingService.evaluateSubmission({ question: problem, language: 'Python', source: loop, executionAvailable: true });
        const toOk = to.status === 'time_limit_exceeded' && to.passedTests === 0;
        console.log(`  Python infinite loop  -> ${to.status} (${to.passedTests}/${to.totalTests}) ${toOk ? 'OK' : 'FAIL'}`);
        if (!toOk) failedChecks++;
        ran++;
    }

    console.log(`\nLanguages executed: ${ran}. Failed checks: ${failedChecks}.`);
    process.exit(failedChecks > 0 ? 1 : 0);
}

main().catch(e => { console.error('Verification error:', e.message); process.exit(1); });