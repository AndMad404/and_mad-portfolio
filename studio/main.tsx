import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  entrySchema,
  type Entry,
  type Snapshot,
  querySchema,
} from "../shared/contracts";
import { EntryView } from "../shared/EntryView";
import initial from "../content/published.json";
import "../shared/tokens.css";
import { ENERGY_CELL } from "../shared/BlueprintEnergy";
document.documentElement.style.setProperty("--grid-unit", `${ENERGY_CELL}px`);
type Row = { id: string; head: string; content: Entry };
type Release = { id: string; state: string; attempt_id: string | null };
type Connector = {
  id: string;
  resources: string[];
  online: boolean;
  revoked: number;
  last_seen: number | null;
};
type Job = {
  id: string;
  state: string;
  query: string;
  result: string | null;
  result_ok: number | null;
  result_expires: number | null;
  lease_until: number | null;
};
type State = {
  entries: Row[];
  releases: Release[];
  connectors: Connector[];
  jobs: Job[];
};
const blank = (): Entry => ({
  id: crypto.randomUUID(),
  slug: "nuevo-caso",
  kind: "case",
  title: "Nuevo caso",
  summary: "Resumen pendiente",
  problem: "Problema pendiente",
  contribution: "Participación pendiente",
  decisions: [],
  results: "Resultados pendientes",
  limits: "Pendiente de revisión",
  tags: [],
  evidence: [],
});
async function api<T>(path: string, data?: unknown): Promise<T> {
  const r = await fetch("/api" + path, {
    method: data === undefined ? "GET" : "POST",
    credentials: "same-origin",
    headers: data === undefined ? {} : { "Content-Type": "application/json" },
    body: data === undefined ? undefined : JSON.stringify(data),
    cache: "no-store",
  });
  const result: unknown = await r.json();
  if (!r.ok)
    throw new Error(
      result && typeof result === "object" && "error" in result
        ? String(result.error)
        : "Operación rechazada",
    );
  return result as T;
}
const labels: Record<string, string> = {
  approved: "Aprobado",
  deploying: "Desplegando",
  published: "Publicado",
  failed: "Fallido",
};
function App() {
  const [state, setState] = useState<State>({
    entries: [],
    releases: [],
    connectors: [],
    jobs: [],
  });
  const [draft, setDraft] = useState<Entry>(blank);
  const [base, setBase] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [preview, setPreview] = useState(false);
  const [history, setHistory] = useState<{ id: string; content: Entry }[]>([]);
  const [packet, setPacket] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [resources, setResources] = useState("");
  const [credentialId, setCredentialId] = useState("");
  const [resource, setResource] = useState("");
  const [literal, setLiteral] = useState("");
  const [secret, setSecret] = useState("");
  const [evidenceLabel, setEvidenceLabel] = useState("");
  const [frozen, setFrozen] = useState<Snapshot | null>(null);
  const [runId, setRunId] = useState("");
  const [clock, setClock] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setClock(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);
  async function refresh() {
    const next = await api<State>("/state");
    setState(next);
    setReady(true);
  }
  useEffect(() => {
    let active = true;
    const tick = async () => {
      try {
        const next = await api<State>("/state");
        if (active) {
          setState(next);
          setReady(true);
        }
      } catch (e) {
        if (active) {
          setNotice((e as Error).message);
          setReady(false);
        }
      }
    };
    void tick();
    const timer = setInterval(() => void tick(), 10000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);
  async function run(task: () => Promise<void>) {
    setBusy(true);
    setNotice("");
    try {
      await task();
      await refresh();
    } catch (e) {
      setNotice((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function edit(row: Row) {
    setDraft(structuredClone(row.content));
    setBase(row.head);
    setPreview(false);
    setHistory([]);
  }
  function field(key: keyof Entry, label: string, multiline = false) {
    const value = String(draft[key]);
    return (
      <label key={key}>
        {label}
        {multiline ? (
          <textarea
            value={value}
            onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
          />
        ) : (
          <input
            required
            value={value}
            disabled={base !== null && (key === "id" || key === "slug")}
            onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
          />
        )}
      </label>
    );
  }
  return (
    <>
      <header className="header">
        <div className="shell">
          <a className="brand" href="#editor">
            and_mad · editorial
          </a>
          <nav aria-label="Panel">
            <a href="#editor">Editor</a>
            <a href="#importar">Importar</a>
            <a href="#publicar">Publicar</a>
            <a href="#prometheus">Prometheus</a>
          </nav>
        </div>
      </header>
      <main className="studio">
        <h1>Tu mesa de edición.</h1>
        {import.meta.env.DEV && (
          <p className="notice">
            Desarrollo local: datos en una D1 de prueba. La publicación remota
            está deshabilitada.
          </p>
        )}
        <p>Solo lo que apruebes y publiques llegará al portafolio.</p>
        <p className="notice" role="status">
          {notice ||
            (!ready
              ? "Comprobando acceso privado…"
              : busy
                ? "Procesando…"
                : "Acceso privado activo")}
        </p>
        <fieldset disabled={busy || !ready} style={{ border: 0, padding: 0 }}>
          <section id="editor" className="studio-grid">
            <aside>
              <h2>Entradas</h2>
              <button
                onClick={() => {
                  setDraft(blank());
                  setBase(null);
                  setHistory([]);
                }}
              >
                Nueva entrada
              </button>
              <ul>
                {state.entries.map((row) => (
                  <li key={row.id}>
                    <button onClick={() => edit(row)}>
                      {row.content.title}
                    </button>
                  </li>
                ))}
              </ul>
              {state.entries.length === 0 && (
                <button
                  onClick={() =>
                    void run(async () => {
                      for (const entry of initial.entries)
                        await api("/entries", { entry, base: null });
                      setNotice("Contenido inicial cargado como borrador");
                    })
                  }
                >
                  Cargar contenido inicial como borradores
                </button>
              )}
            </aside>
            <div>
              <div className="actions">
                <button type="button" onClick={() => setPreview(!preview)}>
                  {preview ? "Volver a editar" : "Vista previa"}
                </button>
                {base && (
                  <button
                    onClick={() =>
                      void run(async () =>
                        setHistory(await api(`/entries/${draft.id}/revisions`)),
                      )
                    }
                  >
                    Ver revisiones
                  </button>
                )}
              </div>
              {history.length > 0 && (
                <details open>
                  <summary>Revisiones inmutables</summary>
                  {history.map((h) => (
                    <p key={h.id}>
                      <code>{h.id}</code>{" "}
                      <button
                        onClick={() => {
                          setDraft(h.content);
                          setNotice(
                            "Revisión anterior cargada. Guardar creará una nueva revisión.",
                          );
                        }}
                      >
                        Restaurar en editor
                      </button>
                    </p>
                  ))}
                </details>
              )}
              {preview ? (
                <EntryView entry={draft} />
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void run(async () => {
                      const saved = await api<Row>("/entries", {
                        entry: entrySchema.parse(draft),
                        base,
                      });
                      setBase(saved.head);
                      setDraft(saved.content);
                      setNotice("Borrador guardado; todavía no publicado");
                    });
                  }}
                >
                  {field("id", "Identificador")}
                  {field("slug", "Ruta")}
                  <label>
                    Tipo
                    <select
                      value={draft.kind}
                      disabled={base !== null}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          kind: e.target.value as Entry["kind"],
                        })
                      }
                    >
                      <option value="case">Caso de estudio</option>
                      <option value="service">Servicio</option>
                    </select>
                  </label>
                  {field("title", "Título")}
                  {field("summary", "Resumen", true)}
                  {field("problem", "Problema", true)}
                  {field("contribution", "Participación / servicio", true)}
                  <label>
                    Decisiones (una por línea)
                    <textarea
                      value={draft.decisions.join("\n")}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          decisions: e.target.value.split("\n"),
                        })
                      }
                    />
                  </label>
                  {field("results", "Resultados y entregables", true)}
                  {field("limits", "Alcance y límites", true)}
                  <label>
                    Etiquetas separadas por coma
                    <input
                      value={draft.tags.join(",")}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          tags: e.target.value.split(",").filter(Boolean),
                        })
                      }
                    />
                  </label>
                  <details>
                    <summary>Evidencias y biblioteca aprobada</summary>
                    <p>
                      Imagen disponible: social-card. No se admiten archivos
                      nuevos.
                    </p>
                    {draft.evidence.map((ev, i) => (
                      <div className="card" key={ev.id}>
                        <label>
                          Descripción
                          <input
                            value={ev.label}
                            onChange={(e) =>
                              setDraft({
                                ...draft,
                                evidence: draft.evidence.map((v, j) =>
                                  i === j ? { ...v, label: e.target.value } : v,
                                ),
                              })
                            }
                          />
                        </label>
                        <label>
                          Enlace HTTPS (opcional)
                          <input
                            value={ev.url || ""}
                            onChange={(e) =>
                              setDraft({
                                ...draft,
                                evidence: draft.evidence.map((v, j) =>
                                  i === j
                                    ? { ...v, url: e.target.value || undefined }
                                    : v,
                                ),
                              })
                            }
                          />
                        </label>
                        <label>
                          Imagen
                          <select
                            value={ev.imageId || ""}
                            onChange={(e) =>
                              setDraft({
                                ...draft,
                                evidence: draft.evidence.map((v, j) =>
                                  i === j
                                    ? {
                                        ...v,
                                        imageId:
                                          e.target.value === "social-card"
                                            ? "social-card"
                                            : undefined,
                                      }
                                    : v,
                                ),
                              })
                            }
                          >
                            <option value="">Sin imagen</option>
                            <option value="social-card">
                              Tarjeta del portafolio
                            </option>
                          </select>
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            setDraft({
                              ...draft,
                              evidence: draft.evidence.filter(
                                (_, j) => i !== j,
                              ),
                            })
                          }
                        >
                          Quitar referencia
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        setDraft({
                          ...draft,
                          evidence: [
                            ...draft.evidence,
                            {
                              id: crypto.randomUUID(),
                              label: "Evidencia pendiente",
                            },
                          ],
                        })
                      }
                    >
                      Añadir referencia
                    </button>
                  </details>
                  <button type="submit">Guardar borrador</button>
                </form>
              )}
            </div>
          </section>
          <section id="importar" className="section">
            <h2>Importar desde Prometheus</h2>
            <p>
              Paquete JSON versionado y revisado. Importar nunca publica ni
              reemplaza silenciosamente una revisión.
            </p>
            <label>
              Paquete editorial
              <textarea
                value={packet}
                onChange={(e) => setPacket(e.target.value)}
              />
            </label>
            <button
              onClick={() =>
                void run(async () => {
                  const result = await api<{ duplicate: boolean }>(
                    "/imports",
                    JSON.parse(packet),
                  );
                  setNotice(
                    result.duplicate
                      ? "Importación ya registrada"
                      : "Borrador importado",
                  );
                })
              }
            >
              Validar e importar
            </button>
          </section>
          <section id="publicar" className="section">
            <h2>Publicación</h2>
            <button
              onClick={() =>
                void run(async () => {
                  const backup = await api("/backup");
                  const url = URL.createObjectURL(
                    new Blob([JSON.stringify(backup, null, 2)], {
                      type: "application/json",
                    }),
                  );
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = `editorial-${new Date().toISOString().slice(0, 10)}.json`;
                  link.click();
                  setTimeout(() => URL.revokeObjectURL(url), 1000);
                  setNotice(
                    "Respaldo descargado sin consultas temporales ni credenciales del conector",
                  );
                })
              }
            >
              Descargar respaldo editorial
            </button>
            <p>
              Selecciona todas las entradas que compondrán el sitio completo.
              Las no seleccionadas quedarán fuera de esta versión.
            </p>
            {state.entries.map((row) => (
              <label key={row.head}>
                <input
                  type="checkbox"
                  style={{ display: "inline", width: "auto" }}
                  checked={selected.includes(row.head)}
                  onChange={(e) =>
                    setSelected(
                      e.target.checked
                        ? [...selected, row.head]
                        : selected.filter((x) => x !== row.head),
                    )
                  }
                />{" "}
                {row.content.title}{" "}
                <small>revisión {row.head.slice(0, 8)}</small>
              </label>
            ))}
            <button
              disabled={!selected.length}
              onClick={() =>
                void run(async () => {
                  const r = await api<{ snapshot: Snapshot }>("/releases", {
                    heads: selected.filter((h) =>
                      state.entries.some((e) => e.head === h),
                    ),
                  });
                  setFrozen(r.snapshot);
                  setNotice(
                    "Versión congelada y aprobada. Revisa su contenido antes de desplegar.",
                  );
                })
              }
            >
              Aprobar versión seleccionada
            </button>
            {state.releases.map((r) => (
              <div className="card" key={r.id}>
                <p>
                  <strong>{labels[r.state]}</strong> · {r.id}
                </p>
                <div className="actions">
                  {r.state === "deploying" && (
                    <div>
                      <label>
                        ID de la ejecución finalizada en GitHub Actions
                        <input
                          inputMode="numeric"
                          value={runId}
                          onChange={(e) => setRunId(e.target.value)}
                        />
                      </label>
                      <button
                        onClick={() =>
                          void run(async () => {
                            await api(`/releases/${r.id}/reconcile`, {
                              attempt: r.attempt_id,
                              runId: Number(runId),
                            });
                            setNotice(
                              "Estado reconciliado con la ejecución de Actions",
                            );
                          })
                        }
                      >
                        Comprobar resultado en Actions
                      </button>
                    </div>
                  )}
                  <button
                    onClick={() =>
                      void run(async () =>
                        setFrozen(await api(`/releases/${r.id}`)),
                      )
                    }
                  >
                    Revisar contenido congelado
                  </button>
                  <button
                    disabled={r.state === "deploying"}
                    onClick={() =>
                      void run(async () => {
                        await api(
                          `/releases/${r.id}/${r.state === "published" ? "republish" : "publish"}`,
                          {},
                        );
                        setNotice("Despliegue solicitado a GitHub Actions");
                      })
                    }
                  >
                    {r.state === "failed"
                      ? "Reintentar misma versión"
                      : r.state === "published"
                        ? "Volver a publicar esta versión"
                        : "Desplegar"}
                  </button>
                </div>
              </div>
            ))}
            {frozen && (
              <details open>
                <summary>Versión {frozen.releaseId}</summary>
                {frozen.entries.map((entry) => (
                  <EntryView key={entry.id} entry={entry} />
                ))}
              </details>
            )}
          </section>
          <section id="prometheus" className="section">
            <h2>Consulta privada a Prometheus</h2>
            <p>
              El conector se inicia manualmente en tu equipo. Solo permite
              lecturas y búsquedas literales. Los resultados caducan en quince
              minutos.
            </p>
            <label>
              Recursos permitidos (identificadores separados por coma)
              <input
                value={resources}
                onChange={(e) => setResources(e.target.value)}
              />
            </label>
            <button
              onClick={() =>
                void run(async () => {
                  const c = await api<{ id: string; token: string }>(
                    "/credentials",
                    {
                      resources: resources
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    },
                  );
                  setSecret(c.token);
                  setCredentialId(c.id);
                })
              }
            >
              Crear credencial del conector
            </button>
            {secret && (
              <div className="notice">
                <p>
                  Copia esta credencial en CONNECTOR_TOKEN del equipo local.
                  Solo se muestra ahora.
                </p>
                <code style={{ overflowWrap: "anywhere" }}>{secret}</code>
                <button onClick={() => setSecret("")}>
                  Ocultar credencial
                </button>
              </div>
            )}
            {state.connectors.map((c) => (
              <p key={c.id}>
                {c.revoked
                  ? "Revocado"
                  : c.last_seen !== null && clock / 1000 - c.last_seen < 30
                    ? "Conectado"
                    : "Desconectado"}{" "}
                · {c.id}{" "}
                {!c.revoked && (
                  <button
                    onClick={() =>
                      void run(async () => {
                        await api(`/credentials/${c.id}/revoke`, {});
                        setSecret("");
                      })
                    }
                  >
                    Revocar
                  </button>
                )}
              </p>
            ))}
            <label>
              Conector
              <select
                value={credentialId}
                onChange={(e) => setCredentialId(e.target.value)}
              >
                <option value="">Selecciona un conector</option>
                {state.connectors
                  .filter((c) => !c.revoked)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.id}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Recurso
              <select
                value={resource}
                onChange={(e) => setResource(e.target.value)}
              >
                <option value="">Selecciona un recurso</option>
                {state.connectors
                  .find((c) => c.id === credentialId)
                  ?.resources.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
              </select>
            </label>
            <label>
              Texto literal (vacío para leer)
              <input
                value={literal}
                onChange={(e) => setLiteral(e.target.value)}
              />
            </label>
            <button
              onClick={() =>
                void run(async () => {
                  await api("/queries", {
                    credentialId,
                    query: querySchema.parse(
                      literal
                        ? { operation: "search", resourceId: resource, literal }
                        : { operation: "read", resourceId: resource },
                    ),
                  });
                  setNotice("Consulta en cola");
                })
              }
            >
              Consultar
            </button>
            <label>
              Texto revisado para conservar como evidencia de la entrada abierta
              <textarea
                value={evidenceLabel}
                onChange={(e) => setEvidenceLabel(e.target.value)}
              />
            </label>
            {state.jobs
              .filter(
                (j) =>
                  j.result_expires === null || j.result_expires > clock / 1000,
              )
              .map((j) => (
                <div className="card" key={j.id}>
                  <p>
                    {j.state === "done"
                      ? "Completada"
                      : j.state === "claimed" &&
                          j.lease_until &&
                          j.lease_until * 1000 < Date.now()
                        ? "Asignación vencida"
                        : j.state === "claimed"
                          ? "En ejecución"
                          : "Pendiente"}{" "}
                    · {j.id}
                  </p>
                  {j.result && (
                    <>
                      <pre>{j.result}</pre>
                      <p>
                        Caduca:{" "}
                        {new Date(
                          (j.result_expires || 0) * 1000,
                        ).toLocaleTimeString()}
                      </p>
                      <button
                        disabled={!base || !evidenceLabel || j.result_ok !== 1}
                        onClick={() =>
                          void run(async () => {
                            const saved = await api<Row>(
                              `/queries/${j.id}/evidence`,
                              {
                                entryId: draft.id,
                                base,
                                evidence: {
                                  id: crypto.randomUUID(),
                                  label: evidenceLabel,
                                },
                              },
                            );
                            setBase(saved.head);
                            setDraft(saved.content);
                            setNotice(
                              "Texto revisado guardado explícitamente como evidencia en un borrador",
                            );
                          })
                        }
                      >
                        Guardar texto revisado como evidencia
                      </button>
                    </>
                  )}
                </div>
              ))}
          </section>
        </fieldset>
      </main>
    </>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
