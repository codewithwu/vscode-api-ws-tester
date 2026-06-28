(function () {
  'use strict';

  // --- Tab toggle inside the mockup (spec §4.3, §5.6) ---
  const tablist = document.querySelector('[role="tablist"]');
  if (tablist) {
    const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));
    const panels = tabs.map(t => document.getElementById(t.getAttribute('aria-controls')));

    function activate(tab) {
      tabs.forEach((t, i) => {
        const selected = t === tab;
        t.setAttribute('aria-selected', String(selected));
        t.setAttribute('tabindex', selected ? '0' : '-1');
        if (panels[i]) {
          if (selected) {
            panels[i].removeAttribute('hidden');
          } else {
            panels[i].setAttribute('hidden', '');
          }
        }
      });
    }

    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => activate(tab));
      tab.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          e.preventDefault();
          const dir = e.key === 'ArrowRight' ? 1 : -1;
          const next = tabs[(i + dir + tabs.length) % tabs.length];
          activate(next);
          next.focus();
        }
      });
    });
  }

  // --- Copy to clipboard on the install command (spec §5.4) ---
  document.querySelectorAll('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const text = btn.getAttribute('data-copy') || '';
      try {
        await navigator.clipboard.writeText(text);
        const original = btn.textContent;
        btn.textContent = 'Copied!';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.textContent = original;
          btn.classList.remove('copied');
        }, 1500);
      } catch (err) {
        // Fallback for older browsers / non-secure contexts
        btn.textContent = 'Press Ctrl+C';
        setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
      }
    });
  });
})();
