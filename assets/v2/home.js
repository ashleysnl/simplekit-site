// Non-modal navigation disclosure. Without JS, ordinary navigation links stay visible.
(() => {
  const header = document.querySelector('[data-v2-header]');
  const button = header?.querySelector('[data-v2-menu-toggle]');
  const navigation = header?.querySelector('[data-v2-navigation]');
  const icon = button?.querySelector('use');
  if (!header || !button || !navigation) return;
  const desktop = window.matchMedia('(min-width: 56.25rem)');
  const isMobile = () => !desktop.matches;
  const isOpen = () => button.getAttribute('aria-expanded') === 'true';
  function setOpen(open, restoreFocus = false) {
    button.setAttribute('aria-expanded', String(open));
    button.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
    navigation.hidden = isMobile() && !open;
    icon?.setAttribute('href', `assets/v2/icons/sprite.svg#${open ? 'close' : 'menu'}`);
    if (restoreFocus && isMobile()) button.focus();
  }
  function synchronize() {
    const active = document.activeElement;
    button.hidden = !isMobile();
    setOpen(false);
    if (isMobile() && navigation.contains(active)) button.focus();
    else if (!isMobile() && active === button) navigation.querySelector('a')?.focus();
  }
  header.setAttribute('data-menu-enhanced', '');
  synchronize();
  button.addEventListener('click', () => setOpen(!isOpen()));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && isMobile() && isOpen()) {
      event.preventDefault();
      setOpen(false, true);
    }
  });
  document.addEventListener('pointerdown', event => {
    if (isMobile() && isOpen() && !header.contains(event.target)) {
      setOpen(false, navigation.contains(document.activeElement));
    }
  });
  header.addEventListener('focusout', event => {
    if (isMobile() && isOpen() && event.relatedTarget && !header.contains(event.relatedTarget)) setOpen(false);
  });
  navigation.addEventListener('click', event => {
    if (event.target.closest('a') && isMobile()) setOpen(false);
  });
  desktop.addEventListener('change', synchronize);
})();
