import { useEffect, useId, useRef, useState } from "react";
import { useReducedMotion } from "../../shared/motion";

export function PixelMark() {
  const mark = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  useEffect(() => {
    const element = mark.current;
    if (!element) return;
    if (reduced) {
      element.removeAttribute("data-entered");
      return;
    }
    if (typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          element.dataset.entered = "true";
          observer.disconnect();
        }
      },
      { threshold: 1 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [reduced]);
  return <span ref={mark} className="pixel-mark" aria-hidden="true" />;
}

const stages = [
  {
    label: "Entrada",
    title: "Contenido por ordenar",
    detail: "Primero identifico los campos, las fuentes y lo que falta.",
    rows: [
      ["Título", "Sin definir"],
      ["Idioma", "es-CR"],
      ["Imagen", "Descripción pendiente"],
    ],
  },
  {
    label: "Revisión",
    title: "Cada campo, con contexto",
    detail:
      "Reviso estructura, enlaces y presentación antes de preparar la entrega.",
    rows: [
      ["Contenido", "Revisar claridad"],
      ["Enlaces", "Comprobar destino"],
      ["Imagen", "Describir su contenido"],
    ],
  },
  {
    label: "Resultado",
    title: "Una entrega revisable",
    detail:
      "Dejo el contenido preparado y sus límites documentados para la revisión humana.",
    rows: [
      ["Título", "Guía de servicios"],
      ["Idioma", "es-CR"],
      ["Imagen", "Equipo en su taller"],
    ],
  },
] as const;

export function EditorialDemo() {
  const [selected, setSelected] = useState(0);
  const [order, setOrder] = useState([0, 1, 2]);
  const id = useId();
  function selectFolder(index: number) {
    if (index === selected) return;
    setOrder((previous) => [
      index,
      ...previous.filter((item) => item !== index && item !== selected),
      selected,
    ]);
    setSelected(index);
  }
  return (
    <div
      className="editorial-demo"
      aria-label="Muestra ilustrativa del proceso editorial"
    >
      <div className="demo-heading">
        <span className="pixel-mark" aria-hidden="true" />
        <span>DEL CONTENIDO A LA EVIDENCIA</span>
        <span>01—03</span>
      </div>
      <div
        className="folder-stack"
        role="group"
        aria-label="Etapas del proceso editorial"
      >
        <div
          className={`folder-body folder-color-${selected}`}
          id={`${id}-content`}
          role="region"
          aria-labelledby={`${id}-tab-${selected}`}
        >
          <svg
            className="folder-silhouette"
            viewBox="0 0 900 600"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d="M 4 70 H 880 Q 896 70 896 88 V 580 Q 896 596 880 596 H 20 Q 4 596 4 580 Z"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <div className="folder-panel">
            <h2>{stages[selected]!.title}</h2>
            <dl>
              {stages[selected]!.rows.map(([name, value]) => (
                <div key={name}>
                  <dt>{name}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
            <p className="folder-detail">{stages[selected]!.detail}</p>
          </div>
        </div>
        {stages.map((stage, index) => {
          const position = order.indexOf(index);
          const start = 4;
          const silhouette = `M ${start} 22 Q ${start} 8 ${start + 16} 8 L ${start + 220} 8 Q ${start + 232} 8 ${start + 240} 23 L ${start + 266} 70 L 880 70 Q 896 70 896 88 L 896 580 Q 896 596 880 596 L 20 596 Q 4 596 4 580 L 4 22 Z`;
          return (
            <div
              key={stage.label}
              className={`folder-layer folder-color-${index}`}
              data-front={selected === index}
              style={
                {
                  "--folder-depth": position,
                  "--folder-index": position,
                } as React.CSSProperties
              }
            >
              <svg
                className="folder-silhouette"
                viewBox="0 0 900 600"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path d={silhouette} vectorEffect="non-scaling-stroke" />
              </svg>
              <button
                id={`${id}-tab-${index}`}
                type="button"
                className="folder-tab"
                aria-expanded={selected === index}
                aria-controls={`${id}-content`}
                onClick={() => selectFolder(index)}
              >
                <span className="folder-tab-number">0{index + 1}</span>
                {stage.label}
              </button>
            </div>
          );
        })}
      </div>
      <p className="sample-note">
        Muestra ilustrativa · datos ficticios, sin información de clientes.
      </p>
    </div>
  );
}

const example = [
  {
    field: "Título",
    before: "Sin definir",
    after: "Guía de servicios",
    change: "Título descriptivo",
  },
  {
    field: "Enlace",
    before: "/pagina-1",
    after: "/servicios",
    change: "Ruta legible",
  },
  {
    field: "Imagen",
    before: "Sin descripción",
    after: "Equipo en su taller",
    change: "Texto alternativo contextual",
  },
] as const;

export function ContentComparison() {
  const [view, setView] = useState<"both" | "before" | "after">("both");
  const id = useId();
  return (
    <div className="content-comparison" data-reveal>
      <div className="comparison-toolbar">
        <span className="eyebrow">UNA FICHA / DOS MOMENTOS</span>
        <div role="group" aria-label="Vista de la comparación">
          {(
            [
              { value: "both", label: "Comparar" },
              { value: "before", label: "Antes" },
              { value: "after", label: "Después" },
            ] as const
          ).map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={view === option.value}
              aria-controls={id}
              onClick={() => setView(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <div id={id} className="comparison-panels" data-view={view}>
        {(["before", "after"] as const).map((moment) => (
          <section
            key={moment}
            className={`comparison-panel comparison-${moment}`}
            hidden={view !== "both" && view !== moment}
          >
            <h3>
              {moment === "before"
                ? "01 / Antes de la revisión"
                : "02 / Propuesta revisada"}
            </h3>
            <dl>
              {example.map((row) => (
                <div key={row.field}>
                  <dt>{row.field}</dt>
                  <dd>
                    {row[moment]}
                    <small>
                      {moment === "after"
                        ? `+ ${row.change}`
                        : "Pendiente de revisar"}
                    </small>
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
      <p className="sample-note" role="status">
        {view === "both"
          ? "Comparación completa."
          : view === "before"
            ? "Mostrando el contenido inicial."
            : "Mostrando la propuesta revisada."}{" "}
        Ejemplo ilustrativo; no es una auditoría ejecutada ni un resultado de
        cliente.
      </p>
    </div>
  );
}
