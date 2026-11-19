import { useEffect, useRef, type RefObject } from "react";
import { useReducedMotion } from "../../shared/motion";

/** Ordered groups begin with their heading, then finish each row before the next. */
export function orderEnergySequences(rows: HTMLElement[]) {
  let cursor = 720;
  for (const row of rows) {
    row.style.setProperty("--energy-title-delay", `${cursor}ms`);
    row.style.setProperty("--energy-node-delay", `${cursor + 600}ms`);
    cursor += 1500;
    row.style.setProperty("--energy-description-delay", `${cursor}ms`);
    cursor += 600;
  }
}

/** Project standard for title → connector → description.
 * Mark the wrapper data-energy-sequence, its title data-energy-title, the
 * connector data-energy-node and each description text data-energy-description.
 * CSS owns one shared timeline; completion means the description finished.
 * Do not combine the wrapper with data-reveal (it has a separate entrance).
 */
export function observeEnergySequences(root: HTMLElement) {
  const rows = root.matches("[data-energy-sequence]") ? [root]
    : [...root.querySelectorAll<HTMLElement>("[data-energy-sequence]")];
  const ordered = root.matches("[data-energy-ordered]");
  if (ordered) orderEnergySequences(rows);
  if (typeof IntersectionObserver === "undefined") return () => {};
  const headerHeight = Math.ceil(root.ownerDocument.querySelector(".public-site > .header")?.getBoundingClientRect().height ?? 0);
  const observer = new IntersectionObserver(entries => {
    for (const { target, isIntersecting, intersectionRatio } of entries) {
      if (!isIntersecting || intersectionRatio < .6) continue;
      if (ordered) {
        if (rows.some(row => !row.dataset.energyPlayed)) {
          root.classList.add("is-section-energized");
          rows.forEach(row => row.classList.add("is-energized"));
        }
        observer.unobserve(target);
        continue;
      }
      const row = target.closest<HTMLElement>("[data-energy-sequence]");
      if (!row) continue;
      if (!row.dataset.energyPlayed) row.classList.add("is-energized");
      observer.unobserve(target);
    }
  }, { threshold: .6, rootMargin: `-${headerHeight}px 0px -10% 0px` });
  const complete = (event: AnimationEvent) => {
    if (event.animationName !== "energy-text-glow" || !(event.target instanceof Element) ||
      !event.target.matches("[data-energy-description]")) return;
    const row = event.target.closest<HTMLElement>("[data-energy-sequence]");
    if (ordered && row && event.target !== [...row.querySelectorAll("[data-energy-description]")].at(-1)) return;
    if (row) row.dataset.energyPlayed = "true";
  };
  for (const row of rows) {
    const node = row.querySelector("[data-energy-node]");
    if (node && (!ordered || row === rows[0])) observer.observe(node);
    row.addEventListener("animationend", complete);
  }
  return () => {
    observer.disconnect();
    if (ordered) root.classList.remove("is-section-energized");
    for (const row of rows) {
      row.removeEventListener("animationend", complete);
      row.classList.remove("is-energized");
    }
  };
}

export function useEnergySequence(root: RefObject<HTMLElement | null>) {
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced || !root.current) return;
    return observeEnergySequences(root.current);
  }, [root, reduced]);
}

/** A newly active menu section explicitly replays its sequences once.
 * Keeping the active id prevents scroll/render notifications from looping it.
 */
export function activateSectionEnergy(root: HTMLElement, sectionId: string, reduced: boolean, force = false) {
  if (!force && root.dataset.energyActiveSection === sectionId) return;
  root.dataset.energyActiveSection = sectionId;
  if (reduced || !sectionId) return;
  const section = [...root.querySelectorAll<HTMLElement>("section[id], footer[id]")]
    .find(element => element.id === sectionId);
  if (!section) return;
  const rows = [...section.querySelectorAll<HTMLElement>("[data-energy-sequence]")];
  if (section.dataset?.energyOrdered !== undefined) orderEnergySequences(rows);
  section.classList.remove("is-section-energized");
  for (const row of rows) {
    row.classList.remove("is-energized");
    delete row.dataset.energyPlayed;
  }
  // Commit the reset once for the section, then restart the shared CSS timeline.
  void root.offsetWidth;
  section.classList.add("is-section-energized");
  rows.forEach(row => row.classList.add("is-energized"));
}

