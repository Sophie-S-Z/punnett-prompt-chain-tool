import assert from "node:assert/strict";
import test from "node:test";
import { STEP_SPACING, stepPosition } from "../src/lib/chain-canvas.ts";

test("step drops choose the nearest slot and stay inside the editable flow", () => {
  assert.equal(stepPosition(-900, 4), 1);
  assert.equal(stepPosition(0, 4), 1);
  assert.equal(stepPosition(STEP_SPACING * 1.49, 4), 1);
  assert.equal(stepPosition(STEP_SPACING * 1.51, 4), 2);
  assert.equal(stepPosition(STEP_SPACING * 3, 4), 3);
  assert.equal(stepPosition(9000, 4), 4);
  assert.equal(stepPosition(9000, 1), 1);
});
