import { useEffect, type RefObject } from "react";
import { CELL, documentLayout, latticeTracks } from "./lattice";

export type DocumentGrid = ReturnType<typeof documentLayout>;
const layouts = new WeakMap<Document, DocumentGrid>();
const listeners = new WeakMap<Document, Set<(grid: DocumentGrid) => void>>();
export function subscribeDocumentGrid(document: Document, listener: (grid: DocumentGrid) => void) {
  let set = listeners.get(document);
  if (!set) listeners.set(document, set = new Set());
  set.add(listener);
  const current = layouts.get(document);
  if (current) listener(current);
  return () => { set.delete(listener); };
}

/** One producer measures document space and lays out content on that same lattice.
 * No screen names or independent canvas grid. Scroll only changes the projection.
 */
export function useDocumentGrid(root: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const main = root.current, site = main?.parentElement;
    if (!main || !site) return;
    const doc = main.ownerDocument;
    let frame: number | null = null;
    const grids = ".hero-copy, .project-grid, .work-type-body, .profile-layout, .service-row, .profile-context, .delivery-steps";
    const boxes = ".section-heading, .service-row, .work-type-title, .work-type-window, .work-type-body, .project-card.work-type, .profile-method-intro, .profile-context, .profile-context > article, .profile-process, .delivery-steps > li, :scope > section";
    const marked = new Set<HTMLElement>();
    function update() {
      frame = null;
      const width = doc.documentElement.clientWidth;
      if (width <= 0) return;
      const inset = Number(getComputedStyle(site!).getPropertyValue("--grid-inset-cells")) || 0;
      const before = documentLayout({ width, height: Math.max(1, doc.documentElement.scrollHeight), dpr: devicePixelRatio }, inset, main!.getBoundingClientRect().top + scrollY);
      site!.style.setProperty("--grid-shell-left", `${before.shellLeft}px`);
      site!.style.setProperty("--grid-shell-width", `${before.shellWidth}px`);
      site!.dataset.documentGrid = "true";
      for (const element of main!.querySelectorAll<HTMLElement>(grids)) {
        if (element.closest("dialog")) continue;
        marked.add(element);
        const style = getComputedStyle(element);
        const count = Number(style.getPropertyValue("--grid-track-count")) || 1;
        const share = element.matches(".hero-copy") ? 7 / 12 : element.matches(".service-row") ? .6 : undefined;
        const available = element.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
        const tracks = latticeTracks(before.lattice, available, count, share);
        element.style.setProperty("--grid-tracks", tracks.map(size => `${size}px`).join(" "));
      }
      // Descendants first: tabs/windows → cards → sections. Reset before measuring
      // so replacing long content with short content can shrink the document too.
      const elements = [...main!.querySelectorAll<HTMLElement>(boxes)].filter(e => !e.closest("dialog"));
      const footer = site!.querySelector<HTMLElement>(":scope > footer");
      if (footer) elements.push(footer);
      for (const element of elements) {
        marked.add(element); element.style.removeProperty("--grid-box-height");
        if (element.matches(".work-type-title")) {
          element.style.removeProperty("--grid-box-width");
          const width = element.getBoundingClientRect().width;
          const available = element.parentElement!.getBoundingClientRect().width;
          const style = getComputedStyle(element);
          if (style.getPropertyValue("--title-size-mode").trim() === "content") {
            const range = doc.createRange();
            range.selectNodeContents(element);
            const longestLine = Math.max(0, ...Array.from(range.getClientRects(), rect => rect.width));
            const inset = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight)
              + parseFloat(style.borderLeftWidth) + parseFloat(style.borderRightWidth);
            element.style.setProperty("--grid-box-width", `${Math.min(width, Math.ceil(longestLine + inset))}px`);
          } else {
            element.style.setProperty("--grid-box-width", `${Math.min(Math.ceil(width / CELL), Math.floor(available / CELL)) * CELL}px`);
          }
        }
      }
      elements.sort((a, b) => a.contains(b) ? 1 : b.contains(a) ? -1 : 0);
      for (const element of elements) {
        const height = element.getBoundingClientRect().height;
        element.style.setProperty("--grid-box-height", `${Math.ceil((height - .01) / CELL) * CELL}px`);
        element.dataset.gridBox = "true";
      }
      const grid = documentLayout({ width, height: Math.max(1, doc.documentElement.scrollHeight), dpr: devicePixelRatio }, inset, main!.getBoundingClientRect().top + scrollY);
      layouts.set(doc, grid);
      for (const element of marked) resize.observe(element);
      for (const listener of listeners.get(doc) ?? []) listener(grid);
      window.dispatchEvent(new Event("portfolio-surface-change"));
    }
    function schedule() { if (frame === null) frame = requestAnimationFrame(update); }
    const resize = new ResizeObserver(schedule);
    resize.observe(doc.documentElement); resize.observe(main);
    const header = site.querySelector(":scope > header");
    if (header) resize.observe(header);
    const mutations = new MutationObserver(schedule);
    mutations.observe(main, { childList: true, subtree: true, characterData: true });
    window.addEventListener("resize", schedule);
    window.visualViewport?.addEventListener("resize", schedule);
    doc.fonts?.addEventListener("loadingdone", schedule);
    main.addEventListener("load", schedule, true);
    update();
    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
      resize.disconnect(); mutations.disconnect();
      window.removeEventListener("resize", schedule);
      window.visualViewport?.removeEventListener("resize", schedule);
      doc.fonts?.removeEventListener("loadingdone", schedule);
      main.removeEventListener("load", schedule, true);
      delete site.dataset.documentGrid; layouts.delete(doc);
      site.style.removeProperty("--grid-shell-left"); site.style.removeProperty("--grid-shell-width");
      for (const element of marked) {
        element.style.removeProperty("--grid-tracks"); element.style.removeProperty("--grid-box-height");
        element.style.removeProperty("--grid-box-width");
        delete element.dataset.gridBox;
      }
    };
  }, [root]);
}
