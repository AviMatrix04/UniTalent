insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'service-images',
  'service-images',
  false,
  5242880,
  array['image/jpeg', 'image/png']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Skill catalog growth is curated. Students select existing entries (including
-- "Other") rather than inserting catalog rows through the API.
revoke insert on table public.skills from authenticated;

create policy "verified students can read service images"
on storage.objects for select to authenticated
using (
  bucket_id = 'service-images'
  and private.is_verified_sdsu_student()
);

create policy "owners can upload service images"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'service-images'
  and private.is_verified_sdsu_student()
  and owner_id = (select auth.uid()::text)
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and exists (
    select 1 from public.services
    where id::text = (storage.foldername(name))[2]
      and student_id = (select auth.uid())
  )
);

create policy "owners can update service images"
on storage.objects for update to authenticated
using (
  bucket_id = 'service-images'
  and owner_id = (select auth.uid()::text)
)
with check (
  bucket_id = 'service-images'
  and owner_id = (select auth.uid()::text)
);

create policy "owners can delete service images"
on storage.objects for delete to authenticated
using (
  bucket_id = 'service-images'
  and owner_id = (select auth.uid()::text)
);

alter table public.portfolio_items
drop constraint portfolio_items_service_order_unique;

alter table public.portfolio_items
add constraint portfolio_items_service_order_unique
unique (service_id, sort_order)
deferrable initially immediate;

create function public.reorder_portfolio_items(
  target_service_id uuid,
  ordered_item_ids uuid[]
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  existing_count integer;
begin
  if not private.owns_service(target_service_id) then
    raise insufficient_privilege using message = 'You can reorder only your own portfolio.';
  end if;

  select count(*) into existing_count
  from public.portfolio_items
  where service_id = target_service_id;

  if existing_count <> pg_catalog.cardinality(ordered_item_ids)
     or existing_count > 6
     or exists (
       select 1
       from pg_catalog.unnest(ordered_item_ids) as submitted(id)
       group by submitted.id
       having count(*) > 1
     )
     or exists (
       select 1 from pg_catalog.unnest(ordered_item_ids) as submitted(id)
       where not exists (
         select 1 from public.portfolio_items
         where portfolio_items.id = submitted.id
           and service_id = target_service_id
       )
     )
  then
    raise check_violation using message = 'The portfolio order is invalid.';
  end if;

  set constraints portfolio_items_service_order_unique deferred;

  update public.portfolio_items
  set sort_order = pg_catalog.array_position(ordered_item_ids, id) - 1
  where service_id = target_service_id;
end;
$$;

revoke execute on function public.reorder_portfolio_items(uuid, uuid[]) from public;
grant execute on function public.reorder_portfolio_items(uuid, uuid[]) to authenticated;
