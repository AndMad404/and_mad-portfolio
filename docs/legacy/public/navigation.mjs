// Administración, archivos y enlaces externos conservan su navegación normal.
export function navigationTarget(event, anchor, currentHref) {
  if (!anchor || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return null;
  if (anchor.hasAttribute('download') || (anchor.target && anchor.target !== '_self') || anchor.rel?.split(/\s+/).includes('external')) return null;
  const current = new URL(currentHref);
  const next = new URL(anchor.href, current);
  if (next.origin !== current.origin || !['http:', 'https:'].includes(next.protocol)) return null;
  if (!/^\/(?:proyectos\/[^/]+\/)?$/.test(next.pathname)) return null;
  if (next.pathname === current.pathname && next.search === current.search) return null;
  return next;
}

export const pageMetadata = 'title, meta[name="description"], meta[name="robots"], meta[property^="og:"], link[rel="canonical"], script[type="application/ld+json"]';

export function currentSection(href, currentHref) {
  const target = new URL(href, currentHref);
  const current = new URL(currentHref);
  return target.origin === current.origin && target.pathname === current.pathname && target.search === current.search && !!target.hash && target.hash === current.hash;
}

export function installNavigation(onPageChange) {
  // Sin las APIs necesarias los enlaces siguen haciendo navegación completa.
  if (!('fetch' in window) || !('AbortController' in window) || !('DOMParser' in window) || !history.pushState) return;
  let controller;
  let displayedPage = location.pathname + location.search;
  async function navigate(url, push) {
    controller?.abort();
    const request = new AbortController();
    controller = request;
    document.querySelector('main').setAttribute('aria-busy', 'true');
    try {
      const response = await fetch(url, { signal: request.signal, headers: { Accept: 'text/html' } });
      if (!response.ok || response.redirected || !response.headers.get('content-type')?.includes('text/html')) throw new Error('Navegación completa requerida');
      const page = new DOMParser().parseFromString(await response.text(), 'text/html');
      const main = page.querySelector('main#contenido');
      if (!main || !page.querySelector('script[src="/app.js"]')) throw new Error('Página ajena al portafolio');
      if (request.signal.aborted) return;
      if (push) history.pushState(null, '', url);
      document.querySelector('main').replaceWith(main);
      document.head.querySelectorAll(pageMetadata).forEach(node => node.remove());
      page.head.querySelectorAll(pageMetadata).forEach(node => document.head.append(node));
      document.documentElement.lang = page.documentElement.lang;
      displayedPage = url.pathname + url.search;
      onPageChange();
      main.setAttribute('tabindex', '-1');
      main.focus({ preventScroll: true });
      const target = url.hash ? document.getElementById(decodeURIComponent(url.hash.slice(1))) : null;
      if (target) target.scrollIntoView({ behavior: 'instant' });
      else window.scrollTo({ top: 0, behavior: 'instant' });
    } catch (error) {
      if (!request.signal.aborted) location.assign(url.href);
    } finally {
      if (controller === request) document.querySelector('main')?.removeAttribute('aria-busy');
    }
  }
  document.addEventListener('click', event => {
    const anchor = event.target.closest('a[href]');
    const target = navigationTarget(event, anchor, location.href);
    if (!target) {
      // Una selección posterior de un ancla local gana a una carga pendiente.
      if (anchor && !event.defaultPrevented && event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey && !anchor.hasAttribute('download') && (!anchor.target || anchor.target === '_self')) {
        const next = new URL(anchor.href, location.href);
        if (next.origin === location.origin && next.pathname + next.search === displayedPage) {
          controller?.abort();
          document.querySelector('main')?.removeAttribute('aria-busy');
        }
      }
      return;
    }
    event.preventDefault();
    navigate(target, true);
  });
  window.addEventListener('popstate', () => {
    if (location.pathname + location.search !== displayedPage) navigate(new URL(location.href), false);
    else {
      controller?.abort();
      document.querySelector('main')?.removeAttribute('aria-busy');
    }
  });
}
