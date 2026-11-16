import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { published, pageMeta, homeSeo, caseAreas } from "../content";
import { entryPath } from "../../shared/contracts";
import { useReducedMotion } from "../../shared/motion";
import { EntryModal } from "../components/ProjectCard";
import { PixelMark } from "../components/EditorialDemo";
export const meta = () =>
  pageMeta(
    homeSeo.title,
    homeSeo.description,
    "/",
  );
export default function Home() {
  const reduced = useReducedMotion();
  const location = useLocation();
  const navigate = useNavigate();
  // Match the server on hydration, then restore deep links and browser history.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const hash = hydrated ? location.hash : "";
  const cases = published.entries.filter(entry => entry.kind === "case");
  const experienceLabels: Record<string, string> = {
    "operacion-cms": "AEM: frontend y gestión de contenido",
    fak: "Federación de Kendo: sitio y actualización de eventos",
    "portafolio-editorial": "Portafolio: revisión y publicación editorial",
    "auditoria-datos": "Investigación y revisión de calidad del catálogo",
  };
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
            Desarrollo interfaces web, organizo contenido y automatizo tareas.
            Acá podés conocer mis servicios y la experiencia que aporto a un equipo.
          </p>
          <div className="hero-actions">
            <Link className="button" to="/#servicios">
              Ver servicios <span aria-hidden="true">↗</span>
            </Link>
            <Link className="text-link" to="/#proyectos">
              Explorar mi experiencia ↗
            </Link>
          </div>
        </div>
      </section>
      <section
        id="servicios"
        className="section services-section"
        aria-labelledby="services-title"
      >
        <div className="section-heading" data-reveal>
          <div>
            <p className="eyebrow">
              <PixelMark /> 01 / CÓMO PUEDO AYUDARTE
            </p>
            <h2 id="services-title">Tu sitio. El siguiente paso.</h2>
          </div>
          <p>Podemos partir de una página nueva, un sitio que necesita mejoras o una tarea que se repite.</p>
        </div>
        <ul className="service-list">
          {published.entries
            .filter((entry) => entry.kind === "service")
            .map((entry, index) => (
              <li className="service-disclosure" key={entry.id}>
                <Link className="service-row" data-reveal id={`resumen-servicio-${entry.slug}`}
                  to={entryPath(entry)} aria-haspopup="dialog" aria-controls={`modal-${entry.id}`}
                  onClick={(event) => {
                    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                    event.preventDefault();
                    navigate(`/${location.search}#servicio-${entry.slug}`,
                      { preventScrollReset: true, viewTransition: !reduced, state: { entryModal: true } });
                  }}>
                  <span className="service-number">0{index + 1}</span>
                  <h3>{entry.title}</h3>
                  <p>{entry.summary}</p>
                  <span className="service-arrow" aria-hidden="true">↗</span>
                </Link>
                <EntryModal entry={entry} open={hash === `#servicio-${entry.slug}`}
                  onRequestClose={() => {
                    if (location.state?.entryModal) navigate(-1);
                    else navigate(`/${location.search}#servicios`, { replace: true, preventScrollReset: true, viewTransition: !reduced });
                  }} />
              </li>
            ))}
        </ul>
      </section>
      <section
        id="proyectos"
        className="section work-section"
        aria-labelledby="work-title"
      >
        <div className="section-heading" data-reveal>
          <div>
            <p className="eyebrow">
              <PixelMark /> 02 / TIPOS DE TRABAJO
            </p>
            <h2 id="work-title">Cómo puedo aportar.</h2>
          </div>
          <p>
            Cuatro áreas de trabajo: sitios administrables, desarrollo web, flujos de contenido y calidad de datos.
          </p>
        </div>
        <div className="project-grid" id="project-results">
          {caseAreas.map(area => {
            const representative = cases.find(entry => entry.id === area.entryId)!;
            return <article className="project-card work-type" data-parallax="folder" key={area.id}>
              <h3 className="work-type-title">{area.title}</h3>
              <div className="work-type-body">
              <div className="work-type-content">
                <p>{representative.summary}</p>
                <ul className="work-experiences" aria-label={`Experiencia en ${area.label}`}>
                  {area.experienceIds.map(id => {
                    const entry = cases.find(item => item.id === id)!;
                    const firstArea = caseAreas.find(item => item.experienceIds.includes(id));
                    return <li key={id}><Link
                      id={firstArea === area ? `resumen-${entry.slug}` : undefined}
                      to={entryPath(entry)} aria-haspopup="dialog" aria-controls={`modal-${entry.id}`}
                      onClick={event => {
                        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                        event.preventDefault();
                        navigate(`/${location.search}#caso-${entry.slug}`, {
                          preventScrollReset: true, viewTransition: !reduced, state: { entryModal: true },
                        });
                      }}>{experienceLabels[id] ?? entry.title} ↗</Link></li>;
                  })}
                </ul>
              </div>
              <div className="work-type-window" aria-hidden="true" />
              </div>
            </article>;
          })}
        </div>
        {cases.map(entry => <EntryModal key={entry.id} entry={entry} open={hash === `#caso-${entry.slug}`}
          onRequestClose={() => {
            if (location.state?.entryModal) navigate(-1);
            else navigate(`/${location.search}#proyectos`, { replace: true, preventScrollReset: true });
          }} />)}
      </section>
      <section id="perfil" className="section profile-method" aria-labelledby="profile-title">
        <header className="profile-method-intro" data-reveal>
          <p className="eyebrow"><PixelMark /> 03 / PERFIL</p>
          <h2 id="profile-title">Perfil y forma de trabajar.</h2>
          <p>Más de siete años entre desarrollo web, contenido empresarial y calidad de datos.
            Conecto el consumo, la transformación, la validación y la presentación de información.</p>
        </header>
        <div className="profile-context">
          <article aria-labelledby="collaboration-title" data-reveal>
            <h3 id="collaboration-title">Conectar necesidades y equipos.</h3>
            <p>He trabajado con QA, Marketing, desarrollo y gestión de proyectos, traduciendo requisitos
              a tareas técnicas y comunicando riesgos antes de las entregas, también en reuniones con clientes en inglés.</p>
          </article>
          <article aria-labelledby="knowledge-title" data-reveal>
            <h3 id="knowledge-title">Compartir conocimiento.</h3>
            <p>Me he incorporado a sistemas existentes, documentado procedimientos y capacitado a equipos.
              Busco que los hallazgos de una tarea ayuden a resolver la siguiente.</p>
          </article>
        </div>
        <section className="profile-process" aria-labelledby="method-title">
          <header>
            <h3 id="method-title">Del alcance a la entrega.</h3>
            <p>El trabajo empieza con un objetivo concreto y termina con una entrega que se puede revisar.</p>
          </header>
          <ol className="delivery-steps">
            <li><h4>Acordar el alcance.</h4><p>Definir quién usará la solución, qué necesita resolver y cómo comprobaremos el resultado.</p></li>
            <li><h4>Construir en partes.</h4><p>Preparar versiones revisables y contrastarlas con el alcance antes de ampliar el trabajo.</p></li>
            <li><h4>Comprobar con criterios claros.</h4><p>Probar las tareas acordadas, registrar problemas y corregir lo que impida completar la entrega.</p></li>
            <li><h4>Dejar claro cómo continuar.</h4><p>Explicar el uso, documentar decisiones y distinguir lo resuelto de los siguientes pasos.</p></li>
          </ol>
        </section>
      </section>
    </>
  );
}
