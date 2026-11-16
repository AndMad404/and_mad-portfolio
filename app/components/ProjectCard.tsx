import { useLayoutEffect, useRef } from "react";
import { Link, useLocation, useNavigate, useViewTransitionState } from "react-router";
import { EntryView } from "../../shared/EntryView";
import { CaseCover } from "../../shared/CaseCover";
import { entryPath, type Entry } from "../../shared/contracts";
import { useReducedMotion } from "../../shared/motion";

const caseLabels: Record<string, string> = {
  fak: "PLATAFORMA COMPLETADA",
  "operacion-cms": "EXPERIENCIA EMPRESARIAL",
  "auditoria-datos": "INVESTIGACIÓN · CALIDAD DE DATOS",
  "portafolio-editorial": "IMPLEMENTACIÓN LOCAL",
  excelbatch: "HERRAMIENTA · CÓDIGO PÚBLICO",
  cleantreeflow: "HERRAMIENTA · CÓDIGO PÚBLICO",
  "auditoria-web": "HERRAMIENTAS LOCALES",
  "extractor-carrito": "PROTOTIPO LOCAL",
  "eventos-combate": "EN PLANIFICACIÓN",
  "sitios-wordpress": "EXPERIENCIA · SIN MUESTRAS PÚBLICAS",
  gestor: "EN DESARROLLO",
  centrificador: "FASE FUTURA",
};


function ProjectSummary({ entry, number, transition = false }: { entry: Entry; number: number; transition?: boolean }) {
  return <>
    <div className="project-visual"><CaseCover entry={entry} transition={transition} /></div>
        <div className="project-meta">
          <span>
            {String(number).padStart(2, "0")} /{" "}
            {caseLabels[entry.id] ?? "PROYECTO EN DOCUMENTACIÓN"}
          </span>
          <span aria-hidden="true">↗</span>
        </div>
        <h3>{entry.title}</h3>
        <p>{entry.summary}</p>
        <div className="project-bottom">
          <div className="tags">
            {entry.tags.map((tag) => (
              <span className="tag" key={tag}>
                {tag}
              </span>
            ))}
          </div>
          <span className="case-link-label">Ver caso ↗</span>
        </div>
  </>;
}

export function ProjectCard({
  entry,
  number,
  expanded = false,
}: {
  entry: Entry;
  number: number;
  expanded?: boolean;
}) {
  const reduced = useReducedMotion();
  const location = useLocation();
  const navigate = useNavigate();
  const target = `/${location.search}#caso-${entry.slug}`;
  const transitioning = useViewTransitionState(target);
  return (
    <article className="project-card" data-reveal data-parallax="folder">
      <Link
        id={`resumen-${entry.slug}`}
        className="project-link"
        to={entryPath(entry)}
        aria-haspopup="dialog"
        aria-controls={`modal-${entry.id}`}
        onClick={(event) => {
          if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
          event.preventDefault();
          navigate(target, {
            preventScrollReset: true,
            viewTransition: !reduced,
            state: { entryModal: true },
          });
        }}
      >
        <ProjectSummary entry={entry} number={number} transition={transitioning && !reduced && !expanded} />
      </Link>
      <EntryModal entry={entry} open={expanded} transition={transitioning && !reduced}
        onRequestClose={() => {
          if (location.state?.entryModal) navigate(-1);
          else navigate(`/${location.search}#proyectos`, { replace: true, preventScrollReset: true, viewTransition: !reduced });
        }} />
    </article>
  );
}

export function EntryModal({ entry, open, transition = false, onRequestClose }: {
  entry: Entry;
  open: boolean;
  transition?: boolean;
  onRequestClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  useLayoutEffect(() => {
    const element = dialog.current;
    if (!open || !element) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const root = document.documentElement;
    const overflow = root.style.overflow;
    const gutter = root.style.scrollbarGutter;
    root.style.scrollbarGutter = "stable";
    root.style.overflow = "hidden";
    element.showModal();
    if (scroller.current) scroller.current.scrollTop = 0;
    closeButton.current?.focus({ preventScroll: true });
    return () => {
      element.close();
      root.style.overflow = overflow;
      root.style.scrollbarGutter = gutter;
      const fallback = document.getElementById(`resumen-${entry.kind === "case" ? "" : "servicio-"}${entry.slug}`);
      const focus = opener?.isConnected && opener !== document.body ? opener : fallback;
      focus?.focus({ preventScroll: true });
    };
  }, [open, entry.id, entry.kind, entry.slug]);
  return (
    <dialog ref={dialog} id={`modal-${entry.id}`} className="entry-modal"
      aria-labelledby={`modal-title-${entry.id}`}
      onCancel={(event) => { event.preventDefault(); onRequestClose(); }}>
      <header className="entry-modal-toolbar">
        <span id={`modal-title-${entry.id}`}>{entry.title}</span>
        <button ref={closeButton} type="button" className="entry-modal-close"
          onClick={onRequestClose} aria-label="Cerrar detalle">Cerrar <span aria-hidden="true">×</span></button>
      </header>
      <div ref={scroller} className="entry-modal-scroll" tabIndex={0} aria-label="Contenido del detalle">
        <EntryView entry={entry} inline transition={open && transition} />
      </div>
    </dialog>
  );
}
