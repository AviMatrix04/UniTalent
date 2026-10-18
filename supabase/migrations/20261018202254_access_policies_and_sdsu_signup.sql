-- Restrict application data to confirmed SDSU students and reject non-SDSU
-- signups before Supabase Auth creates the user.

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create function private.is_verified_sdsu_student()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from auth.users
    where id = (select auth.uid())
      and email_confirmed_at is not null
      and pg_catalog.lower(email) ~ '^[^@[:space:]]+@sdsu[.]edu$'
  );
$$;

create function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_verified_sdsu_student()
    and exists (
      select 1
      from public.user_roles
      where user_id = (select auth.uid())
        and role = 'admin'
    );
$$;

create function private.owns_service(target_service_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.services
    where id = target_service_id
      and student_id = (select auth.uid())
  );
$$;

create function private.can_read_service(target_service_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.services
    where id = target_service_id
      and (
        status = 'published'
        or student_id = (select auth.uid())
        or private.is_admin()
      )
  );
$$;

create function private.enforce_service_update_scope()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- An administrator moderating someone else's listing may change its state,
  -- but must not rewrite the provider's content.
  if (select auth.uid()) is not null
    and (select auth.uid()) <> old.student_id
    and private.is_admin()
    and (
      new.title is distinct from old.title
      or new.description is distinct from old.description
      or new.price_cents is distinct from old.price_cents
      or new.price_unit is distinct from old.price_unit
    )
  then
    raise insufficient_privilege
      using message = 'Administrators may moderate service status but may not edit provider content.';
  end if;

  return new;
end;
$$;

revoke execute on function private.is_verified_sdsu_student() from public;
revoke execute on function private.is_admin() from public;
revoke execute on function private.owns_service(uuid) from public;
revoke execute on function private.can_read_service(uuid) from public;
revoke execute on function private.enforce_service_update_scope() from public;

grant execute on function private.is_verified_sdsu_student() to authenticated;
grant execute on function private.is_admin() to authenticated;
grant execute on function private.owns_service(uuid) to authenticated;
grant execute on function private.can_read_service(uuid) to authenticated;

create trigger services_enforce_update_scope
before update on public.services
for each row execute function private.enforce_service_update_scope();

-- Anonymous visitors use a static landing page and receive no table access.
revoke all on table public.profiles from anon, authenticated;
revoke all on table public.contact_methods from anon, authenticated;
revoke all on table public.services from anon, authenticated;
revoke all on table public.skills from anon, authenticated;
revoke all on table public.service_skills from anon, authenticated;
revoke all on table public.portfolio_items from anon, authenticated;
revoke all on table public.service_reports from anon, authenticated;
revoke all on table public.user_roles from anon, authenticated;

grant select on table public.profiles to authenticated;
grant update (full_name, bio, avatar_path) on table public.profiles to authenticated;

grant select, insert, update, delete on table public.contact_methods to authenticated;

grant select, insert, delete on table public.services to authenticated;
grant update (
  title,
  description,
  price_cents,
  price_unit,
  status,
  published_at
) on table public.services to authenticated;

grant select, insert on table public.skills to authenticated;
grant update (is_hidden) on table public.skills to authenticated;

grant select, insert, update, delete on table public.service_skills to authenticated;
grant select, insert, update, delete on table public.portfolio_items to authenticated;

grant select, insert on table public.service_reports to authenticated;
grant update (status, reviewed_by, reviewed_at) on table public.service_reports to authenticated;

grant select on table public.user_roles to authenticated;

create policy "verified students can read profiles"
on public.profiles
for select
to authenticated
using (private.is_verified_sdsu_student());

create policy "students can update their own profile"
on public.profiles
for update
to authenticated
using (
  private.is_verified_sdsu_student()
  and id = (select auth.uid())
)
with check (
  private.is_verified_sdsu_student()
  and id = (select auth.uid())
);

create policy "students can read visible or owned contacts"
on public.contact_methods
for select
to authenticated
using (
  private.is_verified_sdsu_student()
  and (is_visible or profile_id = (select auth.uid()))
);

create policy "students can add their own contacts"
on public.contact_methods
for insert
to authenticated
with check (
  private.is_verified_sdsu_student()
  and profile_id = (select auth.uid())
);

create policy "students can update their own contacts"
on public.contact_methods
for update
to authenticated
using (
  private.is_verified_sdsu_student()
  and profile_id = (select auth.uid())
)
with check (
  private.is_verified_sdsu_student()
  and profile_id = (select auth.uid())
);

create policy "students can delete their own contacts"
on public.contact_methods
for delete
to authenticated
using (
  private.is_verified_sdsu_student()
  and profile_id = (select auth.uid())
);

create policy "students can read published or owned services"
on public.services
for select
to authenticated
using (
  private.is_verified_sdsu_student()
  and (
    status = 'published'
    or student_id = (select auth.uid())
    or private.is_admin()
  )
);

