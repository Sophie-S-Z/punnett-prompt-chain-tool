import assert from "node:assert/strict";
import test from "node:test";
import { loadPage } from "../src/lib/page-window.ts";
const rows = Array.from({ length: 1203 }, (_, id) => ({ id }));
for (const [requested, size, first, length] of [
  [1, 50, 0, 50],
  [13, 50, 600, 50],
  [25, 50, 1200, 3],
  [1, 2000, 0, 1203],
])
  test("page " + requested + " with size " + size, async () => {
    const r = await loadPage(
      async (p) => ({
        data: rows.slice((p - 1) * size, p * size),
        count: rows.length,
        error: null,
      }),
      requested,
      size,
    );
    assert.equal(r.rows[0].id, first);
    assert.equal(r.rows.length, length);
    assert.equal(r.total, 1203);
  });
test("stale out-of-range pages recount then return the actual last page", async () => {
  const calls: number[] = [];
  const r = await loadPage(
    async (p) => {
      calls.push(p);
      return p === 99
        ? { data: null, count: null, error: { code: "PGRST103" }, status: 416 }
        : {
            data: rows.slice((p - 1) * 50, p * 50),
            count: rows.length,
            error: null,
          };
    },
    99,
    50,
  );
  assert.deepEqual(calls, [99, 1, 25]);
  assert.equal(r.page, 25);
  assert.equal(r.rows[0].id, 1200);
});
test("empty and filtered ranges remain valid; auth and transport errors stay errors", async () => {
  assert.equal(
    (await loadPage(async () => ({ data: [], count: 0, error: null }), 8, 50))
      .page,
    1,
  );
  await assert.rejects(() =>
    loadPage(
      async () => ({
        data: null,
        count: null,
        error: { code: "42501" },
        status: 403,
      }),
      2,
      50,
    ),
  );
  await assert.rejects(() =>
    loadPage(async () => ({ data: [], count: null, error: null }), 1, 50),
  );
  await assert.rejects(() =>
    loadPage(async () => ({ data: [], count: 0, error: null }), 0, 50),
  );
});
