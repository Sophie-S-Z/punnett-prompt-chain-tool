## Milestone

Week 8 direct-upload storage-path correction.

## What changed

The first upload implementation used user-id/studio/file-id.jpg. The owner-installed INSERT condition documented in Selection requires user-id/file-id.jpg. Storage rejected the nested path before image registration or generation. The server now uses the existing flat path, and the registration function validates the same contract. No RLS policy or storage permission changed.

The old browser fixture replaced the whole upload action and missed this integration error. The regression now executes the actual server upload action, including Sharp decoding, against a storage adapter that rejects nested paths and non-JPEG content. It verifies corrupt-image recovery, upload, selection, saved-image reload, and starting a run. Database tests accept the owned flat path and reject nested, missing, and other-owner paths.

## How I verified it

Run npm run check locally and PUNNETT_BROWSER_CHANNEL=chrome npm run test:ui with the shell-appropriate environment syntax. No GitHub Actions minutes are used. Fixture runs do not call Gemini or create live records. See the workspace release report for final results and the fixed deployment URL.

## VERIFY findings (schema, API)

Live logs show HTTP 400 storage writes on the nested /studio/ paths. The documented owner-applied INSERT contract explicitly accepts only the flat UUID JPEG path. Existing successful storage objects use that shape. Only the guarded image-registration function changed in the database; no policy was modified.

## HUMAN tasks needed

Use the new fixed deployment or the stable app domain. The earlier immutable deployment keeps its original source. A real Google-session retry remains required to observe live upload/provider completion.

## Open questions

Fixture acceptance is not reported as a fresh authenticated production upload. The server now logs the storage failure status without logging image content, credentials, or the object path.
