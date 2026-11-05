# Week 8: prompt chain tool

Due: Thursday, November 5, 2026, 2:00 PM EST.

The assignment requires superadmin access. A matrix-admin role alone does not grant access.

## Rubric map

| Requirement                                   | Implementation                                                                                                                            | Evidence and final check                                                                                                                        |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Separate GitHub repository and Vercel project | `Sophie-S-Z/punnett-splicer`; Vercel project `punnett-splicer`                                                                            | Existing independent repository and connected project confirmed on November 5.                                                                  |
| Superadmin-only tool                          | Server session verification, Google-session verification, `profiles.is_superadmin`, request proxy, per-action guards, database RPC guards | Anonymous live RPC denial passes. Database fixtures cover member and non-Google denial. Real browser login and member denial remain required.   |
| Create, update, delete chains                 | Named chains with descriptions, delete confirmation, revision checks                                                                      | Database and actual-component browser fixture tests.                                                                                            |
| Create, update, delete steps                  | Separate system/user prompts, model, temperature, input/output types                                                                      | Database and actual-component browser fixture tests.                                                                                            |
| Reorder steps                                 | Horizontal React Flow strand, drag-to-snap, left/right buttons, accessible list controls                                                  | Both paths call the same atomic revision-checked RPC. Browser fixture checks persistence after reload.                                          |
| Generate media                                | Real sequential Gemini calls produce caption text from saved source images                                                                | Provider-contract and persistence tests pass. A real authenticated deployed generation remains required. No generated image pixels are claimed. |
| View media from one chain                     | Chain-specific result links, preserved chain filter during search/pagination, image plus per-step outputs and stable specimen codes       | Browser fixture checks chain-filter navigation. Snapshots preserve history after edits and deletion.                                            |
| Dark, light, system                           | `next-themes`; dark default; system tracks OS changes                                                                                     | Browser checks cover persistence, OS changes, responsive layout, and accessibility.                                                             |
| Public Incognito access                       | Application auth remains active while Vercel protection must be off                                                                       | Selection and Observatory return public HTTP 200. Splicer currently redirects to Vercel SSO. The owner must disable protection.                 |
| Three commit-specific submission URLs         | Recorded in the release report                                                                                                            | Never submit the protected Splicer URL as ready. Recheck final deployment and exact callback registration.                                      |

## Additional work

- Inspect genes directly on the strand. Pan, zoom, and use the minimap without changing the saved sequence.
- Run the same chain on up to three real source images. Runs execute sequentially. A failed or interrupted result stops the set.
- Every image has a separate request ID. Existing duplicate-request and daily-limit protections still apply.
- Read immutable prompts, model settings, duration, saved output, and errors for each run.
- Keep a keyboard-accessible editing list beside the visual workflow.
- Validate pull requests and main pushes with a GitHub Actions build, lint, strict TypeScript, and database/provider tests.

## Grader walkthrough

1. Open the final Splicer commit URL in an Incognito window.
2. Verify that the app shows Google sign-in without a Vercel login screen.
3. Sign in with a real superadmin account.
4. Create a chain with an image-to-text step.
5. Add a text-to-text step. Set its output to Caption list.
6. Edit each prompt and its model settings. Reload to confirm persistence.
7. Drag a gene to a new position. Reload to confirm the new order.
8. Use the move buttons to restore an executable image-first, caption-last sequence.
9. Choose a saved source image. Run the chain.
10. Open the saved run. Inspect its source image, exact prompts, timings, and actual outputs.
11. Use View results from this chain. Search without losing the chain filter.
12. Select two additional images to test the same chain across a set, if free quota permits.
13. Switch Dark, Light, and System. Reload and change the OS appearance while System is selected.
14. Delete a temporary step and chain through their confirmation dialogs.
15. Verify that past runs retain the original prompts and outputs.
16. Sign out. Verify direct editor, run, asset, and mutation access is denied.
17. Sign in with an ordinary account. Verify clearance denial and no prompt data.

## Owner configuration

AGENTS.md R4 assigns deployment-protection settings to the owner. Section 3.2 assigns Vercel environment settings to the owner.

In the [Splicer settings](https://vercel.com/sophie-zhangs-projects/punnett-splicer/settings), configure Production and Preview with `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and server-only `GEMINI_API_KEY`. Use the existing staging database and provider free quota. Keep secret values out of source control and chat.

Disable Vercel deployment protection. Keep protection off for Selection and Observatory.

Register the stable callback `https://punnett-splicer.vercel.app/auth/callback` in Supabase. Register the final commit URL's exact `/auth/callback` too. Do not add redirect query parameters.

After configuration, deploy again and complete the real-account walkthrough. Tests with isolated data do not establish successful production OAuth or provider generation.
