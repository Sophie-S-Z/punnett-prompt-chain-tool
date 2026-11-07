import Link from "next/link";
import { loadPage } from "@/lib/page-window";
import { requireAdmin } from "@/lib/admin";
import { UUID, type Chain, type Run, type Option } from "@/lib/studio";
import {
  AddStep,
  ChainHeader,
  NewChain,
  StepItem,
  StepList,
} from "./StudioForms";
import { RunPanel } from "./RunPanel";
import { RecordImage } from "./RecordImage";
import { Shell } from "./Shell";
import { ChainCanvas } from "./product/ChainCanvas";

type Query = Record<string, string | string[] | undefined>;
type Client = Awaited<ReturnType<typeof requireAdmin>>["client"];

const CHAIN_PAGE = 50;
const RUN_PAGE = 10;
/** Search appears only when a list is long enough to need it. */
const SEARCH_FROM = 10;

function text(value: string | string[] | undefined, max = 200) {
  return typeof value === "string" ? value.slice(0, max) : "";
}

/** Reads one page of chains or runs. Out-of-range pages fall back to the last page. */
async function readPage(
  client: Client,
  kind: "chains" | "runs",
  q: string,
  chainId: string | null,
  size: number,
  requested: number,
) {
  const read = (p: number) =>
    client
      .rpc(
        "punnett_studio_page",
        {
          kind_input: kind,
          search_input: q,
          chain_input: kind === "runs" ? chainId : null,
        },
        { count: "exact" },
      )
      .range((p - 1) * size, p * size - 1);
  const result = await loadPage<{ record: unknown }>(read, requested, size);
  return { ...result, total: result.total };
}

/** Reads every model and every finished image, 200 rows at a time. */
async function readOptions(client: Client) {
  const options: Record<"models" | "images", Option[]> = {
    models: [],
    images: [],
  };
  for (const entity of ["models", "images"] as const) {
    for (let offset = 0; ; offset += 200) {
      const r = await client
        .rpc(
          "punnett_admin_records",
          { kind_input: entity, sort_input: "name" },
          { count: "exact" },
        )
        .range(offset, offset + 199);
      if (r.error || r.count === null)
        throw new Error("The models or images could not be loaded.");
      for (const item of r.data) {
        const row = item.record;
        if (entity === "models")
          options.models.push({ id: row.id, label: row.name });
        else if (
          !row.archived &&
          row.status === "completed" &&
          row.storage_path
        )
          options.images.push({
            id: row.id,
            label:
              row.title ||
              new Date(row.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                timeZone: "UTC",
              }),
          });
      }
      if (offset + r.data.length >= r.count) break;
      if (!r.data.length) throw new Error("The image list was incomplete.");
    }
  }
  return options;
}

function Pagination({
  page,
  last,
  href,
}: {
  page: number;
  last: number;
  href: (page: number) => string;
}) {
  if (last <= 1) return null;
  return (
    <nav className="pagination" aria-label="Pages">
      {page > 1 ? <Link href={href(page - 1)}>Previous</Link> : <span />}
      <span>
        Page {page} of {last}
      </span>
      {page < last ? <Link href={href(page + 1)}>Next</Link> : <span />}
    </nav>
  );
}

function Search({
  q,
  label,
  chainId,
  clearHref,
}: {
  q: string;
  label: string;
  chainId?: string | null;
  clearHref: string;
}) {
  return (
    <form className="search" method="get" role="search">
      {chainId && <input type="hidden" name="chain" value={chainId} />}
      <label>
        <span className="visually-hidden">{label}</span>
        <input
          type="search"
          name="q"
          defaultValue={q}
          maxLength={200}
          placeholder={label}
        />
      </label>
      {q && <Link href={clearHref}>Clear</Link>}
    </form>
  );
}

