-- Direct test-image uploads. Existing row-security policies are unchanged.
create table punnett_private.studio_uploads (
 image_id uuid primary key references public.punnett_images(id),
 owner_id uuid not null references auth.users(id),
 created_at timestamptz not null default now()
);
revoke all on punnett_private.studio_uploads from public,anon,authenticated;
create function public.punnett_studio_upload(path_input text,title_input text) returns uuid
language plpgsql security definer set search_path='' as $$
declare result uuid;
begin
 perform public.punnett_require_admin();
 perform pg_advisory_xact_lock(hashtext('studio-upload'),hashtext(auth.uid()::text));
 if path_input !~ ('^'||auth.uid()::text||'/[0-9a-f-]{36}\.jpg$') or length(title_input)>200 then raise exception 'Invalid image' using errcode='23514'; end if;
 if not exists(select 1 from storage.objects where bucket_id='caption-images' and name=path_input) then raise exception 'Upload missing' using errcode='23514'; end if;
 if (select count(*) from punnett_private.studio_uploads where owner_id=auth.uid() and created_at>now()-interval '24 hours')>=30 then raise exception 'upload_limit' using errcode='54000'; end if;
 insert into public.punnett_images(owner_id,mime_type,storage_path,title) values(auth.uid(),'image/jpeg',path_input,title_input) returning id into result;
 insert into punnett_private.studio_uploads(image_id,owner_id) values(result,auth.uid());
 return result;
end;$$;
create function public.punnett_studio_uploaded_images() returns table(id uuid,label text)
language plpgsql stable security definer set search_path='' as $$
begin
 perform public.punnett_require_admin();
 return query select i.id,i.title from punnett_private.studio_uploads u join public.punnett_images i on i.id=u.image_id where u.owner_id=auth.uid() order by u.created_at desc;
end;$$;
revoke all on function public.punnett_studio_upload(text,text),public.punnett_studio_uploaded_images() from public,anon;
grant execute on function public.punnett_studio_upload(text,text),public.punnett_studio_uploaded_images() to authenticated;

create or replace function public.punnett_studio_begin(chain_input uuid,image_input uuid,request_input uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare c jsonb; rid uuid;
begin
 perform public.punnett_require_admin();
 if request_input is null then raise exception 'Request ID required' using errcode='23514'; end if;
 perform pg_advisory_xact_lock(hashtext('punnett-studio'),hashtext(auth.uid()::text));
 if exists(select 1 from punnett_private.studio_runs where request_id=request_input) then raise exception 'Request already submitted' using errcode='23505'; end if;
 if (select count(*) from punnett_private.studio_runs where owner_id=auth.uid() and created_at>now()-interval '24 hours')>=10 then raise exception 'daily_limit' using errcode='54000'; end if;
 if exists(select 1 from punnett_private.studio_runs where owner_id=auth.uid() and status='pending' and created_at>now()-interval '5 minutes') then raise exception 'run_in_progress' using errcode='55000'; end if;
 -- Serialize with edits to capture one coherent version of the entire chain.
 perform 1 from punnett_private.studio_chains where id=chain_input for share;
 c:=public.punnett_studio_chain(chain_input);
 if c is null or jsonb_array_length(c->'steps')=0 then raise exception 'Add steps before running' using errcode='23514'; end if;
 if c->'steps'->0->>'input_kind'<>'image' or c->'steps'->-1->>'output_kind'<>'captions' or exists(select 1 from jsonb_array_elements(c->'steps') with ordinality as s(value,i) where i>1 and value->>'input_kind'<>'previous') then
  raise exception 'First step must read the image, later steps must read previous output, and the final step must return captions' using errcode='23514';
 end if;
 if exists(select 1 from jsonb_array_elements(c->'steps') s where s->>'provider'<>'Google Gemini' or s->>'model' !~ '^gemini-[a-z0-9.-]+$') then raise exception 'Choose a configured Gemini model for every step' using errcode='23514'; end if;
 if not exists(select 1 from public.punnett_images i join public.punnett_generations g on g.image_id=i.id where i.id=image_input and i.storage_path is not null and not g.archived and g.status='completed') and not exists(select 1 from punnett_private.studio_uploads u where u.image_id=image_input and u.owner_id=auth.uid()) then raise exception 'Choose an available image' using errcode='23514'; end if;
 update punnett_private.studio_runs set status='failed',error='Interrupted before completion',completed_at=now() where owner_id=auth.uid() and status='pending' and created_at<=now()-interval '5 minutes';
 insert into punnett_private.studio_runs(request_id,chain_id,owner_id,image_id,snapshot) values(request_input,chain_input,auth.uid(),image_input,c) returning id into rid;
 return jsonb_build_object('id',rid,'snapshot',c);
end;$$;
