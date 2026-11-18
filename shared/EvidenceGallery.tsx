import { useId, useRef } from "react";
import { media, type Entry } from "./contracts";
import { useReducedMotion } from "./motion";

export function EvidenceGallery({ evidence, headingLevel = 2, english = false }: {
  evidence: Entry["evidence"];
  headingLevel?: 2 | 3;
  english?: boolean;
}) {
  const Heading = headingLevel === 3 ? "h3" : "h2";
  const id = useId();
  const track = useRef<HTMLUListElement>(null);
  const reduced = useReducedMotion();
  if (!evidence.length) return null;
  function move(direction: number) {
    const element = track.current;
    if (!element) return;
    element.scrollBy({
      left: direction * element.clientWidth,
      behavior: reduced ? "instant" : "smooth",
    });
  }
  return (
    <section className="evidence-gallery" aria-labelledby={`${id}-title`}>
      <div className="evidence-heading">
        <Heading id={`${id}-title`}>{english ? "Evidence and references" : "Evidencia y referencias"}</Heading>
        {evidence.length > 1 && (
          <div className="evidence-controls" aria-label={english ? "Scroll references" : "Desplazar evidencias"}>
            <button
              type="button"
              aria-label={english ? "Previous reference" : "Evidencia anterior"}
              aria-controls={id}
              onClick={() => move(-1)}
            >
              ←
            </button>
            <button
              type="button"
              aria-label={english ? "Next reference" : "Evidencia siguiente"}
              aria-controls={id}
              onClick={() => move(1)}
            >
              →
            </button>
          </div>
        )}
      </div>
      <ul
        ref={track}
        id={id}
        className="evidence-track"
        tabIndex={evidence.length > 1 ? 0 : undefined}
        aria-label={english ? "Case references, horizontal scroll" : "Referencias del caso; desplazamiento horizontal"}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return;
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            move(event.key === "ArrowLeft" ? -1 : 1);
          }
        }}
      >
        {evidence.map((item, index) => (
          <li key={item.id} className="evidence-item">
            <span className="evidence-number">
              {String(index + 1).padStart(2, "0")} / {english ? "REFERENCE" : "REFERENCIA"}
            </span>
            {item.imageId &&
              media
                .filter((image) => image.id === item.imageId)
                .map((image) => (
                  <img
                    key={image.id}
                    src={image.src}
                    alt={english ? "and_mad: web development and content" : image.alt}
                    width="1200"
                    height="630"
                    loading="lazy"
                  />
                ))}
            <p>
              {item.url ? (
                <a href={item.url} target="_blank" rel="noopener noreferrer">
                  {item.label} ↗
                </a>
              ) : (
                item.label
              )}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
