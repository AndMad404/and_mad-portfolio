import { useLayoutEffect, useRef } from "react";
import { Link, useLocation, useNavigate, useViewTransitionState } from "react-router";
import { EntryView } from "../../shared/EntryView";
import { CaseCover } from "../../shared/CaseCover";
import { entryPath, type Entry } from "../../shared/contracts";
import { useReducedMotion } from "../../shared/motion";
import { areaExperienceId, areaStories, caseAreas, type CaseArea } from "../content";

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
  return <AccessibleModal id={`modal-${entry.id}`} title={entry.title} open={open}
    titleId={`modal-title-${entry.id}`}
    fallbackId={`resumen-${entry.kind === "case" ? "" : "servicio-"}${entry.slug}`}
    onRequestClose={onRequestClose}>
    <EntryView entry={entry} inline transition={open && transition} />
  </AccessibleModal>;
}

export function AreaModal({ area, entries, open, experienceId, onRequestClose }: {
  area: CaseArea;
  entries: Entry[];
  open: boolean;
  experienceId?: string;
  onRequestClose: () => void;
}) {
  return <AccessibleModal id={area.modalId} title={area.title} open={open} folder
    fallbackId={`resumen-area-${area.id}`}
    targetId={experienceId ? areaExperienceId(area, experienceId) : undefined}
    onRequestClose={onRequestClose}>
    <article className="detail editorial-detail area-summary">
      <header className="detail-heading" data-modal-summary tabIndex={-1}>
        {area.experienceIds.map(id => {
          const entry = entries.find(item => item.id === id)!;
          return <span key={id} aria-hidden="true"
            id={caseAreas.find(item => item.experienceIds.includes(id)) === area ? `resumen-${entry.slug}` : undefined}>
            <span id={areaExperienceId(area, id)} />
          </span>;
        })}
        <p className="lede">{areaStories[area.id]!.trajectory}</p>
        <h3>Resultados que aporto</h3>
        <ul>{areaStories[area.id]!.results.map(item => <li key={item}>{item}</li>)}</ul>
        {areaStories[area.id]!.links.length > 0 && <ul className="area-evidence-links" aria-label="Evidencia pública">
          {areaStories[area.id]!.links.map(link => <li key={link.url}>
            <a href={link.url} target="_blank" rel="noopener noreferrer">{link.label} ↗</a>
          </li>)}
        </ul>}
      </header>
      <div className="entry-parallax-window" aria-hidden="true" />
    </article>
  </AccessibleModal>;
}

function AccessibleModal({ id, title, titleId = `${id}-title`, open, folder = false, fallbackId, targetId, onRequestClose, children }: {
  id: string;
  title: string;
  titleId?: string;
  open: boolean;
  folder?: boolean;
  fallbackId: string;
  targetId?: string;
  onRequestClose: () => void;
  children: React.ReactNode;
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
      const fallback = document.getElementById(fallbackId);
      const focus = opener?.isConnected && opener !== document.body ? opener : fallback;
      focus?.focus({ preventScroll: true });
    };
  }, [open, id, fallbackId]);
  useLayoutEffect(() => {
    if (!open) return;
    const anchor = targetId ? document.getElementById(targetId) : null;
    const target = anchor?.closest<HTMLElement>("[data-modal-summary]") ?? anchor;
    if (target && scroller.current) {
      target.focus({ preventScroll: true });
      scroller.current.scrollTop += target.getBoundingClientRect().top - scroller.current.getBoundingClientRect().top;
    } else {
      if (scroller.current) scroller.current.scrollTop = 0;
      closeButton.current?.focus({ preventScroll: true });
    }
  }, [open, targetId]);
  const returnButton = <button ref={closeButton} type="button" className="entry-modal-close"
    onClick={onRequestClose} aria-label="Volver a los casos"><span className="entry-modal-close-label">Volver</span> <svg className="entry-modal-arrow"
      viewBox="0 0 40 40" fill="none" aria-hidden="true" focusable="false">
      <path d="M20 33V9M9 20L20 9L31 20" />
      <circle cx="20" cy="33" r="2" /><circle cx="20" cy="9" r="3" />
      <circle cx="9" cy="20" r="2" /><circle cx="31" cy="20" r="2" />
      <circle className="travelling-node" r="2">
        <animateMotion dur="2.4s" repeatCount="indefinite" path="M20 33V9L9 20L20 9L31 20" />
      </circle>
    </svg></button>;
  return (
    <dialog ref={dialog} id={id} className={folder ? "entry-modal entry-modal-folder" : "entry-modal"}
      aria-labelledby={titleId}
      onCancel={(event) => { event.preventDefault(); onRequestClose(); }}>
      <header className="entry-modal-toolbar">
        {folder ? <h2 id={titleId} className="area-folder-title">{title}</h2> : <span id={titleId}>{title}</span>}
        {!folder && returnButton}
      </header>
      <div ref={scroller} className="entry-modal-scroll" tabIndex={0} aria-label="Contenido del detalle">
        {folder && <div className="area-modal-actions">{returnButton}</div>}
        {children}
      </div>
    </dialog>
  );
}