// First-screen content (hero, process demo, detail heading) enters through CSS
// at first paint. This hook reveals only what reaches the viewport afterwards.
const targets = [
  "[data-reveal]",
  ".detail-block",
  ".evidence-gallery",
  ".detail-contact",
].join(",");

/** Enhance visible HTML; never hide content while waiting for JS or an observer. */
export function usePageMotion(
  root: RefObject<HTMLElement | null>,
  pathname: string,
) {
  const reduced = useReducedMotion();
  const revealed = useRef(new WeakSet<Element>());
  useEffect(() => {
    const container = root.current;
    if (
      reduced ||
      !container ||
      typeof IntersectionObserver === "undefined" ||
      typeof Element.prototype.animate !== "function"
    )
      return;

    const seen = new WeakSet<Element>();
    const pending = new Set<Element>();
    // Present when the effect ran: their first report describes content that
    // was already painted before this code executed.
    const mounted = new Set<Element>();
    const active = new Map<Element, Animation>();
    function cancel(element: Element) {
      active.get(element)?.cancel();
      active.delete(element);
    }
    let previousScroll = window.scrollY;
    const observer = new IntersectionObserver(
      (entries) => {
        const upward = window.scrollY < previousScroll;
        previousScroll = window.scrollY;
        let stagger = 0;
        for (const entry of entries) {
          const painted = mounted.delete(entry.target);
          if (!entry.isIntersecting) continue;
          observer.unobserve(entry.target);
          pending.delete(entry.target);
          if (revealed.current.has(entry.target)) continue;
          revealed.current.add(entry.target);
          // Replaying visible content would make it vanish and fade back in.
          if (
            painted ||
            window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
            entry.target.contains(document.activeElement)
          )
            continue;
          const animation = entry.target.animate(
            [
              { opacity: 0.15, translate: upward ? "0 -48px" : "0 48px" },
              { opacity: 1, translate: "0 0" },
            ],
            {
              duration: 850,
              delay: Math.min(stagger++ * 80, 240),
              easing: "cubic-bezier(0.22, 1, 0.36, 1)",
              fill: "backwards",
            },
          );
          active.set(entry.target, animation);
          window.dispatchEvent(new Event("portfolio-surface-change"));
          animation.onfinish = () => {
            cancel(entry.target);
            window.dispatchEvent(new Event("portfolio-surface-change"));
          };
        }
      },
      { threshold: 0.05 },
    );

    function observeNewContent(initial = false) {
      container!.querySelectorAll<HTMLElement>(targets).forEach((element) => {
        if (seen.has(element) || revealed.current.has(element)) return;
        seen.add(element);
        pending.add(element);
        if (initial) mounted.add(element);
        observer.observe(element);
      });
      for (const element of active.keys()) {
        if (!container!.contains(element)) cancel(element);
      }
      for (const element of pending) {
        if (!container!.contains(element)) {
          observer.unobserve(element);
          pending.delete(element);
          mounted.delete(element);
        }
      }
    }
    function revealFocusedContent(event: FocusEvent) {
      for (const element of active.keys()) {
        if (event.target instanceof Node && element.contains(event.target))
          cancel(element);
      }
    }
    observeNewContent(true);
    // Filters can mount new cards without changing the route or replaying the rest of the page.
    const mutations = new MutationObserver(() => observeNewContent());
    mutations.observe(container, { childList: true, subtree: true });
    container.addEventListener("focusin", revealFocusedContent);
    return () => {
      observer.disconnect();
      mutations.disconnect();
      container.removeEventListener("focusin", revealFocusedContent);
      for (const element of active.keys()) cancel(element);
    };
  }, [root, pathname, reduced]);
}


export function centeredBlockScroll(top: number, height: number, viewport: number, header: number) {
  return top - header - Math.max(0, (viewport - header - height) / 2);
}

