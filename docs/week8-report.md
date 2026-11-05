## Milestone

Week 8: Prompt Chain Tool. Due November 5, 2026, at 2:00 PM EST.

## What changed

Extended the existing separate `punnett-splicer` repository and Vercel project for this assignment. The application retains superadmin-only Google authentication and real sequential caption generation.

- Added a horizontal React Flow gene strand. Dragging snaps a gene to its saved position. Left/right buttons provide keyboard reorder. Nodes open a prompt inspector. Pan, zoom, and minimap controls are available.
- Reused the existing revision-checked atomic reorder RPC. The editable list remains available alongside the canvas.
- Added sequential testing on up to three saved images. Each image has its own request ID and saved run. A failure or connection interruption stops the remaining test images.
- Added chain-specific result links and preserved the chain filter during search and pagination. Saved captions now have stable specimen codes.
- Adopted `next-themes` for dark, light, and system appearance. Dark is the default. System follows OS changes without a reload.
- Added GitHub Actions validation and a rubric map with a grader walkthrough.

## How I verified it

- Lint and strict application/test TypeScript passed.
- All nine provider, validation, strand, and PostgreSQL fixture tests passed. They cover superadmin/Google checks, chain/step CRUD, atomic reorder, stale writes, run snapshots, output persistence, and pagination across 1,203 rows.
- The production build passed. Its Google Fonts download required network access in the local environment.
- Three browser tests passed against the production-built app in fresh browser contexts. They cover visitor route/action/asset denial, exact-origin OAuth initiation, persistent themes, live OS appearance changes, no horizontal overflow, and WCAG A/AA scans at 320, 390, 768, and 1440 pixels.
- The same three scenarios passed against the deployed origin. The visitor/icon case was rerun after accepting Vercel's valid `image/vnd.microsoft.icon` MIME type alongside the local server's `image/x-icon` type. Application code did not change for that correction.
- Anonymous requests to all six live studio RPCs were denied. The private schema is not exposed through PostgREST.
- Selection and Observatory's current commit URLs returned public HTTP 200 without cookies or a protection bypass. After the owner configured Splicer, its new deployment also returned public HTTP 200 and showed Google sign-in. Production/Preview environment-variable presence and disabled Vercel protection were confirmed without reading secret values.
- GitHub Actions passed for implementation commit `32f321748db430f45e5285ec716d9a519e311596`.
- The installed dependency tree is valid. npm reports zero production advisories. Eight moderate development advisories trace to lint tooling's minimatch dependency. The suggested automated fix downgrades `eslint-config-next` to a different framework major, so no force downgrade was applied.

Three additional browser tests passed in the isolated actual-component editor. They cover chain/step CRUD, keyboard and drag reorder with persistence after reload, prompt inspection, chain-filter search, sequential test-set failure handling, keyboard navigation, and responsive accessibility. Isolated browser fixtures do not establish successful production Google login or generation.

## VERIFY findings (schema, API)

No schema, policy, grant, or role change was made. The strand and test set use the existing installed studio contract. Primary React Flow, next-themes, and Gemini REST contracts were checked. Details are in `schema-notes.md`.

The Supabase management connector repeatedly timed out during current authenticated schema inspection. Live anonymous denials succeeded. Fresh authenticated live CRUD and provider execution remain unverified.

## HUMAN tasks needed

The owner completed Production/Preview environment configuration and disabled Splicer protection. No environment values were transferred by the agent. Keep protection off for all three apps, as AGENTS.md R4 requires.

1. Register the final commit URL's exact `/auth/callback` in Supabase. Keep the stable callback too.
2. Verify real superadmin login, ordinary-user denial, and a real saved generation on that final origin.

## Open questions

Production OAuth and actual provider generation remain acceptance gates. The browser's real Google sign-in request included the correct commit-specific callback, but Supabase returned it to Selection, which is consistent with that callback not being allowlisted. Subsequent browser-control calls timed out. No successful live authenticated generation is claimed. The assignment submission portal was not modified.
