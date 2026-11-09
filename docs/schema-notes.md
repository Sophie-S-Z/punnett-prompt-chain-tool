# Verified prompt studio contract

Date: 2026-10-29. Project: `ralfwrckxnaieamlttmm` (`punnett-staging`).

Inspected live `punnett_private.w7_*` columns and existing admin RPCs before extending them. Historical W7 chains are exact single-request prompt/model snapshots. They remain immutable historical records. The supplied `toosoon` archive at commit `486e62454e826b82603835f646c63fcd992f083c`, specifically `src/app/humor-flavor-step/[humorFlavorStepId]/step-details-form.tsx`, separates step order, input/output types, model, temperature, system prompt, and user prompt. That structure informed this tool without importing its unrelated production database.

The installed `prompt_studio_chains_and_runs` migration adds:

| Private table    | Purpose                                                                                       |
| ---------------- | --------------------------------------------------------------------------------------------- |
| `studio_chains`  | Editable name, description, example flag, weight, revision                      |
| `studio_steps`   | Ordered step settings and prompts, referencing the existing model catalog                     |
| `studio_runs`    | Source image, originating chain, owner, request ID, immutable snapshot, status and safe error |
| `studio_outputs` | Sequential validated outputs and durations                                                    |

The `(chain_id, position)` unique constraint is deferrable. One locked transaction reorders and renumbers steps. Every edit compares the chain revision, including edits to its steps. Deleting a chain cascades its editable steps and sets the run's chain reference to null; its snapshot and outputs remain.

Six public studio RPCs expose only verified superadmin operations: `page`, `chain`, `mutate`, `begin`, `checkpoint`, and `fail` (all prefixed `punnett_studio_`). Anonymous execution is revoked. Direct private table grants remain revoked. The existing Google-session verifier and `punnett_require_admin` are unchanged. No policy SQL is present.

`punnett_studio_page` returns ordered set rows for PostgREST `count: exact` and `range`. The UI reads pages and all reference pages in chunks of 200. No silent 1,000-row cap is used.

The runner accepts only the existing Google Gemini provider and model identifiers matching `gemini-*`. It uses the fixed Google endpoint, a server environment key, `systemInstruction`, image `inlineData`, and previous text output as a separate part. The final caption step uses the verified REST `responseFormat.text.mimeType = APPLICATION_JSON` contract. No arbitrary URL/provider endpoint is accepted.

Primary references rechecked: [GenerateContent REST](https://ai.google.dev/api/generate-content), [Gemini 3.5 Flash-Lite](https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite). The model supports image input and text output. The app validates STOP completion, excludes thought parts, and rejects malformed/repeated captions. One step times out at 30 seconds; up to eight steps fit the configured 300-second function limit. No automatic provider retry is performed. Ten starts per user per rolling 24 hours are enforced in the database.

Live rollback-only diagnostics passed CRUD, order, conflict handling, checkpoint persistence, history retention, and member denial. They do not test browser OAuth/JWT validation or make provider calls. Isolated database tests also cover 1,203 paginated rows and malformed outputs. Initial staging seeds are two explicitly labeled chains and four editable steps, with no simulated run output.

## Week 8 verification on 2026-11-05

No schema or RPC change is required for the chain diagram, multi-image test set, or chain-specific result links. Drag and keyboard reorder both call the existing `step.move` mutation with the chain revision and one-based position. The existing deferrable unique constraint and locked mutation own persistence. Each test image uses a distinct request ID and the existing begin/checkpoint/fail sequence. The test set stops on a failed or interrupted result.

The deployed REST endpoints denied anonymous execution for all six studio RPCs on November 5. PostgREST also denied access to the private schema. Current authenticated schema inspection through the Supabase connector timed out on repeated attempts. Consequently this update does not claim fresh live authenticated CRUD or provider acceptance. The installed contract above and isolated database tests remain the implementation evidence.

Rechecked primary library contracts: [React Flow component API](https://reactflow.dev/api-reference/react-flow) and [next-themes](https://github.com/pacocoursey/next-themes). Rechecked the [Gemini GenerateContent REST reference](https://ai.google.dev/api/generate-content?hl=en): the existing `responseFormat.text.mimeType = APPLICATION_JSON` contract remains documented. No course API endpoint was invented.


## 2026-11-05 interface and historical content review

Verified the actual `punnett_private.studio_*`, `w7_*`, and public caption/image/generation columns before reviewing saved content. Owner explicitly approved retiring historical wording. Migration `retire_legacy_ui_content` keeps 153 original records in `punnett_private.ui_content_archive(source,record_id,row_data,saved_at)`. Client roles have no archive grants. Replaced content is labeled as retired, never presented as newly generated. Retired catalog generations are archived; 28 real captions remain public. Current prompt chains, run snapshots, and step outputs contain no retired vocabulary. No row-security policy, auth rule, or service-role configuration changed. The migration SQL and recovery guidance are maintained in the Splicer repository.


## Direct prompt-chain image uploads - November 7, 2026

Verified live `punnett_images` columns, storage path resolver, and the complete run-start definition before the migration. `studio_direct_image_uploads` adds an owner-only private upload registry and two guarded RPCs. Registration checks Google/superadmin access, an existing object in the caption-images bucket, the caller's path prefix, and a 30-upload daily limit. Runs accept a caller's registered upload as well as existing completed caption images. No RLS policies changed. No service-role credentials are used. Uploaded images remain available to their owner on reload; they do not manufacture a caption-generation record or public captions.


### Storage-path correction

Owner-reported JPEG failures were traced to the introduced /studio/ subfolder. The existing owner-installed storage INSERT contract requires user-id/file-id.jpg. The server and registration RPC now use that shape. The corrective migration changes only the function, never a policy. The stronger browser regression executes the real upload action against a strict storage-path adapter.


### Text-ending chain tests

The owner chain has three text outputs. Live run-start validation required a caption final step unnecessarily. Checkpoints already validate both strings and caption arrays and mark either final type complete. allow_text_ending_prompt_chain_runs removes only that final-caption precondition. Existing auth, images, quota and ordering constraints remain; saved chain contents are not edited.
