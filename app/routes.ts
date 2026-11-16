import { index, route, type RouteConfig } from "@react-router/dev/routes";
export default [
  index("routes/home.tsx"),
  route("servicios/:slug", "routes/service.tsx"),
  route("proyectos/:slug", "routes/project.tsx"),
  route("*", "routes/not-found.tsx"),
] satisfies RouteConfig;
