// Password strength / requirement / confirm-match checker for the
// registration page. Lives in an external file (not inline) because
// this app's Content-Security-Policy (set via helmet() in app.js)
// blocks both inline <script> content and inline event handler
// attributes like oninput="..." - that CSP restriction is intentional
// security hardening, so the fix is to externalize this script rather
// than to loosen the policy.
//
// Client-side only, for UX feedback - the password itself is never
// logged, sent anywhere outside the form submit, or stored. Server-side
// validation in routes/auth.js remains the real source of truth.

document.addEventListener('DOMContentLoaded', function () {
    var MIN_PW_LENGTH = 8;

    var passwordInput = document.getElementById('password');
    var confirmInput = document.getElementById('confirm');
    var form = document.querySelector('form');

    if (!passwordInput || !confirmInput || !form) {
        // Fail safely - if this script ever ends up on a page without
        // these elements, do nothing instead of throwing.
        return;
    }

    function checkStrength(password) {
        var fill = document.getElementById('strengthFill');
        var text = document.getElementById('strengthText');
        var lengthText = document.getElementById('pwLengthText');

        var hasLower = /[a-z]/.test(password);
        var hasUpper = /[A-Z]/.test(password);
        var hasNumber = /[0-9]/.test(password);
        var hasSpecial = /[^A-Za-z0-9]/.test(password);
        var lengthOk = password.length >= MIN_PW_LENGTH;

        lengthText.textContent = 'Password length: ' + password.length + ' / ' + MIN_PW_LENGTH + ' characters' + (lengthOk ? ' \u2713' : '');
        lengthText.className = 'password-meta' + (lengthOk ? ' ok' : '');

        setRequirement('reqLength', lengthOk, 'At least 8 characters');
        setRequirement('reqLower', hasLower, 'Contains a lowercase letter');
        setRequirement('reqUpper', hasUpper, 'Contains an uppercase letter');
        setRequirement('reqNumber', hasNumber, 'Contains a number');
        setRequirement('reqSpecial', hasSpecial, 'Contains a special character');

        // WEAK: under 8 characters, regardless of complexity.
        // MEDIUM: 8+ characters with 1-3 of (lower/upper/number/special).
        // STRONG: 8+ characters with all four present.
        var metCount = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
        var level;

        if (!lengthOk) {
            level = 'weak';
        } else if (metCount >= 4) {
            level = 'strong';
        } else if (metCount >= 2) {
            level = 'medium';
        } else {
            level = 'weak';
        }

        if (password.length === 0) {
            fill.style.width = '0%';
            text.textContent = '';
        } else if (level === 'weak') {
            fill.style.width = '25%';
            fill.style.background = '#ff4444';
            text.style.color = '#ff4444';
            text.textContent = 'Password strength: Weak';
        } else if (level === 'medium') {
            fill.style.width = '60%';
            fill.style.background = '#ffaa00';
            text.style.color = '#ffaa00';
            text.textContent = 'Password strength: Medium';
        } else {
            fill.style.width = '100%';
            fill.style.background = '#00cc44';
            text.style.color = '#00cc44';
            text.textContent = 'Password strength: Strong \u2705';
        }
    }

    function setRequirement(id, met, label) {
        var el = document.getElementById(id);
        el.textContent = (met ? '\u2713 ' : '\u25cb ') + label;
        el.className = met ? 'met' : '';
    }

    function checkConfirmMatch() {
        var password = passwordInput.value;
        var confirm = confirmInput.value;
        var el = document.getElementById('confirmMatchText');

        if (confirm.length === 0) {
            el.textContent = '';
            el.className = 'confirm-match';
            return;
        }

        if (confirm === password) {
            el.textContent = '\u2713 Passwords match';
            el.className = 'confirm-match match';
        } else {
            el.textContent = '\u25cb Passwords do not match';
            el.className = 'confirm-match no-match';
        }
    }

    passwordInput.addEventListener('input', function () {
        checkStrength(passwordInput.value);
        checkConfirmMatch();
    });

    confirmInput.addEventListener('input', checkConfirmMatch);

    form.addEventListener('submit', function (e) {
        var password = passwordInput.value;
        var confirm = confirmInput.value;
        var errorBox = document.getElementById('clientError');

        if (password.length < MIN_PW_LENGTH) {
            e.preventDefault();
            errorBox.textContent = '\u274c Password must be at least ' + MIN_PW_LENGTH + ' characters.';
            errorBox.style.display = 'block';
            return;
        }

        if (password !== confirm) {
            e.preventDefault();
            errorBox.textContent = '\u274c Passwords do not match.';
            errorBox.style.display = 'block';
            return;
        }

        errorBox.style.display = 'none';
    });
});
