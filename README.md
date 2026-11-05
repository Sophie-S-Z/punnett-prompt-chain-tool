# Punnett Prompt Studio

A separate Next.js application for Google-authenticated superadmins to build and run sequential prompt chains. Shared Supabase staging project: `punnett-staging`.

## Features

- Create, edit, and delete prompt chains and steps.
- Move steps up/down with keyboard-accessible controls. Order changes are atomic and detect concurrent edits.
- Follow a horizontal gene strand with React Flow. Drag genes to reorder, use left/right buttons, and inspect prompts on the canvas.
- Separate system prompt, user prompt, model, input, output, and temperature for every step.
- Generate captions from existing uploaded images. Later steps receive the previous step's actual output.
- Test one chain on up to three images in sequence. Each image has a separate saved run. A failure stops the set.
- Select a chain directly or randomly through saved relative mix weights.
- Inspect saved output, duration, exact prompts, source image, and status for every run. History survives chain deletion.
- Filter results to one chain. Search and pagination preserve the chain filter. Each saved caption shows a stable specimen code.
- Dark, light, and system appearance. Cmd/Ctrl K navigation and create action.
- Explicitly labeled starter chains. No fabricated provider outputs.

## Local setup

Use Node.js 24 or newer. Install with `npm ci`. Copy `.env.example` to `.env.local` and configure it locally without committing credentials. `GEMINI_API_KEY` stays server-only. Use the provider's free quota.

Run `npm run dev` (port 3104). Run `npm run check` before pushing. Run `npm run test:ui` for isolated actual-component browser checks. The public app is for superadmins only: `is_matrix_admin` alone does not grant access under the latest assignment.

The [Week 8 rubric map and grader walkthrough](docs/week8-rubric.md) separates implemented features from owner configuration and real-account acceptance. GitHub Actions runs lint, strict TypeScript, provider/database tests, and the production build on pull requests and pushes to main.

## Database

The existing W6 Google-session guard and W7 catalog must already be installed. `docs/prompt-studio.sql` was applied to staging on 2026-10-29. Do not rerun it. No RLS policies were created, changed, enabled, or disabled. Tables live in the unexposed private schema with direct role access revoked. Every public RPC calls the existing verified Google-session/superadmin guard.

The copied W6/W7 SQL files are dependencies for isolated test fixtures and a record of the existing contract, not instructions to reinstall staging.

## Deployment and acceptance

GitHub: https://github.com/Sophie-S-Z/punnett-splicer

Vercel project: `punnett-splicer`, Sophie Zhang's projects. The owner must configure the three environment variables, disable deployment protection, and register the exact stable/commit-specific `/auth/callback` URLs in Supabase. No callback query parameters are used.

`npm run test:e2e` accepts `PUNNETT_TEST_URL` for a built local or deployed app. Browser fixture tests are separate from real Google login and real provider acceptance. A successful authenticated run on the deployed URL is the final acceptance check; builds alone do not establish it.

Generation currently produces text captions, displayed beside the source image. It does not claim to generate new image pixels. Runs are private review outputs and do not automatically publish captions to the public voting application.
