-- Keep service skills limited to the catalog. New catalog entries can be
-- added by administrators later, including the explicit "Other" option.
insert into public.skills (name, normalized_name, created_by)
values ('Other', 'other', null)
on conflict (normalized_name) do nothing;

create or replace function private.set_service_skills(
  target_service_id uuid,
  skill_names text[]
)
returns void
language plpgsql
set search_path = ''
as $$
declare
  cleaned_names text[] := coalesce(skill_names, array[]::text[]);
  raw_name text;
  display_name text;
  normalized text;
  selected_skill_id uuid;
  skill_position smallint := 0;
begin
  if not private.owns_service(target_service_id) then
    raise insufficient_privilege
      using message = 'You can manage skills only for your own service.';
  end if;

  if pg_catalog.cardinality(cleaned_names) > 5 then
    raise check_violation using message = 'A service can have at most five skills.';
  end if;

  if exists (
    select 1
    from pg_catalog.unnest(cleaned_names) as submitted(name)
    group by public.normalize_skill_name(submitted.name)
    having pg_catalog.count(*) > 1
  ) then
    raise unique_violation using message = 'Each skill can be selected only once.';
  end if;

  delete from public.service_skills where service_id = target_service_id;

  foreach raw_name in array cleaned_names loop
    display_name := pg_catalog.regexp_replace(
      pg_catalog.btrim(raw_name), '[[:space:]]+', ' ', 'g'
    );
    normalized := public.normalize_skill_name(display_name);

    select id into selected_skill_id
    from public.skills
    where normalized_name = normalized and not is_hidden;

    if selected_skill_id is null then
      raise check_violation using message = 'Choose a skill from the available catalog.';
    end if;

    insert into public.service_skills (service_id, skill_id, position)
    values (target_service_id, selected_skill_id, skill_position);
    skill_position := skill_position + 1;
    selected_skill_id := null;
  end loop;
end;
$$;
