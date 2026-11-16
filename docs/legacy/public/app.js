import { installNavigation, currentSection } from './navigation.mjs';

function updateNavigation() {
  document.querySelectorAll('.header nav a').forEach(link => {
    if (currentSection(link.href, location.href)) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}

function initializePage() {
  const filters = document.querySelector('.filters');
  if (filters) filters.hidden = false;
  updateNavigation();
}

document.addEventListener('click', event => {
    const button = event.target.closest('button[data-filter]');
    if (!button) return;
    const filters = button.closest('.filters');
    if (!filters) return;
    const projects = [...document.querySelectorAll('[data-areas]')];
    filters.querySelectorAll('button').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    let count = 0;
    projects.forEach(project => {
      project.hidden = button.dataset.filter !== 'all' && !project.dataset.areas.split('|').includes(button.dataset.filter);
      if (!project.hidden) count++;
    });
    document.querySelector('#filter-status').textContent = `${count} proyectos visibles`;
});
initializePage();
installNavigation(initializePage);
window.addEventListener('hashchange', updateNavigation);

// El margen sigue la altura real del menú, incluidos zoom y texto ampliado.
if ('ResizeObserver' in window) {
  const header = document.querySelector('.header');
  new ResizeObserver(() => {
    document.documentElement.style.setProperty('--header-offset', `${header.getBoundingClientRect().height + 24}px`);
  }).observe(header);
}
