import { Link, useLocation } from "react-router";
import { isEnglishPath } from "../content";

export function LanguagePicker({ to }: { to: string }) {
  const english = isEnglishPath(useLocation().pathname);

  return (
    <Link className="language-toggle" data-language={english ? "en" : "es"}
      to={to}
      hrefLang={english ? "es-CR" : "en"}
      aria-label={english ? "Switch to Spanish" : "Cambiar a inglés"}>
      <span className="nav-label" aria-hidden="true">
        <span className="language-es">ES</span> / <span className="language-en">EN</span>
        <svg className="nav-node" viewBox="0 0 100 10" fill="none" focusable="false">
          <path d="M7 5H93" />
          <circle cx="7" cy="5" r="2" />
          <circle cx="93" cy="5" r="2" />
          <circle className="language-light" cx="7" cy="5" r="3.5" />
        </svg>
      </span>
    </Link>
  );
}