export async function StudioPage({
  query,
  mode = "chains",
}: {
  query: Query;
  mode?: "chains" | "runs";
}) {
  const { client } = await requireAdmin();
  const q = text(query.q);
  const requested = Math.max(
    1,
    Math.min(
      10000,
      Number.isSafeInteger(Number(query.page)) ? Number(query.page) : 1,
    ),
  );
  const chainId =
    typeof query.chain === "string" && UUID.test(query.chain)
      ? query.chain
      : null;
  if (mode === "runs")
    return (
      <RunsView client={client} q={q} page={requested} chainId={chainId} />
    );

  const list = await readPage(client, "chains", q, null, CHAIN_PAGE, requested);
  const chains = list.rows.map(({ record }) => record as Chain);
  let selected: Chain | null = null;
  const target = chainId ?? chains[0]?.id;
  if (target) {
    const response = await client.rpc("punnett_studio_chain", {
      id_input: target,
    });
    if (response.error)
      throw new Error("This chain could not be read. Reload and try again.");
    selected = response.data;
  }
  const options = selected ? await readOptions(client) : null;
  const chainHref = (id: string) =>
    `/chains?${new URLSearchParams({
      chain: id,
      ...(q ? { q } : {}),
      ...(list.page > 1 ? { page: String(list.page) } : {}),
    })}`;

  return (
    <Shell section="chains">
      <main id="main" className="workspace">
        <aside className="chain-nav" aria-label="Prompt chains">
          <div className="section-head">
            <h2>Chains</h2>
            <span className="count">{list.total}</span>
          </div>
          <NewChain />
          {(list.total > SEARCH_FROM || q) && (
            <Search q={q} label="Search chains" clearHref="/chains" />
          )}
          <ol>
            {chains.map((c) => (
              <li key={c.id}>
                <Link
                  href={chainHref(c.id)}
                  aria-current={selected?.id === c.id ? "page" : undefined}
                >
                  {c.name}
                  <small>
                    {c.step_count} {c.step_count === 1 ? "step" : "steps"}
                  </small>
                </Link>
              </li>
            ))}
          </ol>
          {q && !chains.length && <p className="hint">No chains match.</p>}
          <Pagination
            page={list.page}
            last={list.last}
            href={(p) =>
              `/chains?${new URLSearchParams({ ...(q ? { q } : {}), page: String(p) })}`
            }
          />
        </aside>
        <div className="chain-detail">
          {chainId && !selected && (
            <p className="error" role="status">
              That chain was deleted. Choose another chain.
            </p>
          )}
          {!selected && !list.total && (
            <div className="empty">
              <h1>No prompt chains yet</h1>
              <p>
                Create a chain. Then add the steps that turn an image into
                captions.
              </p>
            </div>
          )}
          {selected && options && (
            <>
              <ChainHeader key={`header:${selected.id}`} chain={selected} />
              {selected.steps.length >= 2 && (
                <ChainCanvas
                  key={`flow:${selected.id}:${selected.revision}`}
                  chain={selected}
                />
              )}
              <section aria-labelledby="steps-title">
                <div className="section-head">
                  <h2 id="steps-title">Steps</h2>
                </div>
                {!selected.steps.length && (
                  <p className="hint">
                    Start with a step that reads the image. The last step must
                    write captions.
                  </p>
                )}
                <StepList id={selected.id}>
                  {selected.steps.map((step) => (
                    <StepItem
                      key={step.id}
                      chain={selected}
                      step={step}
                      models={options.models}
                    />
                  ))}
                </StepList>
                <AddStep
                  key={`add:${selected.id}`}
                  chain={selected}
                  models={options.models}
                />
              </section>
              <RunPanel
                key={selected.id}
                chain={selected}
                images={options.images}
              />
            </>
          )}
        </div>
      </main>
    </Shell>
  );
}