/** Select by visible area below the sticky header; gaps have no active link. */
export function visibleNavigationSection(
  sections: { id: string; top: number; bottom: number }[], header: number, viewport: number,
  page?: { scroll: number; height: number },
) {
  if (page && page.scroll + viewport >= page.height - 2 && sections.some(section => section.id === "contacto")) return "contacto";
  let active = "", largest = 0;
  for (const section of sections) {
    if (page && section.id === "contacto") continue;
    const visible = Math.max(0, Math.min(viewport, section.bottom) - Math.max(header, section.top));
    if (visible > largest) { largest = visible; active = section.id; }
  }
  return active;
}

/** Shared stops include overlapping reading positions inside tall blocks. */
export function blockScrollStops(blocks: { top: number; height: number }[], viewport: number, header: number, maxScroll: number) {
  const clamp = (value: number) => Math.max(0, Math.min(maxScroll, value));
  const stops = [0, maxScroll];
  const step = Math.max(1, (viewport - header - 28) * .85);
  for (const { top, height } of blocks) {
    const start = clamp(centeredBlockScroll(top, height, viewport, header + 12));
    const end = height > viewport - header - 28 ? clamp(top + height - viewport + 16) : start;
    stops.push(start);
    for (let at = start + step; at < end - 2; at += step) stops.push(at);
    stops.push(end);
  }
  return [...new Set(stops)].sort((a, b) => a - b);
}

export function nextBlockScroll(blocks: { top: number; height: number }[], scroll: number,
  viewport: number, header: number, direction: number, maxScroll: number) {
  if (!blocks.length) return null;
  const stops = blockScrollStops(blocks, viewport, header, maxScroll);
  return direction > 0 ? stops.find(at => at > scroll + 2) ?? null
    : stops.reverse().find(at => at < scroll - 2) ?? null;
}

