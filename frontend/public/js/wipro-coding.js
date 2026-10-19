/* frontend/public/js/wipro-coding.js
 *
 * Client-side behaviour for the Wipro Coding Mock Test.
 *
 * TRUST MODEL
 *   The client is presentational only. It never decides the verdict, the score
 *   or whether the test is still open. Those decisions are made server-side:
 *   - The deadline is an absolute UNIX timestamp issued by the server. A tampered
 *     client clock cannot extend the test.
 *   - On submit, only { questionId, language, code } are sent. The server
 *     derives everything else.
 */
(function () {
    'use strict';

    var form      = document.getElementById('codingForm');
    if (!form) return;

    var timerEl   = document.getElementById('timer');
    var subsField = document.getElementById('submissions');
    var tabBar    = document.getElementById('problemTabs');
    var langRow   = document.getElementById('langRow');
    var langNote  = document.getElementById('langNote');
    var clearBtn  = document.getElementById('clearCode');
    var loadBtn   = document.getElementById('loadStarter');
    var runBtn    = document.getElementById('runCode');   // may be null (unavailable)
    var runResult = document.getElementById('runResult');

    // ── Read starter templates from the safe JSON block ──────────────
    var starters = {};
    var startersEl = document.getElementById('startersData');
    if (startersEl) {
        try { starters = JSON.parse(startersEl.textContent); } catch (e) {}
    }

    // ── Attempt ID for the /run endpoint ─────────────────────────────
    // The attempt ID is embedded in the timer element so we don't need
    // another hidden field. The server validates it from the session anyway.

    var limit    = parseInt(timerEl.getAttribute('data-limit'), 10) || 3600;
    var deadline = parseInt(timerEl.getAttribute('data-deadline'), 10) || 0;
    var submitting = false;
    var running    = false;

    var currentProblemIndex = 0;
    var currentLang = null;
    var langBtns = langRow ? Array.prototype.slice.call(langRow.querySelectorAll('.lang-btn')) : [];
    if (langBtns.length) currentLang = langBtns[0].getAttribute('data-lang');

    // Per-editor, per-language code storage so switching language does not
    // erase work already done in another language.
    // structure: { editorIndex: { langId: codeString } }
    var codeStore = {};

    function editors() {
        return Array.prototype.slice.call(document.querySelectorAll('.code-editor'));
    }

    function visibleEditor() {
        var wrap = document.querySelector('.editor-wrap:not([style*="display: none"])');
        return wrap ? wrap.querySelector('.code-editor') : (editors()[0] || null);
    }

    function currentEditor() {
        var wrap = document.querySelector('.editor-wrap[data-editor="' + currentProblemIndex + '"]');
        return wrap ? wrap.querySelector('.code-editor') : null;
    }

    // ── Timer (derived from server-issued absolute deadline) ──────────
    function pad(n) { return (n < 10 ? '0' : '') + n; }

    function remainingSeconds() {
        if (deadline) {
            return Math.max(0, Math.round((deadline - Date.now()) / 1000));
        }
        return Math.max(0, limit - Math.floor((Date.now() - Date.now()) / 1000));
    }

    function renderTimer() {
        var remaining = remainingSeconds();
        timerEl.textContent = pad(Math.floor(remaining / 60)) + ':' + pad(remaining % 60);
        timerEl.classList.remove('warn', 'danger');
        if (remaining <= 120) timerEl.classList.add('danger');
        else if (remaining <= 600) timerEl.classList.add('warn');
        return remaining;
    }

    renderTimer();

    var tick = setInterval(function () {
        if (renderTimer() <= 0) {
            clearInterval(tick);
            if (!submitting) {
                alert('Time is up. Your code will be submitted exactly as it is now.');
                packAndSubmit();
            }
        }
    }, 1000);

    // ── Line counters / "done" tab markers ───────────────────────────
    function refreshCounters() {
        editors().forEach(function (ed) {
            var idx = parseInt(ed.dataset.qindex, 10);
            var el = document.getElementById('lineCount_' + idx);
            if (el) el.textContent = ed.value.split('\n').length + ' lines';
            var tab = tabBar ? tabBar.querySelector('.p-tab[data-tab="' + idx + '"]') : null;
            if (tab) tab.classList.toggle('done', ed.value.trim().length > 0);
        });
    }

    // ── Problem tabs ──────────────────────────────────────────────────
    function showTab(index) {
        // Save current editor content into the store before switching.
        saveCurrent();

        currentProblemIndex = index;

        document.querySelectorAll('.problem-panel').forEach(function (p) {
            p.style.display = p.getAttribute('data-panel') === String(index) ? '' : 'none';
        });
        document.querySelectorAll('.editor-wrap').forEach(function (w) {
            w.style.display = w.getAttribute('data-editor') === String(index) ? '' : 'none';
        });
        if (tabBar) {
            tabBar.querySelectorAll('.p-tab').forEach(function (t) {
                var on = t.getAttribute('data-tab') === String(index);
                t.classList.toggle('active', on);
                t.setAttribute('aria-selected', on ? 'true' : 'false');
            });
        }

        // Restore the stored code for this editor / language.
        restoreCurrent();

        // Clear any stale run result when switching problems.
        if (runResult) {
            runResult.className = 'run-result';
            runResult.innerHTML = '';
        }
    }

    if (tabBar) {
        tabBar.addEventListener('click', function (e) {
            var btn = e.target.closest('.p-tab');
            if (btn) showTab(parseInt(btn.getAttribute('data-tab'), 10));
        });
    }

    // ── Per-editor code store helpers ─────────────────────────────────
    function saveCurrent() {
        var ed = currentEditor();
        if (!ed || !currentLang) return;
        var idx = parseInt(ed.dataset.qindex, 10);
        if (!codeStore[idx]) codeStore[idx] = {};
        codeStore[idx][currentLang] = ed.value;
    }

    function restoreCurrent() {
        var ed = currentEditor();
        if (!ed || !currentLang) return;
        var idx = parseInt(ed.dataset.qindex, 10);
        var saved = codeStore[idx] && codeStore[idx][currentLang];
        if (saved !== undefined) {
            ed.value = saved;
        } else {
            // First time opening this editor for this language: load starter.
            ed.value = (starters && starters[currentLang]) ? starters[currentLang] : '';
            if (!codeStore[idx]) codeStore[idx] = {};
            codeStore[idx][currentLang] = ed.value;
        }
        refreshCounters();
    }

    // ── Language selection ────────────────────────────────────────────
    function applyLanguage(lang) {
        saveCurrent();
        currentLang = lang;

        if (langRow) {
            langBtns.forEach(function (b) {
                var on = b.getAttribute('data-lang') === lang;
                b.classList.toggle('active', on);
                b.setAttribute('aria-pressed', on ? 'true' : 'false');
            });
        }
        if (langNote) langNote.classList.toggle('show', lang === 'Java');

        restoreCurrent();
    }

    if (langRow) {
        langRow.addEventListener('click', function (e) {
            var btn = e.target.closest('.lang-btn');
            if (btn) applyLanguage(btn.getAttribute('data-lang'));
        });
    }

    // Initialise: load starters into every editor for the default language.
    if (langBtns.length) {
        // Pre-populate all editors with the starter for the first language.
        editors().forEach(function (ed) {
            var idx = parseInt(ed.dataset.qindex, 10);
            if (!codeStore[idx]) codeStore[idx] = {};
            if (starters && starters[currentLang]) {
                ed.value = starters[currentLang];
                codeStore[idx][currentLang] = ed.value;
            }
        });
        applyLanguage(currentLang);
        refreshCounters();
    }

    // ── Load Starter button ───────────────────────────────────────────
    if (loadBtn) {
        loadBtn.addEventListener('click', function () {
            var ed = visibleEditor();
            if (!ed || !currentLang) return;
            var template = (starters && starters[currentLang]) ? starters[currentLang] : '';
            if (!template) { alert('No starter template is available for ' + currentLang + '.'); return; }
            if (ed.value.trim().length > 0 && !confirm('Replace your current code with the ' + currentLang + ' starter template?')) return;
            ed.value = template;
            var idx = parseInt(ed.dataset.qindex, 10);
            if (!codeStore[idx]) codeStore[idx] = {};
            codeStore[idx][currentLang] = template;
            refreshCounters();
            ed.focus();
        });
    }

    // ── Editor keyboard behaviour ─────────────────────────────────────
    document.addEventListener('keydown', function (e) {
        // Ctrl/Cmd + Enter → submit
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            if (!submitting) packAndSubmit();
            return;
        }
        // Ctrl/Cmd + R → run sample tests
        if ((e.ctrlKey || e.metaKey) && (e.key === 'r' || e.key === 'R')) {
            e.preventDefault();
            if (runBtn && !running) runBtn.click();
            return;
        }
        if (e.ctrlKey || e.metaKey) {
            // Ctrl+1 / Ctrl+2 switch between problems
            if (e.key === '1' || e.key === '2') {
                var i = parseInt(e.key, 10) - 1;
                if (i < editors().length) { e.preventDefault(); showTab(i); }
            }
            return;
        }
        // Tab → insert 4 spaces in code editors
        if (e.key === 'Tab' && e.target.classList && e.target.classList.contains('code-editor')) {
            e.preventDefault();
            var ed = e.target;
            var start = ed.selectionStart;
            var end   = ed.selectionEnd;
            ed.value = ed.value.substring(0, start) + '    ' + ed.value.substring(end);
            ed.selectionStart = ed.selectionEnd = start + 4;
            saveCurrent();
            refreshCounters();
        }
    });

    editors().forEach(function (ed) {
        ed.addEventListener('input', function () {
            saveCurrent();
            refreshCounters();
        });
    });

    // ── Clear editor ──────────────────────────────────────────────────
    if (clearBtn) {
        clearBtn.addEventListener('click', function () {
            var ed = visibleEditor();
            if (!ed) return;
            if (confirm('Clear the code in this editor?')) {
                ed.value = '';
                var idx = parseInt(ed.dataset.qindex, 10);
                if (codeStore[idx]) codeStore[idx][currentLang] = '';
                refreshCounters();
                ed.focus();
            }
        });
    }

    // ── Run sample tests (POST /wipro/coding/run) ─────────────────────
    function showRunResult(cls, html) {
        if (!runResult) return;
        runResult.className = 'run-result show ' + cls;
        runResult.innerHTML = html;
    }

    function verdictClass(status) {
        if (!status) return 'info';
        var s = status.toLowerCase();
        if (s === 'accepted') return 'ok';
        if (s.indexOf('error') !== -1 || s === 'wrong_answer') return 'err';
        return 'info';
    }

    function friendlyStatus(status) {
        if (!status) return 'Not evaluated';
        return status.replace(/_/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); });
    }

    if (runBtn) {
        runBtn.addEventListener('click', function () {
            if (running || submitting) return;
            saveCurrent();

            var ed = visibleEditor();
            if (!ed) return;
            var code = ed.value.trim();
            if (!code) { showRunResult('info', '<strong>No code to run.</strong> Write something first.'); return; }

            var qid = ed.getAttribute('data-qid');
            running = true;
            runBtn.disabled = true;
            runBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Running…';
            showRunResult('info', '<i class="fa-solid fa-spinner fa-spin"></i> Running sample tests inside the sandbox…');

            var body = JSON.stringify({ questionId: qid, language: currentLang || '', code: code });

            fetch('/wipro/coding/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: body
            })
            .then(function (res) { return res.json(); })
            .then(function (data) {
                running = false;
                runBtn.disabled = false;
                runBtn.innerHTML = '<i class="fa-solid fa-play"></i> Run Sample Tests';

                if (!data.ok) {
                    showRunResult('err', '<strong>Error:</strong> ' + (data.message || 'Could not run tests.'));
                    return;
                }
                if (data.expired) {
                    showRunResult('err', '<strong>Time expired.</strong> Submit your code to finalise the attempt.');
                    return;
                }
                var r = data.result || {};
                var cls = verdictClass(r.status);
                var passed = r.passedSampleTests || r.passedTests || 0;
                var total  = r.sampleTests || r.totalTests || 0;
                var html = '<strong>' + friendlyStatus(r.status) + '</strong>';
                html += ' &mdash; Sample tests: <strong>' + passed + ' / ' + total + '</strong> passed';
                if (r.message) html += '<pre>' + r.message.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</pre>';
                showRunResult(cls, html);
            })
            .catch(function () {
                running = false;
                runBtn.disabled = false;
                runBtn.innerHTML = '<i class="fa-solid fa-play"></i> Run Sample Tests';
                showRunResult('err', '<strong>Network error.</strong> Could not reach the server.');
            });
        });
    }

    // ── Pack and submit ───────────────────────────────────────────────
    // Only { questionId, language, code } are included.
    // Verdict, score, and XP are derived server-side.
    function packAndSubmit() {
        if (submitting) return;
        saveCurrent();

        var payload = editors().map(function (ed) {
            var idx  = parseInt(ed.dataset.qindex, 10);
            var code = (codeStore[idx] && codeStore[idx][currentLang]) ? codeStore[idx][currentLang] : ed.value;
            return {
                questionId: ed.getAttribute('data-qid'),
                language:   currentLang || '',
                code:       code
            };
        });

        subsField.value = JSON.stringify(payload);
        submitting = true;
        clearInterval(tick);

        var btn = document.getElementById('submitCoding');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Evaluating…';
        }
        if (runBtn) runBtn.disabled = true;

        form.submit();
    }

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        var empty = editors().every(function (ed) {
            var idx  = parseInt(ed.dataset.qindex, 10);
            var code = (codeStore[idx] && codeStore[idx][currentLang]) ? codeStore[idx][currentLang] : ed.value;
            return code.trim().length === 0;
        });
        if (empty && !confirm('You have not written any code. Submit anyway?')) return;
        packAndSubmit();
    });

    // Warn before navigating away with unsaved code.
    window.addEventListener('beforeunload', function (e) {
        if (submitting) return;
        var hasCode = editors().some(function (ed) {
            var idx  = parseInt(ed.dataset.qindex, 10);
            var code = (codeStore[idx] && codeStore[idx][currentLang]) ? codeStore[idx][currentLang] : ed.value;
            return code.trim().length > 0;
        });
        if (hasCode) {
            e.preventDefault();
            e.returnValue = '';
        }
    });

})();