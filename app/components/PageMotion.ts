import { useEffect, type RefObject } from "react";
import { useReducedMotion } from "../../shared/motion";

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
  useEffect(() => {
    const container = root.current;
    if (
      reduced ||
      !container ||
      typeof IntersectionObserver === "undefined" ||
      typeof Element.prototype.animate !== "function"
    )
      return;

    document.documentElement.dataset.pageMotion = "on";
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
          if (!entry.isIntersecting) {
            cancel(entry.target);
            continue;
          }
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
          // Drop the animation effect so responsive CSS and other interactions own the element again.
          animation.onfinish = () => cancel(entry.target);
        }
      },
      { threshold: 0.05 },
    );

    function observeNewContent(initial = false) {
      container!.querySelectorAll<HTMLElement>(targets).forEach((element) => {
        if (seen.has(element)) return;
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
      delete document.documentElement.dataset.pageMotion;
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
    document.documentElement.dataset.blockNavigation = "on";
    let frame: number | null = null;
    let settle: ReturnType<typeof setTimeout> | undefined;
    let unlock: ReturnType<typeof setTimeout> | undefined;
    let busy = false, dragging = false, accumulated = 0, lastWheel = 0;
    let mouse: { x: number; y: number } | null = null;
    let suppressClick = false;
    const excluded = (target: EventTarget | null) => !!document.querySelector("dialog[open]") ||
      target instanceof Element && !!target.closest("input, textarea, select, [contenteditable], .evidence-track");
    function stops() {
      const elements = [...container!.querySelectorAll<HTMLElement>(".editorial-hero, .services-section, .work-section, .project-card[data-parallax], #perfil")];
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
      if (excluded(event.target) || event.ctrlKey || event.metaKey || event.shiftKey || Math.abs(event.deltaX) > Math.abs(event.deltaY) || !event.deltaY) return;
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
      if (excluded(event.target) || event.altKey || event.ctrlKey || event.metaKey || !["PageDown", "PageUp"].includes(event.key)) return;
      event.preventDefault();
      if (!busy) advance(event.key === "PageDown" ? 1 : -1);
    }
    function snap() {
      if (busy || dragging || excluded(null)) return;
      const values = stops();
      const nearest = values.reduce((best, at) => Math.abs(at - window.scrollY) < Math.abs(best - window.scrollY) ? at : best, values[0] ?? 0);
      if (Math.abs(nearest - window.scrollY) > 2) go(nearest);
    }
    function scroll() {
      if (busy) return;
      clearTimeout(settle); settle = setTimeout(snap, 180);
    }
    function down(event: PointerEvent) {
      if (excluded(event.target)) return;
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
      if (suppressClick) { event.preventDefault(); event.stopPropagation(); suppressClick = false; }
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
