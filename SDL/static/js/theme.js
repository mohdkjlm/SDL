/* Run before painting the page to avoid a flash of the wrong theme. */
(() => {
  let saved;
  try { saved = localStorage.getItem('sdl-theme'); } catch (_) { /* Private browser mode. */ }
  const preferred = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  document.documentElement.dataset.theme = ['light', 'dark'].includes(saved) ? saved : preferred;
  window.ServiceDeskTheme = {
    toggle() {
      const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = theme;
      try { localStorage.setItem('sdl-theme', theme); } catch (_) { /* Still works in memory. */ }
      this.updateButton();
    },
    updateButton() {
      const button = document.getElementById('theme-toggle');
      if (button) {
        button.textContent = document.documentElement.dataset.theme === 'dark' ? '☀' : '☾';
        button.setAttribute('aria-pressed', String(document.documentElement.dataset.theme === 'dark'));
      }
    }
  };
  document.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById('theme-toggle');

    if (button) {
      button.addEventListener('click', () => {
        window.ServiceDeskTheme.toggle();
      });
    }

    window.ServiceDeskTheme.updateButton();
  });
})();
