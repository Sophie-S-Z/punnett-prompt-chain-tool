-- Align registration with the existing storage object path contract. No policies change.
create or replace function public.punnett_studio_upload(path_input text,title_input text) returns uuid
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
