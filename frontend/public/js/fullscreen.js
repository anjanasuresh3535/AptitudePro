/**
 * AptitudePro - Universal Fullscreen & Persistent Shell Controller
 *
 * Solves the browser standard restriction where navigating or submitting forms
 * forcibly drops native fullscreen.
 *
 * Architecture:
 * 1. Host Window (window === window.top):
 *    - Controls the native HTML5 Fullscreen API on the browser viewport.
 *    - When in fullscreen, intercepting internal navigations/forms opens them inside
 *      a seamless, 100vw x 100vh embedded shell iframe.
 *    - Because the host document never unloads, THE BROWSER NEVER EXITS FULLSCREEN.
 *    - Synchronizes the address bar URL (history.pushState) and document.title with
 *      the page running inside the shell.
 *
 * 2. Shell Context (window !== window.top):
 *    - Every page runs in its own authentic document context with its full <head>,
 *      stylesheets, scripts, CodeMirror/Monaco, timers, and form submissions.
 *    - No CSS squishing, no script re-execution bugs, 100% native page rendering.
 *    - Communicates with window.top via postMessage to exit fullscreen or sync URLs.
 */
(function () {
    'use strict';

    var STORAGE_KEY = 'aptitudepro_fs_intent';
    var isTop = (window === window.top);
    var _intentionalExit = false;
    var currentIframeUrl = '';

    /* ── Storage Helpers ────────────────────────────────────────────────── */

    function hasIntent() {
        try {
            return sessionStorage.getItem(STORAGE_KEY) === '1' ||
                   localStorage.getItem(STORAGE_KEY) === '1';
        } catch (e) { return false; }
    }

    function setIntent() {
        try {
            sessionStorage.setItem(STORAGE_KEY, '1');
            localStorage.setItem(STORAGE_KEY, '1');
        } catch (e) {}
        _intentionalExit = false;
    }

    function clearIntent() {
        try {
            sessionStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(STORAGE_KEY);
        } catch (e) {}
        _intentionalExit = true;
    }

    /* ── Native Fullscreen API ───────────────────────────────────────────── */

    function isFSActive() {
        if (!isTop) {
            // Inside iframe: ask or assume active if parent is shell
            return true;
        }
        return !!(document.fullscreenElement       ||
                  document.webkitFullscreenElement ||
                  document.mozFullScreenElement    ||
                  document.msFullscreenElement);
    }

    function _requestHostFS() {
        if (isFSActive()) return;
        var el = document.documentElement;
        var fn = el.requestFullscreen ||
                 el.webkitRequestFullscreen ||
                 el.mozRequestFullScreen    ||
                 el.msRequestFullscreen;
        if (!fn) return;
        try {
            var p = fn.call(el);
            if (p && p.catch) {
                p.catch(function () {
                    showPill();
                });
            }
        } catch (_) {
            showPill();
        }
    }

    function _exitHostFS() {
        var fn = document.exitFullscreen       ||
                 document.webkitExitFullscreen  ||
                 document.mozCancelFullScreen   ||
                 document.msExitFullscreen;
        if (!fn) return;
        try {
            var p = fn.call(document);
            if (p && p.catch) p.catch(function () {});
        } catch (_) {}
    }

    /* ── Persistent Shell Frame (Host Window Only) ───────────────────────── */

    function getOrCreateShellFrame() {
        if (!isTop) return null;
        var frame = document.getElementById('agyFullscreenFrame');
        if (!frame) {
            frame = document.createElement('iframe');
            frame.id = 'agyFullscreenFrame';
            frame.name = 'agyFullscreenFrame';
            frame.className = 'agy-fullscreen-frame';
            frame.setAttribute('allow', 'fullscreen');
            document.body.appendChild(frame);
            document.body.classList.add('fullscreen-shell-active');
        }
        return frame;
    }

    function removeShellFrame() {
        if (!isTop) return;
        var frame = document.getElementById('agyFullscreenFrame');
        if (frame && frame.parentNode) {
            frame.parentNode.removeChild(frame);
        }
        document.body.classList.remove('fullscreen-shell-active');
    }

    function navigateInShell(url) {
        if (!isTop) {
            window.location.href = url;
            return;
        }
        var frame = getOrCreateShellFrame();
        currentIframeUrl = url;
        frame.src = url;
        try {
            window.history.pushState(null, '', url);
        } catch (_) {}
    }

    /* ── Toggle / Enter / Exit Handlers ──────────────────────────────────── */

    function enterFullscreen() {
        setIntent();
        if (isTop) {
            _requestHostFS();
            syncUI();
        } else {
            try {
                window.top.postMessage({ type: 'APTY_FS_ENTER' }, '*');
            } catch (_) {}
        }
    }

    function exitFullscreen() {
        clearIntent();
        hidePill();
        if (isTop) {
            _exitHostFS();
            var target = currentIframeUrl;
            removeShellFrame();
            syncUI();
            if (target && target !== window.location.href && !target.includes('/logout')) {
                window.location.href = target;
            }
        } else {
            try {
                window.top.postMessage({ type: 'APTY_FS_EXIT', currentUrl: window.location.href }, '*');
            } catch (_) {
                _exitHostFS();
            }
        }
    }

    function toggleFullscreen() {
        if (!isTop) {
            exitFullscreen();
            return;
        }
        if (isFSActive()) {
            exitFullscreen();
        } else {
            enterFullscreen();
        }
    }

    window.toggleGlobalFullscreen = toggleFullscreen;
    window.enterGlobalFullscreen  = enterFullscreen;
    window.exitGlobalFullscreen   = exitFullscreen;

    /* ── Resume Notification Pill ────────────────────────────────────────── */

    function showPill() {
        if (isFSActive() || !hasIntent() || _intentionalExit || !isTop) return;
        var pill = document.getElementById('_agy_fs_pill');
        if (!pill) {
            pill = document.createElement('div');
            pill.id = '_agy_fs_pill';
            pill.className = 'fullscreen-resume-pill';
            pill.innerHTML =
                '<span class="fullscreen-resume-dot"></span>' +
                '<span>Click to Resume Full Screen &nbsp;<b>(F)</b></span>';
            document.body.appendChild(pill);
        }
        pill.style.display = 'inline-flex';
        pill.onclick = function (e) {
            e.stopPropagation();
            enterFullscreen();
        };
    }

    function hidePill() {
        var pill = document.getElementById('_agy_fs_pill');
        if (pill) pill.style.display = 'none';
    }

    /* ── UI Elements Sync ────────────────────────────────────────────────── */

    function syncUI() {
        var active = !isTop || isFSActive();

        document.body.classList.toggle('fullscreen-active', active);
        document.documentElement.classList.toggle('fullscreen-active', active);

        if (active) {
            hidePill();
        } else if (hasIntent() && !_intentionalExit) {
            showPill();
        }

        // Icons
        document.querySelectorAll('.fullscreen-icon-expand').forEach(function (el) {
            el.style.display = active ? 'none' : 'block';
        });
        document.querySelectorAll('.fullscreen-icon-compress').forEach(function (el) {
            el.style.display = active ? 'block' : 'none';
        });

        // Buttons
        document.querySelectorAll(
            '.btn-nav-fullscreen, .global-fullscreen-fab, #globalFullscreenBtn,' +
            '#btnNavFullscreen, #btnToggleFullscreen, #btnFloatingFullscreen'
        ).forEach(function (btn) {
            var span = btn.querySelector('span, .btn-text');
            var icon = btn.querySelector('i');
            if (span) span.textContent = active ? 'Exit Full Screen' : 'Full Screen';
            if (icon) {
                icon.classList.toggle('fa-expand',   !active);
                icon.classList.toggle('fa-compress',  active);
            }
            btn.classList.toggle('active', active);
            btn.setAttribute('title',      active ? 'Exit Full Screen (F)' : 'Toggle Full Screen (F)');
            btn.setAttribute('aria-label', active ? 'Exit Full Screen'     : 'Toggle Full Screen');
        });

        // Legacy IDs
        var pIcon = document.getElementById('fullscreenIcon');
        var pText = document.getElementById('fullscreenText');
        var fIcon = document.getElementById('floatingFullscreenIcon');
        var fIcon2 = document.getElementById('floatingFsIcon');
        if (pIcon)  pIcon.className  = active ? 'fa-solid fa-compress' : 'fa-solid fa-expand';
        if (pText)  pText.textContent = active ? 'Exit Full Screen'     : 'Full Screen';
        if (fIcon)  fIcon.className  = active ? 'fa-solid fa-compress' : 'fa-solid fa-expand';
        if (fIcon2) fIcon2.className = active ? 'fa-solid fa-compress' : 'fa-solid fa-expand';
    }

    /* ── FAB Auto-Injection (if not already in DOM) ───────────────────────── */

    function ensureFAB() {
        if (document.getElementById('globalFullscreenBtn') ||
            document.getElementById('btnFloatingFullscreen')) return;

        var wrap = document.createElement('div');
        wrap.className = 'global-fullscreen-fab-container';
        wrap.id = 'globalFullscreenFabContainer';

        var btn = document.createElement('button');
        btn.type = 'button';
        btn.id   = 'globalFullscreenBtn';
        btn.className = 'global-fullscreen-fab';
        btn.setAttribute('title',      'Toggle Full Screen (or press F)');
        btn.setAttribute('aria-label', 'Toggle Full Screen');
        btn.innerHTML =
            '<svg class="fullscreen-icon-expand" viewBox="0 0 24 24" width="22" height="22"' +
            ' stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round">' +
            '<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>' +
            '</svg>' +
            '<svg class="fullscreen-icon-compress" viewBox="0 0 24 24" width="22" height="22"' +
            ' stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="display:none;">' +
            '<path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path>' +
            '</svg>';

        wrap.appendChild(btn);
        document.body.appendChild(wrap);
    }

    /* ── Event Setup ─────────────────────────────────────────────────────── */

    var FS_BTN_SELECTOR =
        '.btn-nav-fullscreen, .global-fullscreen-fab, #globalFullscreenBtn,' +
        '#btnNavFullscreen, #btnToggleFullscreen, #btnFloatingFullscreen';

    function init() {
        ensureFAB();

        /* If inside the iframe shell, notify parent about URL and title */
        if (!isTop) {
            try {
                window.top.postMessage({
                    type: 'APTY_FS_NAVIGATED',
                    url: window.location.href,
                    title: document.title
                }, '*');
            } catch (_) {}
            syncUI();
        }

        /* 1. Fullscreen button clicks */
        document.addEventListener('click', function (e) {
            var btn = e.target.closest(FS_BTN_SELECTOR);
            if (btn) {
                e.preventDefault();
                e.stopImmediatePropagation();
                toggleFullscreen();
            }
        }, false);

        /* 2. Top Window: Intercept internal link clicks when in Fullscreen */
        if (isTop) {
            document.addEventListener('click', function (e) {
                if (!isFSActive()) return;

                var link = e.target.closest('a');
                if (!link || !link.href) return;

                // Ignore target="_blank", downloads, mailto, tel, or fragment links on same page
                if (link.target === '_blank' || link.hasAttribute('download')) return;
                if (link.href.startsWith('mailto:') || link.href.startsWith('tel:')) return;
                if (link.pathname === window.location.pathname && link.hash) return;
                if (link.pathname === '/logout') return; // Allow clean logout

                // Internal link check
                var targetUrl;
                try {
                    targetUrl = new URL(link.href, window.location.origin);
                } catch (_) { return; }

                if (targetUrl.origin === window.location.origin) {
                    e.preventDefault();
                    navigateInShell(targetUrl.href);
                }
            }, false);

            /* Top Window: Intercept form submissions when in Fullscreen */
            document.addEventListener('submit', function (e) {
                if (!isFSActive()) return;
                var form = e.target;
                if (!form || form.target === '_blank') return;
                if (form.action && form.action.includes('/logout')) return;

                // Direct submission into the persistent fullscreen frame
                var frame = getOrCreateShellFrame();
                form.target = frame.name || 'agyFullscreenFrame';
            }, false);

            /* Top Window: Listen to messages from child frame */
            window.addEventListener('message', function (e) {
                if (!e.data || typeof e.data !== 'object') return;

                if (e.data.type === 'APTY_FS_NAVIGATED') {
                    currentIframeUrl = e.data.url;
                    try {
                        window.history.replaceState(null, '', e.data.url);
                        if (e.data.title) {
                            document.title = e.data.title;
                        }
                    } catch (_) {}
                } else if (e.data.type === 'APTY_FS_EXIT') {
                    if (e.data.currentUrl) currentIframeUrl = e.data.currentUrl;
                    exitFullscreen();
                } else if (e.data.type === 'APTY_FS_ENTER') {
                    enterFullscreen();
                }
            });

            /* Top Window: Handle browser Back / Forward buttons */
            window.addEventListener('popstate', function () {
                var frame = document.getElementById('agyFullscreenFrame');
                if (frame && frame.contentWindow) {
                    try {
                        frame.contentWindow.location.href = window.location.href;
                    } catch (_) {}
                }
            });
        }

        /* 3. Browser native fullscreen state change events */
        ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange']
            .forEach(function (ev) {
                document.addEventListener(ev, function () {
                    if (isTop && !isFSActive()) {
                        if (hasIntent() && !_intentionalExit) {
                            showPill();
                        }
                        // If user pressed Esc while viewing a shell page, restore that page in top window
                        var target = currentIframeUrl;
                        removeShellFrame();
                        syncUI();
                        if (target && target !== window.location.href && !target.includes('/logout')) {
                            window.location.href = target;
                        }
                    } else {
                        syncUI();
                    }
                });
            });

        /* 4. Keyboard Shortcut: 'F' to toggle fullscreen */
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') return;

            var tag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
            var inEditor = tag === 'input' || tag === 'textarea' || tag === 'select' ||
                           (document.activeElement && document.activeElement.isContentEditable);

            if ((e.key === 'f' || e.key === 'F') && !inEditor && !e.ctrlKey && !e.altKey && !e.metaKey) {
                e.preventDefault();
                toggleFullscreen();
            }
        });

        /* 5. Window visibility / focus (returns from other tabs or windows) */
        document.addEventListener('visibilitychange', function () {
            if (document.visibilityState === 'visible' && hasIntent() && !isFSActive() && !_intentionalExit) {
                showPill();
            }
        });

        window.addEventListener('focus', function () {
            if (hasIntent() && !isFSActive() && !_intentionalExit) {
                showPill();
            }
        });

        /* 6. On first load in host window */
        if (isTop && hasIntent() && !_intentionalExit) {
            document.body.classList.add('fullscreen-active');
            document.documentElement.classList.add('fullscreen-active');
            _requestHostFS();
        }

        syncUI();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
