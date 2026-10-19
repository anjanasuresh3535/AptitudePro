/**
 * frontend/public/js/wipro-coding-v2.js
 *
 * Client-side controller for the Wipro Coding Assessment.
 * Uses CodeMirror 5 (loaded via CDN before this script) for a professional
 * editor experience: syntax highlighting, line numbers, bracket matching,
 * auto-indent, active-line highlight.
 *
 * ARCHITECTURE
 *   · ONE CodeMirror instance is created on #cmEditorHost.
 *   · Code for every (problem × language) pair is stored in codeStore[prob][lang].
 *   · Switching problem or language: saves current CM value → updates codeStore
 *     → loads the new pair's stored value into CM → sets the language mode.
 *   · On submit, collectSubmissions() reads the best-effort code from codeStore
 *     and sends { questionId, language, code } to the server.
 *
 * TRUST MODEL (enforced server-side)
 *   · deadline = absolute UNIX timestamp issued by server. Client countdown is
 *     display-only; server re-checks on submit.
 *   · Only { questionId, language, code } are sent. Verdict/XP computed server-side.
 */
(function () {
    'use strict';

    /* ── Wait for CodeMirror to be ready ────────────────────────
       CM is loaded via CDN <script> tags placed before this file,
       so it should always be defined. Guard defensively.           */
    if (typeof CodeMirror === 'undefined') {
        console.error('[wipro-coding] CodeMirror not loaded — falling back to plain textarea.');
        initFallback();
        return;
    }

    /* ── DOM references ─────────────────────────────────────── */
    var cmHost         = document.getElementById('cmEditorHost');
    var timerEl        = document.getElementById('timerDisplay');
    var probTabsEl     = document.getElementById('probTabs');
    var langTabsEl     = document.getElementById('langTabs');
    var runPanel       = document.getElementById('runPanel');
    var runBtn         = document.getElementById('runSamplesBtn');   // null if execution off
    var submitBtn      = document.getElementById('submitCodeBtn');
    var finishBtn      = document.getElementById('finishBtn');
    var finishModal    = document.getElementById('finishModal');
    var finishBody     = document.getElementById('finishModalBody');
    var cancelFinish   = document.getElementById('cancelFinishBtn');
    var confirmFinish  = document.getElementById('confirmFinishBtn');
    var loadStarter    = document.getElementById('loadStarterBtn');
    var clearEditor    = document.getElementById('clearEditorBtn');
    var javaHint       = document.getElementById('javaHint');
    var editorProbLbl  = document.getElementById('editorProbLabel');
    var lineColInfo    = document.getElementById('lineColInfo');
    var autoSaveEl     = document.getElementById('autosave-indicator');
    var form           = document.getElementById('codingForm');
    var subsField      = document.getElementById('submissionsField');

    if (!cmHost || !timerEl || !form) return;

    /* ── Load JSON data blocks ──────────────────────────────── */
    var starters = {};
    var problemMeta = [];   // [{id, title}, ...]
    try { starters    = JSON.parse(document.getElementById('startersData').textContent);  } catch(e) {}
    try { problemMeta = JSON.parse(document.getElementById('problemsData').textContent);  } catch(e) {}

    // Build (prob → questionId) from hidden inputs
    var probQids = {};
    document.querySelectorAll('.prob-qid-ref').forEach(function(el) {
        probQids[parseInt(el.getAttribute('data-prob'), 10)] = el.getAttribute('data-qid');
    });

    var numProblems = problemMeta.length;
    if (numProblems === 0) return;

    /* ── State ───────────────────────────────────────────────── */
    var currentProb  = 0;
    var currentLang  = null;
    var submitting   = false;
    var running      = false;
    var autoSubmit   = false;
    var deadline     = parseInt(timerEl.getAttribute('data-deadline'), 10) || 0;

    // Determine initial language from first active lang tab
    var firstLangTab = langTabsEl ? langTabsEl.querySelector('.lang-tab') : null;
    if (firstLangTab) currentLang = firstLangTab.getAttribute('data-lang') || 'Python';

    /* ── codeStore[prob][lang] = code string ──────────────────
       Pre-populate with starter templates so the editor always
       starts with useful boilerplate.                            */
    var codeStore = {};
    for (var pi = 0; pi < numProblems; pi++) {
        codeStore[pi] = {};
        if (langTabsEl) {
            langTabsEl.querySelectorAll('.lang-tab').forEach(function(lt) {
                var l = lt.getAttribute('data-lang');
                codeStore[pi][l] = (starters && starters[l]) ? starters[l] : '';
            });
        }
    }

    /* ── Language → CodeMirror mode map ────────────────────── */
    var CM_MODES = {
        'C':      'text/x-csrc',
        'C++':    'text/x-c++src',
        'Java':   'text/x-java',
        'Python': 'text/x-python'
    };

    function modeFor(lang) {
        return CM_MODES[lang] || 'text/plain';
    }

    /* ── Initialise CodeMirror ──────────────────────────────── */
    var cm = CodeMirror(cmHost, {
        value:            codeStore[0][currentLang] || '',
        mode:             modeFor(currentLang),
        theme:            'dracula',
        lineNumbers:      true,
        indentUnit:       4,
        tabSize:          4,
        indentWithTabs:   false,
        matchBrackets:    true,
        autoCloseBrackets: true,
        styleActiveLine:  true,
        lineWrapping:     false,
        scrollbarStyle:   'native',
        autofocus:        true,
        extraKeys: {
            'Tab':          function(cm) { cm.execCommand('insertSoftTab'); },
            'Ctrl-Enter':   function()   { openFinishModal(); },
            'Ctrl-R':       function()   { runSamples(); },
            'Ctrl-1':       function()   { switchProblem(0); },
            'Ctrl-2':       function()   { switchProblem(1); },
        }
    });

    /* ── Update line/col info as cursor moves ────────────────── */
    cm.on('cursorActivity', function() {
        var pos = cm.getCursor();
        if (lineColInfo) lineColInfo.textContent = 'Ln ' + (pos.line + 1) + ', Col ' + (pos.ch + 1);
        scheduleAutosave();
    });
    cm.on('change', function() {
        scheduleAutosave();
    });

    /* ── Save current CM content back to codeStore ───────────── */
    function saveCurrentCode() {
        codeStore[currentProb][currentLang] = cm.getValue();
    }

    /* ── Switch problem ────────────────────────────────────── */
    function switchProblem(idx) {
        if (idx < 0 || idx >= numProblems) return;
        saveCurrentCode();
        currentProb = idx;

        // Update prob tab styles
        if (probTabsEl) {
            probTabsEl.querySelectorAll('.prob-tab').forEach(function(t, i) {
                t.classList.toggle('active', i === idx);
            });
        }

        // Update problem view panels
        for (var j = 0; j < numProblems; j++) {
            var v = document.getElementById('pview-' + j);
            if (v) { v.classList.toggle('active', j === idx); v.style.display = (j === idx ? 'block' : 'none'); }
        }

        // Scroll problem panel back to top
        var ps = document.getElementById('problemScroll');
        if (ps) ps.scrollTop = 0;

        // Update editor label
        var meta = problemMeta[idx];
        if (editorProbLbl && meta) editorProbLbl.textContent = 'P' + (idx+1) + ': ' + meta.title;

        // Load this problem's code for current language into CM
        cm.setValue(codeStore[idx][currentLang] || starters[currentLang] || '');
        cm.clearHistory();  // separate undo history per problem
        cm.focus();
        hideRunPanel();
    }

    /* ── Switch language ─────────────────────────────────────── */
    function switchLang(lang) {
        saveCurrentCode();
        currentLang = lang;

        // Update lang tab styles
        if (langTabsEl) {
            langTabsEl.querySelectorAll('.lang-tab').forEach(function(t) {
                t.classList.toggle('active', t.getAttribute('data-lang') === lang);
            });
        }

        // Java hint
        if (javaHint) javaHint.classList.toggle('show', lang === 'Java');

        // Update CM mode + value
        cm.setOption('mode', modeFor(lang));
        cm.setValue(codeStore[currentProb][lang] || starters[lang] || '');
        cm.clearHistory();
        cm.focus();
        hideRunPanel();
    }

    /* ── Load starter template ───────────────────────────────── */
    function doLoadStarter(force) {
        var tmpl = (starters && starters[currentLang]) ? starters[currentLang] : '';
        if (!tmpl) { showToast('No starter template for ' + currentLang + '.', 'info'); return; }
        if (!force && cm.getValue().trim().length > 0) {
            if (!confirm('Replace your current code with the starter template for ' + currentLang + '?')) return;
        }
        cm.setValue(tmpl);
        codeStore[currentProb][currentLang] = tmpl;
        cm.focus();
        markAutosaved();
    }

    /* ── Autosave indicator ─────────────────────────────────── */
    var autosaveTimer;
    function scheduleAutosave() {
        clearTimeout(autosaveTimer);
        autosaveTimer = setTimeout(function() {
            saveCurrentCode();
            markAutosaved();
        }, 800);
    }
    function markAutosaved() {
        if (!autoSaveEl) return;
        autoSaveEl.classList.add('saved');
        autoSaveEl.innerHTML = '<i class="fa-solid fa-circle-check"></i> saved';
        setTimeout(function() {
            autoSaveEl.classList.remove('saved');
            autoSaveEl.innerHTML = '<i class="fa-solid fa-circle-dot"></i> autosaved';
        }, 2500);
    }

    /* ── Run result panel ────────────────────────────────────── */
    function showRunPanel(cls, html) {
        if (!runPanel) return;
        runPanel.className = 'run-panel show ' + cls;
        runPanel.innerHTML = html;
    }
    function hideRunPanel() {
        if (!runPanel) return;
        runPanel.className = 'run-panel';
        runPanel.innerHTML = '';
    }

    /* ── Toast notifications ─────────────────────────────────── */
    function showToast(msg, type) {
        var tc = document.getElementById('toast-container');
        if (!tc) return;
        var t = document.createElement('div');
        t.className = 'toast ' + (type || 'info');
        t.textContent = msg;
        tc.appendChild(t);
        setTimeout(function() { if (t.parentNode) t.parentNode.removeChild(t); }, 4000);
    }

    /* ── Timer ──────────────────────────────────────────────── */
    function pad(n) { return n < 10 ? '0' + n : '' + n; }

    function tick() {
        var secs = Math.max(0, Math.floor((deadline - Date.now()) / 1000));
        timerEl.textContent = pad(Math.floor(secs / 60)) + ':' + pad(secs % 60);
        timerEl.classList.toggle('warn',   secs > 0 && secs <= 300 && secs > 60);
        timerEl.classList.toggle('danger', secs > 0 && secs <= 60);
        if (secs === 300) showTimerWarning('5 minutes remaining', 'yellow');
        if (secs === 60)  showTimerWarning('1 minute remaining — submit now!', 'red');
        if (secs === 0 && !autoSubmit) { autoSubmit = true; showToast('Time is up! Submitting…', 'warning'); setTimeout(doSubmit, 1500); }
    }
    setInterval(tick, 500);
    tick();

    function showTimerWarning(msg, color) {
        var el = document.createElement('div');
        el.className = 'timer-warning ' + color;
        el.innerHTML = '<i class="fa-solid fa-clock"></i> ' + msg;
        document.body.appendChild(el);
        setTimeout(function() { if (el.parentNode) el.parentNode.removeChild(el); }, 4500);
    }

    /* ── Collect all submissions for POST body ───────────────── */
    function collectSubmissions() {
        saveCurrentCode();   // flush current CM content first
        return Array.from({length: numProblems}, function(_, pi) {
            var qid  = probQids[pi] || (problemMeta[pi] && problemMeta[pi].id) || '';
            // Pick the language with the most code written for this problem
            var bestLang = currentLang;
            var bestCode = '';
            Object.keys(codeStore[pi] || {}).forEach(function(l) {
                var c = codeStore[pi][l] || '';
                if (c.trim().length > bestCode.trim().length) { bestCode = c; bestLang = l; }
            });
            return { questionId: qid, language: bestLang, code: bestCode };
        });
    }

    /* ── Run sample tests ────────────────────────────────────── */
    function runSamples() {
        if (running) return;
        var code = cm.getValue();
        var qid  = probQids[currentProb] || '';
        if (code.trim().length === 0) { showToast('Write some code before running.', 'warning'); return; }

        running = true;
        if (runBtn) { runBtn.disabled = true; runBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Running…'; }
        showRunPanel('info', '<i class="fa-solid fa-spinner fa-spin"></i> Running against sample test cases…');

        fetch('/wipro/coding/run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ questionId: qid, language: currentLang, code: code })
        })
        .then(function(r) { return r.json(); })
        .then(function(data) {
            var r = data.result || {};
            if (!data.ok) { showRunPanel('err', '<strong>Error:</strong> ' + esc(data.message || 'Unknown error.')); return; }
            if (!data.executionAvailable) { showRunPanel('info', '<strong>Execution unavailable.</strong> Code saved. Submit when ready.'); return; }
            var passed = r.passedSampleTests || 0;
            var total  = r.sampleTests || 1;
            var ok     = r.status === 'accepted' || r.status === 'sample_passed';
            var html   = (ok ? '✅' : '❌') + ' <strong>' + passed + ' / ' + total + ' sample test' + (total===1?'':'s') + ' passed</strong>';
            if (r.message) html += '<pre>' + esc(r.message) + '</pre>';
            showRunPanel(ok ? 'ok' : 'err', html);
        })
        .catch(function() { showRunPanel('err', '<strong>Network error.</strong> Check your connection and try again.'); })
        .finally(function() {
            running = false;
            if (runBtn) { runBtn.disabled = false; runBtn.innerHTML = '<i class="fa-solid fa-play"></i> Run Code'; }
        });
    }

    /* ── Submit (form POST) ──────────────────────────────────── */
    function doSubmit() {
        if (submitting) return;
        submitting = true;
        if (subsField) subsField.value = JSON.stringify(collectSubmissions());
        if (submitBtn) { submitBtn.disabled = true; submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting…'; }
        if (runBtn)    runBtn && (runBtn.disabled = true);
        if (finishBtn) finishBtn.disabled = true;
        if (form)      form.submit();
    }

    /* ── Finish confirmation modal ───────────────────────────── */
    function openFinishModal() {
        if (submitting) return;
        saveCurrentCode();
        var lines = [];
        for (var pi = 0; pi < numProblems; pi++) {
            var meta = problemMeta[pi];
            var hasCode = Object.values(codeStore[pi] || {}).some(function(c) { return c.trim().length > 0; });
            lines.push('Problem ' + (pi+1) + (meta ? ': ' + meta.title : '') + ' — ' + (hasCode ? '✅ Code written' : '⚠️ No code yet'));
        }
        if (finishBody) {
            finishBody.innerHTML =
                '<pre style="font-size:0.8rem;text-align:left;background:rgba(255,255,255,0.04);padding:12px;border-radius:8px;margin-bottom:14px;font-family:monospace;white-space:pre">' +
                esc(lines.join('\n')) + '</pre>This will submit all your code and end the test. You cannot return after finishing.';
        }
        if (finishModal) finishModal.classList.add('show');
    }
    function closeFinishModal() {
        if (finishModal) finishModal.classList.remove('show');
    }

    /* ── HTML escape helper ──────────────────────────────────── */
    function esc(s) {
        return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    /* ── Event bindings ─────────────────────────────────────── */
    // Problem tabs
    if (probTabsEl) {
        probTabsEl.addEventListener('click', function(e) {
            var btn = e.target.closest('.prob-tab');
            if (!btn) return;
            var idx = parseInt(btn.getAttribute('data-idx'), 10);
            if (!isNaN(idx)) switchProblem(idx);
        });
    }

    // Language tabs
    if (langTabsEl) {
        langTabsEl.addEventListener('click', function(e) {
            var btn = e.target.closest('.lang-tab');
            if (!btn) return;
            var lang = btn.getAttribute('data-lang');
            if (lang) switchLang(lang);
        });
    }

    if (runBtn)        runBtn.addEventListener('click', runSamples);
    if (submitBtn)     submitBtn.addEventListener('click', openFinishModal);
    if (finishBtn)     finishBtn.addEventListener('click', openFinishModal);
    if (cancelFinish)  cancelFinish.addEventListener('click', closeFinishModal);
    if (confirmFinish) confirmFinish.addEventListener('click', function() { closeFinishModal(); doSubmit(); });
    if (finishModal)   finishModal.addEventListener('click', function(e) { if (e.target === finishModal) closeFinishModal(); });
    if (loadStarter)   loadStarter.addEventListener('click', function() { doLoadStarter(false); });
    if (clearEditor)   clearEditor.addEventListener('click', function() {
        if (cm.getValue().trim().length === 0) return;
        if (!confirm('Clear your code for this problem?')) return;
        cm.setValue('');
        codeStore[currentProb][currentLang] = '';
        cm.focus();
        markAutosaved();
    });

    // Close modal on Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeFinishModal();
    });

    // Warn on accidental navigation
    window.addEventListener('beforeunload', function(e) {
        if (!submitting) { e.preventDefault(); e.returnValue = 'Your code will be lost. Submit first!'; }
    });

    /* ── Initial state ─────────────────────────────────────── */
    switchProblem(0);      // activates panel + loads first problem/lang into CM
    switchLang(currentLang || 'Python');
    markAutosaved();

    /* ── Fallback: no CodeMirror ─────────────────────────────
       If CodeMirror fails to load (offline), create a styled
       textarea so the page is still usable.                    */
    function initFallback() {
        var host = document.getElementById('cmEditorHost');
        if (!host) return;
        var ta = document.createElement('textarea');
        ta.style.cssText = 'width:100%;height:100%;background:#070c18;color:#e2e8f0;border:none;padding:16px;font-family:monospace;font-size:0.88rem;resize:none;outline:none;';
        ta.placeholder = '// Write your solution here\n// Read from stdin, write to stdout';
        host.appendChild(ta);
    }

})();
