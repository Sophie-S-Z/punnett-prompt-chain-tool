-- One-time owner-requested content retirement. Originals are recoverable.
-- This migration does not touch row-security policies or auth checks.
create table if not exists punnett_private.ui_content_archive (
 source text not null, record_id text not null, row_data jsonb not null,
 saved_at timestamptz not null default now(), primary key(source,record_id)
);
revoke all on punnett_private.ui_content_archive from public,anon,authenticated;
do $cleanup$
declare config record; pattern text := '\m(genes?|genomes?|dna|rna|biolog\w*|biohazard\w*|species|specimens?|petri|culturing|hatching|mutants?|lineage|chromosom\w*)\M';
begin
 for config in select 'public.punnett_generations' rel,'prompt' fields union all select 'public.punnett_captions','content' union all select 'punnett_private.w7_steps','prompt' union all select 'punnett_private.w7_examples','caption,notes' loop
  execute format('insert into punnett_private.ui_content_archive(source,record_id,row_data) select %L,id::text,to_jsonb(t) from %s t where concat_ws('' '',%s) ~* $1 on conflict do nothing',config.rel,config.rel,config.fields) using pattern;
 end loop;
 -- Retire the old catalog generations and any remaining captions with retired wording.
 insert into punnett_private.ui_content_archive(source,record_id,row_data)
 select 'public.punnett_generations',g.id::text,to_jsonb(g) from public.punnett_generations g
 where g.prompt like 'Create four funny fact-based descriptions%' or exists(select 1 from public.punnett_captions c where c.generation_id=g.id and c.content ~* pattern) on conflict do nothing;
 insert into punnett_private.ui_content_archive(source,record_id,row_data)
 select 'public.punnett_captions',c.id::text,to_jsonb(c) from public.punnett_captions c join public.punnett_generations g on g.id=c.generation_id
 where g.prompt like 'Create four funny fact-based descriptions%' on conflict do nothing;
 insert into punnett_private.ui_content_archive(source,record_id,row_data)
 select 'punnett_private.w7_responses',r.id::text,to_jsonb(r) from punnett_private.w7_responses r
 where r.output::text ~* pattern or exists(select 1 from public.punnett_generations g where g.id=r.generation_id and g.prompt like 'Create four funny fact-based descriptions%') on conflict do nothing;
 insert into punnett_private.ui_content_archive(source,record_id,row_data) select 'public.lab_specimens',id::text,to_jsonb(t) from public.lab_specimens t on conflict do nothing;
 insert into punnett_private.ui_content_archive(source,record_id,row_data) select 'public.punnett_bench_specimens',id::text,to_jsonb(t) from public.punnett_bench_specimens t on conflict do nothing;
 update public.punnett_generations g set archived=true where g.prompt like 'Create four funny fact-based descriptions%' or exists(select 1 from public.punnett_captions c where c.generation_id=g.id and c.content ~* pattern);
 update public.punnett_captions c set content='[Retired caption. Original retained in the private archive.]' where exists(select 1 from punnett_private.ui_content_archive a where a.source='public.punnett_captions' and a.record_id=c.id::text);
 update punnett_private.w7_responses r set output='{"notice":"Historical output retired. Original retained in the private archive."}'::jsonb,provenance='Historical output retired on 2026-11-05; original retained in the private archive.',revision=revision+1 where exists(select 1 from punnett_private.ui_content_archive a where a.source='punnett_private.w7_responses' and a.record_id=r.id::text);
 update public.punnett_generations set prompt='[Historical prompt retired on 2026-11-05. Original retained in the private archive.]' where prompt ~* pattern;
 update punnett_private.w7_steps set prompt='[Historical prompt retired on 2026-11-05. Original retained in the private archive.]',revision=revision+1 where prompt ~* pattern;
 update punnett_private.w7_examples set caption='[Retired caption. Original retained in the private archive.]',notes='Historical example retired on 2026-11-05.',revision=revision+1 where concat_ws(' ',caption,notes) ~* pattern;
 update public.lab_specimens set code='ARCH-'||id::text,label='Retired catalog record',notes='Original retained in the private archive.';
 update public.punnett_bench_specimens set label='Retired saved record',notes='Original retained in the private archive.',revision=revision+1;
end $cleanup$;