async function RunsView({
  client,
  q,
  page: requested,
  chainId,
}: {
  client: Client;
  q: string;
  page: number;
  chainId: string | null;
}) {
  const list = await readPage(client, "runs", q, chainId, RUN_PAGE, requested);
  const runs = list.rows.map(({ record }) => record as Run);
  let chainName: string | null = null;
  if (chainId) {
    const response = await client.rpc("punnett_studio_chain", {
      id_input: chainId,
    });
    chainName =
      (response.data as Chain | null)?.name ?? runs[0]?.snapshot.name ?? null;
  }
  const href = (p: number) =>
    `/runs?${new URLSearchParams({
      ...(chainId ? { chain: chainId } : {}),
      ...(q ? { q } : {}),
      page: String(p),
    })}`;
  const clearHref = chainId ? `/runs?chain=${chainId}` : "/runs";

  return (
    <Shell section="runs">
      <main id="main" className="page">
        <header className="page-head">
          <div>
            <h1>{chainName ? `Runs of ${chainName}` : "Runs"}</h1>
            <p>
              {chainName ? (
                <>
                  <Link href={`/chains?chain=${chainId}`}>Open this chain</Link>
                  {" · "}
                  <Link href="/runs">Show all runs</Link>
                </>
              ) : (
                "Each run keeps the prompts it used, so you can compare results after you edit a chain."
              )}
            </p>
          </div>
          {(list.total > SEARCH_FROM || q) && (
            <Search
              q={q}
              label="Search runs"
              chainId={chainId}
              clearHref={clearHref}
            />
          )}
        </header>
        {!runs.length && (
          <div className="empty">
            <h2>{q ? "No runs match" : "No runs yet"}</h2>
            <p>
              {q
                ? "Try a different search."
                : "Test a chain on an image. The results show up here."}
            </p>
          </div>
        )}
        <ol className="runs">
          {runs.map((r) => (
            <li key={r.id} className="run">
              <div className="run-image">
                <RecordImage id={r.image_id} large />
              </div>
              <div className="run-body">
                <header>
                  <h2>{r.snapshot.name}</h2>
                  <p className="meta">
                    <time dateTime={r.created_at}>
                      {new Date(r.created_at).toLocaleString("en-US", {
                        dateStyle: "medium",
                        timeStyle: "short",
                        timeZone: "UTC",
                      })}{" "}
                      UTC
                    </time>
                    {r.status !== "completed" && (
                      <span className={`status ${r.status}`}>
                        {r.status === "pending" ? "Did not finish" : "Failed"}
                      </span>
                    )}
                  </p>
                </header>
                <ol className="trace">
                  {r.snapshot.steps.map((s) => {
                    const output = r.outputs.find(
                      (o) => o.position === s.position,
                    );
                    return (
                      <li key={s.id}>
                        <p className="trace-head">
                          <strong>
                            {s.position}. {s.name}
                          </strong>
                          <span className="meta">
                            {s.model}
                            {output &&
                              ` · ${(output.duration_ms / 1000).toFixed(1)} s`}
                          </span>
                        </p>
                        {Array.isArray(output?.output) ? (
                          <ul className="captions">
                            {output.output.map((c, i) => (
                              <li key={i}>{c}</li>
                            ))}
                          </ul>
                        ) : output ? (
                          <p className="trace-text">{output.output}</p>
                        ) : (
                          <p className="hint">No output</p>
                        )}
                        <details className="system-prompt">
                          <summary>Prompts used</summary>
                          {s.system_prompt && (
                            <>
                              <p className="label">System prompt</p>
                              <p className="prompt">{s.system_prompt}</p>
                            </>
                          )}
                          <p className="label">User prompt</p>
                          <p className="prompt">{s.user_prompt}</p>
                          <p className="meta">Temperature {s.temperature}</p>
                        </details>
                      </li>
                    );
                  })}
                </ol>
                {r.error && (
                  <p className="error" role="status">
                    {r.error}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
        <Pagination page={list.page} last={list.last} href={href} />
      </main>
    </Shell>
  );
}
