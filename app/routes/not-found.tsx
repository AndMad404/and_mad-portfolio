import { Link, Navigate, useLocation } from "react-router";
import { retiredPublicDestination } from "../content";
export const meta = () => [
  { title: "Página no encontrada | and_mad" },
  { name: "robots", content: "noindex, nofollow" },
];
export default function NotFound() {
  const { pathname, search } = useLocation();
  const destination = retiredPublicDestination(pathname);
  if (destination) {
    const [home, hash] = destination.split("#");
    return <Navigate to={{ pathname: home, search, hash: "#" + hash }} replace />;
  }
  return (
    <section>
      <h1 tabIndex={-1}>Esta página no existe.</h1>
      <Link to="/">Volver al inicio</Link>
    </section>
  );
}
