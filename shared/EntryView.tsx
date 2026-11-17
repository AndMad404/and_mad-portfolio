import { entryPath, type Entry } from "./contracts";
import { CaseCover } from "./CaseCover";
import { EvidenceGallery } from "./EvidenceGallery";
export function EntryView({
  entry,
  transition = false,
  inline = false,
}: {
  entry: Entry;
  transition?: boolean;
  inline?: boolean;
}) {
  const Title = inline ? "h2" : "h1";
  const SectionTitle = inline ? "h3" : "h2";
  return (
    <article className="detail editorial-detail">
      <header className="detail-heading">
        <p className="eyebrow">
          {entry.kind === "service"
            ? "Servicios en Costa Rica"
            : "Caso de estudio"}
        </p>
        <Title className="entry-title" tabIndex={-1}>{entry.title}</Title>
        <p className="lede">{entry.summary}</p>
        {entry.kind === "case" && entry.tags.length > 0 && <div className="tags">
          {entry.tags.map((t) => (
            <span className="tag" key={t}>
              {t}
            </span>
          ))}
        </div>}
      </header>
      {entry.kind === "case" && (
        inline ? <div className="entry-parallax-window" aria-hidden="true" /> :
          <CaseCover entry={entry} transition={transition} />
      )}
      {entry.kind === "service" ? <div className="detail-body">
        {entry.decisions.length > 0 && <section className="detail-block">
          <span className="detail-number" aria-hidden="true">01</span>
          <div>
            <SectionTitle>Qué puedes contratar</SectionTitle>
            <ul>{entry.decisions.map((item, index) => <li key={index}>{item}</li>)}</ul>
          </div>
        </section>}
        <section className="detail-block">
          <span className="detail-number" aria-hidden="true">{entry.decisions.length > 0 ? "02" : "01"}</span>
          <div>
            <SectionTitle>Experiencia que aporto</SectionTitle>
            <p>{entry.contribution}</p>
          </div>
        </section>
        <p className="detail-limits">{entry.limits}</p>
      </div> : <div className="detail-body">
        <section className="detail-block">
          <span className="detail-number" aria-hidden="true">
            01
          </span>
          <div>
            <SectionTitle>El problema</SectionTitle>
            <p>{entry.problem}</p>
          </div>
        </section>
        <section className="detail-block">
          <span className="detail-number" aria-hidden="true">
            02
          </span>
          <div>
            <SectionTitle>
              Mi participación
            </SectionTitle>
            <p>{entry.contribution}</p>
          </div>
        </section>
        {entry.decisions.length > 0 && <section className="detail-block">
          <span className="detail-number" aria-hidden="true">
            03
          </span>
          <div>
            <SectionTitle>Decisiones</SectionTitle>
            <ul>
              {entry.decisions.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          </div>
        </section>}
        <section className="detail-block">
          <span className="detail-number" aria-hidden="true">
            {entry.decisions.length > 0 ? "04" : "03"}
          </span>
          <div>
            <SectionTitle>Resultados y entregables</SectionTitle>
            <p>{entry.results}</p>
          </div>
        </section>
        <section className="detail-block detail-limits">
          <span className="detail-number" aria-hidden="true">
            {entry.decisions.length > 0 ? "05" : "04"}
          </span>
          <div>
            <SectionTitle>Alcance y límites</SectionTitle>
            <p>{entry.limits}</p>
          </div>
        </section>
      </div>}
      {entry.kind === "case" && <EvidenceGallery evidence={entry.evidence} headingLevel={inline ? 3 : 2} />}
      <div className="detail-contact">
        <a className="button" href="https://www.linkedin.com/in/andres-mad/" target="_blank" rel="noopener noreferrer">
          {entry.kind === "service" ? "Conversemos sobre tu proyecto ↗" : "Conversemos sobre este trabajo ↗"}
        </a>
      </div>
    </article>
  );
}
export function EntryCard({
  entry,
  children,
}: {
  entry: Entry;
  children?: React.ReactNode;
}) {
  return (
    <article className="card">
      <p className="eyebrow">
        {entry.kind === "service" ? "Servicio" : "Proyecto"}
      </p>
      <h3>{children || <a href={entryPath(entry)}>{entry.title}</a>}</h3>
      <p>{entry.summary}</p>
      <div className="tags">
        {entry.tags.map((t) => (
          <span className="tag" key={t}>
            {t}
          </span>
        ))}
      </div>
    </article>
  );
}
