# Historical content recovery

The owner approved the one-time 2026-11-05 cleanup. Original rows are stored in the non-API schema, in punnett_private.ui_content_archive. Source plus record_id identifies each original; row_data contains the complete original row. No client role can read or edit the archive.

The database owner can inspect a selected original with:

    select row_data from punnett_private.ui_content_archive
    where source = 'public.punnett_generations' and record_id = '<selected id>';

Restore only the selected text columns and archived flag from that original after comparing the current row. Preserve subsequent edits and revisions. Do not bulk-overwrite whole rows or restore old access settings. Keep the archive until the owner explicitly authorizes removal.

The reviewed text audit includes captions, generation prompts, historical ordered steps and responses, examples, saved notes, legacy catalog text, current studio chains/steps, immutable run snapshots, step outputs, and terms. Originals remain preserved only in the private archive and pre-existing backups, outside the applications' UI.
