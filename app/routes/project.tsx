import { Link, useLocation, useParams } from "react-router";
import { useReducedMotion } from "../../shared/motion";
import { EntryView } from "../../shared/EntryView";
import { englishCasePath, englishCases, englishHomePath, isEnglishPath, published, pageMeta } from "../content";
import { entryPath } from "../../shared/contracts";
import NotFound from "./not-found";
export const meta = ({
  params,
  location,
}: {
  params: Record<string, string | undefined>;
  location: { pathname: string };
}) => {
  const english = isEnglishPath(location.pathname);
  const e = (english ? englishCases : published.entries).find(
    (e) => e.kind === "case" && e.slug === params.slug,
  );
  return e
    ? pageMeta(e.title, e.summary, english ? englishCasePath(e) : entryPath(e))
    : [
        { title: english ? "Page not found" : "Página no encontrada" },
        { name: "robots", content: "noindex, nofollow" },
      ];
};
export default function Project() {
  const reduced = useReducedMotion();
  const { slug } = useParams();
  const english = isEnglishPath(useLocation().pathname);
  const e = (english ? englishCases : published.entries).find((e) => e.kind === "case" && e.slug === slug);
  return e ? (
    <>
      <Link className="back-link" to={(english ? englishHomePath : "/") + "#proyectos"} viewTransition={!reduced}>
        {english ? "← All cases" : "← Todos los casos"}
      </Link>
      <EntryView entry={e} english={english} transition={!reduced} />
    </>
  ) : (
    english ? (
      <>
        <h1>Page not found</h1>
        <Link to={englishHomePath}>Back to home</Link>
      </>
    ) : <NotFound />
  );
}
