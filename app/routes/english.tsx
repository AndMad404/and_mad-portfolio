import { useEffect, useState } from "react";
import { useLocation } from "react-router";
import { AreaCard } from "../components/ProjectCard";
import { caseAreas, englishHomePath, englishHomeSeo, pageMeta, published, resolveCaseFragment } from "../content";

export const meta = () => pageMeta(englishHomeSeo.title, englishHomeSeo.description, englishHomePath);

const services: Record<string, { title: string; points: string[] }> = {
  "creacion-sitios": {
    title: "Web interfaces and integrations",
    points: ["Design and build responsive web interfaces.", "Integrate data sources, forms, and applications.",
      "Build and maintain CMS sites with reusable templates and components."],
  },
  "mejora-mantenimiento": {
    title: "QA and quality checks",
    points: ["Test software and interfaces for functional and usability issues.",
      "Validate data, content, and digital assets for inconsistencies.",
      "Automate CI/CD checks and document findings so teams can prioritize fixes and review releases."],
  },
  "automatizacion-editorial": {
    title: "Automation and process improvement",
    points: ["Automate data flows and development tasks.", "Identify and analyze bottlenecks.",
      "Design workflows and build tools that improve how teams work."],
  },
};

export default function EnglishHome() {
  const location = useLocation();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const selected = hydrated ? resolveCaseFragment(location.hash) : undefined;

  return (
    <>
      <section className="hero editorial-hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow"><span className="pixel-mark" aria-hidden="true" /> ANDRÉS MADRIGAL / PORTFOLIO</p>
          <h1 id="hero-title" tabIndex={-1}>
            Clear content.<br />
            Reliable data.<br />
            <span>Web that works.</span>
          </h1>
          <p className="lede">
            More than seven years across web development, enterprise content, and data quality.
            I build interfaces and automate tasks with QA, marketing, and development teams, including work with English-speaking clients.
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
      <section id="servicios" className="section services-section" aria-labelledby="services-title">
        <div className="section-heading">
          <div data-energy-intro>
            <h2 id="services-title">How I can help.</h2>
            <p>We agree on scope, then I build in stages and validate each delivery against clear criteria.
              I document decisions and share what I learn so the team can carry on.</p>
          </div>
        </div>
        <ul className="service-list">
          {published.entries.flatMap(entry => {
            const service = services[entry.id];
            if (entry.kind !== "service" || !service) return [];
            return <li className="service-disclosure" key={entry.id}>
              <div className="service-row">
                <div className="service-heading">
                  <h3>{service.title}</h3>
                  <span className="service-node" aria-hidden="true"><i /><i /></span>
                </div>
                <div className="service-offer">
                  <ul>{service.points.map(point => <li key={point}>{point}</li>)}</ul>
                </div>
              </div>
            </li>;
          })}
        </ul>
      </section>
      <section id="proyectos" className="section work-section" aria-labelledby="work-title">
        <div className="section-heading work-heading">
          <div><h2 id="work-title">Selected work.</h2></div>
          <span className="service-node work-heading-node" aria-hidden="true"><i /><i /></span>
          <p>Examples from web development, data quality, and automation. I can walk through the decisions and context behind each project in an interview.</p>
        </div>
        <div className="project-grid">
          {caseAreas.map(area => <AreaCard key={area.id} area={area} entries={published.entries} selected={selected} english />)}
        </div>
      </section>
    </>
  );
}
