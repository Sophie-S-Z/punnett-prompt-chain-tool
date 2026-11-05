import assert from "node:assert/strict";
import test from "node:test";
import { GENE_SPACING, strandPosition } from "../src/lib/strand.ts";

test("gene drops choose the nearest slot and stay inside the editable strand", () => {
  assert.equal(strandPosition(-900, 4), 1);
  assert.equal(strandPosition(0, 4), 1);
  assert.equal(strandPosition(GENE_SPACING * 1.49, 4), 1);
  assert.equal(strandPosition(GENE_SPACING * 1.51, 4), 2);
  assert.equal(strandPosition(GENE_SPACING * 3, 4), 3);
  assert.equal(strandPosition(9000, 4), 4);
  assert.equal(strandPosition(9000, 1), 1);
});