export function useBlockNavigation(root: RefObject<HTMLElement | null>, pathname: string) {
  const reduced = useReducedMotion();
  useEffect(() => {
    const container = root.current;
    if (!container || pathname !== "/") return;
    const coarsePointer = window.matchMedia("(pointer: coarse)");
    document.documentElement.dataset.blockNavigation = "on";
    let frame: number | null = null;
    let settle: ReturnType<typeof setTimeout> | undefined;
    let unlock: ReturnType<typeof setTimeout> | undefined;
    let busy = false, dragging = false, anchorNavigation = false, accumulated = 0, lastWheel = 0;
    let mouse: { x: number; y: number } | null = null;
    let suppressClick = false;
    const excluded = (target: EventTarget | null) => !!document.querySelector("dialog[open]") ||
      target instanceof Element && !!target.closest("input, textarea, select, [contenteditable], .evidence-track");
    function stops() {
      const elements = [...container!.querySelectorAll<HTMLElement>(".editorial-hero, .services-section, .work-section, .project-card[data-parallax]")];
      const footer = container!.parentElement?.querySelector(":scope > footer");
      if (footer instanceof HTMLElement) elements.push(footer);
      const first = container!.querySelector(".project-grid > .project-card");
      const blocks = elements.flatMap(element => {
        if (element === first) return [];
        const rect = element.getBoundingClientRect();
        if (rect.height <= 0) return [];
        const card = element.matches(".work-section") ? first?.getBoundingClientRect() : null;
        return [{ top: window.scrollY + rect.top, height: card ? card.bottom - rect.top : rect.height }];
      });
      const header = document.querySelector(".public-site > .header")?.getBoundingClientRect().height ?? 100;
      return blockScrollStops(blocks, window.innerHeight, header, Math.max(0, document.documentElement.scrollHeight - window.innerHeight));
    }
    function cancel() {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null; busy = false; clearTimeout(unlock); clearTimeout(settle);
    }
    function go(target: number) {
      cancel(); busy = true;
      const start = window.scrollY, started = performance.now();
      window.dispatchEvent(new Event("blueprint-energy"));
      function move(time: number) {
        const t = reduced ? 1 : Math.min(1, Math.max(0, (time - started) / 600));
        window.scrollTo({ top: start + (target - start) * t * t * (3 - 2 * t), behavior: "instant" });
        if (t < 1) frame = requestAnimationFrame(move);
        else { frame = null; unlock = setTimeout(() => { busy = false; }, 180); }
      }
      frame = requestAnimationFrame(move);
    }
    function advance(direction: number) {
      const values = stops();
      const target = direction > 0 ? values.find(at => at > window.scrollY + 2)
        : values.reverse().find(at => at < window.scrollY - 2);
      if (target !== undefined) go(target);
    }
    function wheel(event: WheelEvent) {
      if (coarsePointer.matches || excluded(event.target) || event.ctrlKey || event.metaKey || event.shiftKey || Math.abs(event.deltaX) > Math.abs(event.deltaY) || !event.deltaY) return;
      anchorNavigation = false;
      event.preventDefault();
      if (busy) return;
      const now = performance.now();
      if (now - lastWheel > 180) accumulated = 0;
      lastWheel = now;
      accumulated += event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1);
      if (Math.abs(accumulated) < 45) return;
      advance(Math.sign(accumulated)); accumulated = 0;
    }
    function key(event: KeyboardEvent) {
      if (coarsePointer.matches || excluded(event.target) || event.altKey || event.ctrlKey || event.metaKey || !["PageDown", "PageUp"].includes(event.key)) return;
      anchorNavigation = false;
      event.preventDefault();
      if (!busy) advance(event.key === "PageDown" ? 1 : -1);
    }
    function snap() {
      if (coarsePointer.matches || busy || dragging || anchorNavigation || excluded(null)) return;
      const values = stops();
      const nearest = values.reduce((best, at) => Math.abs(at - window.scrollY) < Math.abs(best - window.scrollY) ? at : best, values[0] ?? 0);
      if (Math.abs(nearest - window.scrollY) > 2) go(nearest);
    }
    function scroll() {
      if (coarsePointer.matches || busy || anchorNavigation) return;
      clearTimeout(settle); settle = setTimeout(snap, 180);
    }
    function down(event: PointerEvent) {
      if (coarsePointer.matches || event.pointerType === "touch" || excluded(event.target)) return;
      anchorNavigation = false;
      cancel(); dragging = true;
      mouse = event.pointerType === "mouse" && event.button === 0 && event.target instanceof Element &&
        !event.target.closest("a, button, .project-visual") && event.clientX < document.documentElement.clientWidth
        ? { x: event.clientX, y: event.clientY } : null;
      suppressClick = false;
    }
    function drag(event: PointerEvent) {
      if (!mouse || excluded(event.target)) return;
      const dy = mouse.y - event.clientY, dx = mouse.x - event.clientX;
      if (Math.abs(dy) < 48 || Math.abs(dy) < Math.abs(dx) * 1.2) return;
      event.preventDefault(); mouse = null; suppressClick = true;
      advance(Math.sign(dy));
    }
    function click(event: MouseEvent) {
      if (suppressClick) { event.preventDefault(); event.stopPropagation(); suppressClick = false; return; }
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!link) return;
      const destination = new URL(link.href, window.location.href);
      if (destination.origin === window.location.origin && destination.pathname === window.location.pathname && destination.hash) {
        cancel();
        // Let native/router anchor navigation finish without snapping to a different block.
        anchorNavigation = true;
      }
    }
    function up() { mouse = null; dragging = false; scroll(); }
    window.addEventListener("wheel", wheel, { passive: false });
    window.addEventListener("keydown", key);
    window.addEventListener("scroll", scroll, { passive: true });
    window.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    window.addEventListener("pointermove", drag, { passive: false });
    window.addEventListener("click", click, true);
    return () => {
      cancel(); window.removeEventListener("wheel", wheel); window.removeEventListener("keydown", key);
      window.removeEventListener("scroll", scroll); window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", up);
      window.removeEventListener("pointermove", drag); window.removeEventListener("click", click, true);
      delete document.documentElement.dataset.blockNavigation;
    };
  }, [root, pathname, reduced]);
}
