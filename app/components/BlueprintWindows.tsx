import { useEffect, useRef, type RefObject } from "react";

type WindowBox = { x: number; y: number; width: number; height: number };

export function intersectWindow(a: WindowBox, b: WindowBox): WindowBox {
  const x = Math.max(a.x, b.x), y = Math.max(a.y, b.y);
  return { x, y, width: Math.max(0, Math.min(a.x + a.width, b.x + b.width) - x),
    height: Math.max(0, Math.min(a.y + a.height, b.y + b.height) - y) };
}

export function paperWindowPath(paper: { x: number; y: number; width: number; height: number },
  windows: { x: number; y: number; width: number; height: number }[]) {
  const rect = ({ x, y, width, height }: typeof paper) => {
    if (![x, y, width, height].every(Number.isFinite) || width <= 0 || height <= 0) return "";
    return `M${x} ${y}h${width}v${height}h${-width}Z`;
  };
  return [rect(paper), ...windows.map(window => rect(intersectWindow(paper, window)))].join(" ");
}

export function ownedWindowPaths(paper: WindowBox, windows: { bounds: WindowBox; owned: boolean }[]) {
  return windows.filter(window => window.owned && window.bounds.width > 0 && window.bounds.height > 0)
    .map(window => paperWindowPath(intersectWindow(paper, window.bounds), [])).join("");
}

/** A single paper plane with real transparent windows onto the page blueprint. */
export function BlueprintWindows({ root, pathname }: {
  root: RefObject<HTMLElement | null>; pathname: string;
}) {
  const path = useRef<SVGPathElement>(null);
  useEffect(() => {
    const container = root.current;
    const shape = path.current;
    if (!container || !shape) return;
    let frame: number | null = null;
    let previous = "";
    const marked = new Set<HTMLElement>();
    const box = (element: Element) => {
      const r = element.getBoundingClientRect();
      return { x: r.left, y: r.top, width: r.width, height: r.height };
    };
    function paint() {
      frame = null;
      if (document.visibilityState === "hidden") return;
      const covers = [...container!.querySelectorAll<HTMLElement>(".cover-system, .work-type-window, .editorial-hero")]
        .filter(element => !element.closest("dialog, .folder-lens-layer, details:not([open])") && element.getClientRects().length > 0);
      for (const element of marked) {
        if (!covers.includes(element)) { delete element.dataset.blueprintWindow; marked.delete(element); }
      }
      for (const element of covers) {
        element.dataset.blueprintWindow = "true";
        marked.add(element);
      }
      const windows = covers.map(element => {
        const visual = element.closest(".project-visual");
        return visual ? intersectWindow(box(element), box(visual)) : box(element);
      });
      const sections = [...container!.querySelectorAll<HTMLElement>(":scope > section:not(.editorial-hero)")];
      const next = container!.querySelector(":scope > .editorial-hero") ? sections.map(section => {
        const { x, y, width: w, height: h } = box(section);
        const r = Math.min(16, w / 2, h / 2);
        const outline = `M${x+r} ${y}h${w-2*r}q${r} 0 ${r} ${r}v${h-2*r}q0 ${r} ${-r} ${r}h${2*r-w}q${-r} 0 ${-r} ${-r}v${2*r-h}q0 ${-r} ${r} ${-r}Z`;
        // Only descendants can cut this section. Hidden/foreign covers must never expose text.
        return outline + ownedWindowPaths(box(section), windows.map((bounds, index) => ({
          bounds, owned: section.contains(covers[index]!),
        })));
      }).join(" ") : paperWindowPath(box(container!), windows);
      if (next !== previous) { shape!.setAttribute("d", next); previous = next; }
      container!.dataset.blueprintMasked = "true";
      // Follow finite entrance animations; stationary frames and background loops need no polling.
      const moving = container!.getAnimations?.({ subtree: true }).some(animation => {
        const target = (animation.effect as KeyframeEffect | null)?.target;
        return animation.playState === "running" && target instanceof Element &&
          target.matches(".section, [data-reveal], .project-card[data-parallax], .editorial-detail, .detail-heading");
      });
      if (moving) schedule();
    }
    function schedule() { if (frame === null) frame = requestAnimationFrame(paint); }
    function synchronize() {
      if (frame !== null) cancelAnimationFrame(frame);
      paint();
    }
    const resize = new ResizeObserver(schedule);
    resize.observe(container);
    const mutation = new MutationObserver(schedule);
    mutation.observe(container, { childList: true, subtree: true });
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.visualViewport?.addEventListener("resize", schedule);
    window.visualViewport?.addEventListener("scroll", schedule);
    window.addEventListener("portfolio-surface-change", synchronize);
    container.addEventListener("animationstart", schedule);
    paint();
    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
      resize.disconnect(); mutation.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.visualViewport?.removeEventListener("resize", schedule);
      window.visualViewport?.removeEventListener("scroll", schedule);
      window.removeEventListener("portfolio-surface-change", synchronize);
      container.removeEventListener("animationstart", schedule);
      delete container.dataset.blueprintMasked;
      for (const element of marked) delete element.dataset.blueprintWindow;
      shape.removeAttribute("d");
    };
  }, [root, pathname]);
  return <svg className="blueprint-paper-plane" width="100%" height="100%" aria-hidden="true" focusable="false">
    <path ref={path} fillRule="evenodd" />
  </svg>;
}
