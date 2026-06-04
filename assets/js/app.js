// Small UI helpers for Shared Kitchen

// Toast notifications
function toast(msg) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2000);
}

// Auto-flash from PHP
document.addEventListener('DOMContentLoaded', () => {
    // Star rating widget
    document.querySelectorAll('.stars[data-input]').forEach(box => {
        const input = document.querySelector('input[name="' + box.dataset.input + '"]');
        const stars = box.querySelectorAll('.star');
        const set = (n) => {
            stars.forEach((s, i) => s.classList.toggle('on', i < n));
            if (input) input.value = n;
        };
        stars.forEach((s, i) => {
            s.addEventListener('click', () => set(i + 1));
        });
        if (input && input.value) set(parseInt(input.value));
    });

    // Chip groups (radio behavior)
    document.querySelectorAll('.chips[data-input]').forEach(box => {
        const input = document.querySelector('input[name="' + box.dataset.input + '"]');
        box.querySelectorAll('.chip').forEach(c => {
            c.addEventListener('click', () => {
                box.querySelectorAll('.chip').forEach(x => x.classList.remove('on'));
                c.classList.add('on');
                if (input) input.value = c.dataset.value;
            });
        });
    });

    // Confirm before delete
    document.querySelectorAll('[data-confirm]').forEach(el => {
        el.addEventListener('click', (e) => {
            if (!confirm(el.dataset.confirm)) e.preventDefault();
        });
    });
});

// Register service worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(() => {});
    });
}
