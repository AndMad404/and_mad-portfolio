import { Link } from "react-router";
export const meta = () => [
  { title: "Página no encontrada | and_mad" },
  { name: "robots", content: "noindex, nofollow" },
];
export default function NotFound() {
  return (
    <section>
      <h1 tabIndex={-1}>Esta página no existe.</h1>
      <Link to="/">Volver al inicio</Link>
    </section>
  );
}
