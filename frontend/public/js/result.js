// Result page interactivity: expandable question review cards and
// explanation-section accordions. External file from the start (not
// inline) - this project's Content-Security-Policy blocks inline
// scripts and inline event handler attributes, a lesson learned
// repeatedly earlier in this build.

document.addEventListener('DOMContentLoaded', function () {
    // Question review cards - click the header to expand/collapse the
    // full answer/explanation body.
    document.querySelectorAll('[data-toggle-question]').forEach(function (header) {
        header.addEventListener('click', function () {
            const item = header.closest('.q-review-item');
            if (item) item.classList.toggle('open');
        });
    });

    // Explanation sub-sections (Quick Answer, Step-by-Step, Formula,
    // Shortcut, Common Mistake) - independent toggles within each
    // question card, so opening one doesn't affect the others.
    document.querySelectorAll('[data-toggle-explain]').forEach(function (toggle) {
        toggle.addEventListener('click', function (e) {
            e.stopPropagation(); // don't also collapse the parent question card
            const block = toggle.closest('.explain-block');
            if (block) block.classList.toggle('open');
        });
    });
});
