-- Publishing runs through a database function, and the trigger below keeps the
-- same rules in force even if a client attempts a direct status update.
create function private.enforce_service_publish_requirements()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'published'
    and old.status is distinct from 'published'
  then
    if not exists (
      select 1
      from public.profiles
      where id = new.student_id
        and full_name is not null
        and pg_catalog.char_length(pg_catalog.btrim(full_name)) between 2 and 80
        and bio is not null
        and pg_catalog.char_length(pg_catalog.btrim(bio)) > 0
    )
    then
      raise exception using
        errcode = 'P0001',
        message = 'Complete your name and bio before publishing.';
    end if;

    if not exists (
      select 1
      from public.contact_methods
      where profile_id = new.student_id
        and is_visible
    )
    then
      raise exception using
        errcode = 'P0001',
        message = 'Add at least one visible contact method before publishing.';
    end if;

    new.published_at = pg_catalog.now();
  end if;

  return new;
end;
$$;

revoke execute on function private.enforce_service_publish_requirements()
from public;

create trigger services_enforce_publish_requirements
before update of status on public.services
for each row execute function private.enforce_service_publish_requirements();

create function public.publish_service(target_service_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not private.is_verified_sdsu_student() then
    raise insufficient_privilege
      using message = 'A verified SDSU account is required.';
  end if;

  update public.services
  set status = 'published'
  where id = target_service_id
    and student_id = (select auth.uid())
    and status in ('draft', 'archived');

  if not found then
    raise exception using
      errcode = 'P0001',
      message = 'That service cannot be published.';
  end if;
end;
$$;

create function public.archive_service(target_service_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not private.is_verified_sdsu_student() then
    raise insufficient_privilege
      using message = 'A verified SDSU account is required.';
  end if;

  update public.services
  set status = 'archived'
  where id = target_service_id
    and student_id = (select auth.uid())
    and status = 'published';

  if not found then
    raise exception using
      errcode = 'P0001',
      message = 'That service cannot be archived.';
  end if;
end;
$$;

revoke execute on function public.publish_service(uuid) from public;
revoke execute on function public.archive_service(uuid) from public;
grant execute on function public.publish_service(uuid) to authenticated;
grant execute on function public.archive_service(uuid) to authenticated;
