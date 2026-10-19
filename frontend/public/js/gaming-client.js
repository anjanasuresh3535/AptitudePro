// frontend/public/js/gaming-client.js
// Client-side game runner for Speed Challenge and Accuracy Rush modes.

class AptitudeGameClient {
    constructor() {
        window.gameClient = this;

        // Resilient fallback for session data retrieval
        if (!window.GAME_SESSION_DATA) {
            const scriptTag = document.getElementById('gameSessionScript');
            if (scriptTag && scriptTag.textContent) {
                try {
                    window.GAME_SESSION_DATA = JSON.parse(scriptTag.textContent.trim());
                } catch (e) {
                    console.error('Failed to parse gameSessionScript JSON:', e);
                }
            }
        }

        this.session = window.GAME_SESSION_DATA || {};
        this.questions = this.session.questions || [];
        this.currentIndex = 0;
        this.userAnswers = new Array(this.questions.length).fill(null);
        this.questionStartTimes = new Array(this.questions.length).fill(0);
        this.questionTimeSpent = new Array(this.questions.length).fill(0);

        this.timerInterval = null;
        this.startTime = Date.now();
        this.timeLimitSec = this.session.timeLimitSec || 300;
        this.elapsedSec = 0;

        this.init();
    }

    init() {
        if (!this.questions.length) {
            console.error('No questions loaded in session.');
            return;
        }

        // Attach event listeners to controls
        const nextBtn = document.getElementById('btnNext');
        if (nextBtn) {
            nextBtn.onclick = (e) => {
                e.preventDefault();
                this.nextQuestion();
            };
        }

        const skipBtn = document.getElementById('btnSkip');
        if (skipBtn) {
            skipBtn.onclick = (e) => {
                e.preventDefault();
                this.skipQuestion();
            };
        }

        // Attach delegated click listener on optionsGrid
        const gridEl = document.getElementById('optionsGrid');
        if (gridEl) {
            gridEl.addEventListener('click', (e) => {
                const btn = e.target.closest('.option-btn');
                if (btn) {
                    const opt = btn.getAttribute('data-option') || btn.querySelector('.option-prefix')?.textContent?.trim();
                    if (opt) {
                        this.selectOption(opt.toUpperCase());
                    }
                }
            });
        }

        this.questionStartTimes[0] = Date.now();
        this.renderQuestion(0);
        this.startTimer();
    }

    startTimer() {
        const timerEl = document.getElementById('gameTimer');

        // Initial paint
        const initialMins = Math.floor(this.timeLimitSec / 60);
        const initialSecs = this.timeLimitSec % 60;
        if (timerEl) {
            timerEl.textContent = `${initialMins.toString().padStart(2, '0')}:${initialSecs.toString().padStart(2, '0')}`;
        }

        if (this.timerInterval) clearInterval(this.timerInterval);

        this.timerInterval = setInterval(() => {
            this.elapsedSec = Math.floor((Date.now() - this.startTime) / 1000);
            const remaining = Math.max(0, this.timeLimitSec - this.elapsedSec);

            const mins = Math.floor(remaining / 60);
            const secs = remaining % 60;
            if (timerEl) {
                timerEl.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            }

            if (remaining <= 0) {
                clearInterval(this.timerInterval);
                this.submitGame(true);
            }
        }, 1000);
    }

