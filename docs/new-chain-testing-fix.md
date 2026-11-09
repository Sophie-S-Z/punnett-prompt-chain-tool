## Milestone

Fix testing and image upload for newly created prompt chains.

## What changed

The owner-created Dark Humor Captions chain has three text-output steps. The old UI and run-start function incorrectly required a caption-array final step. The UI then hid every test control when that validation failed.

Text and caption final outputs are now both runnable. Upload and image selection remain visible while a chain is incomplete; only Run is disabled with an explanation. A chain still needs at least one step, an image input first, previous output for subsequent steps, and configured models. Existing output-type validation, role checks, run limits, snapshot isolation, and sequential checkpoints remain in place. No owner prompts, steps or saved runs were rewritten.

The diagram terminal reflects Text or Captions. Results from an earlier revision are labeled as such after editing while their result links and uploaded image selections stay available. Completed runs report their actual captured revision. Request IDs are scoped to the chain revision and image.

## How I verified it

The local PostgreSQL regression creates a new empty chain, confirms it cannot run without steps, then executes one- and three-step text chains through typed checkpoints and saved output readback. Wrong output types remain rejected.

The actual-component browser regression begins with no saved images, creates an empty chain, uploads a JPEG before adding steps, checks Run remains disabled until the first step exists, runs with text output, fixes an invalid first input without losing uploads, adds two more text steps and runs the intended chain. Other editor, batch, image-format, persistence and theme tests remain in the suite. Fixtures never call the provider or create real user records.

See the workspace release report for final command results, the new commit-specific URL and live acceptance limits.

## VERIFY findings (schema, API)

Inspected the owner's saved step types and the live run-start function. The checkpoint function already supports typed text final output. The additive migration changes only the run-start function to remove the unnecessary final-caption restriction. Its existing privileges and all other guards remain unchanged. No RLS policy or stored user content changed.

## HUMAN tasks needed

Keep Vercel deployment protection off. Use the newly fixed deployment or the refreshed stable domain; an older immutable URL retains its original UI. Existing scoped callback patterns cover the new deployment.

## Open questions

A completed fresh production provider run is separate from isolated regression tests. The owner can rerun the existing chain without changing its prompts or output types.
