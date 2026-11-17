import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  Link,
  useLocation,
  useNavigationType,
  isRouteErrorResponse,
  useRouteError,
  useNavigation,
} from "react-router";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ENERGY_CELL } from "../shared/BlueprintEnergy";
import { useDocumentGrid } from "../shared/documentGrid";
import { useReducedMotion } from "../shared/motion";
import { usePageMotion, useBlockNavigation, visibleNavigationSection, activateSectionEnergy } from "./components/PageMotion";
import { BlueprintBackground } from "./components/BlueprintBackground";
import { BlueprintWindows } from "./components/BlueprintWindows";
import "../shared/tokens.css";
import "./public.css";
export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CR" style={{ "--grid-unit": `${ENERGY_CELL}px` } as CSSProperties}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <link rel="icon" href="/favicon.svg" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
export default function Root() {
  const location = useLocation();
  // URL fragments never reach the server. Apply them only after hydration so
  // the first client render preserves the prerendered attributes.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const renderedHash = hydrated ? location.hash : "";
  const navigationType = useNavigationType();
  const navigation = useNavigation();
  const reduced = useReducedMotion();
  const header = useRef<HTMLElement>(null);
  const main = useRef<HTMLElement>(null);
  useDocumentGrid(main);
  const [visibleSection, setVisibleSection] = useState("");
  useEffect(() => {
    if (location.pathname !== "/" || !main.current) return;
    let frame: number | null = null;
    function update() {
      frame = null;
      if (document.querySelector("dialog[open]")) return;
      const blocks = [...main.current!.querySelectorAll<HTMLElement>(":scope > section")];
      const footer = document.getElementById("contacto");
      if (footer) blocks.push(footer);
      setVisibleSection(visibleNavigationSection(blocks.map(element => {
        const rect = element.getBoundingClientRect();
        return { id: element.id, top: rect.top, bottom: rect.bottom };
      }), header.current?.getBoundingClientRect().bottom ?? 0, window.innerHeight,
      { scroll: window.scrollY, height: document.documentElement.scrollHeight }));
    }
    function schedule() { if (frame === null) frame = requestAnimationFrame(update); }
    const resize = new ResizeObserver(schedule);
    resize.observe(main.current);
    const footer = document.getElementById("contacto");
    if (footer) resize.observe(footer);
    if (header.current) resize.observe(header.current);
    const mutation = new MutationObserver(schedule);
    mutation.observe(main.current, { subtree: true, childList: true, attributes: true, attributeFilter: ["open"] });
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    schedule();
    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
      resize.disconnect(); mutation.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [location.pathname]);
  const modalSection = /^#servicio-/.test(renderedHash) ? "servicios"
    : /^#caso-/.test(renderedHash) ? "proyectos" : null;
  const activeMenuSection = modalSection ?? visibleSection;
  useEffect(() => {
    if (main.current) activateSectionEnergy(main.current.parentElement ?? main.current,
      location.pathname === "/" ? activeMenuSection : "", reduced);
  }, [activeMenuSection, location.pathname, reduced]);
  usePageMotion(main, location.pathname);
  useBlockNavigation(main, location.pathname);
  const first = useRef(true);
  useEffect(() => {
    if (!header.current || typeof ResizeObserver === "undefined") return;
    const r = new ResizeObserver(([e]) => {
      if (e)
        document.documentElement.style.setProperty(
          "--header-height",
          `${e.target.getBoundingClientRect().height}px`,
        );
    });
    r.observe(header.current);
    return () => r.disconnect();
  }, []);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    document
      .querySelector<HTMLElement>("main h1")
      ?.focus({ preventScroll: true });
  }, [location.pathname]);
  useEffect(() => {
    // Modal URLs leave the page at its current position; POP restores saved scroll.
    if (!location.hash || navigationType === "POP" || /^#(?:caso|servicio)-/.test(location.hash)) return;
    let frame = requestAnimationFrame(() => {
      const target = document.getElementById(location.hash.slice(1));
      if (!target) return;
      target.scrollIntoView({ behavior: reduced ? "instant" : "smooth", block: "start" });
      const focus = target.matches("summary") ? target : target.querySelector<HTMLElement>(
        target.matches("details") ? ".entry-title" : "h2, h1",
      );
      if (focus instanceof HTMLElement) {
        if (!focus.matches("summary")) focus.tabIndex = -1;
        focus.focus({ preventScroll: true });
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [location.hash, location.key, navigationType, reduced]);
  return (
    <div className="public-site">
      <BlueprintBackground />
      <BlueprintWindows root={main} pathname={location.pathname} />
      <a className="skip" href="#main">
        Saltar al contenido
      </a>
      <header className="header" ref={header}>
        <div className="shell">
          <Link
            className="brand"
            to="/"
            viewTransition={!reduced}
            aria-label="Andrés Madrigal — And_Mad — inicio"
          >
            <span className="pixel-mark" aria-hidden="true" />
            <span className="brand-names" aria-hidden="true">
              <span>And</span>
              {Array.from("res ").map((letter, index) => (
                <span
                  className="brand-remove"
                  style={{ "--letter-order": index } as React.CSSProperties}
                  key={`first-${index}`}
                >
                  {letter === " " ? "\u00a0" : letter}
                </span>
              ))}
              <span className="brand-underscore">
                <span className="brand-accent" />
              </span>
              <span>Mad</span>
              {Array.from("rigal").map((letter, index) => (
                <span
                  className="brand-remove"
                  style={{ "--letter-order": index + 4 } as React.CSSProperties}
                  key={`last-${index}`}
                >
                  {letter}
                </span>
              ))}
            </span>
          </Link>
          <nav aria-label="Principal">
            {["servicios", "proyectos", "contacto"].map((section) => (
              <Link
                key={section}
                to={`/#${section}`}
                viewTransition={!reduced}
                onClick={event => {
                  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                  if (location.pathname === "/" && activeMenuSection === section && main.current)
                    activateSectionEnergy(main.current.parentElement ?? main.current, section, reduced, true);
                }}
                aria-current={
                  (location.pathname === "/" ? activeMenuSection === section :
                  location.pathname.startsWith(`/${section}/`) ||
                  renderedHash === `#${section}` ||
                  (section === "proyectos" && /^#(?:caso|resumen)-/.test(renderedHash) && !renderedHash.startsWith("#resumen-servicio-")) ||
                  (section === "servicios" && /^#(?:servicio|resumen-servicio)-/.test(renderedHash)))
                    ? "location"
                    : undefined
                }
              >
                <span className="nav-label">
                  {section === "proyectos"
                    ? "Casos"
                    : section[0]!.toUpperCase() + section.slice(1)}
                  <svg className="nav-node" viewBox="0 0 100 10" fill="none" aria-hidden="true" focusable="false">
                    <path d="M3 5H97" />
                    <circle cx="3" cy="5" r="2" /><circle cx="97" cy="5" r="2" />
                    <circle className="travelling-node" r="2.5">
                      <animateMotion dur="2.466666s" repeatCount="indefinite" path="M3 5H97" />
                    </circle>
                  </svg>
                </span>
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <div className="navigation-status" role="status">
        {navigation.state !== "idle" ? "Abriendo página…" : ""}
      </div>
      <main id="main" className="shell" ref={main}>
        <Outlet />
      </main>
      <footer id="contacto" className="shell contact-section" aria-labelledby="contact-title">
        <p className="eyebrow">CONTACTO</p>
        <h2 id="contact-title">
          Hablemos de tu proyecto<br />o tu equipo<span>.</span>
        </h2>
        <p>Contame qué necesitás resolver o qué perfil estás buscando.</p>
        <div className="contact-links">
          <a className="button" href="https://www.linkedin.com/in/andres-mad/" target="_blank" rel="noopener noreferrer">
            Contactar por LinkedIn ↗
          </a>
          <a className="button button-secondary" href="https://github.com/AndMad404" target="_blank" rel="noopener noreferrer">
            Ver GitHub ↗
          </a>
        </div>
        <div className="footer-signature">
          <Link className="brand" to="/" viewTransition={!reduced}>and_mad</Link>
          <span>Desarrollo web, contenido y calidad · Costa Rica</span>
        </div>
      </footer>
      <button className="back-to-top" type="button" aria-label="Volver al inicio"
        onClick={() => {
          window.scrollTo({ top: 0, behavior: reduced ? "instant" : "smooth" });
          header.current?.querySelector<HTMLElement>("a")?.focus({ preventScroll: true });
        }}>
        <svg viewBox="0 0 40 40" fill="none" aria-hidden="true" focusable="false">
          <path d="M20 33V9M9 20L20 9L31 20" />
          <circle cx="20" cy="33" r="2" /><circle cx="20" cy="9" r="3" />
          <circle cx="9" cy="20" r="2" /><circle cx="31" cy="20" r="2" />
          <circle className="travelling-node" r="2">
            <animateMotion dur="2.4s" repeatCount="indefinite" path="M20 33V9L9 20L20 9L31 20" />
          </circle>
        </svg>
      </button>
    </div>
  );
}
export function ErrorBoundary() {
  const error = useRouteError();
  return (
    <main className="shell">
      <h1 tabIndex={-1}>
        {isRouteErrorResponse(error) && error.status === 404
          ? "Página no encontrada"
          : "No se pudo abrir esta página"}
      </h1>
      <Link to="/">Volver al inicio</Link>
    </main>
  );
}
