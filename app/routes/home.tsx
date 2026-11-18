import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useLocation, useNavigate } from "react-router";
import { published, pageMeta, homeSeo, caseAreas, resolveCaseFragment } from "../content";
import { AreaCard } from "../components/ProjectCard";
import { useEnergySequence } from "../components/PageMotion";
export const meta = () =>
  pageMeta(
    homeSeo.title,
    homeSeo.description,
    "/",
  );
export default function Home() {
  const services = useRef<HTMLElement>(null);
  const workHeading = useRef<HTMLDivElement>(null);
  const [activeServiceItem, setActiveServiceItem] = useState<string | null>(null);
  const highlightTouchedService = (event: React.TouchEvent<HTMLUListElement>) => {
    const touch = event.touches[0];
    if (!touch) return;
    const item = event.currentTarget.ownerDocument.elementFromPoint(touch.clientX, touch.clientY)
      ?.closest<HTMLElement>("[data-service-item]");
    setActiveServiceItem(item && event.currentTarget.contains(item) ? item.dataset.serviceItem ?? null : null);
  };
  useEnergySequence(services);
  useEnergySequence(workHeading);
  useEffect(() => {
    const rows = [...services.current!.querySelectorAll<HTMLElement>(".service-row")];
    // offsetTop is relative to the positioned row, unaffected by page parallax.
    const alignMiddleItems = () => {
      for (const row of rows) {
        const items = row.querySelectorAll<HTMLElement>("[data-service-item]");
        const middle = items[Math.floor(items.length / 2)];
        if (middle) row.style.setProperty("--service-middle-center", `${middle.offsetTop + middle.offsetHeight / 2}px`);
      }
    };
    const observer = new ResizeObserver(alignMiddleItems);
    for (const row of rows) {
      observer.observe(row);
      row.querySelectorAll("[data-service-item]").forEach(item => observer.observe(item));
    }
    alignMiddleItems();
    return () => {
      observer.disconnect();
      rows.forEach(row => row.style.removeProperty("--service-middle-center"));
    };
  }, []);
  const location = useLocation();
  const navigate = useNavigate();
  // Match the server on hydration, then restore deep links and browser history.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const hash = hydrated ? location.hash : "";
  const cases = published.entries.filter(entry => entry.kind === "case");
  const selected = resolveCaseFragment(hash);
  useEffect(() => {
    if (hash.startsWith("#caso-") && !selected) {
      navigate(`/${location.search}#proyectos`, { replace: true });
    }
  }, [hash, location.search, navigate, selected]);
  return (
    <>
      <section className="hero editorial-hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="pixel-mark" aria-hidden="true" /> ANDRÉS MADRIGAL / PORTAFOLIO
          </p>
          <h1 id="hero-title" tabIndex={-1}>
            Contenido claro.
            <br />
            Datos confiables.
            <br />
            <span>Web que funciona.</span>
          </h1>
          <p className="lede">
            Más de siete años entre desarrollo web, contenido empresarial y calidad de datos.
            Desarrollo interfaces y automatizo tareas en colaboración con QA, Marketing y desarrollo,
            también con clientes en inglés.
          </p>
          <div className="hero-actions">
            <a className="button" href="https://github.com/AndMad404" target="_blank" rel="noopener noreferrer">
              GitHub <span aria-hidden="true">↗</span>
            </a>
            <a className="text-link" href="https://www.linkedin.com/in/andres-mad/" target="_blank" rel="noopener noreferrer">
              LinkedIn <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      </section>
      <section
        id="servicios"
        ref={services}
        data-energy-ordered
        className="section services-section"
        aria-labelledby="services-title"
      >
        <div className="section-heading">
          <div data-energy-intro>
            <h2 id="services-title">Servicios que puedo ofrecerte.</h2>
            <p>Acordamos el alcance, construyo en partes y valido cada entrega con criterios claros.
              Documento decisiones y comparto conocimiento para que el equipo pueda continuar.</p>
          </div>
        </div>
        <ul className="service-list"
          onTouchStart={highlightTouchedService} onTouchMove={highlightTouchedService}
          onTouchEnd={() => setActiveServiceItem(null)} onTouchCancel={() => setActiveServiceItem(null)}>
          {published.entries
            .filter((entry) => entry.kind === "service")
            .map((entry, index) => (
              <li className="service-disclosure" key={entry.id}>
                <div className="service-row" data-energy-sequence id={`resumen-servicio-${entry.slug}`}
                  style={{ "--service-sequence-index": index } as CSSProperties}>
                  <div className="service-heading">
                    <h3 data-energy-title>{entry.title}</h3>
                    <span className="service-node" data-energy-node aria-hidden="true"><i /><i /><i className="service-node-traveller" /></span>
                  </div>
                  <div className="service-offer">
                    <ul>{entry.decisions.map((item, index) => {
                      const itemId = `${entry.id}-${index}`;
                      return <li key={item} data-energy-description data-service-item={itemId}
                        className={activeServiceItem === itemId ? "is-touch-active" : undefined}>{item}</li>;
                    })}</ul>
                  </div>
                </div>
              </li>
            ))}
        </ul>
      </section>
      <section
        id="proyectos"
        className="section work-section"
        aria-labelledby="work-title"
      >
        <div className="section-heading work-heading" ref={workHeading} data-energy-sequence>
          <div>
            <h2 id="work-title" data-energy-title>Cómo puedo aportar.</h2>
          </div>
          <span className="service-node work-heading-node" data-energy-node aria-hidden="true"><i /><i /><i className="service-node-traveller" /></span>
          <p data-energy-description>
            Casos de desarrollo web, calidad de datos y automatización. En una entrevista puedo explicar las decisiones y el contexto de cada trabajo.
          </p>
        </div>
        <div className="project-grid" id="project-results">
          {caseAreas.map(area => <AreaCard key={area.id} area={area} entries={cases} selected={selected} />)}
        </div>
      </section>
    </>
  );
}
