// Disclosure navigation only. No formula, input, storage, analytics or network access.
(() => {
  for (const root of document.querySelectorAll('.sk-v2[data-v2-system="1"]')) {
    const button = root.querySelector('[data-v2s-menu]');
    if (!button) continue;
    const nav = root.querySelector('#' + CSS.escape(button.getAttribute('aria-controls')));
    if (!nav) continue;
    const desktop = matchMedia('(min-width: 48rem)');
    const close = (restore = false) => {
      button.setAttribute('aria-expanded', 'false');
      nav.hidden = !desktop.matches;
      if (restore && !desktop.matches) button.focus();
    };
    const sync = () => {
      button.hidden = desktop.matches;
      close(!desktop.matches && nav.contains(document.activeElement));
    };
    button.addEventListener('click', () => {
      const open = button.getAttribute('aria-expanded') !== 'true';
      button.setAttribute('aria-expanded', String(open));
      nav.hidden = !open;
    });
    nav.addEventListener('click', event => { if (event.target.closest('a')) close(); });
    root.addEventListener('keydown', event => {
      if (event.key === 'Escape' && button.getAttribute('aria-expanded') === 'true') {
        event.preventDefault(); close(true);
      }
    });
    desktop.addEventListener('change', sync);
    sync();
  }
})();
