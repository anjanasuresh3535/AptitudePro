// Dashboard scroll-reveal + bar-fill animations.
// Externalized from an inline <script> block (copied verbatim from the
// original AptitudePro dashboard.ejs) because this app's Content-Security-
// Policy (helmet() in app.js) blocks inline script content - same root
// cause as the earlier register.ejs password-strength bug. Logic is
// byte-for-byte identical to the original inline version, just moved
// to a file so it actually executes.

document.addEventListener('DOMContentLoaded', function() {
    const elements = document.querySelectorAll('.animate');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, i * 80);
            }
        });
    }, { threshold: 0.1 });
    elements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'all 0.6s cubic-bezier(0.22, 1, 0.36, 1)';
        observer.observe(el);
    });
});

document.addEventListener('DOMContentLoaded', function() {
    const fills = document.querySelectorAll('.bar-fill, .section-bar-fill');
    fills.forEach(fill => {
        const width = fill.style.width;
        fill.style.width = '0%';
        setTimeout(() => {
            fill.style.width = width;
        }, 300);
    });
});
