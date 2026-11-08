# Punnett Prompt Chain Tool

A Next.js app where superadmins build, edit, and test the prompt chains that turn an image into captions. It shares the `punnett-staging` Supabase project with the other two Punnett apps.

## What it does

- Create, edit, and delete prompt chains.
- Add, edit, and delete steps in place. Each step has a name, input, output, system prompt, user prompt, model, and temperature.
- Reorder steps with "Move up" and "Move down", or drag a step in the chain diagram. The diagram appears when a chain has two or more steps.
- Upload your own JPEG, PNG, WebP, or GIF in the run panel, or choose saved images. Test a chain on up to three selected images. Each image gets its own saved run. A failure stops the remaining images.
- See every run with its source image, the output of each step, the time each step took, and the exact prompts that it used. A run keeps its prompts after you edit or delete the chain.
- Filter runs to one chain. The page title shows the chain name.
- Dark, light, and system themes.

Only users with `profiles.is_superadmin = true` and a Google sign-in can open the app. The server checks the role on every request and in every action.

## Local setup

1. Use Node.js 24.
2. Run `npm ci`.
3. Copy `.env.example` to `.env.local` and fill in the values. Do not commit this file. `GEMINI_API_KEY` stays on the server.
4. Run `npm run dev`. The app opens on port 3104.

## Checks

- `npm run check` runs lint, strict TypeScript, unit and database tests, and the production build. GitHub Actions runs the same command.
- `npm run test:ui` builds the real editor with test data and runs browser tests for editing, reordering, test runs, and accessibility.
- `npm run test:e2e` runs the signed-out browser tests. Set `PUNNETT_TEST_URL` to test a deployed URL.

## Database

`docs/prompt-studio.sql` is already installed in staging. Do not run it again. The tables live in a private schema. Every public function calls the existing Google sign-in and superadmin check. No row-level security policy was created or changed.

## Deployment

Vercel project: `punnett-splicer`. Keep deployment protection off. Add each deployment's exact `/auth/callback` URL to the Supabase redirect list.

The [Week 8 rubric map](docs/week8-rubric.md) lists each requirement and how to check it.

## Direct image uploads

Uploads are validated and resized locally, then decoded again on the server and saved in private storage. A guarded registration function records the image without generating unrelated public captions. The upload registry is owner-only; the server and database require Google superadmin access. The 30-upload daily limit is separate from the ten-run daily limit. See `docs/direct-image-uploads.sql` and `docs/schema-notes.md`. The migration is already installed; do not rerun it.

Hosted validation is manual-only while GitHub Actions minutes are exhausted. Use `npm run check` locally. Run `PUNNETT_BROWSER_CHANNEL=chrome npm run test:ui` with an installed Chrome, using the equivalent environment-variable syntax for your shell. Fixture tests never call Gemini or modify live data.
