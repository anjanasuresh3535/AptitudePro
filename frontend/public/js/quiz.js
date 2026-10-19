// Full quiz functionality - externalized from an inline <script> block
// (copied from the original AptitudePro quiz.ejs) because this app's
// Content-Security-Policy blocks inline script content and inline
// onclick= attributes - same root cause as the register.ejs and
// dashboard.ejs fixes. Logic is otherwise unchanged from the original.
//
// IMPORTANT: the client-side correctCount/wrongCount/xpEarned/xpLost
// computed below are for immediate UI feedback only. The server
// (routes/quiz.js POST /quiz/submit-quiz) NEVER trusts these values -
// it independently recalculates everything from the real Question
// documents in MongoDB.

document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('quizForm');
    if (!form) return; // fail safely if this ever loads on another page

    // ─── Configuration (from server-rendered data attributes) ──────
    const totalQuestions = parseInt(form.dataset.totalQuestions, 10) || 0;
    const xpPerCorrect = parseInt(form.dataset.xpPer, 10) || 10;
    const negativeMarking = form.dataset.negativeMarking !== 'false';
    const penaltyPerWrong = negativeMarking ? (parseInt(form.dataset.penalty, 10) || 5) : 0;
    const penaltyPerSkip = negativeMarking ? (parseInt(form.dataset.skipPenalty, 10) || 2) : 0;
    const initialRemainingSeconds = parseInt(form.dataset.remainingSeconds || form.dataset.timeLimit, 10) || 1800;
    const totalTimeLimit = parseInt(form.dataset.timeLimit, 10) || 1800;

    let questionIds = [];
    try {
        questionIds = JSON.parse(form.dataset.questionIds || '[]');
    } catch (e) {
        questionIds = [];
    }

    let currentIndex = 0;
    let answers = new Array(totalQuestions).fill(null);
    const markedForReview = new Array(totalQuestions).fill(false);
    let timerInterval = null;
    let remainingSeconds = initialRemainingSeconds;

    // ─── DOM Elements ───────────────────────────
    const questionCards = document.querySelectorAll('.question-card');
    const dots = document.querySelectorAll('.dot');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const skipBtn = document.getElementById('skipBtn');
    const submitBtn = document.getElementById('submitBtn');
    const timerDisplay = document.getElementById('timerDisplay');
    const answeredCount = document.getElementById('answeredCount');
    const skippedCount = document.getElementById('skippedCount');

    // ─── Timer ──────────────────────────────────
    function renderTimer() {
        if (!timerDisplay) return;
        const mins = String(Math.floor(Math.max(0, remainingSeconds) / 60)).padStart(2, '0');
        const secs = String(Math.max(0, remainingSeconds) % 60).padStart(2, '0');
        timerDisplay.textContent = mins + ':' + secs;

        if (remainingSeconds <= 180) { // 3 minutes warning
            timerDisplay.style.color = '#f87171';
            timerDisplay.style.fontWeight = '700';
        } else {
            timerDisplay.style.color = 'inherit';
        }
    }

    function startTimer() {
        renderTimer();
        if (timerInterval) return;

        timerInterval = setInterval(function () {
            remainingSeconds--;
            renderTimer();

            if (remainingSeconds <= 0) {
                stopTimer();
                triggerAutoSubmit();
            }
        }, 1000);
    }

    function stopTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        const timeSpent = Math.max(0, totalTimeLimit - Math.max(0, remainingSeconds));
        document.getElementById('timeTaken').value = timeSpent;
    }

    // ─── Navigation ─────────────────────────────
    function showQuestion(index) {
        questionCards.forEach(function (card, i) {
            card.style.display = i === index ? 'block' : 'none';
        });

        dots.forEach(function (dot, i) {
            dot.classList.remove('active');
            if (i === index) dot.classList.add('active');
            if (answers[i] === 'SKIPPED') {
                dot.classList.add('skipped');
                dot.classList.remove('answered');
            } else if (answers[i] !== null) {
                dot.classList.add('answered');
                dot.classList.remove('skipped');
            } else {
                dot.classList.remove('answered', 'skipped');
            }
            dot.classList.toggle('marked-review', markedForReview[i]);
        });

        document.getElementById('questionCounter').textContent = index + 1;
        prevBtn.disabled = index === 0;
        nextBtn.disabled = index === totalQuestions - 1;
        updateStats();
        const markButton = document.getElementById('markReviewBtn');
        if (markButton) {
            markButton.setAttribute('aria-pressed', markedForReview[index] ? 'true' : 'false');
            markButton.textContent = markedForReview[index] ? 'Remove review mark' : 'Mark for review';
        }
    }

    function nextQuestion() {
        if (currentIndex < totalQuestions - 1) {
            currentIndex++;
            showQuestion(currentIndex);
        }
    }

    function prevQuestion() {
        if (currentIndex > 0) {
            currentIndex--;
            showQuestion(currentIndex);
        }
    }

    function goToQuestion(index) {
        if (index >= 0 && index < totalQuestions) {
            currentIndex = index;
            showQuestion(currentIndex);
        }
    }

    // ─── Writing textarea support ───────────────
    var essayTexts = [];

    function countWords(text) {
        return text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
    }

    function updateWordCounter(textarea) {
        var idx  = parseInt(textarea.dataset.index, 10);
        var min  = parseInt(textarea.dataset.wcMin,  10) || 0;
        var max  = parseInt(textarea.dataset.wcMax,  10) || 0;
        var wc   = countWords(textarea.value);
        var wcEl = document.getElementById('wc_' + idx);
        var wsEl = document.getElementById('wcs_' + idx);
        if (wcEl) wcEl.textContent = wc;
        if (wsEl) {
            wsEl.className = 'wc-status';
            if (min > 0 && max > 0) {
                if (wc < min) {
                    wsEl.textContent = '— too short';
                    wsEl.classList.add('wc-warn');
                } else if (wc > max) {
                    wsEl.textContent = '— too long';
                    wsEl.classList.add('wc-warn');
                } else {
                    wsEl.textContent = '✓ within range';
                    wsEl.classList.add('wc-ok');
                }
            } else {
                wsEl.textContent = '';
            }
        }
    }

    // Store essay text in the answers array; use special prefix marker
    document.addEventListener('input', function (e) {
        if (!e.target.classList.contains('writing-textarea')) return;
        var textarea = e.target;
        var idx = parseInt(textarea.dataset.index, 10);
        updateWordCounter(textarea);
        var text = textarea.value.trim();
        essayTexts[idx] = text;
        if (text.length > 0) {
            answers[idx] = 'WRITING:' + text;
            dots[idx].classList.add('answered');
            dots[idx].classList.remove('skipped');
        } else {
            answers[idx] = null;
            dots[idx].classList.remove('answered', 'skipped');
        }
        updateStats();
    });

    // ─── Option Selection ──────────────────────
    function selectOption(element, index) {
        const selectedValue = element.dataset.value;

        const parentCard = element.closest('.question-card');
        parentCard.querySelectorAll('.option').forEach(function (opt) {
            opt.classList.remove('selected');
        });

        element.classList.add('selected');
        answers[index] = selectedValue;

        dots[index].classList.add('answered');
        dots[index].classList.remove('skipped');

        updateStats();
    }

    // ─── Skip Question ──────────────────────────
    function skipQuestion() {
        if (totalQuestions === 0) return;

        if (answers[currentIndex] !== null && answers[currentIndex] !== 'SKIPPED') {
            if (!confirm('You have already answered this question. Skip anyway?')) {
                return;
            }
        }

        answers[currentIndex] = 'SKIPPED';

        dots[currentIndex].classList.remove('answered');
        dots[currentIndex].classList.add('skipped');

        updateStats();

        if (currentIndex < totalQuestions - 1) {
            nextQuestion();
        }
    }

    // ─── Update Stats ───────────────────────────
    function updateStats() {
        let answered = 0;
        let skipped = 0;

        for (let i = 0; i < totalQuestions; i++) {
            if (answers[i] === 'SKIPPED') {
                skipped++;
            } else if (answers[i] !== null) {
                answered++;
            }
        }

        answeredCount.textContent = answered;
        skippedCount.textContent = skipped;
    }

    // ─── Option clicks (event delegation instead of onclick=) ──────
    document.getElementById('questionContainer').addEventListener('click', function (e) {
        const optionEl = e.target.closest('.option');
        if (!optionEl) return;
        const card = optionEl.closest('.question-card');
        const index = parseInt(card.dataset.index, 10);
        selectOption(optionEl, index);
    });

    // ─── Nav button clicks (addEventListener instead of onclick=) ──
    prevBtn.addEventListener('click', prevQuestion);
    nextBtn.addEventListener('click', nextQuestion);
    if (skipBtn) skipBtn.addEventListener('click', skipQuestion);
    const markReviewBtn = document.getElementById('markReviewBtn');
    if (markReviewBtn) markReviewBtn.addEventListener('click', function () {
        markedForReview[currentIndex] = !markedForReview[currentIndex];
        showQuestion(currentIndex);
    });

    // ─── Clickable Dots ────────────────────────
    dots.forEach(function (dot, index) {
        dot.addEventListener('click', function () {
            goToQuestion(index);
        });
    });

    // ─── Submit Quiz ────────────────────────────
    // Client-side counts here are for immediate UI feedback only - the
    // server independently recalculates correct/wrong/skipped/XP from
    // the actual Question documents and never trusts these values.
    //
    // isSubmitting + disabling submitBtn synchronously (before any
    // network request starts) is what actually prevents a real
    // double-click from firing two requests - a server-side session
    // lock alone cannot reliably stop two genuinely concurrent requests,
    // since each one loads its own copy of the session before either
    // has saved back. This is the primary defense; the server-side lock
    // is a secondary backstop (e.g. for non-browser clients).
    function triggerAutoSubmit() {
        if (isSubmitting) return;
        console.log('⏰ Quiz time expired! Auto-submitting quiz...');
        processSubmission(true);
    }

    function processSubmission(isAutoSubmit) {
        if (isSubmitting) return;

        if (totalQuestions === 0) {
            if (!isAutoSubmit) alert('No questions to submit!');
            return;
        }

        if (!isAutoSubmit) {
            let allAnswered = true;
            let unanswered = 0;
            for (let i = 0; i < totalQuestions; i++) {
                if (answers[i] === null) {
                    allAnswered = false;
                    unanswered++;
                }
            }

            if (!allAnswered) {
                const confirmSubmit = confirm(
                    'You have ' + unanswered + ' unanswered question(s).\n' +
                    'Answered: ' + answeredCount.textContent + '\n' +
                    'Skipped: ' + skippedCount.textContent + '\n\n' +
                    'Are you sure you want to submit?'
                );
                if (!confirmSubmit) {
                    return;
                }
            }
        }

        let selectedOptionsArray = [];
        let isCorrectArray = [];

        questionCards.forEach(function (card, index) {
            const selected = answers[index];
            const qtype = card.dataset.qtype || 'mcq';

            if (qtype === 'writing') {
                if (selected && selected.startsWith('WRITING:') && selected.length > 8) {
                    selectedOptionsArray.push('WRITING_SUBMITTED');
                    isCorrectArray.push(false);
                } else if (selected === 'SKIPPED') {
                    selectedOptionsArray.push('SKIPPED');
                    isCorrectArray.push(false);
                } else {
                    selectedOptionsArray.push(null);
                    isCorrectArray.push(false);
                }
            } else {
                selectedOptionsArray.push(selected || null);
                isCorrectArray.push(false);
            }
        });

        // Correctness and XP are calculated only by the server. The browser
        // submits choices but never receives or posts the answer key.
        document.getElementById('correctAnswers').value = 0;
        document.getElementById('wrongAnswers').value = 0;
        document.getElementById('xpEarned').value = 0;
        document.getElementById('xpLost').value = 0;
        document.getElementById('questionIds').value = JSON.stringify(questionIds);
        document.getElementById('selectedOptions').value = JSON.stringify(selectedOptionsArray);
        document.getElementById('isCorrect').value = JSON.stringify(isCorrectArray);
        var essayField = document.getElementById('essayTexts');
        if (essayField) essayField.value = JSON.stringify(essayTexts);

        stopTimer();

        isSubmitting = true;
        submitBtn.disabled = true;

        form.submit();
    }

    let isSubmitting = false;

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        processSubmission(false);
    });

    // ─── Keyboard Shortcuts ────────────────────
    document.addEventListener('keydown', function (e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        switch (e.key) {
            case 'ArrowRight':
                e.preventDefault();
                nextQuestion();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                prevQuestion();
                break;
            case 's':
            case 'S':
                e.preventDefault();
                skipQuestion();
                break;
            case '1': {
                e.preventDefault();
                const opt1 = document.querySelector('.question-card[style*="block"] .option[data-value="A"]');
                if (opt1) selectOption(opt1, currentIndex);
                break;
            }
            case '2': {
                e.preventDefault();
                const opt2 = document.querySelector('.question-card[style*="block"] .option[data-value="B"]');
                if (opt2) selectOption(opt2, currentIndex);
                break;
            }
            case '3': {
                e.preventDefault();
                const opt3 = document.querySelector('.question-card[style*="block"] .option[data-value="C"]');
                if (opt3) selectOption(opt3, currentIndex);
                break;
            }
            case '4': {
                e.preventDefault();
                const opt4 = document.querySelector('.question-card[style*="block"] .option[data-value="D"]');
                if (opt4) selectOption(opt4, currentIndex);
                break;
            }
        }
    });

    // ─── Initialize ────────────────────────────
    if (totalQuestions > 0) {
        startTimer();
        showQuestion(0);
        updateStats();
        console.log('\u2705 Quiz initialized:', totalQuestions, 'questions');
    } else {
        submitBtn.disabled = true;
        console.warn('\u26a0\ufe0f No questions available');
    }
});
