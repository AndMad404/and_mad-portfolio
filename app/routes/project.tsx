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
    (e) => e.kind === "case" && e.slug === params.slug,
  );
  return e
    ? pageMeta(e.title, e.summary, `/proyectos/${e.slug}/`)
    : [
        { title: "Página no encontrada" },
        { name: "robots", content: "noindex, nofollow" },
      ];
};
export default function Project() {
  const reduced = useReducedMotion();
  const { slug } = useParams();
  const e = published.entries.find((e) => e.kind === "case" && e.slug === slug);
  return e ? (
    <>
      <Link className="back-link" to="/#proyectos" viewTransition={!reduced}>
        ← Todos los casos
      </Link>
      <EntryView entry={e} transition={!reduced} />
    </>
  ) : (
    <NotFound />
  );
}