create policy "students can create their own drafts"
on public.services
for insert
to authenticated
with check (
  private.is_verified_sdsu_student()
  and student_id = (select auth.uid())
  and status = 'draft'
  and published_at is null
);

create policy "students can update their own non-hidden services"
on public.services
for update
to authenticated
using (
  private.is_verified_sdsu_student()
  and student_id = (select auth.uid())
  and status <> 'hidden'
)
with check (
  private.is_verified_sdsu_student()
  and student_id = (select auth.uid())
  and status <> 'hidden'
  and (
    status <> 'published'
    or exists (
      select 1
      from public.contact_methods
      where profile_id = (select auth.uid())
        and is_visible
    )
  )
);

create policy "admins can update any service"
on public.services
for update
to authenticated
using (private.is_admin())
with check (private.is_admin());

create policy "students can delete their own non-hidden services"
on public.services
for delete
to authenticated
using (
  private.is_verified_sdsu_student()
  and student_id = (select auth.uid())
  and status <> 'hidden'
);

create policy "students can read available or owned skills"
on public.skills
for select
to authenticated
using (
  private.is_verified_sdsu_student()
  and (
    not is_hidden
    or created_by = (select auth.uid())
    or private.is_admin()
  )
);

create policy "students can create skills"
on public.skills
for insert
to authenticated
with check (
  private.is_verified_sdsu_student()
  and created_by = (select auth.uid())
  and not is_hidden
);

create policy "admins can moderate skills"
on public.skills
for update
to authenticated
using (private.is_admin())
with check (private.is_admin());

create policy "students can read skills for readable services"
on public.service_skills
for select
to authenticated
using (
  private.is_verified_sdsu_student()
  and private.can_read_service(service_id)
);

create policy "owners can add service skills"
on public.service_skills
for insert
to authenticated
with check (
  private.is_verified_sdsu_student()
  and private.owns_service(service_id)
);

create policy "owners can reorder service skills"
on public.service_skills
for update
to authenticated
using (
  private.is_verified_sdsu_student()
  and private.owns_service(service_id)
)
with check (
  private.is_verified_sdsu_student()
  and private.owns_service(service_id)
);

create policy "owners can remove service skills"
on public.service_skills
for delete
to authenticated
using (
  private.is_verified_sdsu_student()
  and private.owns_service(service_id)
);

create policy "students can read portfolio items for readable services"
on public.portfolio_items
for select
to authenticated
using (
  private.is_verified_sdsu_student()
  and private.can_read_service(service_id)
);

create policy "owners can add portfolio items"
on public.portfolio_items
for insert
to authenticated
with check (
  private.is_verified_sdsu_student()
  and private.owns_service(service_id)
);

create policy "owners can update portfolio items"
on public.portfolio_items
for update
to authenticated
using (
  private.is_verified_sdsu_student()
  and private.owns_service(service_id)
)
with check (
  private.is_verified_sdsu_student()
  and private.owns_service(service_id)
);

create policy "owners can delete portfolio items"
on public.portfolio_items
for delete
to authenticated
using (
  private.is_verified_sdsu_student()
  and private.owns_service(service_id)
);

create policy "reporters and admins can read reports"
on public.service_reports
for select
to authenticated
using (
  private.is_verified_sdsu_student()
  and (
    reporter_id = (select auth.uid())
    or private.is_admin()
  )
);

create policy "students can report published services"
on public.service_reports
for insert
to authenticated
with check (
  private.is_verified_sdsu_student()
  and reporter_id = (select auth.uid())
  and status = 'open'
  and reviewed_by is null
  and reviewed_at is null
  and exists (
    select 1
    from public.services
    where id = service_id
      and status = 'published'
      and student_id <> (select auth.uid())
  )
);

create policy "admins can review reports"
on public.service_reports
for update
to authenticated
using (private.is_admin())
with check (
  private.is_admin()
  and reviewed_by = (select auth.uid())
);

create policy "students can read their own role"
on public.user_roles
for select
to authenticated
using (
  private.is_verified_sdsu_student()
  and (
    user_id = (select auth.uid())
    or private.is_admin()
  )
);

create function public.hook_restrict_sdsu_signup(event jsonb)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  email_address text;
begin
  email_address := pg_catalog.lower(
    pg_catalog.btrim(event->'user'->>'email')
  );

  if email_address is null
    or email_address !~ '^[^@[:space:]]+@sdsu[.]edu$'
  then
    return pg_catalog.jsonb_build_object(
      'error', pg_catalog.jsonb_build_object(
        'http_code', 403,
        'message', 'Use your SDSU email address ending in @sdsu.edu.'
      )
    );
  end if;

  return '{}'::jsonb;
end;
$$;

grant execute
on function public.hook_restrict_sdsu_signup(jsonb)
to supabase_auth_admin;

revoke execute
on function public.hook_restrict_sdsu_signup(jsonb)
from authenticated, anon, public;
