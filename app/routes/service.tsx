import { Link, useParams } from "react-router";
import { useReducedMotion } from "../../shared/motion";
import { EntryView } from "../../shared/EntryView";
import { published, pageMeta } from "../content";
import NotFound from "./not-found";
export const meta = ({
  params,
}: {
  params: Record<string, string | undefined>;
}) => {
  const e = published.entries.find(
    (e) => e.kind === "service" && e.slug === params.slug,
  );
  return e
    ? pageMeta(e.title, e.summary, `/servicios/${e.slug}/`)
    : [
        { title: "Página no encontrada" },
        { name: "robots", content: "noindex, nofollow" },
      ];
};
export default function Service() {
  const reduced = useReducedMotion();
  const { slug } = useParams();
  const e = published.entries.find(
    (e) => e.kind === "service" && e.slug === slug,
  );
  return e ? (
    <>
      <Link className="back-link" to="/#servicios" viewTransition={!reduced}>
        ← Todos los servicios
      </Link>
      <EntryView entry={e} />
    </>
  ) : (
    <NotFound />
  );
}
