import type { Entry } from "./contracts";
import { BlueprintBackground } from "./BlueprintBackground";

export function coverName(entry: Entry) {
  return `case-${entry.id}`;
}

/** Original schematic illustrations, never presented as client screenshots. */
export function CaseCover({
  entry,
  transition = false,
}: {
  entry: Entry;
  transition?: boolean;
}) {
  const cms = entry.id === "operacion-cms";
  const web = entry.id === "sitios-wordpress";
  return (
    <div
      className={`case-cover ${cms ? "cover-cms" : web ? "cover-web" : "cover-system"}`}
      style={{ viewTransitionName: transition ? coverName(entry) : "none" }}
    >
      {!cms && !web && <BlueprintBackground variant="cover" />}
      <span className="cover-caption">Ilustración conceptual</span>
      <div className="cover-drawing" aria-hidden="true">
        {cms ? (
          <div className="cms-window">
            <div className="window-bar">
              <span className="pixel-mark" /> CONTENT / REVIEW{" "}
              <span>01—03</span>
            </div>
            <div className="cms-table">
              <div>
                <span>CAMPO</span>
                <span>REVISIÓN</span>
              </div>
              <div>
                <strong>Título</strong>
                <span>Contenido</span>
              </div>
              <div>
                <strong>Imagen</strong>
                <span>Descripción</span>
              </div>
              <div>
                <strong>Enlace</strong>
                <span>Destino</span>
              </div>
            </div>
            <div className="cms-note">
              Contenido → revisión → entrega <span>↗</span>
            </div>
          </div>
        ) : web ? (
          <div className="web-composition">
            <div className="web-window">
              <div className="window-bar">
                SITIO / EDITORIAL <span>↗</span>
              </div>
              <div className="web-page">
                <span>INFORMACIÓN CON ESTRUCTURA</span>
                <strong>
                  Una idea.
                  <br />
                  Un sitio claro.
                </strong>
                <div className="block-art">
                  <i />
                  <i />
                  <i />
                </div>
                <div className="mock-lines">
                  <i />
                  <i />
                  <i />
                </div>
              </div>
            </div>
            <div className="web-phone">
              <div />
              <strong>
                Una idea.
                <br />
                Un sitio claro.
              </strong>
              <div className="phone-art" />
              <div className="mock-lines">
                <i />
                <i />
              </div>
            </div>
          </div>
        ) : (
          <div className="system-drawing">
            <span className="system-label">{entry.tags[0] || "Contenido"}</span>
            <div className="system-nodes">
              <span>Entrada</span>
              <i>→</i>
              <span>Proceso</span>
              <i>→</i>
              <span>Salida</span>
            </div>
            <div className="system-rule" />
            <span className="system-label">
              DECISIONES / ALCANCE / EVIDENCIA
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