    renderQuestion(index) {
        if (index < 0 || index >= this.questions.length) return;

        this.currentIndex = index;
        const q = this.questions[index];

        // Track question start time
        if (!this.questionStartTimes[index]) {
            this.questionStartTimes[index] = Date.now();
        }

        // Update Counter
        const counterEl = document.getElementById('questionCounter');
        if (counterEl) {
            counterEl.textContent = `Question ${index + 1} of ${this.questions.length}`;
        }

        // Update Subject
        const subjectEl = document.getElementById('questionSubject');
        if (subjectEl) {
            subjectEl.textContent = q.subject || q.category || 'Aptitude';
        }

        // Update Question Text
        const textEl = document.getElementById('questionText');
        if (textEl) {
            textEl.textContent = q.questionText;
        }

        // Update Progress Bar
        const progressEl = document.getElementById('progressBar');
        if (progressEl) {
            const pct = Math.round(((index + 1) / this.questions.length) * 100);
            progressEl.style.width = `${pct}%`;
        }

        // Render Options Grid
        const gridEl = document.getElementById('optionsGrid');
        if (gridEl) {
            gridEl.innerHTML = '';
            const options = q.options || {};

            ['a', 'b', 'c', 'd'].forEach(letterKey => {
                const letterUpper = letterKey.toUpperCase();
                const optionText = options[letterKey] || '';

                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'option-btn';
                btn.setAttribute('data-option', letterUpper);
                if (this.userAnswers[index] === letterUpper) {
                    btn.classList.add('selected');
                }

                btn.innerHTML = `
                    <div class="option-prefix">${letterUpper}</div>
                    <div>${optionText}</div>
                `;

                btn.onclick = (e) => {
                    e.preventDefault();
                    this.selectOption(letterUpper);
                };
                gridEl.appendChild(btn);
            });
        }

        // Update Next Button text if last question
        const nextBtn = document.getElementById('btnNext');
        if (nextBtn) {
            if (index === this.questions.length - 1) {
                nextBtn.innerHTML = `<span>Submit Game</span> <i class="fa-solid fa-flag-checkered"></i>`;
            } else {
                nextBtn.innerHTML = `<span>Next Question</span> <i class="fa-solid fa-arrow-right"></i>`;
            }
        }
    }

    selectOption(letterUpper) {
        letterUpper = (letterUpper || '').toString().trim().toUpperCase();
        this.userAnswers[this.currentIndex] = letterUpper;

        // Visual selection update
        const gridEl = document.getElementById('optionsGrid');
        if (gridEl) {
            const buttons = gridEl.querySelectorAll('.option-btn');
            buttons.forEach(btn => {
                const optVal = btn.getAttribute('data-option') || btn.querySelector('.option-prefix')?.textContent?.trim();
                if ((optVal || '').toUpperCase() === letterUpper) {
                    btn.classList.add('selected');
                } else {
                    btn.classList.remove('selected');
                }
            });
        }
    }

    skipQuestion() {
        this.userAnswers[this.currentIndex] = 'SKIPPED';
        this.nextQuestion();
    }

    nextQuestion() {
        // Record time spent on current question
        const now = Date.now();
        const start = this.questionStartTimes[this.currentIndex] || now;
        const timeSpentSec = Math.max(1, Math.round((now - start) / 1000));
        this.questionTimeSpent[this.currentIndex] = timeSpentSec;

        if (this.currentIndex < this.questions.length - 1) {
            this.renderQuestion(this.currentIndex + 1);
        } else {
            this.submitGame(false);
        }
    }

    submitGame(isTimeOut = false) {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }

        const answersPayload = this.questions.map((q, idx) => {
            return {
                questionId: q.questionId,
                selectedOption: this.userAnswers[idx] || 'SKIPPED',
                timeSpentSec: this.questionTimeSpent[idx] || 1
            };
        });

        const totalTimeTakenSec = Math.floor((Date.now() - this.startTime) / 1000);

        const formTimeTaken = document.getElementById('formTimeTaken');
        const formAnswersJson = document.getElementById('formAnswersJson');
        const submitForm = document.getElementById('gameSubmitForm');

        if (formTimeTaken) formTimeTaken.value = totalTimeTakenSec;
        if (formAnswersJson) formAnswersJson.value = JSON.stringify(answersPayload);

        if (submitForm) {
            submitForm.submit();
        }
    }
}

function initGameClient() {
    if (!window.gameClient) {
        window.gameClient = new AptitudeGameClient();
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGameClient);
} else {
    initGameClient();
}
